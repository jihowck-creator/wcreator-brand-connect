'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Seller } from './supabase';

interface AuthContextType {
  user: User | null;
  userType: 'seller' | 'creator' | null;
  sellerInfo: Seller | null;
  sellerBrands: Seller[];
  selectedBrand: Seller | null;
  setSelectedBrand: (brand: Seller) => void;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userType: null,
  sellerInfo: null,
  sellerBrands: [],
  selectedBrand: null,
  setSelectedBrand: () => {},
  loading: true,
  signOut: async () => {},
});

// Note: 이제 sellers 테이블을 통해 관리되므로 하드코딩된 이메일 목록은 불필요

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'seller' | 'creator' | null>(null);
  const [sellerInfo, setSellerInfo] = useState<Seller | null>(null);
  const [sellerBrands, setSellerBrands] = useState<Seller[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        determineUserType(session.user);
      }
      setLoading(false);
    });

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        determineUserType(session.user);
      } else {
        setUserType(null);
        setSellerInfo(null);
        setSellerBrands([]);
        setSelectedBrand(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const determineUserType = async (user: User) => {
    if (user.app_metadata?.provider === 'google' && user.email) {
      // 셀러 테이블에서 해당 이메일의 모든 브랜드 조회
      const { data: sellers, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('google_email', user.email)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (!error && sellers && sellers.length > 0) {
        setUserType('seller');
        setSellerBrands(sellers);
        setSellerInfo(sellers[0]); // 첫 번째 브랜드를 기본으로 설정
        setSelectedBrand(sellers[0]);
        return;
      }
      // 구글 로그인이지만 셀러 테이블에 없으면 접근 차단
      setUserType(null);
      setSellerInfo(null);
      setSellerBrands([]);
      setSelectedBrand(null);
    } else if (user.app_metadata?.provider === 'kakao') {
      setUserType('creator');
      setSellerInfo(null);
      setSellerBrands([]);
      setSelectedBrand(null);
    } else {
      setUserType(null);
      setSellerInfo(null);
      setSellerBrands([]);
      setSelectedBrand(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserType(null);
    setSellerInfo(null);
    setSellerBrands([]);
    setSelectedBrand(null);
  };

  const handleSetSelectedBrand = (brand: Seller) => {
    setSelectedBrand(brand);
    setSellerInfo(brand); // 선택된 브랜드를 현재 셀러 정보로도 설정
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userType, 
      sellerInfo, 
      sellerBrands, 
      selectedBrand, 
      setSelectedBrand: handleSetSelectedBrand,
      loading, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
