-- ============================================
-- bus_passengers에 탑승 여부 컬럼 추가
-- ============================================

ALTER TABLE public.bus_passengers
ADD COLUMN IF NOT EXISTS boarded BOOLEAN NOT NULL DEFAULT false;
