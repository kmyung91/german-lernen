import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

export interface Word {
  id: number;
  german: string;
  english: string;
  german_example: string;
  english_example: string;
  bucket: string;
  last_seen: number | null;
  times_known: number;
  is_removed: number;
  level: string;
}

export type BucketType = 'dontKnow' | 'learning' | 'mastered';

export interface UserProgress {
  word_id: number;
  bucket: BucketType;
  times_seen: number;
  times_known: number;
  last_seen: string;
  is_removed: boolean;
}

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
    
    // Run migrations to create user data tables
    console.log('🔄 Running migrations...');
    runMigrations();
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Run database migrations
function runMigrations(): void {
  if (!db) return;
  
  try {
    // Create user_edits table if it doesn't exist
    db.execSync(`
      CREATE TABLE IF NOT EXISTS user_edits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL,
        field_name TEXT NOT NULL,
        custom_value TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        UNIQUE(word_id, field_name)
      );
    `);
    
    // Create user_notes table if it doesn't exist
    db.execSync(`
      CREATE TABLE IF NOT EXISTS user_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word_id INTEGER NOT NULL UNIQUE,
        notes TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
    
    // Create indexes
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_user_edits_word_id ON user_edits(word_id);
      CREATE INDEX IF NOT EXISTS idx_user_notes_word_id ON user_notes(word_id);
    `);
    
    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Get next word to study (prioritize unreviewed, then weighted by bucket)
export function getNextWord(): Word | null {
  if (!db) throw new Error('Database not initialized');

  try {
    // PRIORITY 1: Get unreviewed words first (white circle)
    let result = db.getFirstSync<Word>(`
      SELECT *
      FROM vocabulary
      WHERE last_seen IS NULL AND is_removed = 0
      ORDER BY RANDOM()
      LIMIT 1
    `);

    // PRIORITY 2: If all words reviewed, use weighted selection from buckets
    if (!result) {
      // Weighted selection: 70% dontKnow, 25% learning, 5% mastered
      const rand = Math.random();
      let bucket = 'dontKnow';
      
      if (rand < 0.70) {
        bucket = 'dontKnow';
      } else if (rand < 0.95) {
        bucket = 'learning';
      } else {
        bucket = 'mastered';
      }

      // Try to get a word from the selected bucket
      result = db.getFirstSync<Word>(`
        SELECT *
        FROM vocabulary
        WHERE bucket = ? AND is_removed = 0
        ORDER BY RANDOM()
        LIMIT 1
      `, [bucket]);
    }

    // FALLBACK: If still no word, get from any bucket
    if (!result) {
      result = db.getFirstSync<Word>(`
        SELECT *
        FROM vocabulary
        WHERE is_removed = 0
        ORDER BY RANDOM()
        LIMIT 1
      `);
    }

    return result || null;
  } catch (error) {
    console.error('Error getting next word:', error);
    return null;
  }
}

// Get word by ID with user edits merged
export function getWordById(id: number): Word | null {
  if (!db) throw new Error('Database not initialized');

  try {
    const baseWord = db.getFirstSync<Word>('SELECT * FROM vocabulary WHERE id = ?', [id]);
    if (!baseWord) return null;
    
    // Get user edits for this word
    const edits = db.getAllSync<{ field_name: string; custom_value: string }>(
      'SELECT field_name, custom_value FROM user_edits WHERE word_id = ?',
      [id]
    );
    
    // Apply user edits
    const word = { ...baseWord };
    edits.forEach(edit => {
      if (edit.field_name in word) {
        (word as any)[edit.field_name] = edit.custom_value;
      }
    });
    
    return word;
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
    // Update the vocabulary table directly
    const currentWord = db.getFirstSync<Word>(
      'SELECT * FROM vocabulary WHERE id = ?',
      [wordId]
    );

    if (currentWord) {
      const timesKnown = bucket === 'know' 
        ? currentWord.times_known + 1 
        : currentWord.times_known;

      db.runSync(
        `UPDATE vocabulary 
         SET bucket = ?, 
             times_known = ?,
             last_seen = ?,
             is_removed = ?
         WHERE id = ?`,
        [bucket, timesKnown, Date.now(), isRemoved ? 1 : 0, wordId]
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
    const word = db.getFirstSync<Word>(
      'SELECT * FROM vocabulary WHERE id = ?',
      [wordId]
    );
    
    if (!word) return null;
    
    // Convert Word to UserProgress format
    return {
      word_id: word.id,
      bucket: word.bucket as BucketType,
      times_seen: word.times_known, // We don't track times_seen separately anymore
      times_known: word.times_known,
      last_seen: word.last_seen ? new Date(word.last_seen).toISOString() : new Date().toISOString(),
      is_removed: word.is_removed === 1,
    };
  } catch (error) {
    console.error('Error getting user progress:', error);
    return null;
  }
}

// Get bucket counts
export function getBucketCounts(): { dontKnow: number; learning: number; mastered: number; totalReviewed: number } {
  if (!db) throw new Error('Database not initialized');

  try {
    const dontKnow = db.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM vocabulary 
       WHERE bucket = 'dontKnow' AND is_removed = 0 AND last_seen IS NOT NULL`
    )?.count || 0;

    const learning = db.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM vocabulary 
       WHERE bucket = 'learning' AND is_removed = 0`
    )?.count || 0;

    const mastered = db.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM vocabulary 
       WHERE bucket = 'mastered' AND is_removed = 0`
    )?.count || 0;

    const totalReviewed = db.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM vocabulary 
       WHERE last_seen IS NOT NULL AND is_removed = 0`
    )?.count || 0;

    return { dontKnow, learning, mastered, totalReviewed };
  } catch (error) {
    console.error('Error getting bucket counts:', error);
    return { dontKnow: 0, learning: 0, mastered: 0, totalReviewed: 0 };
  }
}

// Get total word count
export function getTotalWordCount(): number {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM vocabulary'
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
    db.runSync(`
      UPDATE vocabulary 
      SET bucket = 'dontKnow', 
          times_known = 0, 
          last_seen = NULL, 
          is_removed = 0
    `);
    console.log('✅ Progress reset');
  } catch (error) {
    console.error('Error resetting progress:', error);
    throw error;
  }
}

// Update word data (stores in user_edits table, doesn't modify base vocabulary)
export function updateWord(
  wordId: number,
  updates: {
    german?: string;
    english?: string;
    german_example?: string;
    english_example?: string;
    notes?: string;
  }
): void {
  if (!db) throw new Error('Database not initialized');

  try {
    const now = Math.floor(Date.now() / 1000);
    
    // Store each field edit in user_edits table
    const fieldUpdates = [
      { field: 'german', value: updates.german },
      { field: 'english', value: updates.english },
      { field: 'german_example', value: updates.german_example },
      { field: 'english_example', value: updates.english_example },
    ];

    fieldUpdates.forEach(({ field, value }) => {
      if (value !== undefined) {
        // Check if original value differs from new value
        const originalWord = db.getFirstSync<any>(
          `SELECT ${field} FROM vocabulary WHERE id = ?`,
          [wordId]
        );
        
        if (originalWord && originalWord[field] !== value) {
          // Insert or update user edit
          db.runSync(
            `INSERT INTO user_edits (word_id, field_name, custom_value, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(word_id, field_name) 
             DO UPDATE SET custom_value = ?, updated_at = ?`,
            [wordId, field, value, now, value, now]
          );
        } else if (originalWord && originalWord[field] === value) {
          // If user reverted to original, delete the override
          db.runSync(
            'DELETE FROM user_edits WHERE word_id = ? AND field_name = ?',
            [wordId, field]
          );
        }
      }
    });

    // Handle notes separately
    if (updates.notes !== undefined) {
      if (updates.notes.trim() !== '') {
        db.runSync(
          `INSERT INTO user_notes (word_id, notes, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(word_id)
           DO UPDATE SET notes = ?, updated_at = ?`,
          [wordId, updates.notes, now, updates.notes, now]
        );
      } else {
        // Delete empty notes
        db.runSync('DELETE FROM user_notes WHERE word_id = ?', [wordId]);
      }
    }
    
    console.log('✅ Word updated successfully in user_edits');
  } catch (error) {
    console.error('Error updating word:', error);
    throw error;
  }
}

// Get user notes for a word
export function getUserNotes(wordId: number): string | null {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.getFirstSync<{ notes: string }>(
      'SELECT notes FROM user_notes WHERE word_id = ?',
      [wordId]
    );
    return result?.notes || null;
  } catch (error) {
    console.error('Error getting user notes:', error);
    return null;
  }
}

// Reset a single word's progress (for undo functionality)
export function resetWordProgress(wordId: number): void {
  if (!db) throw new Error('Database not initialized');

  try {
    db.runSync(
      `UPDATE vocabulary 
       SET bucket = 'dontKnow', 
           times_known = 0, 
           last_seen = NULL, 
           is_removed = 0
       WHERE id = ?`,
      [wordId]
    );
    console.log('✅ Word progress reset');
  } catch (error) {
    console.error('Error resetting word progress:', error);
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

