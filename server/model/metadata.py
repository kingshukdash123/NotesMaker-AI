from typing import TypedDict


# metadata of youtube video
class VideoMetadata(TypedDict):
    video_id: str
    title: str
    channel: str
    duration: int
    description: str
    upload_date: str
    thumbnail: str
    language: str