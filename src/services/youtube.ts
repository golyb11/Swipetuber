const YOUTUBE_API_KEY = 'AIzaSyB8WNpH3w-XSgfGRkdMggIWFWWCVtCA-1k';
const SWIPETUBER_PLAYLIST_NAME = 'SwipeTuber Watch Later';



export interface OEmbedMetadata {
  title: string;
  author_name: string;
  thumbnail_url: string;
}



export const fetchOEmbedMetadata = async (videoId: string): Promise<OEmbedMetadata | null> => {
  try {
    const url = `https:
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      return { title: data.title, author_name: data.author_name, thumbnail_url: data.thumbnail_url };
    }


    const htmlResponse = await fetch(`https:
    const html = await htmlResponse.text();
    const titleMatch = html.match(/<title>(.*?) - YouTube<\/title>/) || html.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1] : 'Unknown Title';
    title = title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const authorMatch = html.match(/"author":"(.*?)"/) || html.match(/ownerChannelName":"(.*?)"/);
    const authorName = authorMatch ? authorMatch[1] : 'Unknown Channel';
    return { title, author_name: authorName, thumbnail_url: `https:
  } catch (error) {
    console.error('oEmbed fetch error:', error);
    return null;
  }
};



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








export const findOrCreateSwipeTuberPlaylist = async (token: string): Promise<string> => {

  const listUrl =
    `https:
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


  const createRes = await fetch(
    `https:
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


  await new Promise((resolve) => setTimeout(resolve, 2000));

  return createdId;
};



export const fetchPlaylistItems = async (
  token: string,
  playlistId: string,
  pageToken?: string | null
) => {
  let url =
    `https:
    `?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=10`;

  if (pageToken) url += `&pageToken=${pageToken}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.text();

    const error = new Error(`Failed to fetch playlist items: ${err}`) as any;
    error.status = response.status;
    throw error;
  }

  return response.json();
};


export const fetchWatchLaterPlaylist = fetchPlaylistItems;



export const fetchVideoDurations = async (
  videoIds: string[]
): Promise<Record<string, { text: string; seconds: number }>> => {
  if (videoIds.length === 0) return {};

  const url =
    `https:
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



export const deleteFromPlaylist = async (
  playlistItemId: string,
  token: string
): Promise<boolean> => {
  const url =
    `https:

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



export const fetchComments = async (videoId: string) => {
  const url =
    `https:
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
