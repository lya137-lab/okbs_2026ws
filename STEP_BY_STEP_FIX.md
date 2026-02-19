# 🚨 데이터베이스 테이블 생성 문제 - 단계별 해결 가이드

## 문제: "Could not find the table 'public.participants'"

이 문제는 **Supabase 데이터베이스에 테이블이 실제로 생성되지 않았을 때** 발생합니다.

---

## ✅ 해결 방법 (반드시 순서대로 실행)

### Step 1: 환경 변수 확인

프로젝트 루트의 `.env` 파일을 확인하세요:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**확인 사항:**
- URL이 `https://`로 시작하는지
- 키가 `anon` 키인지 (service_role이 아님)
- 따옴표 없이 입력했는지
- 공백이 없는지

### Step 2: Supabase 대시보드 접속

1. https://supabase.com/dashboard 접속
2. **올바른 프로젝트**를 선택했는지 확인
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### Step 3: 테이블 존재 여부 확인

SQL Editor에서 다음 쿼리를 실행하세요:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('participants', 'participant_profiles');
```

**결과:**
- **비어있음** → 테이블이 없음. Step 4로 진행
- **2개 행** → 테이블이 있음. Step 5로 진행

### Step 4: 테이블 생성 (가장 중요!)

SQL Editor에서 **`CREATE_TABLES_NOW.sql`** 파일의 **전체 내용**을 복사하여 실행하세요.

**실행 방법:**
1. `CREATE_TABLES_NOW.sql` 파일 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)
3. Supabase SQL Editor에 붙여넣기 (Ctrl+V)
4. **Run** 버튼 클릭 (또는 Ctrl+Enter)
5. "Success" 메시지 확인

**중요:** 에러가 발생해도 계속 진행됩니다. 마지막에 "✅ 모든 테이블이 성공적으로 생성되었습니다!" 메시지가 보이면 성공입니다.

### Step 5: 생성 확인

다시 Step 3의 쿼리를 실행하여 테이블이 생성되었는지 확인하세요.

### Step 6: 브라우저 새로고침

1. 브라우저를 **완전히 닫고 다시 열기** (또는 Ctrl+Shift+R로 강력 새로고침)
2. 개발 서버가 실행 중인지 확인
3. `http://localhost:8080/login` 접속

### Step 7: 콘솔 확인

브라우저 개발자 도구(F12) > Console 탭에서 다음 메시지 확인:

```
🔍 데이터베이스 상태 확인
연결 상태: ✅ 연결됨
participants 테이블: ✅ 존재
```

---

## 🔧 문제가 계속되면

### 확인 1: 올바른 프로젝트인가?

Supabase 대시보드에서:
1. Settings > API로 이동
2. Project URL과 anon key를 확인
3. `.env` 파일의 값과 일치하는지 확인

### 확인 2: 테이블이 실제로 생성되었는가?

SQL Editor에서 실행:

```sql
-- 상세 확인
SELECT 
    'participants' as table_name,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name = 'participants') as exists_count,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' AND tablename = 'participants') as policy_count;
```

### 확인 3: RLS 정책이 있는가?

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'participants';
```

정책이 없으면 `CREATE_TABLES_NOW.sql`을 다시 실행하세요.

---

## 📝 테스트 데이터 추가 (선택사항)

회원가입 테스트를 위해 테스트 데이터를 추가할 수 있습니다:

```sql
INSERT INTO public.participants (name, phone, cohort, university, major, enrollment_status)
VALUES 
  ('홍길동', '01012345678', '1기', '서울대학교', '컴퓨터공학과', '재학'),
  ('김철수', '01023456789', '1기', '연세대학교', '경영학과', '재학')
ON CONFLICT (phone) DO NOTHING;
```

이 데이터로 로그인 테스트를 할 수 있습니다.

---

## ⚠️ 주의사항

1. **마이그레이션은 Supabase 대시보드에서만 실행** 가능합니다
2. **로컬 파일을 실행하는 것이 아닙니다** - SQL Editor에 복사해서 실행해야 합니다
3. **환경 변수 변경 후 개발 서버를 재시작**해야 합니다
4. **브라우저 캐시를 지우고** 새로고침하세요

---

## 🎯 성공 확인

다음이 모두 확인되면 성공입니다:

- [ ] Supabase SQL Editor에서 테이블 확인 쿼리 결과가 2개 행
- [ ] 브라우저 콘솔에서 "✅ participants 테이블 존재" 메시지
- [ ] 회원가입이 정상적으로 작동
- [ ] 로그인이 정상적으로 작동
