# 🔧 테이블 생성 후에도 오류가 나는 경우 - 해결 가이드

## 문제 상황
`CREATE_TABLES_NOW.sql`을 실행했는데도 계속 "데이터베이스 테이블이 아직 생성되지 않았습니다" 오류가 발생합니다.

## 🔍 원인 분석

가능한 원인들:
1. **테이블은 생성되었지만 RLS 정책이 없음**
2. **환경 변수가 다른 프로젝트를 가리킴**
3. **스키마 캐시 문제**
4. **RLS 정책이 잘못 설정됨**
5. **실제로 테이블이 생성되지 않음 (에러가 발생했지만 놓침)**

## ✅ 단계별 해결 방법

### Step 1: 문제 진단

Supabase SQL Editor에서 **`DIAGNOSE_ISSUE.sql`** 파일을 실행하세요.

이 쿼리는 다음을 확인합니다:
- 테이블이 실제로 존재하는지
- RLS가 활성화되어 있는지
- 정책이 올바르게 설정되어 있는지
- 테이블 구조가 올바른지

**결과 해석:**
- "✅ 존재함" → 테이블은 있음. Step 2로 진행
- "❌ 없음" → 테이블이 없음. `CREATE_TABLES_NOW.sql` 다시 실행

### Step 2: 테이블이 있는 경우

테이블이 있는데도 오류가 나면, **`FIX_IF_TABLES_EXIST.sql`** 파일을 실행하세요.

이 스크립트는:
- 기존 정책을 모두 삭제
- 새 정책을 올바르게 생성
- RLS를 확실히 활성화
- 트리거를 재설정

### Step 3: 환경 변수 확인

`.env` 파일이 올바른 프로젝트를 가리키는지 확인:

1. Supabase 대시보드 > Settings > API
2. **Project URL**과 **anon public** 키 확인
3. `.env` 파일의 값과 비교

**중요:** URL과 키가 정확히 일치해야 합니다!

### Step 4: 브라우저 완전 새로고침

1. 브라우저를 **완전히 닫기**
2. 브라우저 다시 열기
3. `http://localhost:8080` 접속
4. 개발자 도구(F12) > Console 확인

### Step 5: 개발 서버 재시작

1. 터미널에서 `Ctrl+C`로 서버 중지
2. `npm run dev`로 다시 시작
3. 브라우저 새로고침

## 🎯 빠른 해결 (권장 순서)

### 방법 1: 진단 후 수정

1. `DIAGNOSE_ISSUE.sql` 실행 → 상태 확인
2. 테이블이 있으면 → `FIX_IF_TABLES_EXIST.sql` 실행
3. 브라우저 새로고침

### 방법 2: 강제 재설정

1. `FIX_IF_TABLES_EXIST.sql` 실행 (테이블이 있는 경우 안전)
2. 브라우저 완전 새로고침
3. 개발 서버 재시작

## 🔍 확인 체크리스트

다음을 모두 확인하세요:

- [ ] `DIAGNOSE_ISSUE.sql` 실행 결과 "✅ 존재함" 확인
- [ ] RLS 정책이 3개 이상 있는지 확인 (SELECT, INSERT, UPDATE)
- [ ] `.env` 파일의 URL과 키가 Supabase 대시보드와 일치
- [ ] 브라우저를 완전히 닫고 다시 열었는지
- [ ] 개발 서버를 재시작했는지
- [ ] 브라우저 콘솔에서 "✅ participants 테이블 존재" 확인

## 💡 추가 확인 사항

### Supabase 프로젝트 확인

SQL Editor에서 실행:

```sql
-- 현재 프로젝트의 데이터베이스 이름 확인
SELECT current_database();

-- public 스키마의 모든 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

`participants`와 `participant_profiles`가 목록에 있어야 합니다.

### RLS 정책 상세 확인

```sql
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'participants';
```

**필수 정책:**
- `public_select_participants` (SELECT)
- `public_insert_participants` (INSERT)
- `public_update_participants` (UPDATE)

## 🚨 여전히 안 되면?

### 최종 해결책: 수동 테이블 삭제 후 재생성

```sql
-- ⚠️ 주의: 이 쿼리는 기존 데이터를 삭제합니다!

-- 1. 테이블 삭제
DROP TABLE IF EXISTS public.participant_profiles CASCADE;
DROP TABLE IF EXISTS public.participants CASCADE;

-- 2. CREATE_TABLES_NOW.sql 다시 실행
```

그 후 `CREATE_TABLES_NOW.sql`을 다시 실행하세요.

## 📞 디버깅 정보 수집

문제가 계속되면 다음 정보를 확인하세요:

1. **DIAGNOSE_ISSUE.sql 실행 결과** (전체)
2. **브라우저 콘솔의 전체 메시지** (F12 > Console)
3. **Supabase SQL Editor의 에러 메시지** (있다면)
4. **환경 변수 형식** (실제 값은 공유하지 마세요)

---

## ✅ 성공 확인

다음이 모두 확인되면 성공입니다:

- `DIAGNOSE_ISSUE.sql`에서 "✅ 존재함" 확인
- RLS 정책이 3개 이상 확인됨
- 브라우저 콘솔에서 "✅ participants 테이블 존재" 확인
- 회원가입이 정상 작동
- 로그인이 정상 작동
