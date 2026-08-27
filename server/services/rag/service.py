import os
from typing import List, Dict, Any, Optional
from pinecone import Pinecone

from config.settings import settings
from utils.logger import get_logger
from utils.exceptions import NotesMakerError
from config.constants import CHAT_MODEL, RAG_TOP_K

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
            raise NotesMakerError(
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
            raise NotesMakerError(
                message="Could not establish connection to the vector store index.",
                code="PINECONE_CONNECTION_ERROR",
                status_code=500,
            ) from e

    def answer_question(self, video_id: str, question: str) -> Dict[str, Any]:
        """
        Retrieves matching transcript segments for a video namespace from Pinecone,
        constructs a grounded context, and answers the user's question.
        """
        logger.info("RAG Q&A: Querying for video %s, Question: %s", video_id, question)

        try:
            # 1. Embed user query using Gemini Embedding 2
            query_vector = self.embeddings.embed_query(question)
        except Exception as e:
            logger.exception("Failed to embed question.")
            raise NotesMakerError(
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
            raise NotesMakerError(
                message="Failed to execute search on vector database.",
                code="PINECONE_QUERY_FAILED",
                status_code=500,
            ) from e

        matches = response.get("matches", [])
        if not matches:
            logger.info("No matching transcript segments found in Pinecone for video %s.", video_id)
            return {
                "answer": "I couldn't find any relevant sections in the transcript to answer your question. Make sure notes generation completed successfully for this video first.",
                "sources": [],
            }

        # 3. Build context and keep track of source segments
        context_blocks = []
        sources = []
        
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
            sources.append(
                {
                    "text": text,
                    "start": start,
                    "end": end,
                    "score": float(match.get("score", 0.0)),
                }
            )

        context_text = "\n".join(context_blocks)

        # 4. Invoke LLM to answer the question using the context
        system_prompt = VIDEO_QNA_PROMPT.format(context=context_text, question=question)

        try:
            answer_response = self.llm.invoke(system_prompt)
            answer_text = answer_response.content
            
            # Handle newer LangChain list content structures
            if isinstance(answer_text, list):
                answer_text = "".join(
                    block.get("text", "") if isinstance(block, dict) else str(block)
                    for block in answer_text
                )
        except Exception as e:
            logger.exception("Failed to generate response via LLM.")
            raise NotesMakerError(
                message="Failed to generate an answer due to an AI service error.",
                code="LLM_GENERATION_FAILED",
                status_code=500,
            ) from e

        logger.info("RAG Q&A: Successfully generated answer.")

        return {"answer": answer_text, "sources": sources}
