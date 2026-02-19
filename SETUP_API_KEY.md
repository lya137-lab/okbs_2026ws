# 🔑 Supabase API Key 설정 가이드

## 문제: "Invalid API key" 오류

현재 `.env` 파일에 `PLACEHOLDER_ANON_KEY`가 설정되어 있어 실제 API 키가 필요합니다.

## ✅ 해결 방법

### Step 1: Supabase 대시보드 접속

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 (프로젝트 ID: `ezxnbcyfzcoflzdbvyqa`)

### Step 2: API Key 복사

1. 왼쪽 메뉴에서 **Settings** 클릭
2. **API** 메뉴 클릭
3. **Project API keys** 섹션에서:
   - **`anon` `public`** 키를 찾으세요
   - **복사** 버튼 클릭하여 키 복사
   - ⚠️ **주의**: `service_role` 키가 아닌 **`anon` `public`** 키를 사용해야 합니다!

### Step 3: .env 파일 업데이트

프로젝트 루트의 `.env` 파일을 열고 다음 줄을 수정하세요:

```env
VITE_SUPABASE_PUBLISHABLE_KEY=여기에_복사한_anon_키_붙여넣기
```

**예시:**
```env
VITE_SUPABASE_PROJECT_ID=ezxnbcyfzcoflzdbvyqa
VITE_SUPABASE_URL=https://ezxnbcyfzcoflzdbvyqa.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eG5iY3lmemNvZmx6ZGJ2eXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDU0NzY1NDAsImV4cCI6MjAyMTAzMjU0MH0.실제키값...
```

**중요 사항:**
- ✅ 따옴표 없이 입력
- ✅ 공백 없이 입력
- ✅ 전체 키를 복사 (매우 긴 문자열입니다)
- ✅ `eyJ`로 시작하는 JWT 토큰 형식

### Step 4: 개발 서버 재시작

1. 터미널에서 `Ctrl+C`로 서버 중지
2. `npm run dev`로 서버 재시작
3. 브라우저를 완전히 닫고 다시 열기
4. `http://localhost:8084` 접속

### Step 5: 확인

브라우저 개발자 도구(F12) > Console에서 다음 메시지 확인:

```
✅ Supabase 환경 변수 설정됨: https://ezxnbcyfzcoflzdbvyqa.supabase.co
```

이 메시지가 보이면 성공입니다!

## 🔍 API Key 형식 확인

올바른 anon key는 다음과 같은 형식입니다:
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.`로 시작
- 매우 긴 문자열 (100자 이상)
- JWT 토큰 형식

## ⚠️ 주의사항

1. **`anon` `public` 키만 사용**: `service_role` 키는 절대 프론트엔드에서 사용하지 마세요!
2. **키 공유 금지**: API 키를 GitHub 등에 공개하지 마세요 (`.env`는 `.gitignore`에 포함되어 있습니다)
3. **환경 변수 변경 후 서버 재시작 필수**: Vite는 서버 시작 시에만 `.env` 파일을 읽습니다

## 💡 빠른 확인 방법

브라우저 콘솔에서 다음을 확인하세요:

```javascript
console.log(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20))
```

- `PLACEHOLDER_ANON_KEY`가 보이면 → 아직 업데이트되지 않음
- `eyJhbGciOiJIUzI1NiIs`가 보이면 → 올바르게 설정됨 ✅
