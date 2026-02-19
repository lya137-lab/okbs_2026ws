# 🚨 긴급 해결: 테이블 생성 오류

## 현재 상황
"데이터베이스 테이블이 아직 생성되지 않았습니다" 오류가 계속 발생하고 있습니다.

## ⚡ 즉시 해결 방법

### 필수 단계 (5분 소요)

1. **Supabase 대시보드 접속**
   ```
   https://supabase.com/dashboard
   ```
   - 로그인 후 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 **SQL Editor** 클릭
   - **New query** 버튼 클릭

3. **테이블 생성 스크립트 실행**
   - 프로젝트 폴더에서 **`CREATE_TABLES_NOW.sql`** 파일 열기
   - **전체 내용 복사** (Ctrl+A, Ctrl+C)
   - Supabase SQL Editor에 **붙여넣기** (Ctrl+V)
   - **Run** 버튼 클릭 (또는 Ctrl+Enter)

4. **성공 확인**
   - "Success" 또는 "✅ 모든 테이블이 성공적으로 생성되었습니다!" 메시지 확인
   - 에러가 없으면 성공입니다

5. **테이블 확인**
   - 같은 SQL Editor에서 **`TEST_CONNECTION.sql`** 파일 내용 실행
   - "✅ participants 테이블 존재" 메시지 확인

6. **브라우저 새로고침**
   - 브라우저를 **완전히 닫고 다시 열기**
   - 또는 Ctrl+Shift+R (강력 새로고침)
   - `http://localhost:8080/login` 접속

---

## 🔍 문제 진단

### 확인 1: 환경 변수

`.env` 파일이 프로젝트 루트에 있고, 다음 형식인지 확인:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**확인 사항:**
- URL이 `https://`로 시작
- 키가 `eyJ`로 시작 (JWT 토큰 형식)
- 따옴표 없음
- 공백 없음

### 확인 2: 올바른 프로젝트인가?

Supabase 대시보드에서:
1. **Settings** > **API** 메뉴로 이동
2. **Project URL**과 **anon public** 키 확인
3. `.env` 파일의 값과 **정확히 일치**하는지 확인

### 확인 3: 테이블이 실제로 생성되었는가?

SQL Editor에서 실행:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'participants';
```

**결과:**
- **1개 행** → 테이블 존재 ✅
- **0개 행** → 테이블 없음 ❌ (CREATE_TABLES_NOW.sql 실행 필요)

---

## 🎯 성공 확인 체크리스트

다음이 모두 확인되면 성공입니다:

- [ ] Supabase SQL Editor에서 "Success" 메시지 확인
- [ ] TEST_CONNECTION.sql 실행 시 "✅ participants 테이블 존재" 확인
- [ ] 브라우저 콘솔(F12)에서 "✅ participants 테이블 존재" 확인
- [ ] 회원가입이 정상 작동
- [ ] 로그인이 정상 작동

---

## 💡 여전히 안 되면?

### 방법 1: 수동 테이블 생성

SQL Editor에서 다음을 직접 실행:

```sql
-- participants 테이블 생성
CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    cohort TEXT,
    university TEXT,
    major TEXT,
    enrollment_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- 정책 생성
CREATE POLICY "public_select_participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "public_insert_participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_participants" ON public.participants FOR UPDATE USING (true);
```

### 방법 2: 개발 서버 재시작

1. 터미널에서 `Ctrl+C`로 서버 중지
2. `npm run dev`로 다시 시작
3. 브라우저 새로고침

### 방법 3: 브라우저 캐시 삭제

1. 브라우저 개발자 도구(F12) 열기
2. Network 탭에서 "Disable cache" 체크
3. 페이지 새로고침

---

## 📞 추가 도움

위 방법으로 해결되지 않으면 다음 정보를 확인하세요:

1. **Supabase SQL Editor의 에러 메시지** (있다면)
2. **브라우저 콘솔의 전체 에러 메시지** (F12 > Console)
3. **환경 변수 값** (개인정보 제외, 형식만 확인)

---

## ⚠️ 중요

**로컬 파일을 실행하는 것이 아닙니다!**

- ❌ 파일을 더블클릭해서 실행
- ❌ 터미널에서 실행
- ✅ **Supabase 대시보드의 SQL Editor에서 실행**

이것이 가장 중요한 부분입니다!
