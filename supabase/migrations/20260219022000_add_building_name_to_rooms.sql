-- ============================================
-- rooms 테이블에 건물명 컬럼 추가
-- ============================================

ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS building_name TEXT;
