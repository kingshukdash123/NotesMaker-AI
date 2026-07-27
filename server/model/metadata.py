from typing import TypedDict, NotRequired


# metadata of youtube video
class VideoMetadata(TypedDict):
    video_id: str
    title: str
    channel: str
    thumbnail: str
    available_languages: NotRequired[list[dict]]