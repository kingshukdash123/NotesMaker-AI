from langgraph.graph import StateGraph, START, END
from langgraph.types import RetryPolicy

from server.state.state import NotesState
from server.state.sectionState import SectionState

from server.nodes.transcript_metadata_generator import transcript_metadata_generator
from server.nodes.transcript_merger import transcript_merger
from server.nodes.orchestrator import orchestrator
from server.nodes.fanout import fanout
from server.nodes.sectionWriter import section_writer
from server.nodes.research import research
from server.nodes.research_router import research_router
from server.nodes.reducer import reducer

# ==========================
# Section Worker Subgraph
# ==========================

section_builder = StateGraph(SectionState)

section_builder.add_node(
    "research",
    research,
    retry_policy=RetryPolicy(max_attempts=5, backoff_factor=2.0),
)

section_builder.add_node(
    "section_writer",
    section_writer,
    retry_policy=RetryPolicy(max_attempts=5, backoff_factor=2.0),
)

# Conditional Routing from START
section_builder.add_conditional_edges(
    START,
    research_router,
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
    transcript_metadata_generator,
)

builder.add_node(
    "transcript_merger",
    transcript_merger,
)

builder.add_node(
    "orchestrator",
    orchestrator,
)

builder.add_node(
    "section_worker",
    section_worker_node,
)

builder.add_node(
    "reducer",
    reducer,
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
    fanout,
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