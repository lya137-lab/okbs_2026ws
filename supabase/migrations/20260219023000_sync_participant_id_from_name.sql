-- ============================================
-- room_members, bus_passengers: 이름 기준 participant_id 자동 매핑
-- participants.name과 동일한 경우 자동으로 id 세팅
-- ============================================

-- 1) 공통 함수: 이름으로 participant_id 찾기
CREATE OR REPLACE FUNCTION public.sync_participant_id_from_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  matched_id UUID;
BEGIN
  -- 이름이 없으면 처리하지 않음
  IF NEW.name IS NULL OR NEW.name = '' THEN
    RETURN NEW;
  END IF;

  -- 이름이 동일한 참가자가 있으면 해당 id로 설정
  SELECT id INTO matched_id
  FROM public.participants
  WHERE name = NEW.name
  ORDER BY created_at DESC
  LIMIT 1;

  IF matched_id IS NOT NULL THEN
    NEW.participant_id := matched_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) room_members 트리거
DROP TRIGGER IF EXISTS sync_participant_id_room_members ON public.room_members;
CREATE TRIGGER sync_participant_id_room_members
BEFORE INSERT OR UPDATE OF name
ON public.room_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_participant_id_from_name();

-- 3) bus_passengers 트리거
DROP TRIGGER IF EXISTS sync_participant_id_bus_passengers ON public.bus_passengers;
CREATE TRIGGER sync_participant_id_bus_passengers
BEFORE INSERT OR UPDATE OF name
ON public.bus_passengers
FOR EACH ROW
EXECUTE FUNCTION public.sync_participant_id_from_name();

-- 4) 기존 데이터 보정 (이름 기준)
UPDATE public.room_members AS rm
SET participant_id = p.id
FROM public.participants AS p
WHERE rm.name = p.name
  AND (rm.participant_id IS NULL OR rm.participant_id <> p.id);

UPDATE public.bus_passengers AS bp
SET participant_id = p.id
FROM public.participants AS p
WHERE bp.name = p.name
  AND (bp.participant_id IS NULL OR bp.participant_id <> p.id);
