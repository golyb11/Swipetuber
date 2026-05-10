import { getDB } from './database';

export interface Folder {
  id: string;
  name: string;
  is_system: number;
  created_at: number;
}

export interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  channel_name: string;
  description: string;
  folder_id: string;
  status: 'unread' | 'archived';
  added_at: number;
  duration?: string;
  durationSec?: number;
  playlistItemId?: string;
}

export const getFolders = async (): Promise<Folder[]> => {
  const db = getDB();
  return await db.getAllAsync<Folder>('SELECT * FROM folders ORDER BY is_system DESC, created_at ASC');
};

export const createFolder = async (id: string, name: string): Promise<void> => {
  const db = getDB();
  await db.runAsync('INSERT INTO folders (id, name, is_system, created_at) VALUES (?, ?, 0, ?)', [id, name, Date.now()]);
};

export const deleteFolder = async (id: string): Promise<void> => {
  const db = getDB();
  await db.runAsync('DELETE FROM folders WHERE id = ? AND is_system = 0', [id]);
};

export const getVideosByFolder = async (folderId: string): Promise<Video[]> => {
  const db = getDB();
  return await db.getAllAsync<Video>('SELECT * FROM videos WHERE folder_id = ? ORDER BY added_at DESC', [folderId]);
};

export const insertVideo = async (video: Video): Promise<void> => {
  const db = getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO videos (id, title, thumbnail_url, channel_name, description, folder_id, status, added_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [video.id, video.title, video.thumbnail_url, video.channel_name || '', video.description || '', video.folder_id, video.status || 'unread', video.added_at]
  );
};

export const archiveVideo = async (id: string): Promise<void> => {
  const db = getDB();
  await db.runAsync('UPDATE videos SET status = ?, folder_id = ? WHERE id = ?', ['archived', 'sys_archive', id]);
};

export const deleteVideo = async (id: string): Promise<void> => {
  const db = getDB();
  await db.runAsync('DELETE FROM videos WHERE id = ?', [id]);
};
