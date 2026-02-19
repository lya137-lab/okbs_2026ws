# Supabase 연동 가이드

## 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## 2. 데이터베이스 마이그레이션

다음 순서로 마이그레이션을 실행하세요:

1. `supabase/migrations/20260120074206_29195468-fb07-4a97-80b5-6ff6ad37bd22.sql` - 기본 테이블 생성
2. `supabase/migrations/20260122023412_9ad0ff8a-f790-4c17-b5f1-3636567187ad.sql` - Storage 버킷 설정
3. `supabase/migrations/20260122030000_add_participants_tables.sql` - 참가자 및 프로필 테이블

## 3. Storage 버킷 설정

Supabase 대시보드에서 `profile-photos` 버킷이 생성되었는지 확인하세요.
- 버킷 이름: `profile-photos`
- Public: true
- 파일 크기 제한: 10MB

## 4. 테이블 구조

### participants
- 참가자 기본 정보 (이름, 전화번호)

### participant_profiles
- 참가자 자기소개 정보
- 프로필 사진 URL 포함

### rooms / room_members
- 숙소 배정 정보

### buses / bus_passengers
- 버스 배정 정보

## 5. RLS (Row Level Security) 정책

모든 테이블은 공개 읽기가 가능하도록 설정되어 있습니다.
- SELECT: 모든 사용자 가능
- INSERT/UPDATE/DELETE: 관리자만 가능 (인증 필요)

## 6. 참가자 등록

참가자는 `participants` 테이블에 직접 등록해야 합니다:

```sql
INSERT INTO participants (name, phone) VALUES ('홍길동', '01012345678');
```

## 7. 타입 재생성 (선택사항)

Supabase CLI를 사용하여 타입을 재생성하려면:

```bash
npx supabase gen types typescript --project-id your_project_id > src/integrations/supabase/types.ts
```

또는 Supabase 대시보드에서 타입을 다운로드할 수 있습니다.
