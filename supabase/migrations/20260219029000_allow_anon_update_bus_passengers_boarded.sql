-- ============================================
-- 비로그인(anon) 사용자도 bus_passengers 탑승여부(boarded) 변경 허용
-- ============================================

-- 1) bus_passengers RLS 활성화 (이미 활성화되어도 문제 없음)
ALTER TABLE public.bus_passengers ENABLE ROW LEVEL SECURITY;

-- 2) anon 사용자에게 boarded 업데이트 허용
DROP POLICY IF EXISTS "Anon can update bus_passengers boarded" ON public.bus_passengers;
CREATE POLICY "Anon can update bus_passengers boarded"
ON public.bus_passengers
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
