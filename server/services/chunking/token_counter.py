# import tiktoken

# from server.logger import get_logger

# logger = get_logger(__name__)

# # Tokenizer used for counting tokens
# encoding = tiktoken.get_encoding("cl100k_base")


# def count_tokens(text: str) -> int:
#     """
#     Count the number of tokens in a text.
#     """

#     token_count = len(encoding.encode(text))

#     logger.info(f"Token count: {token_count}")

#     return token_count