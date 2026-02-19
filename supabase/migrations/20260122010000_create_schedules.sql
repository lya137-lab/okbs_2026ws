-- ============================================
-- 일정표 테이블 생성
-- ============================================

-- Create schedule_days table (일차 정보)
CREATE TABLE IF NOT EXISTS public.schedule_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_number INTEGER NOT NULL UNIQUE, -- 1일차, 2일차 등
    label TEXT NOT NULL, -- "1일차", "2일차"
    date TEXT NOT NULL, -- "3월 14일 (토)"
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create schedules table (일정 항목)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES public.schedule_days(id) ON DELETE CASCADE,
    time TEXT NOT NULL, -- "13:00"
    title TEXT NOT NULL, -- "등록 및 체크인"
    location TEXT NOT NULL, -- "본관 로비"
    type TEXT NOT NULL CHECK (type IN ('main', 'activity', 'meal', 'break', 'info')), -- 일정 유형
    icon_name TEXT NOT NULL, -- 아이콘 이름 (예: "MapPin", "Presentation")
    display_order INTEGER NOT NULL DEFAULT 0, -- 표시 순서
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedules_day_id ON public.schedules(day_id);
CREATE INDEX IF NOT EXISTS idx_schedules_display_order ON public.schedules(display_order);
CREATE INDEX IF NOT EXISTS idx_schedule_days_day_number ON public.schedule_days(day_number);

-- Enable RLS
ALTER TABLE public.schedule_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedule_days
-- Anyone can view schedule days
DROP POLICY IF EXISTS "Anyone can view schedule_days" ON public.schedule_days;
CREATE POLICY "Anyone can view schedule_days"
ON public.schedule_days FOR SELECT
USING (true);

-- Only admins can insert/update/delete schedule days
DROP POLICY IF EXISTS "Admins can manage schedule_days" ON public.schedule_days;
CREATE POLICY "Admins can manage schedule_days"
ON public.schedule_days FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- RLS Policies for schedules
-- Anyone can view schedules
DROP POLICY IF EXISTS "Anyone can view schedules" ON public.schedules;
CREATE POLICY "Anyone can view schedules"
ON public.schedules FOR SELECT
USING (true);

-- Only admins can insert/update/delete schedules
DROP POLICY IF EXISTS "Admins can manage schedules" ON public.schedules;
CREATE POLICY "Admins can manage schedules"
ON public.schedules FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_schedule_days_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_schedule_days_updated_at ON public.schedule_days;
CREATE TRIGGER update_schedule_days_updated_at
    BEFORE UPDATE ON public.schedule_days
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_days_updated_at();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.schedules;
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_schedules_updated_at();

-- Insert initial data (기존 하드코딩된 데이터)
-- 1일차
INSERT INTO public.schedule_days (day_number, label, date)
VALUES (1, '1일차', '3월 14일 (토)')
ON CONFLICT (day_number) DO NOTHING;

-- 2일차
INSERT INTO public.schedule_days (day_number, label, date)
VALUES (2, '2일차', '3월 15일 (일)')
ON CONFLICT (day_number) DO NOTHING;

-- Insert schedule items for day 1
DO $$
DECLARE
    day1_id UUID;
BEGIN
    SELECT id INTO day1_id FROM public.schedule_days WHERE day_number = 1;
    
    IF day1_id IS NOT NULL THEN
        INSERT INTO public.schedules (day_id, time, title, location, type, icon_name, display_order)
        VALUES
            (day1_id, '13:00', '등록 및 체크인', '본관 로비', 'info', 'MapPin', 1),
            (day1_id, '14:00', '오리엔테이션', '대강당', 'main', 'Presentation', 2),
            (day1_id, '15:00', '아이스브레이킹', '세미나실 A', 'activity', 'Users', 3),
            (day1_id, '16:30', '휴식 & 간식', '카페테리아', 'break', 'Coffee', 4),
            (day1_id, '17:00', '팀 빌딩 액티비티', '야외 잔디광장', 'activity', 'Users', 5),
            (day1_id, '18:30', '저녁 식사', '식당', 'meal', 'Utensils', 6),
            (day1_id, '20:00', '장기자랑 & 친목', '대강당', 'activity', 'Music', 7),
            (day1_id, '22:00', '자유시간 및 취침', '숙소', 'info', 'Moon', 8)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Insert schedule items for day 2
DO $$
DECLARE
    day2_id UUID;
BEGIN
    SELECT id INTO day2_id FROM public.schedule_days WHERE day_number = 2;
    
    IF day2_id IS NOT NULL THEN
        INSERT INTO public.schedules (day_id, time, title, location, type, icon_name, display_order)
        VALUES
            (day2_id, '07:30', '기상 및 아침 산책', '숙소/정원', 'break', 'Coffee', 1),
            (day2_id, '08:30', '아침 식사', '식당', 'meal', 'Utensils', 2),
            (day2_id, '10:00', '멘토링 세션', '세미나실 B', 'main', 'MessageSquare', 3),
            (day2_id, '11:30', '조별 토론', '각 세미나실', 'activity', 'Users', 4),
            (day2_id, '12:30', '점심 식사', '식당', 'meal', 'Utensils', 5),
            (day2_id, '14:00', '미션 게임 & 이벤트', '다목적홀', 'activity', 'Music', 6),
            (day2_id, '15:30', '시상 및 마무리', '대강당', 'main', 'Presentation', 7),
            (day2_id, '16:30', '체크아웃 및 귀가', '본관 로비', 'info', 'MapPin', 8)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
