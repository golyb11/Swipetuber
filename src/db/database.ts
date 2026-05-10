import * as SQLite from 'expo-sqlite';
import { ToastAndroid } from 'react-native';

let db: SQLite.SQLiteDatabase | null = null;

export const initDB = async () => {
  if (db) return db;
  
  try {
    db = await SQLite.openDatabaseAsync('swipetube.db');

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS folders (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          is_system INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS videos (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          thumbnail_url TEXT NOT NULL,
          channel_name TEXT,
          description TEXT,
          folder_id TEXT NOT NULL,
          status TEXT DEFAULT 'unread',
          added_at INTEGER NOT NULL,
          FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE CASCADE
      );
    `);

    // Seed system folders if they don't exist
    const countRes = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM folders');
    if (countRes && countRes.count === 0) {
      const now = Date.now();
      await db.runAsync(
        'INSERT INTO folders (id, name, is_system, created_at) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
        ['sys_archive', 'Archive', 1, now, 'sys_watchlater', 'Watch Later', 1, now]
      );
    }

    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    ToastAndroid.show('Critical Error: Database initialization failed.', ToastAndroid.LONG);
    throw error;
  }
};

export const getDB = () => {
  if (!db) throw new Error("Database not initialized");
  return db;
};
