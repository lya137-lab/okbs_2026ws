-- ============================================
-- 참가자 개인정보 수정 권한 부여
-- ============================================

-- 1) participants RLS 활성화 (이미 활성화되어도 문제 없음)
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- 2) anon 사용자 업데이트 허용
DROP POLICY IF EXISTS "Anon can update participants" ON public.participants;
CREATE POLICY "Anon can update participants"
ON public.participants
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 3) authenticated 사용자 업데이트 허용
DROP POLICY IF EXISTS "Authenticated can update participants" ON public.participants;
CREATE POLICY "Authenticated can update participants"
ON public.participants
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4) 업데이트 권한 부여
GRANT UPDATE (name, phone, cohort, university, major, enrollment_status) ON public.participants TO anon, authenticated;
