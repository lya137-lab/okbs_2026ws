# 데이터베이스 테이블 오류 해결 가이드

## 🔍 문제 진단

"Could not find the table 'public.participants' in the schema cache" 오류가 발생하는 주요 원인:

### 1. 마이그레이션이 실행되지 않음 (가장 흔한 원인)
- Supabase 대시보드에서 SQL 마이그레이션을 실행하지 않았을 경우

### 2. 스키마 캐시 문제
- Supabase가 테이블 정보를 캐시하지 못한 경우
- 새로 생성된 테이블이 즉시 인식되지 않는 경우

### 3. RLS (Row Level Security) 정책 문제
- 테이블은 있지만 접근 권한이 없는 경우

### 4. 환경 변수 문제
- 잘못된 Supabase URL 또는 키 사용
- 다른 프로젝트의 데이터베이스에 연결된 경우

## ✅ 해결 방법

### 방법 1: 마이그레이션 실행 확인 (필수)

#### Step 1: Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택

#### Step 2: 테이블 존재 확인
SQL Editor에서 다음 쿼리 실행:

```sql
-- 테이블 존재 여부 확인
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('participants', 'participant_profiles')
ORDER BY table_name;
```

**결과가 비어있으면**: 테이블이 없음 → 마이그레이션 실행 필요
**결과가 있으면**: 테이블이 있음 → 다른 원인 확인 필요

#### Step 3: 마이그레이션 실행
SQL Editor에서 `supabase/migrations/20260122050000_complete_setup.sql` 파일의 내용을 복사하여 실행

#### Step 4: 실행 확인
다시 Step 2의 쿼리를 실행하여 테이블이 생성되었는지 확인

### 방법 2: 스키마 캐시 새로고침

Supabase는 때때로 스키마 캐시를 업데이트하지 않을 수 있습니다.

#### 해결책:
1. Supabase 대시보드에서 **Table Editor** 열기
2. 왼쪽 사이드바에서 **Refresh** 버튼 클릭
3. 또는 브라우저 새로고침 후 다시 시도

### 방법 3: RLS 정책 확인

테이블이 있지만 접근이 안 되는 경우:

```sql
-- RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('participants', 'participant_profiles');
```

RLS 정책이 없거나 잘못 설정된 경우, 마이그레이션을 다시 실행하세요.

### 방법 4: 환경 변수 확인

`.env` 파일 확인:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

**확인 사항:**
- URL이 올바른 프로젝트를 가리키는지
- 키가 `anon` 키인지 (service_role 키가 아님)
- 따옴표나 공백이 없는지

### 방법 5: 수동 테이블 생성 (긴급)

마이그레이션이 작동하지 않는 경우, SQL Editor에서 직접 실행:

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

## 🔧 단계별 체크리스트

다음 순서로 확인하세요:

- [ ] Supabase 대시보드에 로그인되어 있는가?
- [ ] 올바른 프로젝트를 선택했는가?
- [ ] SQL Editor에서 테이블 존재 여부를 확인했는가?
- [ ] 마이그레이션 파일을 실행했는가?
- [ ] 마이그레이션 실행 후 에러가 없었는가?
- [ ] `.env` 파일의 환경 변수가 올바른가?
- [ ] 브라우저를 새로고침했는가?
- [ ] 개발 서버를 재시작했는가?

## 📞 추가 도움

위 방법으로 해결되지 않으면:

1. **Supabase 대시보드 > Logs**에서 에러 로그 확인
2. **브라우저 개발자 도구 > Console**에서 자바스크립트 에러 확인
3. **Network 탭**에서 Supabase API 요청 상태 확인

## 🎯 빠른 테스트

테이블이 제대로 생성되었는지 빠르게 테스트:

```sql
-- 테스트 데이터 삽입
INSERT INTO public.participants (name, phone, cohort, university, major, enrollment_status)
VALUES ('테스트', '01012345678', '1기', '테스트대학교', '테스트학과', '재학');

-- 확인
SELECT * FROM public.participants WHERE phone = '01012345678';

-- 삭제 (테스트 후)
DELETE FROM public.participants WHERE phone = '01012345678';
```

이 쿼리가 성공하면 테이블이 정상적으로 생성된 것입니다!
