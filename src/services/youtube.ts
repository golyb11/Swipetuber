const YOUTUBE_API_KEY = 'AIzaSyB8WNpH3w-XSgfGRkdMggIWFWWCVtCA-1k';
const SWIPETUBER_PLAYLIST_NAME = 'SwipeTuber Watch Later';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OEmbedMetadata {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

// ─── oEmbed (used for manual video add) ──────────────────────────────────────

export const fetchOEmbedMetadata = async (videoId: string): Promise<OEmbedMetadata | null> => {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return { title: data.title, author_name: data.author_name, thumbnail_url: data.thumbnail_url };
    }

    // Fallback: scrape HTML
    const htmlResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await htmlResponse.text();
    const titleMatch = html.match(/<title>(.*?) - YouTube<\/title>/) || html.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1] : 'Unknown Title';
    title = title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const authorMatch = html.match(/"author":"(.*?)"/) || html.match(/ownerChannelName":"(.*?)"/);
    const authorName = authorMatch ? authorMatch[1] : 'Unknown Channel';
    return { title, author_name: authorName, thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` };
  } catch (error) {
    console.error('oEmbed fetch error:', error);
    return null;
  }
};

// ─── Duration helpers ─────────────────────────────────────────────────────────

export const parseISO8601Duration = (duration: string) => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return { text: '0:00', seconds: 0 };

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  let text = '';
  if (hours > 0) {
    text = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    text = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return { text, seconds: totalSeconds };
};

// ─── Find or create the SwipeTuber Watch Later playlist ──────────────────────

/**
 * Searches the authenticated user's playlists for one named
 * SWIPETUBER_PLAYLIST_NAME. Creates it if not found.
 * Returns the playlist ID.
 */
export const findOrCreateSwipeTuberPlaylist = async (token: string): Promise<string> => {
  // 1. Fetch user's playlists (mine=true, up to 50)
  const listUrl =
    `https://www.googleapis.com/youtube/v3/playlists` +
    `?part=snippet&mine=true&maxResults=50`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Failed to list playlists: ${err}`);
  }

  const listData = await listRes.json();
  const existing = (listData.items || []).find(
    (p: any) => p.snippet?.title === SWIPETUBER_PLAYLIST_NAME
  );

  if (existing) {
    const foundId = existing.id as string;
    console.log('[SwipeTuber] Found existing playlist ID:', foundId);
    return foundId;
  }

  // 2. Create the playlist
  const createRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet,status`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          title: SWIPETUBER_PLAYLIST_NAME,
          description: 'Managed by SwipeTuber app',
        },
        status: { privacyStatus: 'private' },
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create playlist: ${err}`);
  }

  const created = await createRes.json();
  const createdId = created.id as string;
  console.log('[SwipeTuber] Created new playlist ID:', createdId);

  // YouTube needs time to index a freshly created private playlist
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return createdId;
};

// ─── Fetch playlist items (paginated) ────────────────────────────────────────

export const fetchPlaylistItems = async (
  token: string,
  playlistId: string,
  pageToken?: string | null
) => {
  let url =
    `https://www.googleapis.com/youtube/v3/playlistItems` +
    `?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=10`;

  if (pageToken) url += `&pageToken=${pageToken}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.text();
    // Attach status so callers can detect 404 specifically
    const error = new Error(`Failed to fetch playlist items: ${err}`) as any;
    error.status = response.status;
    throw error;
  }

  return response.json();
};

// ─── Keep old name as alias so existing store code keeps working ──────────────
export const fetchWatchLaterPlaylist = fetchPlaylistItems;

// ─── Video durations ──────────────────────────────────────────────────────────

export const fetchVideoDurations = async (
  videoIds: string[]
): Promise<Record<string, { text: string; seconds: number }>> => {
  if (videoIds.length === 0) return {};

  const url =
    `https://www.googleapis.com/youtube/v3/videos` +
    `?part=contentDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) return {};

  const data = await response.json();
  const durations: Record<string, { text: string; seconds: number }> = {};
  data.items?.forEach((item: any) => {
    durations[item.id] = parseISO8601Duration(item.contentDetails.duration);
  });

  return durations;
};

// ─── Delete playlist item (swipe-left sync) ───────────────────────────────────

export const deleteFromPlaylist = async (
  playlistItemId: string,
  token: string
): Promise<boolean> => {
  const url =
    `https://www.googleapis.com/youtube/v3/playlistItems?id=${playlistItemId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to delete playlist item: ${err}`);
  }

  return true;
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const fetchComments = async (videoId: string) => {
  const url =
    `https://www.googleapis.com/youtube/v3/commentThreads` +
    `?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch comments', await response.text());
      return [];
    }
    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      text: item.snippet.topLevelComment.snippet.textOriginal,
      likeCount: item.snippet.topLevelComment.snippet.likeCount ?? 0,
    }));
  } catch (error) {
    console.error('Fetch comments error', error);
    return [];
  }
};
