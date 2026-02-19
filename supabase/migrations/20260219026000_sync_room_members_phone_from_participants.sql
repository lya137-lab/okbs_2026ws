-- ============================================
-- room_members.phone을 participants.phone으로 자동 동기화
-- participant_id 기준으로 자동 업데이트
-- ============================================

-- 1) participant_id 기준 phone 자동 매핑 함수
CREATE OR REPLACE FUNCTION public.sync_room_member_phone_from_participant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  matched_phone TEXT;
BEGIN
  -- participant_id가 없으면 처리하지 않음
  IF NEW.participant_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- participant_id 기준 연락처 조회
  SELECT phone INTO matched_phone
  FROM public.participants
  WHERE id = NEW.participant_id
  LIMIT 1;

  IF matched_phone IS NOT NULL THEN
    NEW.phone := matched_phone;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) room_members 트리거
DROP TRIGGER IF EXISTS sync_room_member_phone ON public.room_members;
CREATE TRIGGER sync_room_member_phone
BEFORE INSERT OR UPDATE OF participant_id
ON public.room_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_room_member_phone_from_participant();

-- 3) 기존 데이터 보정 (participant_id 기준)
UPDATE public.room_members AS rm
SET phone = p.phone
FROM public.participants AS p
WHERE rm.participant_id = p.id
  AND p.phone IS NOT NULL
  AND (rm.phone IS NULL OR rm.phone <> p.phone);
