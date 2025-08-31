'use client';

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const { user, userType, loading, signOut } = useAuth();

  // 구글 로그인 (셀러용)
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // 카카오 로그인 (크리에이터용)
  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            셀러-크리에이터 플랫폼
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            브랜드 상품 등록과 크리에이터 협찬 신청을 위한 플랫폼입니다
          </p>
          
          {/* 로그인 상태 표시 */}
          {user && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8 inline-block">
              <div className="flex items-center space-x-4">
                <div className="text-left">
                  <p className="text-sm text-gray-600">로그인됨</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-blue-600">
                    {userType === 'seller' ? '셀러' : userType === 'creator' ? '크리에이터' : '권한 없음'}
                  </p>
                  {userType === null && user.app_metadata?.provider === 'google' && (
                    <p className="text-xs text-red-600 mt-1">
                      등록되지 않은 셀러 계정입니다. 관리자에게 문의하세요.
                    </p>
                  )}
                </div>
                <button
                  onClick={signOut}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 셀러 섹션 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">셀러</h2>
              <p className="text-gray-600 mb-6">
                브랜드 상품을 등록하고 크리에이터와의 협찬을 관리하세요
              </p>
              <div className="space-y-3">
                {userType === 'seller' ? (
                  <>
                    <Link
                      href="/seller/register"
                      className="block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                    >
                      상품 등록하기
                    </Link>
                    <Link
                      href="/seller/mypage"
                      className="block bg-blue-100 text-blue-600 px-8 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors text-center"
                    >
                      마이페이지
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    className="block w-full bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                  >
                    구글로 셀러 로그인
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 크리에이터 섹션 */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">크리에이터</h2>
              <p className="text-gray-600 mb-6">
                다양한 브랜드 상품의 협찬을 신청하고 콘텐츠를 제작하세요
              </p>
              <div className="space-y-3">
                {userType === 'creator' ? (
                  <>
                    <Link
                      href="/creator/apply"
                      className="block bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center"
                    >
                      협찬 신청하기
                    </Link>
                    <Link
                      href="/creator/mypage"
                      className="block bg-purple-100 text-purple-600 px-8 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors text-center"
                    >
                      마이페이지
                    </Link>
                  </>
                ) : userType === null && user?.app_metadata?.provider === 'google' ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-red-800">
                      등록되지 않은 셀러 계정입니다.<br/>
                      크리에이터는 카카오 로그인을 사용해주세요.
                    </p>
                    <button
                      onClick={signOut}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      로그아웃하고 카카오로 로그인
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleKakaoLogin}
                    className="block w-full bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-colors text-center"
                  >
                    카카오로 크리에이터 로그인
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            간편하고 빠른 협찬 매칭 플랫폼으로 함께하세요
          </p>
        </div>
      </div>
    </div>
  );
}
