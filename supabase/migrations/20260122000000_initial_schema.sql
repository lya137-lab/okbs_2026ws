-- ============================================
-- OK배정장학재단 2026 워크숍 - 초기 스키마
-- 모든 테이블과 설정을 포함하는 완전한 마이그레이션
-- 
-- 이 마이그레이션은 다음을 포함합니다:
-- - user_roles (관리자/사용자 역할)
-- - rooms, room_members (숙소 배정)
-- - buses, bus_passengers (버스 배정)
-- - participants, participant_profiles (참가자 정보)
-- - storage bucket (프로필 사진)
-- - 모든 RLS 정책 및 트리거
-- ============================================

-- ============================================
-- 1. Enum Types
-- ============================================

-- Create app_role enum for user roles (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END $$;

-- ============================================
-- 2. Core Tables
-- ============================================

-- Create user_roles table for role-based access control
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create room_assignments table (방배정 정보)
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

-- Create bus_passengers table (버스 배정 정보)
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

-- Create participants table for participant authentication and info
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

-- Create participant_profiles table for self-introduction data
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

-- Create announcements table for 공지사항
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

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Helper Functions
-- ============================================

-- Create helper function to check admin role
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

-- Create function to update timestamps
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

-- Drop existing policies if they exist (to avoid conflicts)
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

-- RLS policies for user_roles
CREATE POLICY "Admins can manage user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS policies for room_assignments (public read, admins can modify)
CREATE POLICY "Anyone can view room_assignments"
ON public.room_assignments
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert room_assignments"
ON public.room_assignments
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update room_assignments"
ON public.room_assignments
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete room_assignments"
ON public.room_assignments
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS policies for bus_passengers (public read, admins can modify)
CREATE POLICY "Anyone can view bus_passengers"
ON public.bus_passengers
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert bus_passengers"
ON public.bus_passengers
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update bus_passengers"
ON public.bus_passengers
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete bus_passengers"
ON public.bus_passengers
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS policies for participants (public access for registration)
CREATE POLICY "Anyone can view participants"
ON public.participants
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert participants"
ON public.participants
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update participants"
ON public.participants
FOR UPDATE
USING (true);

-- RLS policies for participant_profiles (public access)
CREATE POLICY "Anyone can view participant_profiles"
ON public.participant_profiles
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert participant_profiles"
ON public.participant_profiles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update participant_profiles"
ON public.participant_profiles
FOR UPDATE
USING (true);

-- RLS policies for announcements (public read, admins can modify)
CREATE POLICY "Anyone can view announcements"
ON public.announcements
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- ============================================
-- 6. Triggers
-- ============================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_room_assignments_updated_at ON public.room_assignments;
DROP TRIGGER IF EXISTS update_bus_passengers_updated_at ON public.bus_passengers;
DROP TRIGGER IF EXISTS update_participants_updated_at ON public.participants;
DROP TRIGGER IF EXISTS update_participant_profiles_updated_at ON public.participant_profiles;
DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_room_assignments_updated_at
BEFORE UPDATE ON public.room_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bus_passengers_updated_at
BEFORE UPDATE ON public.bus_passengers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
BEFORE UPDATE ON public.participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participant_profiles_updated_at
BEFORE UPDATE ON public.participant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. Storage Bucket for Profile Photos
-- ============================================

-- Create storage bucket for profile photos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos
-- Drop existing policies if they exist
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

-- Allow anyone to view profile photos (public bucket)
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

-- Allow anyone to upload profile photos
CREATE POLICY "Anyone can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

-- Allow anyone to update profile photos
CREATE POLICY "Anyone can update profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos');

-- Allow anyone to delete profile photos
CREATE POLICY "Anyone can delete profile photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos');
