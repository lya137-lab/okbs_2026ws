-- ============================================
-- user_roles에 이메일 지원 추가
-- 이메일만으로도 관리자 권한 부여 가능
-- ============================================

-- 1. user_id를 nullable로 변경 (이메일만으로도 관리자 부여 가능하도록)
-- 먼저 외래 키 제약을 확인하고, 필요시 수정
-- user_id가 NULL일 수 있으므로 외래 키 제약은 유지하되 NOT NULL만 제거
ALTER TABLE public.user_roles
ALTER COLUMN user_id DROP NOT NULL;

-- 2. user_roles에 email 컬럼 추가 (nullable, 이메일만으로도 관리자 부여 가능)
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. 기존 UNIQUE 제약 제거 후 재생성 (user_id가 NULL일 수 있으므로)
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- user_id와 role 조합이 UNIQUE (단, user_id가 NULL이면 email+role 조합으로 UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_id_role_unique
ON public.user_roles(user_id, role)
WHERE user_id IS NOT NULL;

-- 4. email 컬럼에 UNIQUE 제약 추가 (동일 이메일+role 조합 중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_email_role_unique
ON public.user_roles(email, role)
WHERE email IS NOT NULL;

-- 5. is_admin 함수 수정: user_id 또는 email로 관리자 확인
-- 기존 호출 방식 (is_admin(auth.uid()))도 지원하면서 이메일 확인도 추가
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
  -- user_id가 제공된 경우: user_id로 확인
  IF _user_id IS NOT NULL THEN
    _check_user_id := _user_id;
  ELSE
    -- user_id가 없는 경우: 현재 로그인한 사용자 ID 사용
    _check_user_id := auth.uid();
  END IF;

  -- 1. user_id로 먼저 확인
  IF _check_user_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _check_user_id
        AND role = 'admin'
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- 2. user_id로 없으면 이메일로 확인
  SELECT email INTO _user_email
  FROM auth.users
  WHERE id = COALESCE(_check_user_id, auth.uid());

  IF _user_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 이메일로 관리자 확인
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE email = _user_email
      AND role = 'admin'
  );
END;
$$;

-- 6. 이메일로 관리자 권한 부여를 위한 헬퍼 함수 생성
CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 이메일로 관리자 권한 부여 (user_id는 NULL)
  -- 이메일은 소문자로 정규화하여 저장
  INSERT INTO public.user_roles (email, role)
  VALUES (LOWER(TRIM(_email)), 'admin')
  ON CONFLICT (email, role) DO NOTHING;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 7. 컬럼 코멘트 추가
COMMENT ON COLUMN public.user_roles.email IS '관리자 이메일 (user_id 없이도 이메일만으로 관리자 권한 부여 가능)';
