-- ============================================
-- schedule_days 테이블 삭제 및 schedules 단일 테이블 연동
-- schedules.scheduled_date로 날짜 구분, day_id 제거
-- ============================================

-- 1. schedules -> schedule_days FK 제거
ALTER TABLE public.schedules
DROP CONSTRAINT IF EXISTS schedules_day_id_fkey;

-- 2. schedules에서 day_id 컬럼 제거
ALTER TABLE public.schedules
DROP COLUMN IF EXISTS day_id;

-- 3. schedule_days 테이블 삭제 (관련 트리거/정책 등 함께 제거)
DROP TABLE IF EXISTS public.schedule_days CASCADE;

-- 4. 사용하지 않는 트리거 함수 정리
DROP FUNCTION IF EXISTS update_schedule_days_updated_at();
