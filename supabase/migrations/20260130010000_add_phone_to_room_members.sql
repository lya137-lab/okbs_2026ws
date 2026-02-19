-- ============================================
-- room_members 테이블에 휴대전화번호(phone) 컬럼 추가
-- ============================================

ALTER TABLE public.room_members
ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.room_members.phone IS '입실자 휴대전화번호';
