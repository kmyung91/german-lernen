import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

export interface Word {
  id: number;
  german: string;
  english: string;
  article: string | null;
  part_of_speech: string;
  german_example: string;
  english_example: string;
  pronunciation: string | null;
}

export interface UserProgress {
  word_id: number;
  bucket: 'dontKnow' | 'know';
  times_seen: number;
  times_known: number;
  last_seen: string;
  is_removed: boolean;
}

export type BucketType = 'dontKnow' | 'know';

let db: SQLite.SQLiteDatabase | null = null;

// Initialize database
export async function initDatabase(): Promise<void> {
  try {
    console.log('🔄 Starting database initialization...');
    
    // Load the bundled database
    const dbName = 'german-vocabulary.db';
    console.log('📦 Loading database asset...');
    const dbAsset = require('./assets/german-vocabulary.db');
    console.log('🔗 Getting asset URI...');
    
    // Download the asset first to ensure it's available locally
    const asset = Asset.fromModule(dbAsset);
    await asset.downloadAsync();
    const dbUri = asset.localUri || asset.uri;
    console.log('📍 Database URI:', dbUri);
    
    const docDir = FileSystem.documentDirectory;
    console.log('📁 Document directory:', docDir);
    if (!docDir) {
      throw new Error('FileSystem.documentDirectory is undefined');
    }
    
    const dbFilePath = `${docDir}SQLite/${dbName}`;
    console.log('📍 Target path:', dbFilePath);

    // Ensure the SQLite directory exists
    console.log('📁 Checking SQLite directory...');
    const dirInfo = await FileSystem.getInfoAsync(`${docDir}SQLite`);
    if (!dirInfo.exists) {
      console.log('📁 Creating SQLite directory...');
      await FileSystem.makeDirectoryAsync(`${docDir}SQLite`, {
        intermediates: true,
      });
    }

    // Check if database already exists in app directory
    console.log('🔍 Checking if database exists...');
    const fileInfo = await FileSystem.getInfoAsync(dbFilePath);
    if (!fileInfo.exists) {
      console.log('📥 Copying database from assets...');
      await FileSystem.downloadAsync(dbUri, dbFilePath);
      console.log('✅ Database copied');
    } else {
      console.log('✅ Database already exists');
    }

    // Open database
    console.log('🔓 Opening database...');
    db = SQLite.openDatabaseSync(dbName);
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Get next word to study (prioritize dontKnow bucket, exclude removed)
export function getNextWord(): Word | null {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.getFirstSync<Word>(`
      SELECT w.*
      FROM words w
      LEFT JOIN user_progress up ON w.id = up.word_id
      WHERE (up.bucket = 'dontKnow' OR up.bucket IS NULL)
        AND (up.is_removed = 0 OR up.is_removed IS NULL)
      ORDER BY RANDOM()
      LIMIT 1
    `);

    return result || null;
  } catch (error) {
    console.error('Error getting next word:', error);
    return null;
  }
}

// Get word by ID
export function getWordById(id: number): Word | null {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.getFirstSync<Word>('SELECT * FROM words WHERE id = ?', [id]);
    return result || null;
  } catch (error) {
    console.error('Error getting word by ID:', error);
    return null;
  }
}

// Update progress after swipe
export function updateProgress(
  wordId: number,
  bucket: BucketType,
  isRemoved: boolean = false
): void {
  if (!db) throw new Error('Database not initialized');

  try {
    // Get current progress
    const currentProgress = db.getFirstSync<UserProgress>(
      'SELECT * FROM user_progress WHERE word_id = ?',
      [wordId]
    );

    if (currentProgress) {
      // Update existing progress
      const timesKnown = bucket === 'know' 
        ? currentProgress.times_known + 1 
        : currentProgress.times_known;

      db.runSync(
        `UPDATE user_progress 
         SET bucket = ?, 
             times_seen = times_seen + 1, 
             times_known = ?,
             last_seen = datetime('now'),
             is_removed = ?,
             updated_at = datetime('now')
         WHERE word_id = ?`,
        [bucket, timesKnown, isRemoved ? 1 : 0, wordId]
      );
    } else {
      // Insert new progress
      db.runSync(
        `INSERT INTO user_progress (word_id, bucket, times_seen, times_known, last_seen, is_removed)
         VALUES (?, ?, 1, ?, datetime('now'), ?)`,
        [wordId, bucket, bucket === 'know' ? 1 : 0, isRemoved ? 1 : 0]
      );
    }
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
}

// Get user progress for a word
export function getUserProgress(wordId: number): UserProgress | null {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.getFirstSync<UserProgress>(
      'SELECT * FROM user_progress WHERE word_id = ?',
      [wordId]
    );
    return result || null;
  } catch (error) {
    console.error('Error getting user progress:', error);
    return null;
  }
}

// Get bucket counts
export function getBucketCounts(): { dontKnow: number; know: number; total: number } {
  if (!db) throw new Error('Database not initialized');

  try {
    const dontKnow = db.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM user_progress 
       WHERE bucket = 'dontKnow' AND is_removed = 0`
    )?.count || 0;

    const know = db.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM user_progress 
       WHERE bucket = 'know' AND is_removed = 0`
    )?.count || 0;

    const total = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM words'
    )?.count || 0;

    return { dontKnow, know, total };
  } catch (error) {
    console.error('Error getting bucket counts:', error);
    return { dontKnow: 0, know: 0, total: 0 };
  }
}

// Get total word count
export function getTotalWordCount(): number {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM words'
    );
    return result?.count || 0;
  } catch (error) {
    console.error('Error getting total word count:', error);
    return 0;
  }
}

// Reset all progress (for testing)
export function resetProgress(): void {
  if (!db) throw new Error('Database not initialized');

  try {
    db.runSync('DELETE FROM user_progress');
    console.log('✅ Progress reset');
  } catch (error) {
    console.error('Error resetting progress:', error);
    throw error;
  }
}

// Close database
export function closeDatabase(): void {
  if (db) {
    db.closeSync();
    db = null;
    console.log('✅ Database closed');
  }
}

