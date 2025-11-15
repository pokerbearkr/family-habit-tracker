# 🏠 가족 습관 트래커 (Family Habit Tracker)

가족과 함께 습관을 만들어가는 PWA 웹 애플리케이션

## ✨ 주요 기능

- 👤 **개인 습관 관리**: 각자의 습관을 만들고 관리
- 👨‍👩‍👧‍👦 **가족 공유**: 가족 구성원들의 습관 진행상황 확인
- 📊 **월간 통계**: 개인별, 습관별 완료율 통계 및 캘린더 뷰
- 📱 **PWA 지원**: 모바일 앱처럼 설치하여 사용 가능
- 🔔 **실시간 업데이트**: WebSocket을 통한 실시간 동기화
- 🎨 **커스터마이징**: 습관별 색상 설정
- ✅ **사용자 인증**: JWT 기반 로그인/회원가입
- 👨‍👩‍👧‍👦 **가족 그룹**: 초대 코드로 가족 구성원 초대

## 기술 스택

### Backend
- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Security** + JWT
- **Spring Data JPA**
- **WebSocket** (STOMP)
- **H2 Database** (개발용) / **MySQL** (배포용)

### Frontend
- **React**
- **React Router**
- **Axios** (HTTP 클라이언트)
- **SockJS** + **STOMP** (WebSocket 클라이언트)

## 프로젝트 구조

```
family-habit-tracker/
├── backend/                    # Spring Boot 백엔드
│   ├── src/main/java/com/habittracker/
│   │   ├── config/            # 설정 (Security, WebSocket)
│   │   ├── controller/        # REST API 컨트롤러
│   │   ├── dto/              # 데이터 전송 객체
│   │   ├── entity/           # JPA 엔티티
│   │   ├── repository/       # JPA Repository
│   │   ├── security/         # JWT 및 보안 관련
│   │   └── service/          # 비즈니스 로직
│   └── src/main/resources/
│       └── application.properties
└── frontend/                  # React 프론트엔드
    ├── src/
    │   ├── components/       # 재사용 가능한 컴포넌트
    │   ├── context/          # React Context (Auth)
    │   ├── pages/            # 페이지 컴포넌트
    │   └── services/         # API 및 WebSocket 서비스
    └── package.json
```

## 시작하기

### 사전 요구사항

- Java 17 이상
- Node.js 14 이상
- Maven 3.6 이상

### 1. 백엔드 실행

```bash
cd backend
mvn spring-boot:run
```

백엔드는 `http://localhost:8080`에서 실행됩니다.

#### 데이터베이스 설정

**개발 환경 (H2 - 기본값)**
- 별도 설정 없이 바로 실행 가능
- H2 콘솔: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:mem:habitdb`
  - Username: `sa`
  - Password: (비워두기)

**배포 환경 (MySQL)**

`backend/src/main/resources/application.properties` 파일에서 다음 부분의 주석을 해제하고 수정:

```properties
# MySQL Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/habitdb?createDatabaseIfNotExist=true
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```

H2 설정 부분은 주석 처리:
```properties
# spring.datasource.url=jdbc:h2:mem:habitdb
# spring.datasource.driverClassName=org.h2.Driver
# ...
```

### 2. 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

## 사용 방법

### 1. 회원가입 및 로그인
1. 회원가입 페이지에서 계정 생성
2. 로그인

### 2. 가족 그룹 생성 또는 참여
- **새 가족 생성**: "Family" 메뉴에서 가족 이름 입력 후 생성
- **기존 가족 참여**: 초대 코드를 입력하여 가족에 참여

### 3. 습관 관리
1. Dashboard에서 "Add Habit" 버튼 클릭
2. 습관 이름, 설명, 색상 선택
3. 생성된 습관을 매일 체크

### 4. 실시간 동기화
- 가족 구성원이 습관을 체크하면 자동으로 화면에 반영됩니다
- 각 습관 카드에서 가족 구성원별 완료 상태를 확인할 수 있습니다

## API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인

### 가족
- `POST /api/family/create` - 가족 생성
- `POST /api/family/join/{inviteCode}` - 가족 참여
- `GET /api/family/my` - 내 가족 정보 조회
- `POST /api/family/leave` - 가족 탈퇴

### 습관
- `POST /api/habits` - 습관 생성
- `GET /api/habits` - 가족 습관 목록 조회
- `PUT /api/habits/{id}` - 습관 수정
- `DELETE /api/habits/{id}` - 습관 삭제

### 습관 로그
- `POST /api/logs` - 습관 체크
- `GET /api/logs/family/{date}` - 특정 날짜의 가족 로그 조회
- `GET /api/logs/my/{date}` - 특정 날짜의 내 로그 조회

### WebSocket
- 연결: `/ws` (SockJS)
- 구독: `/topic/family/{familyId}/habit-updates`

## 무료 배포 옵션

### Backend (Spring Boot)
- **Render** (추천): https://render.com
  - 무료 플랜 제공 (비활성 시 sleep)
  - Docker 또는 Java 빌드 지원
- **Railway**: https://railway.app
  - 월 $5 크레딧 무료 제공
- **Fly.io**: https://fly.io
  - 무료 티어 제공

### Frontend (React)
- **Vercel** (추천): https://vercel.com
  - 무료, 무제한 배포
  - GitHub 연동 자동 배포
- **Netlify**: https://netlify.com
  - 무료 플랜 제공
- **Cloudflare Pages**: https://pages.cloudflare.com

### Database (MySQL/PostgreSQL)
- **Supabase**: https://supabase.com
  - PostgreSQL 무료 500MB
- **PlanetScale**: https://planetscale.com
  - MySQL 무료 5GB
- **Neon**: https://neon.tech
  - PostgreSQL 무료 0.5GB

## 환경 변수 설정

### Backend (application.properties)
```properties
jwt.secret=your-secret-key-here
spring.datasource.url=your-database-url
spring.datasource.username=your-database-username
spring.datasource.password=your-database-password
cors.allowed-origins=your-frontend-url
```

### Frontend (.env)
```
REACT_APP_API_URL=your-backend-url/api
REACT_APP_WS_URL=your-backend-url/ws
```

## 📱 PWA 설치 방법

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

## 🚀 배포

자세한 배포 방법은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

**추천 배포 스택:**
- Backend: Render (무료)
- Database: PostgreSQL on Render (무료)
- Frontend: Vercel (무료)

## 🧪 테스트 계정

서버 재시작 시 자동으로 생성되는 테스트 계정:
- **아이디**: testuser / **비밀번호**: test123
- **아이디**: testuser2 / **비밀번호**: test123

## 라이센스

MIT License

## 기여

이슈나 풀 리퀘스트는 언제든지 환영합니다!
