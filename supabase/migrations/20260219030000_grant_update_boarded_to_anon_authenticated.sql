-- ============================================
-- bus_passengers.boarded 업데이트 권한 부여
-- ============================================

-- 0) boarded 컬럼이 없으면 먼저 추가
ALTER TABLE public.bus_passengers
ADD COLUMN IF NOT EXISTS boarded BOOLEAN NOT NULL DEFAULT false;

-- 1) 조회 권한 보장 (필요 시)
GRANT SELECT ON public.bus_passengers TO anon, authenticated;

-- 2) boarded 컬럼만 업데이트 권한 부여
GRANT UPDATE (boarded) ON public.bus_passengers TO anon, authenticated;
