from langgraph.graph import StateGraph, START, END
from langgraph.types import RetryPolicy

from state.state import NotesState
from utils.decorators import wrap_node

from nodes.transcript_metadata_generator import transcript_metadata_generator
from nodes.transcript_merger import transcript_merger
from nodes.orchestrator import orchestrator
from nodes.chapter_worker import chapter_worker_node, chapter_router
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
)

builder.add_node(
    "transcript_merger",
    wrap_node(transcript_merger),
)

builder.add_node(
    "orchestrator",
    wrap_node(orchestrator),
)

builder.add_node(
    "chapter_worker",
    wrap_node(chapter_worker_node),
    retry_policy=RetryPolicy(max_attempts=5, backoff_factor=2.0),
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

# Run chapters sequentially
builder.add_edge(
    "orchestrator",
    "chapter_worker",
)

builder.add_conditional_edges(
    "chapter_worker",
    wrap_node(chapter_router),
    ["chapter_worker", "reducer"],
)

# Reducer -> END
builder.add_edge(
    "reducer",
    END,
)

graph = builder.compile()