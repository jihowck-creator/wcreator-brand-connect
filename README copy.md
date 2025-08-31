# 셀러-크리에이터 플랫폼

브랜드 상품 등록과 크리에이터 협찬 신청을 위한 웹 플랫폼입니다.

## 주요 기능

### 셀러 기능
- **상품 등록**: 브랜드 상품을 등록하고 옵션(컬러/사이즈) 관리
- **브랜드 관리**: 기존 브랜드 검색 및 새 브랜드 등록
- **상품 옵션 관리**: 컬러별, 사이즈별 URL과 이미지 개별 설정 가능

### 크리에이터 기능
- **상품 카탈로그**: 등록된 모든 상품과 옵션 조회
- **협찬 신청**: 원하는 상품 옵션들을 선택하여 협찬 신청
- **프로필 관리**: 연락처, 주소, SNS 링크 등 정보 입력

## 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Real-time Database)
- **Form Management**: React Hook Form, Zod (유효성 검사)
- **Deployment**: Vercel

## 데이터베이스 구조

### 주요 테이블
1. **brands**: 브랜드 정보
2. **products**: 상품 정보
3. **product_options**: 상품 옵션 (컬러/사이즈 조합)
4. **sponsorship_applications**: 협찬 신청 정보
5. **sponsorship_product_options**: 신청별 선택된 상품 옵션

자세한 스키마는 `database-schema.sql` 파일을 참조하세요.

## 설치 및 실행

### 1. 의존성 설치
\`\`\`bash
npm install
\`\`\`

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `database-schema.sql` 파일의 내용을 실행하여 테이블 생성
3. 프로젝트 설정에서 API 키와 URL 확인

#### 인증 설정
4. **Authentication > Settings**에서 다음 설정:
   - **Site URL**: `http://localhost:3000` (개발 시) 또는 배포 도메인
   - **Redirect URLs**: `http://localhost:3000/auth/callback` 추가

5. **구글 로그인 설정** (셀러용):
   - Authentication > Providers에서 Google 활성화
   - Google Cloud Console에서 OAuth 2.0 클라이언트 생성
   - Client ID와 Client Secret을 Supabase에 입력

6. **카카오 로그인 설정** (크리에이터용):
   - Authentication > Providers에서 Kakao 활성화
   - 카카오 개발자 센터에서 애플리케이션 생성
   - Client ID와 Client Secret을 Supabase에 입력

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 4. 개발 서버 실행
\`\`\`bash
npm run dev
\`\`\`

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 배포

### Vercel 배포

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에서 GitHub 레포지토리 연결
3. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 배포 완료

## 사용 방법

### 🔐 로그인 시스템
- **셀러**: 구글 로그인 (등록된 이메일만 허용)
- **크리에이터**: 카카오 로그인 (자유 가입)

### 🏢 셀러 워크플로우
1. 홈페이지에서 "구글로 셀러 로그인" 클릭
2. 구글 계정으로 로그인 (허용된 이메일만)
3. 상품 등록 페이지에서 브랜드 상품 등록
4. 마이페이지에서 협찬 신청 관리 및 승인/거절
5. 크리에이터가 업로드한 콘텐츠 URL 확인

### 🎨 크리에이터 워크플로우
1. 홈페이지에서 "카카오로 크리에이터 로그인" 클릭
2. 카카오 계정으로 로그인 (자유 가입)
3. 상품 카탈로그에서 원하는 옵션들 선택
4. 협찬 신청 제출 (이름은 자동 입력)
5. 마이페이지에서 신청 현황 확인
6. 승인된 협찬에 대해 W컨셉 스타일클립 URL, SNS 업로드 URL 제출

## 주요 특징

- **🔐 역할 기반 인증**: 구글(셀러) / 카카오(크리에이터) 로그인 시스템
- **📱 반응형 디자인**: 모바일과 데스크톱 모두 최적화
- **🔍 실시간 검색**: 브랜드명, 상품명 자동완성
- **⚙️ 유연한 옵션 관리**: 컬러/사이즈별 개별 URL과 이미지 설정
- **🎯 직관적 UI**: 사용자 친화적인 인터페이스
- **📊 실시간 관리**: 협찬 신청 즉시 승인/거절 처리
- **📤 콘텐츠 업로드**: W컨셉 스타일클립, SNS URL 관리

## 라이센스

MIT License