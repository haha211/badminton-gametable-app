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
export let lastDbStatus = 'checking'; // 'ok', 'error', 'checking'
export let lastErrorMessage = '';

/**
 * Supabase DB에서 최신 대진표 세션 데이터 가져오기
 */
export async function fetchBadmintonSession(fallbackSession) {
  if (!isSupabaseConfigured || !supabase) {
    lastDbStatus = 'no_config';
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('badminton_sessions')
      .select('*')
      .eq('room_id', SESSION_ROOM_ID)
      .maybeSingle();

    if (error) {
      console.error('Supabase fetch error:', error);
      lastDbStatus = 'error';
      lastErrorMessage = error.message || error.details || 'DB Read Error';
      return null;
    }

    lastDbStatus = 'ok';
    lastErrorMessage = '';

    if (!data && fallbackSession) {
      await updateBadmintonSession(fallbackSession);
      return fallbackSession;
    }

    return data ? data.session_data : null;
  } catch (err) {
    console.error('Supabase fetch exception:', err);
    lastDbStatus = 'error';
    lastErrorMessage = err.message || 'Network/CORS Exception';
    return null;
  }
}

/**
 * Supabase DB 저장 및 Broadcast 웹소켓으로 다른 모든 기기에 0.1초 실시간 전송
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
      lastDbStatus = 'error';
      lastErrorMessage = error.message || 'DB Write Error';
    } else {
      lastDbStatus = 'ok';
      lastErrorMessage = '';
    }

    if (globalChannel) {
      globalChannel.send({
        type: 'broadcast',
        event: 'session_update',
        payload: sessionData,
      });
    }
  } catch (err) {
    console.error('Supabase update exception:', err);
    lastDbStatus = 'error';
    lastErrorMessage = err.message || 'Network Exception';
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
    .on('broadcast', { event: 'session_update' }, (payload) => {
      if (payload && payload.payload) {
        onSessionUpdate(payload.payload);
      }
    })
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
        console.log('⚡ Realtime Subscribed!');
      }
    });

  return () => {
    if (globalChannel) {
      supabase.removeChannel(globalChannel);
      globalChannel = null;
    }
  };
}
