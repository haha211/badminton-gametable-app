import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
      auth: {
        persistSession: false,
      },
    })
  : null;

const SESSION_ROOM_ID = 'default_badminton_room';

/**
 * Supabase DB에서 최신 대진표 세션 데이터 가져오기 (없으면 최초 자동 생성)
 */
export async function fetchBadmintonSession(fallbackSession) {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('badminton_sessions')
      .select('*')
      .eq('room_id', SESSION_ROOM_ID)
      .maybeSingle();

    if (error) {
      console.error('Supabase fetch error:', error);
      return null;
    }

    // 만약 DB에 아직 생성된 방 세션이 없으면 현재 기기의 세션을 DB 최초 1회 생성
    if (!data && fallbackSession) {
      await updateBadmintonSession(fallbackSession);
      return fallbackSession;
    }

    return data ? data.session_data : null;
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    return null;
  }
}

/**
 * Supabase DB에 세션 데이터 실시간 저장 (upsert)
 */
export async function updateBadmintonSession(sessionData) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { error } = await supabase
      .from('badminton_sessions')
      .upsert(
        {
          room_id: SESSION_ROOM_ID,
          session_data: sessionData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'room_id' }
      );

    if (error) {
      console.error('Supabase update error:', error);
    }
  } catch (err) {
    console.error('Supabase update exception:', err);
  }
}

/**
 * Supabase Realtime 채널 실시간 구독
 */
export function subscribeToBadmintonSession(onSessionUpdate) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  let channel = null;

  const initChannel = () => {
    if (channel) {
      supabase.removeChannel(channel);
    }

    channel = supabase
      .channel(`badminton_realtime_global`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'badminton_sessions',
        },
        (payload) => {
          if (payload.new && payload.new.session_data) {
            onSessionUpdate(payload.new.session_data);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Global Realtime Sync Active!');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setTimeout(initChannel, 2000);
        }
      });
  };

  initChannel();

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}
