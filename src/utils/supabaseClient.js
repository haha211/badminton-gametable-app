import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

const SESSION_ROOM_ID = 'default_badminton_room';

/**
 * Supabase에서 최신 대진표 세션 데이터 가져오기
 */
export async function fetchBadmintonSession() {
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

    return data ? data.session_data : null;
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    return null;
  }
}

/**
 * Supabase DB에 변경된 대진표 세션 데이터 실시간 저장/업데이트
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
 * Supabase Realtime 채널을 통해 다른 기기 변경사항을 1초 만에 실시간 수신
 */
export function subscribeToBadmintonSession(onSessionUpdate) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel('badminton_sessions_channel')
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
        console.log('⚡ Supabase Realtime Subscribed Successfully!');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
