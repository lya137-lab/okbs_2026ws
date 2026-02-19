# 🚀 빠른 해결 가이드

## 문제: "Could not find the table 'public.participants' in the schema cache"

### ✅ 즉시 해결 방법 (3단계)

#### 1단계: Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택

#### 2단계: SQL Editor에서 마이그레이션 실행
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 SQL을 복사하여 붙여넣기:

```sql
-- participants 테이블 생성
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    cohort TEXT,
    university TEXT,
    major TEXT,
    enrollment_status TEXT CHECK (enrollment_status IN ('재학', '휴학', '교환학생', '졸업예정', '기타')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- participant_profiles 테이블 생성
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

-- RLS 활성화
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_profiles ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Anyone can view participants"
ON public.participants FOR SELECT USING (true);

CREATE POLICY "Anyone can insert participants"
ON public.participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update participants"
ON public.participants FOR UPDATE USING (true);

CREATE POLICY "Anyone can view participant_profiles"
ON public.participant_profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can insert participant_profiles"
ON public.participant_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update participant_profiles"
ON public.participant_profiles FOR UPDATE USING (true);
```

4. **Run** 버튼 클릭 (또는 Ctrl+Enter)
5. "Success. No rows returned" 메시지 확인

#### 3단계: 확인 및 테스트
1. 브라우저 새로고침 (F5)
2. 회원가입 다시 시도
3. 정상 작동 확인

---

## 🔍 문제 진단

브라우저 개발자 도구(F12) > Console 탭에서 다음 메시지를 확인하세요:

- `🔍 데이터베이스 상태 확인` - 자동으로 표시됩니다
- 테이블 상태가 표시됩니다

---

## ⚠️ "policy already exists" 에러가 발생하면?

정책이 이미 존재하는 경우, 다음 SQL을 실행하세요:

```sql
-- 기존 정책 삭제 후 재생성
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view participants" ON public.participants;
    DROP POLICY IF EXISTS "Anyone can insert participants" ON public.participants;
    DROP POLICY IF EXISTS "Anyone can update participants" ON public.participants;
    DROP POLICY IF EXISTS "Anyone can view participant_profiles" ON public.participant_profiles;
    DROP POLICY IF EXISTS "Anyone can insert participant_profiles" ON public.participant_profiles;
    DROP POLICY IF EXISTS "Anyone can update participant_profiles" ON public.participant_profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 정책 재생성
CREATE POLICY "Anyone can view participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Anyone can insert participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participants" ON public.participants FOR UPDATE USING (true);
CREATE POLICY "Anyone can view participant_profiles" ON public.participant_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert participant_profiles" ON public.participant_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participant_profiles" ON public.participant_profiles FOR UPDATE USING (true);
```

또는 `supabase/migrations/20260122060000_fix_policies.sql` 파일을 실행하세요.

## ⚠️ 여전히 안 되면?

1. **환경 변수 확인**: `.env` 파일에 Supabase URL과 키가 올바른지 확인
2. **프로젝트 확인**: 올바른 Supabase 프로젝트에 연결되어 있는지 확인
3. **서버 재시작**: 개발 서버를 중지하고 다시 시작 (`Ctrl+C` 후 `npm run dev`)

---

## 📚 상세 가이드

더 자세한 내용은 `TROUBLESHOOTING.md` 파일을 참고하세요.
