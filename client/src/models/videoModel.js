import { formatTimeAgo, formatViews, formatVideoDuration } from '../utils/formatters';
import { extractYouTubeVideoId } from '../utils/router';

/**
 * Normalizes any raw video object (from YouTube Data API, backend responses,
 * Firestore documents, notes, history, or playlists) into a canonical VideoModel instance.
 *
 * @param {Object} item - Any raw video object or document
 * @returns {VideoModel|null} Canonical normalized VideoModel instance
 */
export function normalizeVideoMetadata(item) {
  if (!item) return null;
  if (item instanceof VideoModel) return item;
  return new VideoModel(item);
}

/**
 * Domain model representing a standard video across the application.
 * Adheres strictly to canonical camelCase schema with virtual getters for backwards-compatibility.
 */
export class VideoModel {
  constructor(item = {}) {
    const rawMeta = item.metadata || item.snippet || item || {};

    let videoId = String(
      item.videoId ||
      item.id ||
      item.video_id ||
      rawMeta.videoId ||
      rawMeta.video_id ||
      rawMeta.id ||
      ''
    ).trim();

    // If videoId contains an underscore (e.g. userId_videoId from Firestore doc ID) or URL characters, extract plain YouTube ID
    if (!videoId || videoId.includes('_') || videoId.includes('/') || videoId.includes('http')) {
      const fromUrl = extractYouTubeVideoId(item.videoUrl || item.url || rawMeta.videoUrl || rawMeta.url || videoId, { allowPlainId: true });
      if (fromUrl) {
        videoId = fromUrl;
      } else if (videoId.includes('_')) {
        const parts = videoId.split('_');
        const lastPart = parts[parts.length - 1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(lastPart)) {
          videoId = lastPart;
        }
      }
    }

    const title = String(
      rawMeta.title ||
      item.title ||
      'Educational Video'
    ).trim();

    const channel = String(
      rawMeta.channel ||
      rawMeta.channelTitle ||
      rawMeta.author ||
      item.channel ||
      item.channelTitle ||
      'YouTube Creator'
    ).trim();

    const channelId = String(
      rawMeta.channelId ||
      rawMeta.channel_id ||
      item.channelId ||
      item.channel_id ||
      rawMeta.snippet?.channelId ||
      item.snippet?.channelId ||
      ''
    ).trim();

    const thumbnail = String(
      rawMeta.thumbnail ||
      item.thumbnail ||
      rawMeta.thumbnails?.maxres?.url ||
      rawMeta.thumbnails?.high?.url ||
      rawMeta.thumbnails?.medium?.url ||
      rawMeta.thumbnails?.default?.url ||
      (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '')
    ).trim();

    const rawDuration =
      rawMeta.duration ??
      item.duration ??
      rawMeta.duration_seconds ??
      item.duration_seconds ??
      rawMeta.length_seconds ??
      item.length_seconds ??
      0;

    const durationSec = typeof rawDuration === 'string' && rawDuration.includes(':')
      ? 0
      : Number(rawDuration) || 0;

    const rawFormatted =
      rawMeta.duration_formatted ||
      rawMeta.durationFormatted ||
      item.durationFormatted ||
      item.duration_formatted ||
      (typeof rawDuration === 'string' && rawDuration.includes(':') ? rawDuration : '');

    const isLive = Boolean(
      rawMeta.is_live ||
      rawMeta.isLive ||
      item.isLive ||
      item.is_live ||
      item.mediaType === 'live' ||
      rawMeta.mediaType === 'live' ||
      rawMeta.liveBroadcastContent === 'live' ||
      item.liveBroadcastContent === 'live'
    );

    const isLiveArchive = Boolean(
      rawMeta.is_live_archive ||
      rawMeta.isLiveArchive ||
      item.isLiveArchive ||
      item.mediaType === 'live_archive' ||
      rawMeta.mediaType === 'live_archive'
    );

    const mediaType = isLive
      ? 'live'
      : isLiveArchive
      ? 'live_archive'
      : item.mediaType || rawMeta.mediaType || 'video';

    let durationFormatted = isLive
      ? ''
      : String(rawFormatted || (durationSec > 0 ? formatVideoDuration(durationSec) : '')).trim();

    // Sanitize: Live streams or videos with zero/empty duration should never display '0:00'
    if (isLive || durationFormatted === '0:00' || durationFormatted === '00:00' || durationFormatted === '0:00:00' || durationFormatted === '0' || durationSec <= 0) {
      durationFormatted = '';
    }

    const rawViews =
      rawMeta.view_count ??
      rawMeta.viewCount ??
      item.viewCount ??
      item.view_count ??
      rawMeta.views ??
      item.views ??
      '';

    const viewCount = String(rawViews || '');
    const viewsText = formatViews(rawViews);

    const rawPublishedAt =
      rawMeta.publishedAt ||
      rawMeta.published_at ||
      item.publishedAt ||
      item.published_at ||
      item.createdAt ||
      item.savedAt ||
      item.addedAt ||
      '';

    const publishedAt = String(rawPublishedAt || '');
    const timeAgoText = formatTimeAgo(rawPublishedAt);

    const rawDesc =
      rawMeta.description ||
      item.description ||
      rawMeta.snippet?.description ||
      item.snippet?.description ||
      '';
    const description = String(rawDesc || '').replace(/\r\n/g, '\n').trim();

    const videoUrl =
      item.videoUrl ||
      item.url ||
      rawMeta.videoUrl ||
      rawMeta.url ||
      (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '');

    this.id = item.id || videoId;
    this.videoId = videoId;
    this.videoUrl = videoUrl;
    this.title = title;
    this.channel = channel;
    this.channelId = channelId;
    this.thumbnail = thumbnail;
    this.duration = isLive ? 0 : durationSec;
    this.durationFormatted = durationFormatted;
    this.viewCount = viewCount;
    this.viewsText = viewsText;
    this.publishedAt = publishedAt;
    this.timeAgoText = timeAgoText;
    this.description = description;
    this.isLive = isLive;
    this.isLiveArchive = isLiveArchive;
    this.mediaType = mediaType;
    this.playlistIds = item.playlistIds || [];
    this.position = typeof item.position === 'number' ? item.position : 0;
    this.watched = Boolean(item.watched);
    this.watchedAt = item.watchedAt || null;
    this.result = item.result || rawMeta.result || null;
  }

  // Virtual getters for backwards-compatibility without payload/memory duplication
  get video_id() { return this.videoId; }
  get duration_formatted() { return this.durationFormatted; }
  get view_count() { return this.viewCount; }
  get published_at() { return this.publishedAt; }
  get is_live() { return this.isLive; }
  get is_live_archive() { return this.isLiveArchive; }

  // Canonical metadata object (computed on demand, keeping memory footprint minimal)
  get metadata() {
    return {
      title: this.title,
      channel: this.channel,
      channelId: this.channelId,
      thumbnail: this.thumbnail,
      duration: this.duration,
      durationFormatted: this.durationFormatted,
      duration_formatted: this.durationFormatted,
      viewCount: this.viewCount,
      view_count: this.viewCount,
      publishedAt: this.publishedAt,
      published_at: this.publishedAt,
      description: this.description,
      isLive: this.isLive,
      is_live: this.isLive,
      isLiveArchive: this.isLiveArchive,
      is_live_archive: this.isLiveArchive,
      mediaType: this.mediaType,
      videoId: this.videoId,
      video_id: this.videoId,
    };
  }

  static fromRaw(raw) {
    return new VideoModel(raw);
  }

  static fromFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    return new VideoModel({ id: docSnap.id, ...docSnap.data() });
  }

  toFirestore() {
    return {
      videoId: this.videoId,
      videoUrl: this.videoUrl,
      metadata: this.metadata,
      duration: this.duration,
      durationFormatted: this.durationFormatted,
      playlistIds: this.playlistIds,
      position: this.position,
      watched: this.watched,
    };
  }
}

