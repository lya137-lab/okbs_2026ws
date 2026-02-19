-- ============================================
-- 버스배정(buses, bus_passengers) / 숙소배정(rooms, room_members) 테이블
-- 메뉴 버스배정·숙소배정 페이지와 Supabase 연동용
-- ============================================

-- ============================================
-- 1. buses 테이블 (버스 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS public.buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_number TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 40,
    departure TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    meeting_point TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 2. bus_passengers에 bus_id 컬럼이 없으면 추가 (기존 bus_passengers와 호환)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'bus_passengers' AND column_name = 'bus_id'
    ) THEN
        -- 기존 bus_passengers가 flat 스키마일 경우: buses 테이블 생성 후 bus_id 컬럼 추가
        ALTER TABLE public.bus_passengers
        ADD COLUMN IF NOT EXISTS bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- 3. rooms 테이블 (숙소 객실 정보)
-- ============================================
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number TEXT NOT NULL,
    floor TEXT NOT NULL,
    gender TEXT NOT NULL DEFAULT 'mixed',
    room_type TEXT NOT NULL DEFAULT '2인실',
    capacity INTEGER NOT NULL DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 4. room_members 테이블 (객실별 입실자)
-- ============================================
CREATE TABLE IF NOT EXISTS public.room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    university TEXT,
    role TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 5. RLS 활성화
-- ============================================
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS 정책 (버스/숙소: 전체 읽기, 관리자만 쓰기)
-- ============================================
DROP POLICY IF EXISTS "Anyone can view buses" ON public.buses;
CREATE POLICY "Anyone can view buses"
ON public.buses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage buses" ON public.buses;
CREATE POLICY "Admins can manage buses"
ON public.buses FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;
CREATE POLICY "Anyone can view rooms"
ON public.rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage rooms" ON public.rooms;
CREATE POLICY "Admins can manage rooms"
ON public.rooms FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view room_members" ON public.room_members;
CREATE POLICY "Anyone can view room_members"
ON public.room_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage room_members" ON public.room_members;
CREATE POLICY "Admins can manage room_members"
ON public.room_members FOR ALL TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ============================================
-- 7. updated_at 트리거
-- ============================================
DROP TRIGGER IF EXISTS update_buses_updated_at ON public.buses;
CREATE TRIGGER update_buses_updated_at
BEFORE UPDATE ON public.buses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

