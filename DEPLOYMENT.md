# 배포 가이드 (Deployment Guide)

## 📋 목차
1. [백엔드 배포 (Render)](#백엔드-배포-render)
2. [프론트엔드 배포 (Vercel)](#프론트엔드-배포-vercel)
3. [PWA 설치 방법](#pwa-설치-방법)

---

## 백엔드 배포 (Render)

### 1. Render 계정 생성
1. https://render.com 접속
2. GitHub 계정으로 회원가입
3. 무료 플랜 선택

### 2. PostgreSQL 데이터베이스 생성
1. Render 대시보드에서 **"New +"** 클릭
2. **"PostgreSQL"** 선택
3. 다음 정보 입력:
   - **Name**: `habit-tracker-db`
   - **Database**: `habitdb`
   - **User**: `habittracker` (자동 생성)
   - **Region**: `Singapore` (한국에서 가장 가까운 지역)
   - **Plan**: `Free`
4. **"Create Database"** 클릭
5. 생성된 데이터베이스의 **"Internal Database URL"** 복사 (나중에 사용)

### 3. 백엔드 웹 서비스 생성
1. Render 대시보드에서 **"New +"** 클릭
2. **"Web Service"** 선택
3. GitHub 저장소 연결 (리포지토리를 먼저 GitHub에 푸시해야 함)
4. 다음 정보 입력:
   - **Name**: `habit-tracker-backend`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Java`
   - **Build Command**: `./gradlew build -x test`
   - **Start Command**: `java -Dspring.profiles.active=prod -jar build/libs/habit-tracker-1.0.0.jar`
   - **Plan**: `Free`

### 4. 환경 변수 설정
백엔드 서비스 설정에서 **"Environment"** 탭으로 이동하여 다음 환경 변수 추가:

```
DATABASE_URL=<PostgreSQL Internal Database URL>
DB_USERNAME=habittracker
DB_PASSWORD=<PostgreSQL 비밀번호>
JWT_SECRET=<랜덤한 긴 문자열, 예: openssl rand -base64 64>
JWT_EXPIRATION=86400000
FRONTEND_URL=https://<vercel-app-url>.vercel.app
PORT=8080
SPRING_PROFILES_ACTIVE=prod
```

### 5. 배포
- **"Create Web Service"** 클릭
- 자동으로 빌드 및 배포가 시작됨
- 배포 완료 후 제공되는 URL 복사 (예: `https://habit-tracker-backend.onrender.com`)

---

## 프론트엔드 배포 (Vercel)

### 1. Vercel 계정 생성
1. https://vercel.com 접속
2. GitHub 계정으로 회원가입

### 2. 프로젝트 배포
1. Vercel 대시보드에서 **"Add New"** → **"Project"** 클릭
2. GitHub 저장소 Import
3. 다음 정보 입력:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (자동 설정됨)
   - **Output Directory**: `build` (자동 설정됨)

### 3. 환경 변수 설정
배포 설정에서 **"Environment Variables"** 추가:

```
REACT_APP_API_URL=https://<render-backend-url>.onrender.com/api
REACT_APP_WS_URL=https://<render-backend-url>.onrender.com/ws
```

예시:
```
REACT_APP_API_URL=https://habit-tracker-backend.onrender.com/api
REACT_APP_WS_URL=https://habit-tracker-backend.onrender.com/ws
```

### 4. 배포
- **"Deploy"** 클릭
- 배포 완료 후 제공되는 URL 확인 (예: `https://habit-tracker.vercel.app`)

### 5. 백엔드 CORS 업데이트
Render의 백엔드 환경 변수에서 `FRONTEND_URL`을 Vercel URL로 업데이트:
```
FRONTEND_URL=https://habit-tracker.vercel.app
```

---

## PWA 설치 방법

### iOS (아이폰/아이패드)
1. Safari 브라우저에서 앱 URL 접속
2. 화면 하단의 **공유 버튼** (↑) 클릭
3. **"홈 화면에 추가"** 선택
4. 앱 이름 확인 후 **"추가"** 클릭
5. 홈 화면에 앱 아이콘 생성됨

### Android
1. Chrome 브라우저에서 앱 URL 접속
2. 우측 상단 메뉴 (⋮) 클릭
3. **"홈 화면에 추가"** 또는 **"앱 설치"** 선택
4. 앱 이름 확인 후 **"설치"** 클릭
5. 홈 화면에 앱 아이콘 생성됨

---

## 🔧 트러블슈팅

### 백엔드 배포 실패
- Gradle 빌드 로그 확인
- Java 버전 확인 (Java 17 필요)
- 환경 변수 설정 확인

### 프론트엔드에서 API 연결 안됨
- `REACT_APP_API_URL` 환경 변수 확인
- 백엔드 `FRONTEND_URL` CORS 설정 확인
- 브라우저 개발자 도구 Console 확인

### PWA 설치 버튼이 안보임
- HTTPS 연결 확인 (Vercel은 자동 HTTPS)
- `manifest.json` 파일 확인
- Service Worker 등록 확인

---

## 📱 완료!
이제 가족들에게 Vercel URL을 공유하고, PWA로 설치하도록 안내하세요!

**URL 예시**: `https://habit-tracker.vercel.app`
