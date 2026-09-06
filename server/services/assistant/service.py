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

    async def chat_stream(
        self,
        messages: List[Dict[str, Any]],
        summary: Optional[str] = None,
        user_name: Optional[str] = None,
        student_profile: Optional[Dict[str, Any]] = None
    ) -> AsyncIterator[str]:
        """
        Processes messages and summary, runs safety system instructions, streams back chat tokens,
        and yields an updated summary block at the end.
        """
        logger.info("Assistant Service: processing chat query stream.")

        # 1. Format system instructions with current summary, student name, and academic profile
        summary_val = summary if (summary and summary.strip()) else "No significant context yet."
        raw_name = (user_name or "").strip()
        is_known_name = bool(raw_name and raw_name.lower() not in ("user", "student", "my student", "none", "null"))
        student_name_val = raw_name if is_known_name else "champion"

        if is_known_name:
            name_instruction = (
                f"- The student you are talking to is: {student_name_val}.\n"
                f"- You know {student_name_val} personally and call them by their name.\n"
                f"- If {student_name_val} asks 'what is my name?' or 'who am I?', answer directly, warmly, and proudly (e.g. 'You are {student_name_val}, champion!' or 'Arre {student_name_val}, how could I ever forget your name?'). NEVER claim you do not know their name."
            )
        else:
            name_instruction = (
                "- You do not know the student's personal real name yet.\n"
                "- If they ask 'what is my name?', answer warmly and naturally: 'Arre dost, you haven't told me your real name yet! What should I call you?' (Never use robotic AI phrases like 'I am an AI, remind me what you would like to be called')."
            )

        # Format student academic profile instructions
        if student_profile and isinstance(student_profile, dict):
            ed_level = (student_profile.get("educationLevel") or "").strip()
            stream = (student_profile.get("fieldOfStudy") or "").strip()
            goal = (student_profile.get("targetGoal") or "").strip()
            style = (student_profile.get("explanationStyle") or "").strip()
            tone = (student_profile.get("mentorTone") or "").strip()

            profile_lines = []
            if ed_level:
                profile_lines.append(f"- Academic Level: {ed_level}")
            if stream:
                profile_lines.append(f"- Stream / Field: {stream}")
            if goal:
                profile_lines.append(f"- Current Target / Exam: {goal}")
            if style:
                profile_lines.append(f"- Preferred Explanation Style: {style}")
            if tone:
                profile_lines.append(f"- Mentor Persona Tone: {tone}")

            if profile_lines:
                profile_text = "\n".join(profile_lines)
                directives = [
                    f"- Tailor your examples, technical analogies, difficulty, and practice questions to match their level and goals.",
                    f"- Encourage them towards their target goal naturally."
                ]

                # Specific explanation style directive
                if "Concise Bullet Points" in style:
                    directives.append("- Style Directive: Present explanations primarily in clean, structured bullet points with prominent formulas and high information density. Avoid conversational rambling.")
                elif "Intuitive" in style or "Analogie" in style:
                    directives.append("- Style Directive: Ground concepts in vivid, relatable everyday analogies (daily life, sports, simple kitchen examples) before formal terminology.")
                elif "Mathematical" in style or "Rigor" in style:
                    directives.append("- Style Directive: Emphasize mathematical rigor, exact formula derivations, underlying mechanisms, and step-by-step logic.")
                elif "Exam-Oriented" in style or "High-Yield" in style:
                    directives.append("- Style Directive: Focus on high-frequency exam questions, key scoring keywords, common student mistakes, and examiner marking criteria.")

                # Specific mentor persona tone directive
                if "Calm & Structured" in tone:
                    directives.append("- Persona Tone Directive: Speak as a calm, patient, and methodical guide. Keep explanations orderly, your presence reassuring, and your pacing clear without rushing.")
                elif "Warm Brotherly" in tone or "Dost" in tone:
                    directives.append("- Persona Tone Directive: Speak with the warmth, affection, and loyalty of an elder brother ('Dost'). Use friendly, reassuring encouragement ('Tension mat le dost, we will ace this together').")
                elif "Academic Coach" in tone or "Challenging" in tone:
                    directives.append("- Persona Tone Directive: Act as an ambitious, disciplined academic coach. Set high standards, challenge the student to think critically, and push them to excel.")

                if ed_level:
                    directives.append(f"- Syllabus Scope: Calibrate vocabulary, difficulty, and depth strictly to the {ed_level} curriculum. Avoid overwhelming with out-of-syllabus college material.")
                if goal:
                    directives.append(f"- Goal Alignment: Structure guidance to directly help {student_name_val} master concepts and achieve top marks in {goal}.")

                directives_text = "\n".join(directives)
                student_profile_instruction = (
                    f"You have deep knowledge of {student_name_val}'s academic background:\n"
                    f"{profile_text}\n"
                    f"{directives_text}"
                )
            else:
                student_profile_instruction = (
                    f"- Treat {student_name_val} with a balanced, caring, and encouraging academic approach suitable for any dedicated student."
                )
        else:
            student_profile_instruction = (
                f"- Treat {student_name_val} with a balanced, caring, and encouraging academic approach suitable for any dedicated student."
            )

        system_content = ASSISTANT_SYSTEM_PROMPT.format(
            student_name=student_name_val,
            student_name_instruction=name_instruction,
            student_profile_instruction=student_profile_instruction,
            conversation_summary=summary_val
        )

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

        # 3. Stream response from LLM (centralized fallbacks are handled by LLMService)
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
