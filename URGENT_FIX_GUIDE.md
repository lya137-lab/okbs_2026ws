# 🚨 긴급 해결 가이드 - PGRST205 에러

## 현재 문제
- **에러 코드**: PGRST205
- **에러 메시지**: "Could not find the table 'public.participants' in the schema cache"
- **원인**: Supabase 스키마 캐시가 업데이트되지 않음

---

## ✅ 즉시 해결 방법 (3단계)

### Step 1: 테이블 생성 확인

**Supabase SQL Editor에서 실행:**

```sql
-- CHECK_TABLES_EXIST.sql 파일 내용 실행
SELECT 
    'participants' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'participants'
        ) THEN '✅ 존재함'
        ELSE '❌ 없음'
    END as status;
```

**결과 확인:**
- ✅ **존재함** → Step 2로 진행
- ❌ **없음** → `ULTIMATE_FIX.sql` 실행 후 Step 2로 진행

---

### Step 2: 스키마 캐시 강제 새로고침

**방법 1: Table Editor에서 새로고침 (권장)**
1. Supabase 대시보드 > **Table Editor** 클릭
2. 왼쪽 사이드바에서 **새로고침** 버튼 클릭 (또는 F5)
3. `participants` 테이블이 보이는지 확인

**방법 2: API Settings 새로고침**
1. Settings > **API** 클릭
2. 페이지 새로고침 (F5)

**방법 3: 프로젝트 재시작 (최후의 수단)**
1. Settings > **General** 클릭
2. 프로젝트 일시 중지 후 재시작
3. 2-3분 대기

---

### Step 3: 브라우저 및 개발 서버 재시작

1. **브라우저 완전히 닫기**
   - 모든 브라우저 창 닫기
   - 작업 관리자에서 브라우저 프로세스 종료 (선택사항)

2. **개발 서버 재시작**
   ```bash
   # 터미널에서
   Ctrl+C  # 서버 중지
   npm run dev  # 재시작
   ```

3. **브라우저 다시 열기**
   - `http://localhost:8080/login` 접속
   - 개발자 도구(F12) > Console 확인

---

## 🔍 문제가 계속되면

### 확인 1: 올바른 프로젝트인가?

1. Supabase 대시보드 > Settings > API
2. **Project URL** 확인: `https://hswlxxzfhcmnirajznff.supabase.co`
3. `.env` 파일의 `VITE_SUPABASE_URL`과 **정확히 일치**하는지 확인

### 확인 2: 테이블이 실제로 존재하는가?

**Supabase SQL Editor에서 실행:**

```sql
-- CHECK_TABLES_EXIST.sql 실행
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('participants', 'participant_profiles');
```

**결과:**
- **2개 행** → 테이블 존재 ✅
- **0개 행** → 테이블 없음 ❌ (`ULTIMATE_FIX.sql` 실행 필요)

### 확인 3: RLS 정책이 있는가?

```sql
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'participants';
```

**결과:**
- **3개 이상** → 정책 있음 ✅
- **0개** → 정책 없음 ❌ (`ULTIMATE_FIX.sql` 실행 필요)

---

## 📝 실행 순서 요약

1. ✅ `CHECK_TABLES_EXIST.sql` 실행 → 테이블 존재 확인
2. ✅ 테이블 없으면 → `ULTIMATE_FIX.sql` 실행
3. ✅ Supabase Table Editor에서 새로고침
4. ✅ **1-2분 대기** (스키마 캐시 업데이트)
5. ✅ 브라우저 완전히 닫고 다시 열기
6. ✅ 개발 서버 재시작: `npm run dev`
7. ✅ 회원가입 테스트

---

## ⚠️ 중요 사항

1. **스키마 캐시 업데이트는 시간이 걸립니다**
   - SQL 실행 후 즉시 반영되지 않을 수 있음
   - **최소 30초~1분, 최대 2분** 대기 필요

2. **브라우저 캐시 문제**
   - 브라우저를 완전히 닫지 않으면 이전 캐시가 남아있을 수 있음
   - **강제 새로고침**: Ctrl+Shift+R (Windows) 또는 Cmd+Shift+R (Mac)

3. **개발 서버 재시작 필수**
   - 환경 변수 변경 시 반드시 재시작
   - 테이블 생성 후에도 재시작 권장

---

## 🎯 성공 기준

브라우저 콘솔에서 다음 메시지 확인:

```
🔍 데이터베이스 상태 확인
연결 상태: ✅ 연결됨
participants 테이블: ✅ 존재
participant_profiles 테이블: ✅ 존재
```

**이 메시지가 보이면 성공입니다!** 🎉

---

## 💡 여전히 안 되면

1. **Supabase 지원팀에 문의**
   - 프로젝트 URL과 에러 메시지 제공
   - PGRST205 에러는 Supabase 측 문제일 수 있음

2. **새 프로젝트 생성 (최후의 수단)**
   - 새 Supabase 프로젝트 생성
   - `.env` 파일 업데이트
   - `ULTIMATE_FIX.sql` 실행

---

**중요**: 스키마 캐시 문제는 Supabase 측 이슈일 수 있습니다. SQL 실행 후 충분히 기다려주세요!
