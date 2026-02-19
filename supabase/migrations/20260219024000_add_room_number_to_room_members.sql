-- ============================================
-- room_members에 room_number 컬럼 추가 및 room_id 자동 매핑
-- ============================================

-- 1) room_number 컬럼 추가
ALTER TABLE public.room_members
ADD COLUMN IF NOT EXISTS room_number TEXT;

-- 2) room_number로 room_id 자동 매핑 함수
CREATE OR REPLACE FUNCTION public.sync_room_id_from_room_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  matched_room_id UUID;
BEGIN
  -- room_number가 없으면 처리하지 않음
  IF NEW.room_number IS NULL OR NEW.room_number = '' THEN
    RETURN NEW;
  END IF;

  -- room_number가 동일한 rooms.id 찾기
  SELECT id INTO matched_room_id
  FROM public.rooms
  WHERE room_number = NEW.room_number
  ORDER BY created_at DESC
  LIMIT 1;

  IF matched_room_id IS NOT NULL THEN
    NEW.room_id := matched_room_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) room_members 트리거
DROP TRIGGER IF EXISTS sync_room_id_room_members ON public.room_members;
CREATE TRIGGER sync_room_id_room_members
BEFORE INSERT OR UPDATE OF room_number
ON public.room_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_room_id_from_room_number();

-- 4) 기존 데이터 보정 (room_number 기준)
UPDATE public.room_members AS rm
SET room_id = r.id
FROM public.rooms AS r
WHERE rm.room_number = r.room_number
  AND (rm.room_id IS NULL OR rm.room_id <> r.id);
