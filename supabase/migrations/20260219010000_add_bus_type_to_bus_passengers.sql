-- ============================================
-- bus_passengers 테이블에 운행 구분 추가
-- 출발/행사중/귀가 3가지 구분용
-- ============================================

-- 1) bus_type 컬럼 추가 (기본값: 출발)
ALTER TABLE public.bus_passengers
ADD COLUMN IF NOT EXISTS bus_type TEXT NOT NULL DEFAULT '출발';

-- 2) buses.bus_type이 존재하는 경우, bus_id 기준으로 값 채우기
UPDATE public.bus_passengers AS bp
SET bus_type = b.bus_type
FROM public.buses AS b
WHERE bp.bus_id = b.id;

-- 3) NULL/공백 데이터 보정
UPDATE public.bus_passengers
SET bus_type = '출발'
WHERE bus_type IS NULL OR bus_type = '';

-- 4) 허용값 제약 추가 (출발/행사중/귀가)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bus_passengers_bus_type_check'
  ) THEN
    ALTER TABLE public.bus_passengers
    ADD CONSTRAINT bus_passengers_bus_type_check
    CHECK (bus_type IN ('출발', '행사중', '귀가'));
  END IF;
END $$;
