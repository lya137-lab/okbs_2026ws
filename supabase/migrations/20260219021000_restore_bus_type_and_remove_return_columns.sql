-- ============================================
-- bus_passengers에서 귀가 관련 컬럼 제거 + bus_type 제약 복구
-- ============================================

-- 1) 귀가 관련 컬럼 삭제 (return_bus_name, return_departure_time)
ALTER TABLE public.bus_passengers
DROP COLUMN IF EXISTS return_bus_name,
DROP COLUMN IF EXISTS return_departure_time;

-- 2) bus_type 제약 복구 (출발/행사중/귀가)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bus_passengers_bus_type_check'
  ) THEN
    ALTER TABLE public.bus_passengers
    DROP CONSTRAINT bus_passengers_bus_type_check;
  END IF;
END $$;

ALTER TABLE public.bus_passengers
ADD CONSTRAINT bus_passengers_bus_type_check
CHECK (bus_type IN ('출발', '행사중', '귀가'));
