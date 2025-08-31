'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType: 'seller' | 'creator';
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredUserType, 
  fallbackPath = '/login' 
}: ProtectedRouteProps) {
  const { user, userType, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // 로그인되지 않은 경우
        router.push(fallbackPath);
      } else if (userType !== requiredUserType) {
        // 잘못된 사용자 타입인 경우
        if (userType === null) {
          // 권한이 없는 사용자
          router.push('/login?error=unauthorized');
        } else {
          // 다른 타입의 사용자 (셀러 vs 크리에이터)
          router.push('/');
        }
      }
    }
  }, [user, userType, loading, router, requiredUserType, fallbackPath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user || userType !== requiredUserType) {
    return null; // useEffect에서 리다이렉트 처리
  }

  return <>{children}</>;
}
