import json
from typing import List, Dict, Any, Optional, AsyncIterator
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from config.constants import CHAT_MODEL, ASSISTANT_MEMORY_WINDOW
from services.llm.service import LLMService
from prompts.assistant_prompt import ASSISTANT_SYSTEM_PROMPT, SUMMARY_PROMPT
from utils.logger import get_logger
from utils.exceptions import PathshalaError

logger = get_logger(__name__)


class AssistantService:
    def __init__(self, groq_api_key: Optional[str] = None):
        self.groq_api_key = groq_api_key
        # Initialize Groq Chat model
        self.llm = LLMService.get_groq_llm(
            groq_api_key=groq_api_key,
            model_name=CHAT_MODEL
        )

    async def chat_stream(self, messages: List[Dict[str, Any]], summary: Optional[str] = None) -> AsyncIterator[str]:
        """
        Processes messages and summary, runs safety system instructions, streams back chat tokens,
        and yields an updated summary block at the end.
        """
        logger.info("Assistant Service: processing chat query stream.")

        # 1. Format system instructions with current summary
        summary_val = summary if (summary and summary.strip()) else "No significant context yet."
        system_content = ASSISTANT_SYSTEM_PROMPT.format(conversation_summary=summary_val)

        langchain_messages = [SystemMessage(content=system_content)]

        # 2. Append only the last N messages to the assistant prompt
        if messages and isinstance(messages, list):
            recent_messages = messages[-ASSISTANT_MEMORY_WINDOW:] if len(messages) > ASSISTANT_MEMORY_WINDOW else messages
            for msg in recent_messages:
                if not isinstance(msg, dict):
                    continue
                role = msg.get("role") or msg.get("sender")
                content = msg.get("content") or msg.get("text")
                if not content or not isinstance(content, str) or not content.strip():
                    continue
                clean_content = content.strip()
                if role in ("user", "human"):
                    langchain_messages.append(HumanMessage(content=clean_content))
                elif role in ("assistant", "ai", "bot"):
                    langchain_messages.append(AIMessage(content=clean_content))

        # 3. Stream response from LLM
        full_response = ""
        try:
            async for chunk in self.llm.astream(langchain_messages):
                content = chunk.content
                if isinstance(content, list):
                    content = "".join(
                        block.get("text", "") if isinstance(block, dict) else str(block)
                        for block in content
                    )
                if content:
                    full_response += content
                    yield json.dumps({"type": "content", "data": content})
        except Exception as e:
            logger.exception("Failed to stream response from assistant LLM.")
            raise PathshalaError(
                message="Failed to generate response due to an LLM service error.",
                code="LLM_STREAMING_FAILED",
                status_code=500,
            ) from e

        # 4. Generate updated summary using existing summary and recent question
        try:
            new_summary = await self.generate_summary(messages, full_response, summary_val)
            yield json.dumps({"type": "summary_update", "data": new_summary})
        except Exception as e:
            logger.warning(f"Failed to generate summary: {str(e)}")
            # We don't fail the whole stream if summarization fails
            yield json.dumps({"type": "summary_update", "data": summary_val})

    async def generate_summary(self, previous_messages: List[Dict[str, Any]], last_ai_response: str, existing_summary: str) -> str:
        """
        Generates an updated conversation summary by incorporating the recent question and response into the existing summary.
        Skips summarization on initial turns (<= 2 messages) since sliding window captures the entire conversation.
        """
        # 1. Skip summarization if conversation is in its initial turns
        if len(previous_messages) <= 2:
            return existing_summary

        # 2. Find the recent user question
        recent_question = ""
        for msg in reversed(previous_messages):
            role = msg.get("role") or msg.get("sender")
            if role == "user":
                recent_question = msg.get("content") or msg.get("text") or ""
                break

        if not recent_question and not last_ai_response:
            return existing_summary

        recent_turn_str = f"USER QUESTION: {recent_question}\nASSISTANT ANSWER: {last_ai_response}"

        summary_prompt_content = SUMMARY_PROMPT.format(
            existing_summary=existing_summary,
            new_messages=recent_turn_str
        )

        try:
            logger.info("Generating updated conversation summary from existing summary and recent question...")
            response = await self.llm.ainvoke([SystemMessage(content=summary_prompt_content)])
            new_summary = response.content
            if isinstance(new_summary, list):
                new_summary = "".join(
                    block.get("text", "") if isinstance(block, dict) else str(block)
                    for block in new_summary
                )
            return new_summary.strip()
        except Exception as e:
            logger.error(f"Error generating summary in LLM: {str(e)}")
            return existing_summary
