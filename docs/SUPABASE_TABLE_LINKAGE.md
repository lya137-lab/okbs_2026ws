# Supabase 테이블 ↔ 웹페이지 연동 현황

프로젝트 전체에서 `supabase.from('테이블명')` 사용처를 기준으로 정리했습니다.

## participants.id 연동 (나의 프로필)

- **participant_profiles**: `participant_id` → `participants(id)` (기존 연동)
- **bus_passengers**: `participant_id` → `participants(id)` (마이그레이션 `20260130020000_link_participant_id.sql` 추가)
- **room_members**: `participant_id` → `participants(id)` (동일 마이그레이션 추가)

로그인 시 `participantId`를 저장하고, **나의 프로필** (`/profile`)에서 위 세 테이블을 `participant_id` 기준으로 조회해 한 화면에 표시합니다.

---

## ✅ 웹페이지와 연동된 테이블 (삭제하면 안 됨)

| 테이블명 | 연동 페이지/컴포넌트 | 용도 |
|----------|------------------------|------|
| **participants** | ParticipantLogin, SelfIntroduction, dbCheck | 참가자 로그인·자기소개·DB 점검 |
| **participant_profiles** | ParticipantsSection, SelfIntroduction, dbCheck | 참가자 프로필·자기소개서·DB 점검 |
| **announcements** | AnnouncementsSection, Announcements 페이지, Admin | 공지사항 조회·관리자 CRUD |
| **schedules** | ScheduleSection, Admin | 일정표 조회·관리자 CRUD |
| **faqs** | ContactSection, Admin | FAQ 조회·관리자 CRUD |
| **buses** | BusAssignmentSection, Admin | 버스 배정 조회·관리자 CRUD |
| **bus_passengers** | BusAssignmentSection, Admin | 버스 탑승자 조회·관리자 CRUD |
| **rooms** | AccommodationSection | 숙소 배정 조회 (rooms + room_members 조인) |
| **room_members** | AccommodationSection | 숙소 입실자 (rooms select 시 함께 조회) |
| **user_roles** | 프론트에서 `.from()` 미사용 | **RLS/백엔드 전용** – `is_admin()` 등 정책에서 참조. 삭제 시 관리자 권한 체크 깨짐 |

---

## ⚠️ 중복·전환 가능 (삭제 검토용)

| 테이블명 | 연동 여부 | 비고 |
|----------|-----------|------|
| **room_assignments** | **Admin 페이지에서만 사용** | 숙소 배정 관리(CRUD)를 Admin에서만 `room_assignments`로 하고 있음. 공개 페이지(AccommodationSection)는 **rooms + room_members**만 사용. **삭제하려면** Admin의 숙소배정 탭을 `rooms` / `room_members` 기반으로 바꾼 뒤 제거 가능. |

---

## ❌ 이미 삭제된 테이블 (마이그레이션 기준)

| 테이블명 | 비고 |
|----------|------|
| **schedule_days** | `20260126020000_drop_schedule_days.sql`에서 **DROP**됨. 현재 스키마에는 없음. |

---

## 요약

- **실제 웹과 연동되지 않은 “불필요” 테이블**: 없음.  
  (모든 현재 마이그레이션 상 테이블은 어딘가에서 사용되거나 RLS에서 참조됨.)
- **삭제 후보**: **room_assignments** 1개.  
  - 공개 페이지는 이미 `rooms` + `room_members`만 사용.  
  - Admin에서 숙소배정을 `rooms` / `room_members`로 완전히 이전한 뒤에만 `room_assignments` 삭제하는 것을 권장.

---

## 참고: types.ts vs 실제 사용 테이블

`src/integrations/supabase/types.ts`에는 아래만 정의되어 있음:  
`bus_passengers`, `buses`, `room_members`, `rooms`, `user_roles`, `participants`, `participant_profiles`

아래 테이블은 **코드에서 사용 중**이지만 types에는 없을 수 있음 (수동 타입 또는 any):  
`announcements`, `schedules`, `faqs`, `room_assignments`  
→ 타입 안전성을 위해 추후 types 재생성(또는 수동 타입 추가)을 권장.
