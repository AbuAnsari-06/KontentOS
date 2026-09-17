import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Video, Subtitle, Caption, PublishingRecord, User, VideoStatus, SocialPlatform } from '../src/types.js';

const rawUrl = (process.env.SUPABASE_URL || '').trim();
const rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

function isValidHttpUrl(urlStr: string): boolean {
  if (!urlStr || urlStr === 'MY_SUPABASE_URL' || urlStr.startsWith('your-')) return false;
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

let supabaseClient: SupabaseClient | null = null;

if (isValidHttpUrl(rawUrl) && rawKey && rawKey !== 'MY_SUPABASE_KEY') {
  try {
    supabaseClient = createClient(rawUrl, rawKey, {
      auth: { persistSession: false },
    });
    console.log('✓ Connected to external Supabase PostgreSQL database');
  } catch (err: any) {
    console.log('ℹ️ Supabase initialization bypassed, utilizing local persistent storage engine.');
    supabaseClient = null;
  }
} else {
  console.log('ℹ️ Utilizing zero-cost local persistent storage engine (.data/kontentos-db.json).');
}

export function isSupabaseConnected(): boolean {
  return supabaseClient !== null;
}

// ==========================================
// Robust Local Storage Fallback Engine
// ==========================================
interface LocalStoreSchema {
  users: User[];
  videos: Video[];
  subtitles: Subtitle[];
  captions: Caption[];
  publishing_history: PublishingRecord[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'kontentos-db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLocalStore(): LocalStoreSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const defaultData: LocalStoreSchema = {
      users: [
        {
          id: 'user_default',
          email: 'creator@kontentos.ai',
          full_name: 'KontentOS Creator',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          created_at: new Date().toISOString(),
        },
      ],
      videos: [],
      subtitles: [],
      captions: [],
      publishing_history: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local DB file, resetting to empty schema:', err);
    return {
      users: [],
      videos: [],
      subtitles: [],
      captions: [],
      publishing_history: [],
    };
  }
}

function saveLocalStore(data: LocalStoreSchema) {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ==========================================
// Database Operations Service
// ==========================================

export async function createVideo(data: Partial<Video>): Promise<Video> {
  const newVideo: Video = {
    id: data.id || `vid_${crypto.randomUUID()}`,
    user_id: data.user_id || 'user_default',
    title: data.title || 'Untitled Video',
    description: data.description || '',
    file_url: data.file_url || '',
    thumbnail_url: data.thumbnail_url || '',
    duration: data.duration || 0,
    file_size: data.file_size || 0,
    aspect_ratio: data.aspect_ratio || '9:16',
    status: data.status || 'uploading',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabaseClient) {
    try {
      const { data: inserted, error } = await supabaseClient
        .from('videos')
        .insert([newVideo])
        .select()
        .single();
      if (!error && inserted) {
        // Mirror to local store for fast offline read
        const store = loadLocalStore();
        store.videos.unshift(inserted as Video);
        saveLocalStore(store);
        return inserted as Video;
      }
      console.warn('Supabase createVideo returned error, falling back to local store:', error?.message);
    } catch (err: any) {
      console.warn('Supabase createVideo exception, falling back to local store:', err?.message);
    }
  }

  const store = loadLocalStore();
  store.videos.unshift(newVideo);
  saveLocalStore(store);
  return newVideo;
}

export async function getVideo(id: string): Promise<Video | null> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('videos')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return data as Video;
      }
    } catch (err: any) {
      console.warn('Supabase getVideo exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  return store.videos.find((v) => v.id === id) || null;
}

export async function listVideos(userId = 'user_default'): Promise<Video[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        return data as Video[];
      }
      console.warn('Supabase listVideos returned error, reading local store:', error?.message);
    } catch (err: any) {
      console.warn('Supabase listVideos exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  return store.videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateVideoStatus(
  id: string,
  status: VideoStatus,
  extra: Partial<Video> = {}
): Promise<Video | null> {
  const updates = {
    ...extra,
    status,
    updated_at: new Date().toISOString(),
  };

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const store = loadLocalStore();
        const idx = store.videos.findIndex((v) => v.id === id);
        if (idx !== -1) {
          store.videos[idx] = data as Video;
          saveLocalStore(store);
        }
        return data as Video;
      }
    } catch (err: any) {
      console.warn('Supabase updateVideoStatus exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  const idx = store.videos.findIndex((v) => v.id === id);
  if (idx === -1) return null;

  store.videos[idx] = {
    ...store.videos[idx],
    ...updates,
  };
  saveLocalStore(store);
  return store.videos[idx];
}

export async function deleteVideo(id: string): Promise<boolean> {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.from('videos').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteVideo warning:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase deleteVideo exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  const initialLen = store.videos.length;
  store.videos = store.videos.filter((v) => v.id !== id);
  store.subtitles = store.subtitles.filter((s) => s.video_id !== id);
  store.captions = store.captions.filter((c) => c.video_id !== id);
  store.publishing_history = store.publishing_history.filter((p) => p.video_id !== id);
  saveLocalStore(store);
  return store.videos.length < initialLen;
}

export async function saveSubtitles(
  sub: Omit<Subtitle, 'id' | 'created_at'>
): Promise<Subtitle> {
  const newSub: Subtitle = {
    id: `sub_${crypto.randomUUID()}`,
    video_id: sub.video_id,
    srt_content: sub.srt_content,
    vtt_content: sub.vtt_content,
    transcript_text: sub.transcript_text,
    language: sub.language,
    segments: sub.segments,
    created_at: new Date().toISOString(),
  };

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('subtitles')
        .upsert([newSub])
        .select()
        .single();
      if (!error && data) {
        const store = loadLocalStore();
        store.subtitles = store.subtitles.filter((s) => s.video_id !== sub.video_id);
        store.subtitles.unshift(data as Subtitle);
        saveLocalStore(store);
        return data as Subtitle;
      }
    } catch (err: any) {
      console.warn('Supabase saveSubtitles exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  store.subtitles = store.subtitles.filter((s) => s.video_id !== sub.video_id);
  store.subtitles.unshift(newSub);
  saveLocalStore(store);
  return newSub;
}

export async function getSubtitles(videoId: string): Promise<Subtitle | null> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('subtitles')
        .select('*')
        .eq('video_id', videoId)
        .maybeSingle();
      if (!error && data) {
        return data as Subtitle;
      }
    } catch (err: any) {
      console.warn('Supabase getSubtitles exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  return store.subtitles.find((s) => s.video_id === videoId) || null;
}

export async function saveCaption(
  caption: Omit<Caption, 'id' | 'created_at'>
): Promise<Caption> {
  const newCap: Caption = {
    id: `cap_${crypto.randomUUID()}`,
    video_id: caption.video_id,
    platform: caption.platform,
    caption_text: caption.caption_text,
    hashtags: caption.hashtags,
    approved: caption.approved ?? false,
    transcript_hash: caption.transcript_hash || '',
    character_count: caption.character_count || caption.caption_text.length,
    created_at: new Date().toISOString(),
  };

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('captions')
        .upsert([newCap])
        .select()
        .single();
      if (!error && data) {
        const store = loadLocalStore();
        store.captions = store.captions.filter(
          (c) => !(c.video_id === caption.video_id && c.platform === caption.platform)
        );
        store.captions.unshift(data as Caption);
        saveLocalStore(store);
        return data as Caption;
      }
    } catch (err: any) {
      console.warn('Supabase saveCaption exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  store.captions = store.captions.filter(
    (c) => !(c.video_id === caption.video_id && c.platform === caption.platform)
  );
  store.captions.unshift(newCap);
  saveLocalStore(store);
  return newCap;
}

export async function getCaption(
  videoId: string,
  platform: SocialPlatform = 'instagram'
): Promise<Caption | null> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('captions')
        .select('*')
        .eq('video_id', videoId)
        .eq('platform', platform)
        .maybeSingle();
      if (!error && data) {
        return data as Caption;
      }
    } catch (err: any) {
      console.warn('Supabase getCaption exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  return store.captions.find((c) => c.video_id === videoId && c.platform === platform) || null;
}

export async function updateCaption(
  id: string,
  updates: Partial<Caption>
): Promise<Caption | null> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('captions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        const store = loadLocalStore();
        const idx = store.captions.findIndex((c) => c.id === id);
        if (idx !== -1) {
          store.captions[idx] = data as Caption;
          saveLocalStore(store);
        }
        return data as Caption;
      }
    } catch (err: any) {
      console.warn('Supabase updateCaption exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  const idx = store.captions.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  store.captions[idx] = {
    ...store.captions[idx],
    ...updates,
  };
  saveLocalStore(store);
  return store.captions[idx];
}

export async function recordPublish(
  record: Omit<PublishingRecord, 'id' | 'published_at'>
): Promise<PublishingRecord> {
  const newRec: PublishingRecord = {
    id: `pub_${crypto.randomUUID()}`,
    video_id: record.video_id,
    platform: record.platform,
    platform_post_id: record.platform_post_id || '',
    url: record.url || '',
    status: record.status,
    error_message: record.error_message || '',
    published_at: new Date().toISOString(),
  };

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('publishing_history')
        .insert([newRec])
        .select()
        .single();
      if (!error && data) {
        const store = loadLocalStore();
        store.publishing_history.unshift(data as PublishingRecord);
        saveLocalStore(store);
        return data as PublishingRecord;
      }
    } catch (err: any) {
      console.warn('Supabase recordPublish exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  store.publishing_history.unshift(newRec);
  saveLocalStore(store);
  return newRec;
}

export async function listPublishingHistory(
  userId = 'user_default'
): Promise<PublishingRecord[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('publishing_history')
        .select('*')
        .order('published_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        return data as PublishingRecord[];
      }
    } catch (err: any) {
      console.warn('Supabase listPublishingHistory exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  return store.publishing_history.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export async function deletePublishingRecord(id: string): Promise<boolean> {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('publishing_history')
        .delete()
        .eq('id', id);
      if (error) {
        console.warn('Supabase deletePublishingRecord warning:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase deletePublishingRecord exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  const initialLen = store.publishing_history.length;
  store.publishing_history = store.publishing_history.filter((p) => p.id !== id);
  saveLocalStore(store);
  return store.publishing_history.length < initialLen;
}

export async function getUser(id = 'user_default'): Promise<User | null> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return data as User;
      }
    } catch (err: any) {
      console.warn('Supabase getUser exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  return store.users.find((u) => u.id === id) || null;
}

export async function saveUser(userData: Partial<User>): Promise<User> {
  const userId = userData.id || 'user_default';
  const existing = await getUser(userId);
  const updatedUser: User = {
    id: userId,
    email: userData.email || existing?.email || 'creator@kontentos.ai',
    full_name: userData.full_name || existing?.full_name || 'KontentOS Creator',
    avatar_url: userData.avatar_url || existing?.avatar_url || '',
    instagram_token: userData.instagram_token || existing?.instagram_token,
    instagram_user_id: userData.instagram_user_id || existing?.instagram_user_id,
    instagram_username: userData.instagram_username || existing?.instagram_username,
    created_at: existing?.created_at || new Date().toISOString(),
  };

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .upsert([updatedUser])
        .select()
        .single();
      if (!error && data) {
        const store = loadLocalStore();
        const idx = store.users.findIndex((u) => u.id === userId);
        if (idx === -1) {
          store.users.push(data as User);
        } else {
          store.users[idx] = data as User;
        }
        saveLocalStore(store);
        return data as User;
      }
    } catch (err: any) {
      console.warn('Supabase saveUser exception:', err?.message);
    }
  }

  const store = loadLocalStore();
  const idx = store.users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    store.users.push(updatedUser);
  } else {
    store.users[idx] = updatedUser;
  }
  saveLocalStore(store);
  return updatedUser;
}
