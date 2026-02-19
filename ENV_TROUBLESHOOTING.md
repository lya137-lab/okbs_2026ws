# 환경 변수 로드 문제 해결 가이드

## 문제
콘솔에 환경 변수가 "❌ 없음"으로 표시됩니다.

## 원인
Vite는 **개발 서버 시작 시에만** `.env` 파일을 읽습니다. `.env` 파일을 변경한 후 서버를 재시작하지 않으면 변경사항이 반영되지 않습니다.

## 해결 방법

### Step 1: 개발 서버 완전히 중지
1. 터미널에서 `Ctrl+C`를 눌러 서버 중지
2. 모든 Node.js 프로세스가 종료되었는지 확인

### Step 2: .env 파일 확인
프로젝트 루트에 `.env` 파일이 있고 다음 형식인지 확인:

```env
VITE_SUPABASE_PROJECT_ID=ezxnbcyfzcoflzdbvyqa
VITE_SUPABASE_URL=https://ezxnbcyfzcoflzdbvyqa.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=실제_anon_키_값
```

**중요:**
- 따옴표 없이 입력
- 공백 없음
- 각 줄 끝에 공백 없음

### Step 3: 개발 서버 재시작
```bash
npm run dev
```

### Step 4: 브라우저 확인
1. 브라우저를 완전히 닫고 다시 열기
2. `http://localhost:8084` 접속
3. 개발자 도구(F12) > Console 확인
4. 다음 로그 확인:
   ```
   🔍 환경 변수 확인:
   import.meta.env: {...}
   import.meta.env.VITE_SUPABASE_URL: https://ezxnbcyfzcoflzdbvyqa.supabase.co
   ✅ Supabase 환경 변수 설정됨
   ```

## 추가 확인 사항

### .env 파일 위치
`.env` 파일은 **프로젝트 루트**에 있어야 합니다:
```
프로젝트루트/
  ├── .env          ← 여기에 있어야 함
  ├── package.json
  ├── vite.config.ts
  └── src/
```

### .env 파일 인코딩
- UTF-8 인코딩 사용
- BOM 없음

### Vite 환경 변수 규칙
- `VITE_` 접두사 필수
- `import.meta.env.VITE_변수명` 형식으로 접근
- 서버 시작 시에만 로드됨 (런타임 변경 불가)

## 여전히 안 되면

1. **캐시 삭제**
   ```bash
   # node_modules/.vite 폴더 삭제
   rm -rf node_modules/.vite
   # 또는 Windows에서
   rmdir /s /q node_modules\.vite
   ```

2. **.env 파일 재생성**
   - 기존 .env 파일 삭제
   - 새로 생성하여 값 입력

3. **Vite 설정 확인**
   - `vite.config.ts`에 특별한 설정이 없는지 확인
