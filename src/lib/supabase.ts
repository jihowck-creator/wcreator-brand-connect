import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// 데이터베이스 타입 정의
export interface Brand {
  id: string;
  name: string;
  brand_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  google_email: string;
  brand_code: string;
  brand_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  base_url?: string;
  base_image_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}

export interface ProductOption {
  id: string;
  product_id: string;
  color: string;
  size: string;
  product_url?: string;
  image_url?: string;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface SponsorshipApplication {
  id: string;
  creator_name: string;
  phone_number: string;
  address: string;
  wconcept_id?: string;
  sns_links?: string[];
  status: "pending" | "approved" | "rejected";
  wconcept_styleclip_url?: string;
  sns_upload_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SponsorshipProductOption {
  id: string;
  sponsorship_application_id: string;
  product_option_id: string;
  created_at: string;
  product_option?: ProductOption;
}
