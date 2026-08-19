from langgraph.graph import StateGraph, START, END
from langgraph.types import RetryPolicy, Send

from state.state import NotesState
from utils.decorators import wrap_node

from nodes.transcript_metadata_generator import transcript_metadata_generator
from nodes.transcript_merger import transcript_merger
from nodes.orchestrator import orchestrator
from nodes.chapter_worker import chapter_worker_node
from nodes.reducer import reducer

# ==========================
# Main Graph Builder
# ==========================

builder = StateGraph(NotesState)

# ==========================
# Add Nodes
# ==========================

builder.add_node(
    "transcript_metadata_generator",
    wrap_node(transcript_metadata_generator),
    retry_policy=RetryPolicy(max_attempts=3, backoff_factor=2.0),
)

builder.add_node(
    "transcript_merger",
    wrap_node(transcript_merger),
)

builder.add_node(
    "orchestrator",
    wrap_node(orchestrator),
    retry_policy=RetryPolicy(max_attempts=3, backoff_factor=2.0),
)

builder.add_node(
    "chapter_worker",
    wrap_node(chapter_worker_node),
    retry_policy=RetryPolicy(max_attempts=3, backoff_factor=2.0),
)

builder.add_node(
    "reducer",
    wrap_node(reducer),
)

# ==========================
# Main Pipeline
# ==========================

builder.add_edge(
    START,
    "transcript_metadata_generator",
)

builder.add_edge(
    "transcript_metadata_generator",
    "transcript_merger",
)

builder.add_edge(
    "transcript_merger",
    "orchestrator",
)


def route_to_chapters(state: NotesState) -> list[Send]:
    """
    Creates parallel chapter worker tasks using LangGraph's Send API.
    """
    chapters = state.get("chapters", [])
    execution_plan = state.get("execution_plan", {})
    audience = execution_plan.get("audience", "All Students")
    note_style = execution_plan.get("note_style", "Standard Lecture Notes")
    
    sends = []
    for chapter in chapters:
        sends.append(
            Send(
                "chapter_worker",
                {
                    "lecture_outline": state["lecture_outline"],
                    "chapter_plan": chapter,
                    "transcript_segments": state["merged_transcript"],
                    "google_api_key": state.get("google_api_key"),
                    "groq_api_key": state.get("groq_api_key"),
                    "task_id": state.get("task_id"),
                    "audience": audience,
                    "note_style": note_style,
                },
            )
        )
    return sends


# Map chapter generation to parallel workers
builder.add_conditional_edges(
    "orchestrator",
    wrap_node(route_to_chapters),
    ["chapter_worker"],
)

# Reduce all parallel outputs into reducer
builder.add_edge(
    "chapter_worker",
    "reducer",
)

# Reducer -> END
builder.add_edge(
    "reducer",
    END,
)

graph = builder.compile()