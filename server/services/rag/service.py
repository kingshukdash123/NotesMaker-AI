import os
from typing import List, Dict, Any, Optional
from pinecone import Pinecone

from config.settings import settings
from utils.logger import get_logger
from utils.exceptions import NotesMakerError
from config.constants import CHAT_MODEL, RAG_TOP_K

from services.llm.service import LLMService

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

            # Format timestamp display (e.g. "01:23 - 02:45")
            start_min = int(start // 60)
            start_sec = int(start % 60)
            end_min = int(end // 60)
            end_sec = int(end % 60)
            time_str = f"{start_min:02d}:{start_sec:02d} - {end_min:02d}:{end_sec:02d}"

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
        system_prompt = (
            "You are an academic learning assistant helping a student understand a lecture video.\n"
            "Answer the student's question based strictly on the transcript context provided below.\n"
            "If the context doesn't contain the answer, say honestly that you cannot find it in the video.\n"
            "Keep your response concise, professional, well-structured, and use markdown formatting where helpful.\n\n"
            "If user asks any question which is not related to the transcript context, politely refuse to answer.\n\n"
            "act like you watch the video and understood it well, then answer the question.\n\n"
            "Don't use the words 'transcript' or 'context' in your answer.\n\n"
            "When explaining concepts, you may mention the relevant timestamp in your response in [hh:mm:ss] format (or [mm:ss]) if needed to guide the student to the exact moment in the video.\n\n"
            "CRITICAL MATH FORMATTING RULES:\n"
            "- Always wrap mathematical equations and symbols in standard LaTeX delimiters: use $equation$ for inline math, and $$equation$$ on its own line for display block math.\n"
            "- NEVER wrap the math delimiters ($ or $$) or the formula in markdown backticks (do NOT write ` $formula$ ` or ` $$formula$$ `). Write them directly as plain text.\n"
            "- Ensure all starting and ending delimiters ($ or $$) are perfectly matched and balanced. Never mix them (e.g. do not write $formula$$).\n"
            "- Double-check all LaTeX syntax: Ensure all opening and closing braces ({}), brackets ([]), and parentheses (()) are perfectly matched (e.g. no unmatched \\left or \\right).\n"
            "- Never mix plain text and display math delimiters (e.g. do not put a whole sentence inside $$...$$). Only wrap the pure mathematical formula itself.\n"
            "- Do not write prefixes like 'inline-math' inside math delimiters or backticks. Only output valid LaTeX expressions.\n\n"
            f"Transcript Context:\n{context_text}\n\n"
            f"Question: {question}\n"
            "Answer:"
        )

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
