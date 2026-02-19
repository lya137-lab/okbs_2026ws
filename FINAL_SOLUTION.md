# 🎯 최종 해결 방법 - PGRST205 에러

## 현재 상황
- ✅ Supabase 연결 정상
- ❌ 테이블이 스키마 캐시에 없음 (PGRST205 에러)
- ❌ 404 Not Found 에러 발생

## ⚡ 즉시 해결 (3단계)

### Step 1: Supabase에서 테이블 생성

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 올바른 프로젝트 선택 확인

2. **SQL Editor 열기**
   - 왼쪽 메뉴 > SQL Editor
   - New query 클릭

3. **`SIMPLE_CREATE.sql` 파일 실행**
   - 파일 내용 전체 복사 (Ctrl+A, Ctrl+C)
   - SQL Editor에 붙여넣기 (Ctrl+V)
   - **Run** 클릭 (또는 Ctrl+Enter)
   - "Success" 메시지 확인

### Step 2: Supabase 스키마 캐시 새로고침

**방법 1: Table Editor에서 새로고침**
1. Supabase 대시보드 > **Table Editor** 클릭
2. 왼쪽 사이드바에서 **새로고침** 버튼 클릭
3. 또는 브라우저 새로고침 (F5)

**방법 2: API Settings에서 새로고침**
1. Settings > **API** 클릭
2. 페이지 새로고침

**방법 3: 잠시 대기**
- Supabase 스키마 캐시는 자동으로 업데이트됩니다
- **30초~1분 정도 기다린 후** 다시 시도

### Step 3: 브라우저 완전 새로고침

1. **브라우저 완전히 닫기**
2. **브라우저 다시 열기**
3. `http://localhost:8080/login` 접속
4. **개발자 도구(F12) > Console** 확인

---

## ✅ 성공 확인

브라우저 콘솔에서 다음 메시지 확인:

```
🔍 데이터베이스 상태 확인
연결 상태: ✅ 연결됨
participants 테이블: ✅ 존재
participant_profiles 테이블: ✅ 존재
```

---

## 🔍 문제가 계속되면

### 확인 1: 테이블이 실제로 생성되었는가?

Supabase SQL Editor에서 실행:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('participants', 'participant_profiles');
```

**결과:**
- **2개 행** → 테이블 존재 ✅
- **0개 행** → 테이블 없음 ❌ (SIMPLE_CREATE.sql 다시 실행)

### 확인 2: 올바른 프로젝트인가?

1. Supabase 대시보드 > Settings > API
2. **Project URL** 확인: `https://hswlxxzfhcmnirajznff.supabase.co`
3. `.env` 파일의 `VITE_SUPABASE_URL`과 **정확히 일치**하는지 확인

### 확인 3: RLS 정책이 있는가?

```sql
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'participants';
```

**결과:**
- **3개 이상** → 정책 있음 ✅
- **0개** → 정책 없음 ❌ (SIMPLE_CREATE.sql 다시 실행)

---

## 💡 추가 팁

### Supabase 프로젝트 재시작 (최후의 수단)

1. Supabase 대시보드 > Settings > General
2. 프로젝트 일시 중지 후 재시작
3. 1-2분 대기 후 다시 시도

### 개발 서버 재시작

```bash
# 터미널에서
Ctrl+C  # 서버 중지
npm run dev  # 재시작
```

---

## 📝 실행 순서 요약

1. ✅ `SIMPLE_CREATE.sql` 실행
2. ✅ Supabase Table Editor에서 새로고침
3. ✅ 30초~1분 대기
4. ✅ 브라우저 완전히 닫고 다시 열기
5. ✅ 회원가입 테스트

---

## 🎯 성공 기준

- [ ] Supabase SQL Editor에서 테이블 확인 쿼리 결과 2개 행
- [ ] 브라우저 콘솔에서 "✅ participants 테이블 존재"
- [ ] 회원가입이 정상 작동
- [ ] 로그인이 정상 작동

---

**중요:** 스키마 캐시 업데이트는 즉시 반영되지 않을 수 있습니다. 30초~1분 정도 기다린 후 다시 시도하세요!
