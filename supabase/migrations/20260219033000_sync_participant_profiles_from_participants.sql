-- ============================================
-- participant_profiles에 participants 동일 정보 동기화
-- ============================================

-- 1) 동일 컬럼 추가
ALTER TABLE public.participant_profiles
ADD COLUMN IF NOT EXISTS cohort TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS enrollment_status TEXT;

-- 2) participant_id 기준 동기화 함수
CREATE OR REPLACE FUNCTION public.sync_profile_from_participants()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  p_record RECORD;
BEGIN
  IF NEW.participant_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT cohort, phone, enrollment_status, university, major, name
  INTO p_record
  FROM public.participants
  WHERE id = NEW.participant_id
  LIMIT 1;

  IF p_record IS NOT NULL THEN
    NEW.cohort := p_record.cohort;
    NEW.phone := p_record.phone;
    NEW.enrollment_status := p_record.enrollment_status;
    NEW.university := COALESCE(NEW.university, p_record.university);
    NEW.major := COALESCE(NEW.major, p_record.major);
    NEW.name := COALESCE(NEW.name, p_record.name);
  END IF;

  RETURN NEW;
END;
$$;

-- 3) 트리거 등록
DROP TRIGGER IF EXISTS sync_profile_from_participants ON public.participant_profiles;
CREATE TRIGGER sync_profile_from_participants
BEFORE INSERT OR UPDATE OF participant_id
ON public.participant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_from_participants();

-- 4) 기존 데이터 보정
UPDATE public.participant_profiles AS pp
SET
  cohort = p.cohort,
  phone = p.phone,
  enrollment_status = p.enrollment_status,
  university = COALESCE(pp.university, p.university),
  major = COALESCE(pp.major, p.major),
  name = COALESCE(pp.name, p.name)
FROM public.participants AS p
WHERE pp.participant_id = p.id;
