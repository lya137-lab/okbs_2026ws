-- ============================================
-- user_roles 테이블 삭제 및 participants 테이블에 역할 추가
-- participants.email과 Supabase Auth 이메일을 매칭하여 관리자 권한 확인
-- ============================================

-- 1. participants 테이블에 email, role 컬럼 추가
ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS role app_role NOT NULL DEFAULT 'user';

-- 2. email 컬럼에 UNIQUE 인덱스 추가 (이메일 중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_email_unique
ON public.participants(email)
WHERE email IS NOT NULL;

-- 3. is_admin 함수를 participants 기반으로 수정
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_email TEXT;
  _check_user_id UUID;
BEGIN
  -- user_id가 제공된 경우 사용, 없으면 현재 로그인한 사용자 ID
  IF _user_id IS NOT NULL THEN
    _check_user_id := _user_id;
  ELSE
    _check_user_id := auth.uid();
  END IF;

  -- 현재 로그인한 사용자의 이메일 가져오기
  SELECT email INTO _user_email
  FROM auth.users
  WHERE id = _check_user_id;

  IF _user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- participants 테이블에서 이메일로 관리자 확인
  RETURN EXISTS (
    SELECT 1
    FROM public.participants
    WHERE email = LOWER(TRIM(_user_email))
      AND role = 'admin'
  );
END;
$$;

-- 4. 기존 user_roles 데이터를 participants로 마이그레이션 (있는 경우)
-- user_roles의 email을 participants의 email과 매칭하여 role 업데이트
DO $$
DECLARE
  _role_record RECORD;
  _updated_count INTEGER;
BEGIN
  -- user_roles에 있는 이메일 기반 관리자를 participants에 반영
  FOR _role_record IN
    SELECT DISTINCT email, role
    FROM public.user_roles
    WHERE email IS NOT NULL
      AND role = 'admin'
  LOOP
    -- participants에 해당 이메일이 있으면 role 업데이트
    UPDATE public.participants
    SET role = 'admin', email = LOWER(TRIM(_role_record.email))
    WHERE email = LOWER(TRIM(_role_record.email))
      AND (role IS NULL OR role != 'admin');
    
    GET DIAGNOSTICS _updated_count = ROW_COUNT;
    
    -- participants에 해당 이메일이 없으면 새로 생성
    IF _updated_count = 0 THEN
      INSERT INTO public.participants (email, role, name, phone)
      VALUES (
        LOWER(TRIM(_role_record.email)),
        'admin',
        '관리자',
        '000-0000-0000' -- 임시 전화번호
      )
      ON CONFLICT (email) DO UPDATE
      SET role = 'admin';
    END IF;
  END LOOP;
END $$;

-- 5. user_roles 테이블 관련 정책 삭제
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;

-- 6. user_roles 테이블 삭제
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- 7. participants 테이블 RLS 정책 업데이트 (관리자만 수정 가능하도록)
DROP POLICY IF EXISTS "Anyone can update participants" ON public.participants;

CREATE POLICY "Users can update own participant"
ON public.participants
FOR UPDATE
USING (
  -- 본인 데이터는 수정 가능
  (SELECT email FROM auth.users WHERE id = auth.uid()) = email
  OR
  -- 관리자는 모든 데이터 수정 가능
  public.is_admin(auth.uid())
);

-- 8. participants.role 컬럼 수정 권한 제한 (관리자만)
CREATE POLICY "Admins can update participant role"
ON public.participants
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 9. schedules 테이블 RLS 정책 수정 (user_roles 대신 is_admin 함수 사용)
DROP POLICY IF EXISTS "Admins can manage schedule_days" ON public.schedule_days;
DROP POLICY IF EXISTS "Admins can manage schedules" ON public.schedules;

-- schedule_days는 이미 삭제되었을 수 있으므로 IF EXISTS 사용
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedule_days') THEN
    CREATE POLICY "Admins can manage schedule_days"
    ON public.schedule_days FOR ALL
    USING (public.is_admin(auth.uid()));
  END IF;
END $$;

CREATE POLICY "Admins can manage schedules"
ON public.schedules FOR ALL
USING (public.is_admin(auth.uid()));

-- 10. 컬럼 코멘트 추가
COMMENT ON COLUMN public.participants.email IS '이메일 (Supabase Auth 이메일과 매칭하여 역할 확인)';
COMMENT ON COLUMN public.participants.role IS '사용자 역할 (user 또는 admin)';
