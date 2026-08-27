ORCHESTRATOR_PROMPT = """Analyze the lecture transcript and generate a structured outline and detailed execution plan. You must fully understand the video carefully, capturing every small detail into the plan to make it highly comprehensive.

INPUTS:
- Metadata: {metadata}
- Transcript (numbered segments): {transcript}

RULES:
1. Lecture Outline:
   - Order: Follow instructor's progression exactly. Do not rearrange topics.
   - topic_hierarchy: Flat list of TopicNodes. Bullets: max 2-3 per topic, <10 words each. No nesting.
   - overview: 3-6 sentences explaining the scope.
   - concepts: Extract all key concepts/terms mentioned in the video.
   - learning_objectives: List what a student should understand after finishing.
2. Execution Plan:
   - sections: Sequential, non-overlapping note-taking sections mapping to segment IDs (start_segment_id/end_segment_id, inclusive).
   - Word Count: If <5 sections, target_word_count < 250 words/section. If >=5 sections, target_word_count < 150 words/section. Include one "Conclusion" section (<100 words) at the end.
   - Flags: Set diagram_required, table_required, example_required to true if corresponding content would enhance the notes.
3. Language & Accuracy:
   - Do not invent information. Regardless of the language of the transcript or metadata, you MUST write the entire outline, execution plan, section titles, and topics ENTIRELY in English.

Output MUST match OrchestrationResultModel schema. Do not return markdown blocks or extra text."""

