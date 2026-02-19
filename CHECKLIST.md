# 웹페이지 기능 점검 체크리스트

## ✅ 완료된 작업

### 1. Supabase DB 연동
- [x] BusAssignmentSection - 버스 배정 정보를 DB에서 로드
- [x] AccommodationSection - 숙소 배정 정보를 DB에서 로드
- [x] ParticipantsSection - 참가자 목록을 DB에서 로드
- [x] ParticipantLogin - 참가자 인증을 DB와 연동
- [x] SelfIntroduction - 자기소개 정보를 DB에 저장
- [x] Admin 페이지 - 관리자 기능 (이미 DB 연동됨)

### 2. 데이터베이스 테이블
- [x] participants 테이블 생성
- [x] participant_profiles 테이블 생성
- [x] rooms, room_members 테이블 (기존)
- [x] buses, bus_passengers 테이블 (기존)
- [x] RLS 정책 설정 (공개 읽기 허용)

### 3. Storage 설정
- [x] profile-photos 버킷 마이그레이션 파일 생성

## 📋 다음 단계 (Supabase 대시보드에서 실행)

### 1. 마이그레이션 실행
Supabase 대시보드 > SQL Editor에서 다음 순서로 실행:

1. `supabase/migrations/20260120074206_29195468-fb07-4a97-80b5-6ff6ad37bd22.sql`
2. `supabase/migrations/20260122023412_9ad0ff8a-f790-4c17-b5f1-3636567187ad.sql`
3. `supabase/migrations/20260122030000_add_participants_tables.sql`

### 2. Storage 버킷 확인
- Storage > Buckets에서 `profile-photos` 버킷이 생성되었는지 확인
- Public 설정이 true인지 확인

### 3. 테스트 데이터 추가

#### 참가자 등록 (participants 테이블)
```sql
INSERT INTO participants (name, phone) VALUES 
  ('홍길동', '01012345678'),
  ('김철수', '01023456789'),
  ('이영희', '01034567890');
```

#### 숙소 배정 (rooms, room_members 테이블)
관리자 페이지에서 직접 추가하거나:
```sql
-- 객실 추가
INSERT INTO rooms (room_number, floor, room_type, gender, capacity) VALUES
  ('101', '1층', '4인실', '남', 4),
  ('201', '2층', '4인실', '여', 4);

-- 객실 멤버 추가
INSERT INTO room_members (room_id, name, university, role) VALUES
  ('room_id_here', '홍길동', '서울대학교', '장학생');
```

#### 버스 배정 (buses, bus_passengers 테이블)
관리자 페이지에서 직접 추가하거나:
```sql
-- 버스 추가
INSERT INTO buses (bus_number, departure, departure_time, meeting_point, capacity) VALUES
  ('1호차', '서울역', '08:00', '서울역 버스환승센터 3번 게이트', 45);

-- 버스 승객 추가
INSERT INTO bus_passengers (bus_id, name, university, is_mentor) VALUES
  ('bus_id_here', '홍길동', '서울대학교', false);
```

## 🧪 기능 테스트

### 참가자 로그인 테스트
1. `/login` 페이지 접속
2. 등록된 참가자 이름과 전화번호로 로그인
3. 로그인 성공 시 메인 페이지로 이동

### 자기소개 등록 테스트
1. 로그인 후 `/self-introduction` 페이지 접속
2. 모든 필드 입력 및 프로필 사진 업로드
3. 등록 완료 후 메인 페이지에서 확인

### 관리자 기능 테스트
1. `/auth` 페이지에서 관리자 로그인
2. `/admin` 페이지에서 숙소/버스 관리 기능 확인
3. 객실/버스 추가, 멤버/승객 추가 기능 테스트

### 메인 페이지 테스트
1. 로그인 전: 기본 정보만 표시
2. 로그인 후: 참가자 목록, 숙소 배정, 버스 배정 섹션 표시 확인

## ⚠️ 주의사항

1. **환경 변수**: `.env` 파일에 Supabase URL과 키가 올바르게 설정되어 있는지 확인
2. **RLS 정책**: 모든 테이블의 SELECT 정책이 공개로 설정되어 있는지 확인
3. **Storage 권한**: profile-photos 버킷의 업로드/다운로드 권한이 올바르게 설정되어 있는지 확인

## 🔧 문제 해결

### Supabase 연결 오류
- `.env` 파일의 환경 변수 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- 네트워크 연결 확인

### 데이터가 표시되지 않음
- 마이그레이션이 실행되었는지 확인
- 테스트 데이터가 추가되었는지 확인
- 브라우저 콘솔에서 에러 확인

### 프로필 사진 업로드 실패
- Storage 버킷이 생성되었는지 확인
- 버킷의 권한 정책 확인
- 파일 크기가 10MB 이하인지 확인
