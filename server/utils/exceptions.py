class PathshalaError(Exception):
    def __init__(
        self,
        message: str,
        code: str = "UNKNOWN_ERROR",
        status_code: int = 500,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)

    def to_dict(self):
        return {
            "success": False,
            "error": {
                "code": self.code,
                "message": self.message,
            },
        }