-- ============================================
-- schedules 테이블에 날짜 구분 컬럼 추가
-- 일정 항목별 실제 일자(scheduled_date)로 날짜별 정렬/필터링 지원
-- ============================================

-- 1. schedules에 날짜 구분용 DATE 컬럼 추가
ALTER TABLE public.schedules
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- 2. 기존 데이터 backfill (day_id -> schedule_days.day_number 기준, 1일차=2025-03-14, 2일차=2025-03-15)
UPDATE public.schedules s
SET scheduled_date = sub.d
FROM (
    SELECT sd.id AS day_id,
           CASE sd.day_number
               WHEN 1 THEN '2025-03-14'::DATE
               WHEN 2 THEN '2025-03-15'::DATE
               ELSE NULL
           END AS d
    FROM public.schedule_days sd
) sub
WHERE s.day_id = sub.day_id
  AND sub.d IS NOT NULL
  AND s.scheduled_date IS NULL;

-- 3. 날짜 기반 조회 성능을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_date
ON public.schedules(scheduled_date);

-- 4. 컬럼 코멘트 (유지보수용)
COMMENT ON COLUMN public.schedules.scheduled_date IS '날짜 구분용 실제 일자 (정렬/필터링)';
