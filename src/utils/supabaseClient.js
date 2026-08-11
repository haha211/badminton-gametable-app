import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 30,
        },
      },
    })
  : null;

const SESSION_ROOM_ID = 'default_badminton_room';

let globalChannel = null;

/**
 * Supabase DB에서 최신 대진표 세션 데이터 가져오기
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
 * Supabase DB 저장 및 Broadcast 웹소켓으로 다른 모든 기기에 0.1초 실시간 전송
 */
export async function updateBadmintonSession(sessionData) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    // 1. Supabase DB에 세션 저장
    await supabase
      .from('badminton_sessions')
      .upsert(
        {
          room_id: SESSION_ROOM_ID,
          session_data: sessionData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'room_id' }
      );

    // 2. Broadcast 웹소켓으로 연결된 모든 기기(PC, 폰)에 0.1초 즉시 전송
    if (globalChannel) {
      globalChannel.send({
        type: 'broadcast',
        event: 'session_update',
        payload: sessionData,
      });
    }
  } catch (err) {
    console.error('Supabase update exception:', err);
  }
}

/**
 * Supabase Broadcast + DB Realtime 2중 실시간 리스너 구독
 */
export function subscribeToBadmintonSession(onSessionUpdate) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  if (globalChannel) {
    supabase.removeChannel(globalChannel);
  }

  globalChannel = supabase.channel('badminton_live_room', {
    config: {
      broadcast: { self: false },
    },
  });

  globalChannel
    // 1. Broadcast 웹소켓 실시간 0.1초 메세지 수신
    .on('broadcast', { event: 'session_update' }, (payload) => {
      if (payload && payload.payload) {
        onSessionUpdate(payload.payload);
      }
    })
    // 2. DB Postgres Changes 동기화 수신
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
        console.log('⚡ 0.1초 강력한 Realtime Broadcast 채널 연결 성공!');
      }
    });

  return () => {
    if (globalChannel) {
      supabase.removeChannel(globalChannel);
      globalChannel = null;
    }
  };
}
