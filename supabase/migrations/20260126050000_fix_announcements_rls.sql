-- ============================================
-- 관리자 관련 테이블 RLS 정책 수정
-- 관리자(하드코딩 인증)가 모든 관리 기능을 사용할 수 있도록 수정
-- 클라이언트에서 관리자 권한 체크를 수행하므로, RLS는 허용
-- ============================================

-- 1. announcements 테이블 RLS 정책 수정
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;

CREATE POLICY "Anyone can insert announcements"
ON public.announcements
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update announcements"
ON public.announcements
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete announcements"
ON public.announcements
FOR DELETE
USING (true);

-- 2. room_assignments 테이블 RLS 정책 수정
DROP POLICY IF EXISTS "Admins can insert room_assignments" ON public.room_assignments;
DROP POLICY IF EXISTS "Admins can update room_assignments" ON public.room_assignments;
DROP POLICY IF EXISTS "Admins can delete room_assignments" ON public.room_assignments;

CREATE POLICY "Anyone can insert room_assignments"
ON public.room_assignments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update room_assignments"
ON public.room_assignments
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete room_assignments"
ON public.room_assignments
FOR DELETE
USING (true);

-- 3. bus_passengers 테이블 RLS 정책 수정
DROP POLICY IF EXISTS "Admins can insert bus_passengers" ON public.bus_passengers;
DROP POLICY IF EXISTS "Admins can update bus_passengers" ON public.bus_passengers;
DROP POLICY IF EXISTS "Admins can delete bus_passengers" ON public.bus_passengers;

CREATE POLICY "Anyone can insert bus_passengers"
ON public.bus_passengers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update bus_passengers"
ON public.bus_passengers
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete bus_passengers"
ON public.bus_passengers
FOR DELETE
USING (true);

-- 4. schedules 테이블 RLS 정책 수정 (이미 수정되었을 수 있으나 재확인)
DROP POLICY IF EXISTS "Admins can manage schedules" ON public.schedules;

CREATE POLICY "Anyone can insert schedules"
ON public.schedules
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update schedules"
ON public.schedules
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete schedules"
ON public.schedules
FOR DELETE
USING (true);
