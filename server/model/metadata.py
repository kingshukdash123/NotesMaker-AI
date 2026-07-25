from typing import TypedDict


# metadata of youtube video
class VideoMetadata(TypedDict):
    video_id: str
    title: str
    channel: str
    thumbnail: str