# Supabase 마이그레이션 실행 가이드

## ⚠️ 중요: 테이블이 없다는 에러가 발생한 경우

"Could not find the table 'public.participants' in the schema cache" 에러가 발생했다면, Supabase 데이터베이스에 테이블이 아직 생성되지 않은 것입니다.

## 해결 방법

### 방법 1: 통합 마이그레이션 실행 (권장)

Supabase 대시보드 > SQL Editor에서 다음 파일의 내용을 복사하여 실행하세요:

**`supabase/migrations/20260122050000_complete_setup.sql`**

이 파일은 `participants`와 `participant_profiles` 테이블을 모두 생성합니다.

### 방법 2: 개별 마이그레이션 순서대로 실행

다음 순서로 마이그레이션을 실행하세요:

1. **기본 테이블 생성**
   - 파일: `supabase/migrations/20260120074206_29195468-fb07-4a97-80b5-6ff6ad37bd22.sql`
   - 내용: rooms, buses, user_roles 테이블 생성

2. **Storage 버킷 설정**
   - 파일: `supabase/migrations/20260122023412_9ad0ff8a-f790-4c17-b5f1-3636567187ad.sql`
   - 내용: profile-photos 버킷 생성

3. **참가자 테이블 생성**
   - 파일: `supabase/migrations/20260122030000_add_participants_tables.sql`
   - 내용: participants, participant_profiles 테이블 생성

4. **참가자 테이블 필드 추가**
   - 파일: `supabase/migrations/20260122040000_update_participants_table.sql`
   - 내용: cohort, university, major, enrollment_status 필드 추가

## 실행 방법

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 클릭
5. 마이그레이션 파일 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭 (또는 Ctrl+Enter)
7. 성공 메시지 확인

## 실행 확인

마이그레이션 실행 후, 다음 쿼리로 테이블이 생성되었는지 확인하세요:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('participants', 'participant_profiles');
```

두 테이블이 모두 조회되면 성공입니다!

## 문제 해결

### 에러: "relation already exists"
- 테이블이 이미 존재하는 경우입니다. 무시하고 다음 마이그레이션을 실행하세요.

### 에러: "permission denied"
- Supabase 프로젝트의 관리자 권한이 있는지 확인하세요.

### 에러: "function does not exist"
- `update_updated_at_column` 함수가 없는 경우, 기본 마이그레이션을 먼저 실행하세요.

## 다음 단계

마이그레이션 실행 후:
1. 브라우저를 새로고침하세요
2. 회원가입을 다시 시도하세요
3. 정상적으로 작동하는지 확인하세요
