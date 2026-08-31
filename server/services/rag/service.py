import os
import json
from typing import List, Dict, Any, Optional
from pinecone import Pinecone
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from config.settings import settings
from utils.logger import get_logger
from utils.exceptions import PathshalaError
from config.constants import CHAT_MODEL, RAG_TOP_K, RAG_MEMORY_WINDOW

from services.llm.service import LLMService
from prompts.video_qna_prompt import VIDEO_QNA_PROMPT

logger = get_logger(__name__)


class RAGService:
    """
    Service responsible for Retrieval-Augmented Generation (RAG) Q&A.
    Queries Pinecone for transcripts within a specific video namespace and answers using Groq model (openai/gpt-oss-20b).
    """

    def __init__(self, google_api_key: Optional[str] = None, groq_api_key: Optional[str] = None):
        self.google_api_key = google_api_key
        self.groq_api_key = groq_api_key

        # Initialize langchain-google-genai embeddings
        self.embeddings = LLMService.get_embeddings(
            google_api_key=self.google_api_key
        )


        # Initialize Groq Chat model
        self.llm = LLMService.get_groq_llm(
            groq_api_key=groq_api_key,
            model_name=CHAT_MODEL
        )


        # Connect to Pinecone
        pinecone_api_key = settings.PINECONE_API_KEY
        if not pinecone_api_key:
            raise PathshalaError(
                message="Pinecone configurations are missing in the server settings.",
                code="MISSING_PINECONE_CONFIG",
                status_code=500,
            )

        self.pc = Pinecone(api_key=pinecone_api_key)
        self.index_name = settings.PINECONE_INDEX_NAME

        
        try:
            self.index = self.pc.Index(self.index_name)
        except Exception as e:
            logger.exception("Failed to connect to Pinecone index.")
            raise PathshalaError(
                message="Could not establish connection to the vector store index.",
                code="PINECONE_CONNECTION_ERROR",
                status_code=500,
            ) from e



    async def answer_question_stream(
        self, video_id: str, question: str, history: Optional[List[Dict[str, Any]]] = None
    ):
        """
        Retrieves matching transcript segments, constructs the prompt with history context,
        and streams the answer chunk by chunk.
        """
        logger.info("RAG Q&A Stream: Querying for video %s, Question: %s", video_id, question)

        try:
            # 1. Embed user query using Gemini Embedding 2
            query_vector = self.embeddings.embed_query(question)
        except Exception as e:
            logger.exception("Failed to embed question.")
            raise PathshalaError(
                message="Failed to generate embeddings for your question.",
                code="EMBEDDING_GENERATION_FAILED",
                status_code=500,
            ) from e

        try:
            # 2. Query Pinecone under specific namespace
            response = self.index.query(
                namespace=video_id,
                vector=query_vector,
                top_k=RAG_TOP_K,
                include_metadata=True,
            )
        except Exception as e:
            logger.exception("Pinecone query execution failed.")
            raise PathshalaError(
                message="Failed to execute search on vector database.",
                code="PINECONE_QUERY_FAILED",
                status_code=500,
            ) from e

        matches = response.get("matches", [])
        if not matches:
            logger.info("No matching transcript segments found in Pinecone for video %s.", video_id)
            yield json.dumps({
                "type": "content",
                "data": "I couldn't find any relevant sections in the transcript to answer your question. Make sure notes generation completed successfully for this video first."
            })
            return

        # 3. Build context and keep track of source segments
        context_blocks = []
        
        # Sort matches chronologically by their start time to help LLM reason about temporal flow
        sorted_matches = sorted(matches, key=lambda x: x.get("metadata", {}).get("start", 0.0))

        for match in sorted_matches:
            meta = match.get("metadata", {})
            text = meta.get("text", "")
            start = meta.get("start", 0.0)
            end = meta.get("end", 0.0)

            # Format timestamp display as accurate start timestamp (e.g. "35:13")
            start_hour = int(start // 3600)
            start_min = int((start % 3600) // 60)
            start_sec = int(start % 60)
            if start_hour > 0:
                time_str = f"{start_hour:02d}:{start_min:02d}:{start_sec:02d}"
            else:
                time_str = f"{start_min:02d}:{start_sec:02d}"

            context_blocks.append(f"[{time_str}]: {text}")

        context_text = "\n".join(context_blocks)

        # 4. Construct message history for LLM
        # Adapt VIDEO_QNA_PROMPT to remove the specific question block, as it is appended dynamically in the messages.
        # Replacing 'Question: {question}' with empty space to reuse prompt rules.
        clean_rules = VIDEO_QNA_PROMPT.replace("Question: {question}", "").strip()
        system_content = clean_rules.format(context=context_text)

        messages = [SystemMessage(content=system_content)]

        if history and isinstance(history, list):
            # Send last N messages from history to keep short term memory
            recent_history = history[-RAG_MEMORY_WINDOW:]
            for msg in recent_history:
                if not isinstance(msg, dict):
                    continue
                role = msg.get("sender") or msg.get("role")
                text = msg.get("text") or msg.get("content")
                if not text or not isinstance(text, str) or not text.strip():
                    continue
                clean_text = text.strip()
                if role in ("user", "human"):
                    messages.append(HumanMessage(content=clean_text))
                elif role in ("assistant", "ai", "bot"):
                    messages.append(AIMessage(content=clean_text))

        # Add current question
        if question and str(question).strip():
            messages.append(HumanMessage(content=str(question).strip()))

        # 5. Stream LLM response
        try:
            async for chunk in self.llm.astream(messages):
                content = chunk.content
                # Handle newer LangChain list content structures
                if isinstance(content, list):
                    content = "".join(
                        block.get("text", "") if isinstance(block, dict) else str(block)
                        for block in content
                    )
                if content:
                    yield json.dumps({"type": "content", "data": content})
        except Exception as e:
            logger.exception("Failed to stream response via LLM.")
            raise PathshalaError(
                message="Failed to generate a streamed answer due to an AI service error.",
                code="LLM_STREAMING_FAILED",
                status_code=500,
            ) from e

