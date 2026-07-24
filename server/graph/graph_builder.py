from langgraph.graph import StateGraph, START, END
from langgraph.types import RetryPolicy

from state.state import NotesState
from state.sectionState import SectionState

from nodes.transcript_metadata_generator import transcript_metadata_generator
from nodes.transcript_merger import transcript_merger
from nodes.orchestrator import orchestrator
from nodes.fanout import fanout
from nodes.sectionWriter import section_writer
from nodes.research import research
from nodes.research_router import research_router
from nodes.reducer import reducer

from utils.logger import current_task_id

# ==========================
# Task ID Context Propagation Wrapper
# ==========================


def wrap_node(node_func):
    def wrapper(state):
        task_id = state.get("task_id") if isinstance(state, dict) else None
        token = None
        if task_id:
            token = current_task_id.set(task_id)
        try:
            return node_func(state)
        finally:
            if token:
                current_task_id.reset(token)
    return wrapper

# ==========================
# Section Worker Subgraph
# ==========================

section_builder = StateGraph(SectionState)

section_builder.add_node(
    "research",
    wrap_node(research),
    retry_policy=RetryPolicy(max_attempts=5, backoff_factor=2.0),
)

section_builder.add_node(
    "section_writer",
    wrap_node(section_writer),
    retry_policy=RetryPolicy(max_attempts=5, backoff_factor=2.0),
)

# Conditional Routing from START
section_builder.add_conditional_edges(
    START,
    wrap_node(research_router),
    ["research", "section_writer"]
)

# Research -> Section Writer
section_builder.add_edge("research", "section_writer")

# Section Writer -> END
section_builder.add_edge("section_writer", END)

section_graph = section_builder.compile()


# Node function to wrap the subgraph and prevent parent state pollution
def section_worker_node(state: SectionState):
    subgraph_state = section_graph.invoke(state)
    return {
        "generated_sections": subgraph_state.get("generated_sections", [])
    }


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
    "section_worker",
    wrap_node(section_worker_node),
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

# ==========================
# Parallel Fan-out
# ==========================

builder.add_conditional_edges(
    "orchestrator",
    wrap_node(fanout),
    ["section_worker"],
)

# Wait for all Section Workers
builder.add_edge(
    "section_worker",
    "reducer",
)

# Temporary End
builder.add_edge(
    "reducer",
    END,
)

graph = builder.compile()