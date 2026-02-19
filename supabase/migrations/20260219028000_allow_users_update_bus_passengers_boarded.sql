-- ============================================
-- bus_passengers 탑승여부(boarded) 사용자 수정 허용
-- ============================================

-- 1) 기존 관리자 정책은 유지
DROP POLICY IF EXISTS "Users can update bus_passengers boarded" ON public.bus_passengers;

-- 2) 모든 로그인 사용자에게 boarded 업데이트 허용
CREATE POLICY "Users can update bus_passengers boarded"
ON public.bus_passengers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
