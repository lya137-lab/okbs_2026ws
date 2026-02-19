-- ============================================
-- 🚀 데이터베이스 설정 스크립트
-- Supabase SQL Editor에서 이 파일을 실행하세요
-- ============================================
-- 
-- 이 스크립트는 모든 데이터베이스 테이블과 설정을 포함합니다.
-- 
-- 📋 사용 방법:
-- 1. 이 파일의 전체 내용을 복사 (Ctrl+A, Ctrl+C)
-- 2. Supabase 대시보드 > SQL Editor 열기
-- 3. 붙여넣기 (Ctrl+V) 후 Run 클릭
-- 4. 성공 메시지 확인
-- 5. 1-2분 대기 (스키마 캐시 업데이트)
-- 6. Supabase Table Editor에서 새로고침
-- 7. 브라우저 완전히 닫고 다시 열기
-- 8. 개발 서버 재시작: npm run dev
-- ============================================

-- ============================================
-- 1. Enum Types
-- ============================================

-- Create app_role enum (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END $$;

-- ============================================
-- 2. Core Tables
-- ============================================

-- user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- room_assignments table (방배정 정보)
CREATE TABLE IF NOT EXISTS public.room_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_name TEXT, -- 건물명
    floor TEXT, -- 층
    room_number TEXT, -- 호실
    room_type TEXT, -- 구분 (2인실/3인실)
    team TEXT, -- 조
    name TEXT NOT NULL, -- 성명
    university TEXT, -- 학교
    major TEXT, -- 전공
    phone TEXT, -- 연락처
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- bus_passengers table (버스 배정 정보)
CREATE TABLE IF NOT EXISTS public.bus_passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team TEXT, -- 조
    name TEXT NOT NULL, -- 성명
    departure_bus_name TEXT, -- 출발버스명
    departure_time TEXT, -- 출발시간
    departure_location TEXT, -- 출발지
    return_bus_name TEXT, -- 귀가버스명
    return_departure_time TEXT, -- 귀가 출발시간
    arrival_location TEXT, -- 도착지
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- participants table
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    cohort TEXT,
    university TEXT,
    major TEXT,
    enrollment_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT participants_enrollment_status_check 
        CHECK (enrollment_status IS NULL OR enrollment_status IN ('재학', '휴학', '교환학생', '졸업예정', '기타'))
);

-- participant_profiles table
CREATE TABLE IF NOT EXISTS public.participant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    university TEXT,
    major TEXT,
    birth_date DATE,
    location TEXT,
    mbti TEXT,
    keywords TEXT[],
    specialty TEXT,
    goals_2026 TEXT,
    foundation_activities TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (participant_id)
);

-- announcements table (공지사항)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- 3. Row Level Security (RLS)
-- ============================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Helper Functions
-- ============================================

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ============================================
-- 5. RLS Policies
-- ============================================

-- Drop existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('user_roles', 'rooms', 'room_members', 'room_assignments', 'bus_passengers', 'participants', 'participant_profiles', 'announcements')
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END LOOP;
END $$;

-- user_roles policies
CREATE POLICY "Admins can manage user_roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- room_assignments policies
CREATE POLICY "Anyone can view room_assignments" ON public.room_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can insert room_assignments" ON public.room_assignments FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update room_assignments" ON public.room_assignments FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete room_assignments" ON public.room_assignments FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- bus_passengers policies
CREATE POLICY "Anyone can view bus_passengers" ON public.bus_passengers FOR SELECT USING (true);
CREATE POLICY "Admins can insert bus_passengers" ON public.bus_passengers FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update bus_passengers" ON public.bus_passengers FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete bus_passengers" ON public.bus_passengers FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- participants policies (public access)
CREATE POLICY "Anyone can view participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Anyone can insert participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participants" ON public.participants FOR UPDATE USING (true);

-- participant_profiles policies (public access)
CREATE POLICY "Anyone can view participant_profiles" ON public.participant_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert participant_profiles" ON public.participant_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participant_profiles" ON public.participant_profiles FOR UPDATE USING (true);

-- announcements policies (public read, admins can modify)
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- ============================================
-- 6. Triggers
-- ============================================

DROP TRIGGER IF EXISTS update_room_assignments_updated_at ON public.room_assignments;
DROP TRIGGER IF EXISTS update_bus_passengers_updated_at ON public.bus_passengers;
DROP TRIGGER IF EXISTS update_participants_updated_at ON public.participants;
DROP TRIGGER IF EXISTS update_participant_profiles_updated_at ON public.participant_profiles;
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;

CREATE TRIGGER update_room_assignments_updated_at
BEFORE UPDATE ON public.room_assignments FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bus_passengers_updated_at
BEFORE UPDATE ON public.bus_passengers FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
BEFORE UPDATE ON public.participants FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participant_profiles_updated_at
BEFORE UPDATE ON public.participant_profiles FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. Storage Bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname LIKE '%profile photos%'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END LOOP;
END $$;

CREATE POLICY "Anyone can view profile photos" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "Anyone can upload profile photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-photos');
CREATE POLICY "Anyone can update profile photos" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-photos');
CREATE POLICY "Anyone can delete profile photos" ON storage.objects FOR DELETE USING (bucket_id = 'profile-photos');

-- ============================================
-- 일정표 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS public.schedule_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_number INTEGER NOT NULL UNIQUE,
    label TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES public.schedule_days(id) ON DELETE CASCADE,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('main', 'activity', 'meal', 'break', 'info')),
    icon_name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_day_id ON public.schedules(day_id);
CREATE INDEX IF NOT EXISTS idx_schedules_display_order ON public.schedules(display_order);
CREATE INDEX IF NOT EXISTS idx_schedule_days_day_number ON public.schedule_days(day_number);

ALTER TABLE public.schedule_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view schedule_days" ON public.schedule_days;
CREATE POLICY "Anyone can view schedule_days" ON public.schedule_days FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage schedule_days" ON public.schedule_days;
CREATE POLICY "Admins can manage schedule_days" ON public.schedule_days FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

DROP POLICY IF EXISTS "Anyone can view schedules" ON public.schedules;
CREATE POLICY "Anyone can view schedules" ON public.schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage schedules" ON public.schedules;
CREATE POLICY "Admins can manage schedules" ON public.schedules FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'));

CREATE OR REPLACE FUNCTION update_schedule_days_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION update_schedules_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_schedule_days_updated_at ON public.schedule_days;
CREATE TRIGGER update_schedule_days_updated_at BEFORE UPDATE ON public.schedule_days FOR EACH ROW EXECUTE FUNCTION update_schedule_days_updated_at();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.schedules;
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION update_schedules_updated_at();

INSERT INTO public.schedule_days (day_number, label, date) VALUES (1, '1일차', '3월 14일 (토)') ON CONFLICT (day_number) DO NOTHING;
INSERT INTO public.schedule_days (day_number, label, date) VALUES (2, '2일차', '3월 15일 (일)') ON CONFLICT (day_number) DO NOTHING;

DO $$ DECLARE day1_id UUID; BEGIN SELECT id INTO day1_id FROM public.schedule_days WHERE day_number = 1; IF day1_id IS NOT NULL THEN INSERT INTO public.schedules (day_id, time, title, location, type, icon_name, display_order) VALUES (day1_id, '13:00', '등록 및 체크인', '본관 로비', 'info', 'MapPin', 1), (day1_id, '14:00', '오리엔테이션', '대강당', 'main', 'Presentation', 2), (day1_id, '15:00', '아이스브레이킹', '세미나실 A', 'activity', 'Users', 3), (day1_id, '16:30', '휴식 & 간식', '카페테리아', 'break', 'Coffee', 4), (day1_id, '17:00', '팀 빌딩 액티비티', '야외 잔디광장', 'activity', 'Users', 5), (day1_id, '18:30', '저녁 식사', '식당', 'meal', 'Utensils', 6), (day1_id, '20:00', '장기자랑 & 친목', '대강당', 'activity', 'Music', 7), (day1_id, '22:00', '자유시간 및 취침', '숙소', 'info', 'Moon', 8) ON CONFLICT DO NOTHING; END IF; END $$;

DO $$ DECLARE day2_id UUID; BEGIN SELECT id INTO day2_id FROM public.schedule_days WHERE day_number = 2; IF day2_id IS NOT NULL THEN INSERT INTO public.schedules (day_id, time, title, location, type, icon_name, display_order) VALUES (day2_id, '07:30', '기상 및 아침 산책', '숙소/정원', 'break', 'Coffee', 1), (day2_id, '08:30', '아침 식사', '식당', 'meal', 'Utensils', 2), (day2_id, '10:00', '멘토링 세션', '세미나실 B', 'main', 'MessageSquare', 3), (day2_id, '11:30', '조별 토론', '각 세미나실', 'activity', 'Users', 4), (day2_id, '12:30', '점심 식사', '식당', 'meal', 'Utensils', 5), (day2_id, '14:00', '미션 게임 & 이벤트', '다목적홀', 'activity', 'Music', 6), (day2_id, '15:30', '시상 및 마무리', '대강당', 'main', 'Presentation', 7), (day2_id, '16:30', '체크아웃 및 귀가', '본관 로비', 'info', 'MapPin', 8) ON CONFLICT DO NOTHING; END IF; END $$;

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ 데이터베이스 설정 완료!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '다음 단계:';
    RAISE NOTICE '1. Supabase Table Editor에서 새로고침';
    RAISE NOTICE '2. 1-2분 대기 (스키마 캐시 업데이트)';
    RAISE NOTICE '3. 브라우저 새로고침';
    RAISE NOTICE '';
END $$;
