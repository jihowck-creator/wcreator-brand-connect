-- 기존 sellers 테이블이 있다면 삭제
DROP TABLE IF EXISTS sellers CASCADE;

-- 셀러 테이블 생성 (한 이메일이 여러 브랜드 관리 가능)
CREATE TABLE sellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_email VARCHAR(255) NOT NULL, -- 구글 로그인 이메일 (중복 허용)
  brand_code VARCHAR(50) NOT NULL UNIQUE, -- 브랜드 고유 코드 (중복 불가)
  brand_name VARCHAR(255) NOT NULL, -- 브랜드명
  is_active BOOLEAN DEFAULT true, -- 활성화 상태
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 복합 유니크 제약: 같은 이메일이 같은 브랜드 코드를 중복으로 가질 수 없음
  UNIQUE(google_email, brand_code)
);

-- 인덱스 생성
CREATE INDEX idx_sellers_google_email ON sellers(google_email);
CREATE INDEX idx_sellers_brand_code ON sellers(brand_code);
CREATE INDEX idx_sellers_email_brand ON sellers(google_email, brand_code);

-- 업데이트 트리거 적용
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입
INSERT INTO sellers (google_email, brand_code, brand_name) VALUES
('ji.ho.wck@gmail.com', '115929', 'ANDL');

-- brands 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- brands 테이블에 brand_code 컬럼 추가 (조건부)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='brands' AND column_name='brand_code') THEN
        ALTER TABLE brands ADD COLUMN brand_code VARCHAR(50) UNIQUE;
    END IF;
END $$;

-- brands 테이블 업데이트 트리거 추가 (조건부)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_brands_updated_at') THEN
        CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 권한 정책 설정
ALTER TABLE "public"."sellers" ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 (셀러 정보 확인용)
CREATE POLICY "Enable read access for sellers" ON "public"."sellers"
AS PERMISSIVE FOR SELECT
TO public
USING (true);
