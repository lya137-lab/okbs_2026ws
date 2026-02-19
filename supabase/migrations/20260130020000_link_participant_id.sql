-- ============================================
-- participants.id를 bus_passengers, room_members에 연동
-- 나의 프로필에서 버스배정·숙소배정·자기소개 통합 조회용
-- ============================================

-- 1. bus_passengers에 participant_id 추가 (nullable, 기존 데이터 호환)
ALTER TABLE public.bus_passengers
ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bus_passengers_participant_id ON public.bus_passengers(participant_id);
COMMENT ON COLUMN public.bus_passengers.participant_id IS '참가자 ID (participants.id) - 나의 프로필 연동';

-- 2. room_members에 participant_id 추가 (nullable, 기존 데이터 호환)
ALTER TABLE public.room_members
ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_room_members_participant_id ON public.room_members(participant_id);
COMMENT ON COLUMN public.room_members.participant_id IS '참가자 ID (participants.id) - 나의 프로필 연동';
