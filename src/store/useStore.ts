import { create } from 'zustand';
import { ToastAndroid } from 'react-native';
import {
  Folder,
  Video,
  getFolders,
  getVideosByFolder,
  archiveVideo,
  deleteVideo,
  createFolder,
  deleteFolder,
} from '../db/repository';
import { ThemeName } from '../theme/theme';
import {
  fetchPlaylistItems,
  fetchVideoDurations,
  deleteFromPlaylist,
  fetchComments as fetchYouTubeComments,
  findOrCreateSwipeTuberPlaylist,
} from '../services/youtube';



interface AppState {
  theme: ThemeName;
  folders: Folder[];
  videos: Video[];
  activeFolderId: string;
  isInitializing: boolean;
  activeSheet: 'info' | 'comments' | null;
  activeVideo: Video | null;
  lastSwipedVideo: Video | null;
  lastSwipeType: 'archive' | 'delete' | null;
  undoTimeoutId: NodeJS.Timeout | null;
  isAddVideoModalVisible: boolean;

  youtubeToken: string | null;

  swipeTuberPlaylistId: string | null;
  nextPageToken: string | null;
  isLoadingVideos: boolean;
  hideLongVideos: boolean;
  comments: any[];
  isLoadingComments: boolean;


  toggleTheme: () => void;
  setFolders: (folders: Folder[]) => void;
  setVideos: (videos: Video[]) => void;
  setActiveFolder: (id: string) => Promise<void>;
  setAddVideoModalVisible: (visible: boolean) => void;
  openSheet: (type: 'info' | 'comments', video: Video) => void;
  closeSheet: () => void;
  loadFolders: () => Promise<void>;
  loadVideosForActiveFolder: () => Promise<void>;
  swipeRightArchive: (videoId: string) => void;
  swipeLeftDelete: (videoId: string) => void;
  undoSwipe: () => void;
  commitSwipe: () => void;
  addFolder: (name: string) => Promise<void>;
  removeFolder: (id: string) => Promise<void>;

  setYoutubeToken: (token: string | null) => Promise<void>;
  logout: () => void;
  toggleDurationFilter: () => void;
  fetchWatchLater: (loadMore?: boolean, forcePlaylistId?: string) => Promise<void>;
  fetchVideoComments: (videoId: string) => Promise<void>;
}



export const useStore = create<AppState>((set, get) => ({
  theme: 'savanna',
  folders: [],
  videos: [],
  activeFolderId: 'sys_watchlater',
  isInitializing: true,
  activeSheet: null,
  activeVideo: null,
  lastSwipedVideo: null,
  lastSwipeType: null,
  undoTimeoutId: null,
  isAddVideoModalVisible: false,

  youtubeToken: null,
  swipeTuberPlaylistId: null,
  nextPageToken: null,
  isLoadingVideos: false,
  hideLongVideos: false,
  comments: [],
  isLoadingComments: false,



  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'savanna' ? 'midnight' : 'savanna' })),

  setFolders: (folders) => set({ folders }),
  setVideos: (videos) => set({ videos }),
  setAddVideoModalVisible: (visible) => set({ isAddVideoModalVisible: visible }),



  openSheet: (type, video) => {
    set({ activeSheet: type, activeVideo: video });
    if (type === 'comments') {
      get().fetchVideoComments(video.id);
    }
  },
  closeSheet: () => set({ activeSheet: null, activeVideo: null }),



  setActiveFolder: async (id) => {
    set({ activeFolderId: id });
    await get().loadVideosForActiveFolder();
  },

  loadFolders: async () => {
    try {
      const folders = await getFolders();
      set({ folders });
      if (folders.length > 0 && !get().activeFolderId) {
        set({ activeFolderId: folders[0].id });
      }
      await get().loadVideosForActiveFolder();
    } catch (e) {
      console.error('Failed to load folders', e);
      ToastAndroid.show('Failed to load folders from database.', ToastAndroid.LONG);
    }
  },

  loadVideosForActiveFolder: async () => {
    try {
      const { activeFolderId, youtubeToken, fetchWatchLater } = get();
      if (!activeFolderId) {
        set({ isInitializing: false });
        return;
      }

      if (activeFolderId === 'sys_watchlater' && youtubeToken) {
        await fetchWatchLater();
        return;
      }

      const videos = await getVideosByFolder(activeFolderId);
      set({ videos, isInitializing: false });
    } catch (e) {
      console.error('Failed to load videos', e);
      ToastAndroid.show('Failed to load videos from database.', ToastAndroid.LONG);
      set({ isInitializing: false });
    }
  },



  commitSwipe: () => {
    const { lastSwipedVideo, lastSwipeType, youtubeToken } = get();
    if (!lastSwipedVideo) return;

    if (lastSwipeType === 'archive') {
      archiveVideo(lastSwipedVideo.id).catch((e) => {
        console.error('Failed to archive video', e);
        ToastAndroid.show('Failed to archive video.', ToastAndroid.LONG);
        get().loadVideosForActiveFolder();
      });
    } else if (lastSwipeType === 'delete') {

      if (lastSwipedVideo.playlistItemId && youtubeToken) {
        deleteFromPlaylist(lastSwipedVideo.playlistItemId, youtubeToken).catch((e) => {
          console.error('Failed to delete from playlist', e);
          ToastAndroid.show('Failed to remove from SwipeTuber Watch Later.', ToastAndroid.LONG);
        });
      } else {
        deleteVideo(lastSwipedVideo.id).catch((e) => {
          console.error('Failed to delete video', e);
          ToastAndroid.show('Failed to delete video.', ToastAndroid.LONG);
          get().loadVideosForActiveFolder();
        });
      }
    }

    set({ lastSwipedVideo: null, lastSwipeType: null, undoTimeoutId: null });
  },

  swipeRightArchive: (videoId: string) => {
    const { videos, commitSwipe, undoTimeoutId } = get();

    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      commitSwipe();
    }

    const swipedVideo = videos.find((v) => v.id === videoId);
    if (!swipedVideo) return;

    set({
      videos: videos.filter((v) => v.id !== videoId),
      lastSwipedVideo: swipedVideo,
      lastSwipeType: 'archive',
    });

    const timeout = setTimeout(() => get().commitSwipe(), 4000);
    set({ undoTimeoutId: timeout });
  },

  swipeLeftDelete: (videoId: string) => {
    const { videos, commitSwipe, undoTimeoutId } = get();

    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      commitSwipe();
    }

    const swipedVideo = videos.find((v) => v.id === videoId);
    if (!swipedVideo) return;

    set({
      videos: videos.filter((v) => v.id !== videoId),
      lastSwipedVideo: swipedVideo,
      lastSwipeType: 'delete',
    });

    const timeout = setTimeout(() => get().commitSwipe(), 4000);
    set({ undoTimeoutId: timeout });
  },

  undoSwipe: () => {
    const { lastSwipedVideo, videos, undoTimeoutId } = get();
    if (!lastSwipedVideo) return;

    if (undoTimeoutId) clearTimeout(undoTimeoutId);

    set({
      videos: [lastSwipedVideo, ...videos],
      lastSwipedVideo: null,
      lastSwipeType: null,
      undoTimeoutId: null,
    });
  },



  addFolder: async (name: string) => {
    try {
      const id = 'usr_' + Date.now().toString();
      await createFolder(id, name);
      await get().loadFolders();
      set({ activeFolderId: id });
      await get().loadVideosForActiveFolder();
      ToastAndroid.show('Folder created!', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Failed to create folder:', error);
      ToastAndroid.show('Error creating folder.', ToastAndroid.LONG);
    }
  },

  removeFolder: async (id: string) => {
    try {
      await deleteFolder(id);
      await get().loadFolders();
      set({ activeFolderId: 'sys_watchlater' });
      await get().loadVideosForActiveFolder();
      ToastAndroid.show('Folder deleted.', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      ToastAndroid.show('Error deleting folder.', ToastAndroid.LONG);
    }
  },








  setYoutubeToken: async (token) => {
    set({ youtubeToken: token });

    if (!token) return;

    let playlistId: string | null = null;
    try {
      playlistId = await findOrCreateSwipeTuberPlaylist(token);

      set({ swipeTuberPlaylistId: playlistId });
    } catch (e) {
      console.error('Failed to find/create SwipeTuber playlist', e);
      ToastAndroid.show('Could not access SwipeTuber Watch Later playlist.', ToastAndroid.LONG);
      return;
    }

    if (get().activeFolderId === 'sys_watchlater' && playlistId) {

      await get().fetchWatchLater(false, playlistId);
    }
  },

  logout: () => {
    set({ youtubeToken: null, swipeTuberPlaylistId: null, nextPageToken: null, videos: [] });
    get().loadVideosForActiveFolder();
  },



  toggleDurationFilter: () => {
    const { hideLongVideos, youtubeToken, activeFolderId } = get();
    set({ hideLongVideos: !hideLongVideos });
    if (youtubeToken && activeFolderId === 'sys_watchlater') {
      get().fetchWatchLater();
    }
  },







  fetchWatchLater: async (loadMore = false, forcePlaylistId?: string) => {
    const { youtubeToken, swipeTuberPlaylistId, nextPageToken, hideLongVideos, videos } = get();

    const playlistId = forcePlaylistId ?? swipeTuberPlaylistId;

    if (!youtubeToken || !playlistId) return;

    if (!loadMore) {
      set({ isLoadingVideos: true, videos: [], nextPageToken: null });
    } else {
      set({ isLoadingVideos: true });
    }

    try {
      const pageToFetch = loadMore ? nextPageToken : null;
      if (loadMore && !pageToFetch) {
        set({ isLoadingVideos: false });
        return;
      }

      const data = await fetchPlaylistItems(youtubeToken, playlistId, pageToFetch);
      const newNextPageToken = data.nextPageToken || null;
      const items: any[] = data.items || [];

      if (items.length === 0) {
        set({ isLoadingVideos: false, isInitializing: false });
        return;
      }

      const videoIds = items.map((item) => item.contentDetails.videoId);
      const durations = await fetchVideoDurations(videoIds);

      let fetchedVideos: Video[] = items.map((item) => {
        const videoId = item.contentDetails.videoId;
        const durationInfo = durations[videoId] || { text: '0:00', seconds: 0 };
        return {
          id: videoId,
          title: item.snippet.title,
          thumbnail_url:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.default?.url ||
            `https:
          channel_name: item.snippet.videoOwnerChannelTitle || '',
          description: item.snippet.description || '',
          folder_id: 'sys_watchlater',
          status: 'unread' as const,
          added_at: new Date(item.snippet.publishedAt || Date.now()).getTime(),
          duration: durationInfo.text,
          durationSec: durationInfo.seconds,
          playlistItemId: item.id,
        };
      });

      if (hideLongVideos) {
        fetchedVideos = fetchedVideos.filter((v) => (v.durationSec || 0) <= 900);
      }

      set({
        videos: loadMore ? [...videos, ...fetchedVideos] : fetchedVideos,
        nextPageToken: newNextPageToken,
        isLoadingVideos: false,
        isInitializing: false,
      });
    } catch (e: any) {

      if (e?.status === 404) {
        console.warn('[SwipeTuber] Playlist 404 — invalidating ID and re-creating...');
        set({ swipeTuberPlaylistId: null, isLoadingVideos: false });

        const token = get().youtubeToken;
        if (token) {
          try {
            const freshId = await findOrCreateSwipeTuberPlaylist(token);
            set({ swipeTuberPlaylistId: freshId });

            await get().fetchWatchLater(false, freshId);
          } catch (retryErr) {
            console.error('Failed to recover from 404', retryErr);
            ToastAndroid.show('Could not recover playlist. Please sign out and back in.', ToastAndroid.LONG);
            set({ isInitializing: false });
          }
        }
        return;
      }

      console.error('Failed to fetch SwipeTuber Watch Later', e);
      ToastAndroid.show('Failed to fetch SwipeTuber Watch Later playlist.', ToastAndroid.LONG);
      set({ isLoadingVideos: false, isInitializing: false });
    }
  },



  fetchVideoComments: async (videoId: string) => {
    set({ isLoadingComments: true, comments: [] });
    const comments = await fetchYouTubeComments(videoId);
    set({ comments, isLoadingComments: false });
  },
}));
