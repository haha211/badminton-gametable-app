-- ==========================================
-- 🏸 배드민턴 게임판 Supabase 실시간 DB 생성 SQL
-- Supabase 대시보드 -> [SQL Editor]에 복사해 실행하세요!
-- ==========================================

-- 1. 대진표 실시간 세션 저장 테이블 생성
CREATE TABLE IF NOT EXISTS public.badminton_sessions (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT UNIQUE NOT NULL DEFAULT 'default_badminton_room',
  session_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 모든 사람(로그인 필요 없음)이 조회/수정 가능하도록 RLS 권한 허용
ALTER TABLE public.badminton_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badminton sessions"
  ON public.badminton_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert/update badminton sessions"
  ON public.badminton_sessions
  FOR ALL
  USING (true);

-- 3. Supabase Realtime (실시간 동기화) 기능 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.badminton_sessions;
