-- ============================================
-- bus_passengers에서 귀가(RETURN) 버스 정보 제거
-- ============================================

-- 1) 귀가 버스 데이터 삭제
DELETE FROM public.bus_passengers
WHERE bus_type = '귀가';

-- 2) bus_type 제약 갱신 (귀가 제거)
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
CHECK (bus_type IN ('출발', '행사중'));
