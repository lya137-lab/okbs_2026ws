-- ============================================
-- 관리자 버스 탑승여부 변경 권한 보장
-- ============================================

-- 1) 관리자 업데이트 정책 재보장
DROP POLICY IF EXISTS "Admins can update bus_passengers" ON public.bus_passengers;
CREATE POLICY "Admins can update bus_passengers"
ON public.bus_passengers
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 2) 관리자에게 boarded 업데이트 권한 보장
GRANT UPDATE (boarded) ON public.bus_passengers TO authenticated;
