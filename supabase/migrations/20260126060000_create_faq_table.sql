-- ============================================
-- FAQ 테이블 생성
-- 자주 묻는 질문을 데이터베이스로 관리
-- ============================================

-- Create faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 카테고리: "행사 기본정보", "교통 안내", "숙소 안내", "식사 및 기타", "참가 및 등록", "기타 문의"
    question TEXT NOT NULL, -- 질문
    answer TEXT NOT NULL, -- 답변
    icon_name TEXT NOT NULL DEFAULT 'HelpCircle', -- 아이콘 이름 (MapPin, Bus, BedDouble, Utensils, FileText, HelpCircle)
    display_order INTEGER NOT NULL DEFAULT 0, -- 카테고리 내 표시 순서
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON public.faqs(display_order);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for faqs
-- Anyone can view FAQs
CREATE POLICY "Anyone can view faqs"
ON public.faqs
FOR SELECT
USING (true);

-- Anyone can insert/update/delete (클라이언트에서 관리자 권한 체크)
CREATE POLICY "Anyone can insert faqs"
ON public.faqs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update faqs"
ON public.faqs
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete faqs"
ON public.faqs
FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial FAQ data (기존 하드코딩된 데이터)
INSERT INTO public.faqs (category, question, answer, icon_name, display_order) VALUES
-- 행사 기본정보
('행사 기본정보', '워크숍 일정과 장소는 어디인가요?', '2026년 3월 14일(토) ~ 15일(일) 1박 2일간 용인 대웅경영개발원에서 진행됩니다.', 'MapPin', 1),
('행사 기본정보', '집합 시간과 장소는 어떻게 되나요?', '3월 14일(토) 오후 1시까지 출발 장소(서울역, 강남역, 수원역)에 도착해주세요. 정확한 집합 장소는 버스배정 안내에서 확인하실 수 있습니다.', 'MapPin', 2),
('행사 기본정보', '일정표는 어디서 확인하나요?', '상단 메뉴의 ''일정표''를 클릭하시면 1박 2일간의 상세 일정을 확인하실 수 있습니다.', 'MapPin', 3),

-- 교통 안내
('교통 안내', '버스 배정은 어떻게 되나요?', '출발지(서울역, 강남역, 수원역)별로 1~3호차가 배정됩니다. 상단 메뉴의 ''버스배정''에서 본인의 버스 번호와 탑승 장소를 확인해주세요.', 'Bus', 1),
('교통 안내', '개인 차량으로 이동해도 되나요?', '네, 개인 차량 이용 가능합니다. 연수원 주차장은 무료이며, 출발 전 운영팀에 사전 연락 부탁드립니다. 네비게이션에 ''대웅경영개발원''을 검색하세요.', 'Bus', 2),
('교통 안내', '버스 출발 시간에 늦으면 어떻게 하나요?', '버스는 정해진 시간에 출발하며 기다리지 않습니다. 늦으실 경우 운영팀에 즉시 연락하여 개인 차량 또는 대중교통 이용을 안내받으세요.', 'Bus', 3),

-- 숙소 안내
('숙소 안내', '숙소 배정은 어떻게 되나요?', '숙소는 성별에 따라 2~4인 1실로 배정됩니다. 상단 메뉴의 ''숙소배정''에서 본인의 객실 번호와 룸메이트를 확인하실 수 있습니다.', 'BedDouble', 1),
('숙소 안내', '룸메이트 지정이 가능한가요?', '함께 배정받고 싶은 분이 있으시면 워크숍 일주일 전까지 운영팀에 요청해주세요. 가능한 범위 내에서 반영해 드립니다.', 'BedDouble', 2),
('숙소 안내', '숙소에서 제공되는 물품은 무엇인가요?', '세면도구(치약, 칫솔, 샴푸, 바디워시), 수건, 드라이기가 제공됩니다. 개인 의류와 상비약은 직접 준비해주세요.', 'BedDouble', 3),

-- 식사 및 기타
('식사 및 기타', '식사는 어떻게 제공되나요?', '1일차 저녁, 2일차 아침/점심이 제공됩니다. 모든 식사는 연수원 식당에서 뷔페식으로 진행됩니다.', 'Utensils', 1),
('식사 및 기타', '식단 관련 알레르기가 있어요.', '알레르기나 특별 식이 요청(채식, 할랄 등)은 워크숍 일주일 전까지 운영팀에 연락해주세요. 가능한 범위 내에서 대체 식단을 준비해 드립니다.', 'Utensils', 2),
('식사 및 기타', '간식이나 음료는 제공되나요?', '휴식 시간에 다과와 음료가 제공됩니다. 개인적으로 필요한 간식은 자유롭게 가져오셔도 됩니다.', 'Utensils', 3),

-- 참가 및 등록
('참가 및 등록', '자기소개 등록은 필수인가요?', '네, 자기소개 등록은 필수입니다. 다른 장학생들과의 네트워킹을 위해 워크숍 3일 전까지 등록해주세요.', 'FileText', 1),
('참가 및 등록', '자기소개 수정은 언제까지 가능한가요?', '자기소개는 워크숍 시작 하루 전까지 수정 가능합니다. 이후에는 수정이 불가하니 참고해주세요.', 'FileText', 2),
('참가 및 등록', '불참 시 어떻게 해야 하나요?', '불가피한 사정으로 불참하실 경우, 반드시 일주일 전까지 운영팀에 연락해주세요. 무단 불참 시 향후 프로그램 참여에 불이익이 있을 수 있습니다.', 'FileText', 3),

-- 기타 문의
('기타 문의', '사진/영상은 어떻게 공유하나요?', '갤러리 메뉴에서 사진을 업로드하고 공유할 수 있습니다. 워크숍 종료 후 공식 사진은 Google Drive 링크로 공유됩니다.', 'HelpCircle', 1),
('기타 문의', '복장 규정이 있나요?', '특별한 복장 규정은 없습니다. 편안한 캐주얼 복장을 권장하며, 야외 활동이 있으니 운동화를 준비해주세요.', 'HelpCircle', 2),
('기타 문의', '워크숍 중 외출이 가능한가요?', '프로그램 진행 중 외출은 불가합니다. 개인 사정으로 조기 귀가가 필요하신 경우 사전에 운영팀에 말씀해주세요.', 'HelpCircle', 3)
ON CONFLICT DO NOTHING;

-- 컬럼 코멘트 추가
COMMENT ON TABLE public.faqs IS '자주 묻는 질문 (FAQ)';
COMMENT ON COLUMN public.faqs.category IS '카테고리: 행사 기본정보, 교통 안내, 숙소 안내, 식사 및 기타, 참가 및 등록, 기타 문의';
COMMENT ON COLUMN public.faqs.icon_name IS '아이콘 이름 (lucide-react)';
COMMENT ON COLUMN public.faqs.display_order IS '카테고리 내 표시 순서';
