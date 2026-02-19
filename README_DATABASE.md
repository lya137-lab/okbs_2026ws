# 데이터베이스 설정 가이드

## 📁 파일 구조

### 마이그레이션 파일
- `supabase/migrations/20260122000000_initial_schema.sql`
  - 모든 테이블과 설정을 포함하는 완전한 마이그레이션 파일
  - Supabase CLI를 사용하는 경우 자동으로 적용됩니다

### 수동 실행 파일
- `SETUP_DATABASE.sql`
  - Supabase SQL Editor에서 직접 실행하는 용도
  - 마이그레이션 파일과 동일한 내용

## 🚀 데이터베이스 설정 방법

### 방법 1: Supabase SQL Editor에서 실행 (권장)

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴 > SQL Editor
   - New query 클릭

3. **스크립트 실행**
   - `SETUP_DATABASE.sql` 파일 열기
   - 전체 내용 복사 (Ctrl+A, Ctrl+C)
   - SQL Editor에 붙여넣기 (Ctrl+V)
   - **Run** 클릭 (또는 Ctrl+Enter)

4. **성공 확인**
   - "Success" 메시지 확인
   - 완료 메시지 확인

5. **스키마 캐시 새로고침**
   - Table Editor 열기
   - 왼쪽 사이드바 새로고침 버튼 클릭
   - 1-2분 대기

6. **브라우저 및 개발 서버 재시작**
   - 브라우저 완전히 닫고 다시 열기
   - 개발 서버 재시작: `npm run dev`

### 방법 2: Supabase CLI 사용

```bash
# Supabase CLI 설치 (필요한 경우)
npm install -g supabase

# Supabase 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref <your-project-ref>

# 마이그레이션 실행
supabase db push
```

## 📊 생성되는 테이블

### 1. user_roles
- 관리자/사용자 역할 관리
- Supabase Auth와 연동

### 2. rooms, room_members
- 숙소 배정 정보
- 방 번호, 층, 타입, 성별, 수용 인원

### 3. buses, bus_passengers
- 버스 배정 정보
- 버스 번호, 출발지, 시간, 집결지

### 4. participants
- 참가자 기본 정보
- 이름, 전화번호, 기수, 학교, 전공, 재학여부

### 5. participant_profiles
- 참가자 상세 프로필
- 자기소개, MBTI, 키워드, 목표, 활동 내역, 프로필 사진

### 6. Storage Bucket
- `profile-photos`: 프로필 사진 저장

## 🔒 보안 설정 (RLS)

### 공개 접근 (Anyone)
- `participants`: SELECT, INSERT, UPDATE
- `participant_profiles`: SELECT, INSERT, UPDATE
- `rooms`, `room_members`, `buses`, `bus_passengers`: SELECT만

### 관리자 전용 (Admin)
- `rooms`, `room_members`, `buses`, `bus_passengers`: INSERT, UPDATE, DELETE
- `user_roles`: 모든 작업

## ✅ 설정 확인

### 테이블 존재 확인

Supabase SQL Editor에서 실행:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'user_roles',
    'rooms',
    'room_members',
    'buses',
    'bus_passengers',
    'participants',
    'participant_profiles'
)
ORDER BY table_name;
```

**예상 결과**: 7개 행

### RLS 정책 확인

```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Storage Bucket 확인

```sql
SELECT id, name, public
FROM storage.buckets
WHERE id = 'profile-photos';
```

## 🐛 문제 해결

### PGRST205 에러 (스키마 캐시 문제)

1. `SETUP_DATABASE.sql` 실행
2. Supabase Table Editor에서 새로고침
3. **1-2분 대기** (중요!)
4. 브라우저 완전히 닫고 다시 열기
5. 개발 서버 재시작

### 테이블이 보이지 않을 때

1. Supabase 대시보드 > Table Editor
2. 왼쪽 사이드바 새로고침 버튼 클릭
3. 또는 브라우저 새로고침 (F5)

### 정책 충돌 에러

`SETUP_DATABASE.sql` 스크립트는 기존 정책을 자동으로 삭제하고 재생성합니다.
에러가 발생하면 스크립트를 다시 실행하세요.

## 📝 참고 사항

- 모든 테이블은 `IF NOT EXISTS`를 사용하여 안전하게 생성됩니다
- 기존 데이터는 유지됩니다 (DROP TABLE 없음)
- RLS 정책은 기존 정책을 삭제하고 재생성합니다
- 트리거는 기존 트리거를 삭제하고 재생성합니다
