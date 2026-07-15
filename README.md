# Notes-Maker AI



## Architecture

```text
START
│
├── Transcript & Metadata Generator
│
├── Transcript Cleaner
│
├── Orchestrator
│      ├── Analyze the entire transcript
│      ├── Generate lecture outline
│      ├── Divide into logical sections
│      ├── Decide if research is needed
│      └── Create execution plan
│
├── Fan-out (Parallel)
│     ├── Research (if required)
│     └── Section Writer
│
├── Reducer
│
├── Reviewer
│     ├── PASS → Export
│     └── FAIL → Regeneration Router
│                     │
│                     └── Fan-out (Failed Sections Only)
│                               │
│                               └── Reducer → Reviewer
│
└── Export
```



## Nodes State Transitions

| Node | Reads (Input State) | Writes (Output State) |
|------|----------------------|-----------------------|
| Transcript & Metadata Generator | `youtube_url` | `metadata`, `transcript_segments` |
| Transcript Cleaner | `transcript_segments` | `cleaned_segments` |
| Semantic Chunker | `cleaned_segments` | `chunks` |
| Chunk Summarizer | `chunks` | `chunk_summaries` |
| Global Lecture Outline | `metadata`, `chunk_summaries` | `lecture_outline` |
| Orchestrator | `metadata`, `lecture_outline`, `chunk_summaries` | `execution_plan` |
| Fan-out Router | `execution_plan`, `chunks` | *(No state update. Dispatches workers.)* |
| Section Worker | `execution_plan`, `chunks`, `review_result` *(retry only)*, `generated_sections` *(retry only)* | `generated_sections` |
| Reducer | `execution_plan`, `generated_sections` | `draft_notes` |
| Reviewer | `draft_notes`, `execution_plan`, `lecture_outline`, `metadata` | `review_result`, `final_notes` *(only if approved)* |
| Regeneration Router | `review_result`, `execution_plan`, `generated_sections` | *(No state update. Routes failed sections.)* |
| Export | `metadata`, `final_notes` | `success`, `error` |




1. retry logic for validating schema
2. add chunking logic for extra long videos
3. add multilingual support for non-english caption