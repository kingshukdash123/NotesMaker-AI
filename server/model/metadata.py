from typing import TypedDict, NotRequired


# Rich metadata model for YouTube video resources fetched via YouTube Data API v3
class VideoMetadata(TypedDict):
    video_id: str
    title: str
    channel: str
    thumbnail: str
    channel_id: NotRequired[str]
    description: NotRequired[str]
    duration: NotRequired[int]  # Video length in total seconds
    duration_formatted: NotRequired[str]  # Human-readable format (e.g. '14:25', '1:02:30')
    published_at: NotRequired[str]
    view_count: NotRequired[int | str]
    like_count: NotRequired[int | str]
    comment_count: NotRequired[int | str]
    tags: NotRequired[list[str]]
    category_id: NotRequired[str]
    default_language: NotRequired[str]
    is_live: NotRequired[bool]
    is_live_archive: NotRequired[bool]
    is_upcoming: NotRequired[bool]
    embeddable: NotRequired[bool]
    available_languages: NotRequired[list[dict]]