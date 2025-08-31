'use client';

import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'seller' | 'creator' | null>(null);
  const { user, userType, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && userType) {
      // 로그인 성공 시 해당 사용자 타입의 페이지로 리다이렉트
      if (userType === 'seller') {
        router.push('/seller/register');
      } else if (userType === 'creator') {
        router.push('/creator/apply');
      }
    }
  }, [user, userType, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">로그인</h1>
          <p className="text-gray-600">계정 유형을 선택하고 로그인하세요</p>
        </div>

        {!loginType ? (
          /* 사용자 타입 선택 */
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">셀러 로그인</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  등록된 구글 계정으로만 로그인 가능합니다
                </p>
                <button
                  onClick={() => setLoginType('seller')}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  구글로 셀러 로그인
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">크리에이터 로그인</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  카카오 계정으로 자유롭게 가입하고 로그인하세요
                </p>
                <button
                  onClick={() => setLoginType('creator')}
                  className="w-full bg-yellow-400 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-yellow-500 transition-colors"
                >
                  카카오로 크리에이터 로그인
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 로그인 폼 */
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {loginType === 'seller' ? '셀러 로그인' : '크리에이터 로그인'}
              </h2>
              <button
                onClick={() => setLoginType(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← 뒤로
              </button>
            </div>

            {loginType === 'seller' ? (
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#2563eb',
                        brandAccent: '#1d4ed8',
                      },
                    },
                  },
                }}
                providers={['google']}
                redirectTo={`${window.location.origin}/auth/callback`}
                onlyThirdPartyProviders
                localization={{
                  variables: {
                    sign_in: {
                      social_provider_text: '구글로 셀러 로그인',
                    },
                  },
                }}
              />
            ) : (
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#eab308',
                        brandAccent: '#ca8a04',
                      },
                    },
                  },
                }}
                providers={['kakao']}
                redirectTo={`${window.location.origin}/auth/callback`}
                onlyThirdPartyProviders
                localization={{
                  variables: {
                    sign_in: {
                      social_provider_text: '카카오로 크리에이터 로그인',
                    },
                  },
                }}
              />
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                {loginType === 'seller' ? (
                  <>
                    <span className="font-medium">셀러 로그인 안내:</span><br />
                    등록된 구글 계정만 로그인할 수 있습니다. 
                    계정 등록이 필요한 경우 관리자에게 문의하세요.
                  </>
                ) : (
                  <>
                    <span className="font-medium">크리에이터 로그인 안내:</span><br />
                    카카오 계정으로 자유롭게 가입하고 협찬 신청을 시작하세요.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
