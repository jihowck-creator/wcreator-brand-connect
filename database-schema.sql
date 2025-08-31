-- Supabase 데이터베이스 스키마 설계

-- 브랜드 테이블
CREATE TABLE brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 상품 테이블
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  base_url VARCHAR(500), -- 기본 상품 URL (컬러별로 달라질 수 있어서 옵션별로도 URL 저장)
  base_image_url VARCHAR(500), -- 기본 상품 이미지 URL
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 상품 옵션 테이블 (컬러/사이즈 조합)
CREATE TABLE product_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  color VARCHAR(100) NOT NULL,
  size VARCHAR(50) NOT NULL,
  product_url VARCHAR(500), -- 해당 옵션의 특정 URL (있는 경우)
  image_url VARCHAR(500), -- 해당 옵션의 특정 이미지 URL (있는 경우)
  stock_quantity INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, color, size)
);

-- 크리에이터 협찬 신청 테이블
CREATE TABLE sponsorship_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  wconcept_id VARCHAR(255),
  sns_links TEXT[], -- SNS 링크들을 배열로 저장
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  wconcept_styleclip_url VARCHAR(500), -- W컨셉 스타일클립 URL
  sns_upload_url VARCHAR(500), -- SNS 업로드 URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 협찬 신청별 상품 옵션 테이블 (다대다 관계)
CREATE TABLE sponsorship_product_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsorship_application_id UUID REFERENCES sponsorship_applications(id) ON DELETE CASCADE,
  product_option_id UUID REFERENCES product_options(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sponsorship_application_id, product_option_id)
);

-- 인덱스 생성
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_product_options_product_id ON product_options(product_id);
CREATE INDEX idx_sponsorship_applications_status ON sponsorship_applications(status);
CREATE INDEX idx_sponsorship_applications_created_at ON sponsorship_applications(created_at);
CREATE INDEX idx_sponsorship_product_options_sponsorship_id ON sponsorship_product_options(sponsorship_application_id);
CREATE INDEX idx_sponsorship_product_options_product_option_id ON sponsorship_product_options(product_option_id);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 적용
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_options_updated_at BEFORE UPDATE ON product_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsorship_applications_updated_at BEFORE UPDATE ON sponsorship_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
