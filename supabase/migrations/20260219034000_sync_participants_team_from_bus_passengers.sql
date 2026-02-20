-- ============================================
-- participants.team: bus_passengers.team 연동 및 기본값 설정
-- ============================================

-- 1) team 컬럼 추가
ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS team TEXT;

-- 2) bus_passengers 기준으로 participants.team 동기화
CREATE OR REPLACE FUNCTION public.sync_participants_team_from_bus_passengers()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.participant_id IS NOT NULL AND NEW.team IS NOT NULL AND NEW.team <> '' THEN
    UPDATE public.participants
    SET team = NEW.team
    WHERE id = NEW.participant_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_participants_team_from_bus_passengers ON public.bus_passengers;
CREATE TRIGGER sync_participants_team_from_bus_passengers
AFTER INSERT OR UPDATE OF team, participant_id
ON public.bus_passengers
FOR EACH ROW
EXECUTE FUNCTION public.sync_participants_team_from_bus_passengers();

-- 3) 기존 데이터 보정: bus_passengers.team 우선, 없으면 STAFF
UPDATE public.participants AS p
SET team = bp.team
FROM public.bus_passengers AS bp
WHERE bp.participant_id = p.id
  AND bp.team IS NOT NULL
  AND bp.team <> '';

UPDATE public.participants
SET team = 'STAFF'
WHERE team IS NULL OR team = '';
