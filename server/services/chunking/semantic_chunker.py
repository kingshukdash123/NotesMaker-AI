# from langchain_core.documents import Document
# from langchain_experimental.text_splitter import SemanticChunker
# from langchain_huggingface import HuggingFaceEmbeddings

# from utils.logger import get_logger
# from model.chunk import Chunk
# from model.transcript import TranscriptSegment
# from services.chunking.token_counter import count_tokens

# logger = get_logger(__name__)

# # Load embedding model only once
# embeddings = HuggingFaceEmbeddings(
#     model_name="BAAI/bge-small-en-v1.5"
# )

# chunker = SemanticChunker(
#     embeddings=embeddings
# )


# def semantic_chunk_transcript(
#     merged_transcript: list[TranscriptSegment],
# ) -> list[Chunk]:
#     """
#     Split merged transcript into semantic chunks.
#     """

#     logger.info("Starting semantic chunking...")

#     documents = [
#         Document(page_content=segment["text"])
#         for segment in merged_transcript
#     ]

#     semantic_docs = chunker.split_documents(documents)

#     chunks: list[Chunk] = []

#     for index, doc in enumerate(semantic_docs):

#         text = doc.page_content

#         chunks.append(
#             {
#                 "chunk_id": index + 1,
#                 "text": text,
#                 "token_count": count_tokens(text),
#             }
#         )

#     logger.info(f"Generated {len(chunks)} semantic chunks.")

#     return chunks