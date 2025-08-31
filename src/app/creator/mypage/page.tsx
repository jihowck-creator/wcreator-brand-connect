'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';

interface ApplicationWithDetails {
  id: string;
  creator_name: string;
  phone_number: string;
  address: string;
  wconcept_id?: string;
  sns_links?: string[];
  status: 'pending' | 'approved' | 'rejected';
  wconcept_styleclip_url?: string;
  sns_upload_url?: string;
  created_at: string;
  brand_name: string;
  product_name: string;
  requested_items: {
    color: string;
    size: string;
    product_url?: string;
    image_url?: string;
  }[];
}

const urlUpdateSchema = z.object({
  wconcept_styleclip_url: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  sns_upload_url: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
});

type UrlUpdateFormData = z.infer<typeof urlUpdateSchema>;

function CreatorMyPageContent() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingApplication, setEditingApplication] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UrlUpdateFormData>({
    resolver: zodResolver(urlUpdateSchema),
  });

  const loadApplications = useCallback(async () => {
    if (!user || !user.email) {
      setApplications([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sponsorship_applications')
        .select(`
          *,
          sponsorship_product_options!inner(
            product_option:product_options!inner(
              color,
              size,
              product_url,
              image_url,
              product:products!inner(
                name,
                brand:brands!inner(name)
              )
            )
          )
        `)
        .eq('creator_name', user.user_metadata?.name || user.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // 데이터 가공
      const processedApplications = data?.map((app: {
        id: string;
        creator_name: string;
        phone_number: string;
        address: string;
        wconcept_id?: string;
        sns_links?: string[];
        status: string;
        wconcept_styleclip_url?: string;
        sns_upload_url?: string;
        created_at: string;
        sponsorship_product_options: {
          product_option: {
            color: string;
            size: string;
            product_url?: string;
            image_url?: string;
            product: {
              name: string;
              brand: {
                name: string;
              };
            };
          };
        }[];
      }) => {
        const firstOption = app.sponsorship_product_options[0];
        const brandName = firstOption.product_option.product.brand.name;
        const productName = firstOption.product_option.product.name;
        
        const requestedItems = app.sponsorship_product_options.map((spo) => ({
          color: spo.product_option.color,
          size: spo.product_option.size,
          product_url: spo.product_option.product_url,
          image_url: spo.product_option.image_url,
        }));

        return {
          id: app.id,
          creator_name: app.creator_name,
          phone_number: app.phone_number,
          address: app.address,
          wconcept_id: app.wconcept_id,
          sns_links: app.sns_links,
          status: app.status as 'pending' | 'approved' | 'rejected',
          wconcept_styleclip_url: app.wconcept_styleclip_url,
          sns_upload_url: app.sns_upload_url,
          created_at: app.created_at,
          brand_name: brandName,
          product_name: productName,
          requested_items: requestedItems,
        };
      }) || [];

      setApplications(processedApplications);
      
    } catch (error) {
      console.error('신청 내역 로드 오류:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleEditUrls = (application: ApplicationWithDetails) => {
    setEditingApplication(application.id);
    setValue('wconcept_styleclip_url', application.wconcept_styleclip_url || '');
    setValue('sns_upload_url', application.sns_upload_url || '');
  };

  const handleCancelEdit = () => {
    setEditingApplication(null);
    reset();
  };

  const onSubmitUrls = async (data: UrlUpdateFormData) => {
    if (!editingApplication) return;

    try {
      console.log('업데이트 시도:', {
        id: editingApplication,
        data: data
      });

      const { data: result, error } = await supabase
        .from('sponsorship_applications')
        .update({
          wconcept_styleclip_url: data.wconcept_styleclip_url || null,
          sns_upload_url: data.sns_upload_url || null,
        })
        .eq('id', editingApplication)
        .select();

      console.log('Supabase 응답:', { result, error });

      if (error) {
        console.error('Supabase 에러 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      // 로컬 상태 업데이트
      setApplications(prev => 
        prev.map(app => 
          app.id === editingApplication 
            ? { 
                ...app, 
                wconcept_styleclip_url: data.wconcept_styleclip_url || undefined,
                sns_upload_url: data.sns_upload_url || undefined
              }
            : app
        )
      );

      setEditingApplication(null);
      reset();
      alert('URL이 성공적으로 업데이트되었습니다!');
    } catch (error) {
      console.error('URL 업데이트 오류:', error);
      alert(`URL 업데이트 중 오류가 발생했습니다: ${JSON.stringify(error)}`);
    }
  };

  const filteredApplications = applications.filter(app => {
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    return statusMatch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    
    const labels = {
      pending: '대기중',
      approved: '승인됨',
      rejected: '거절됨',
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-purple-600 hover:text-purple-800 font-medium">
            ← 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">크리에이터 마이페이지</h1>
          <p className="text-gray-600">협찬 신청 현황을 확인하고 콘텐츠 URL을 업로드하세요</p>
        </div>

        {/* 사용자 정보 표시 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.user_metadata?.name || user?.email}님의 신청 내역
              </h2>
              <p className="text-sm text-gray-600">📧 {user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태 필터</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">모든 상태</option>
                <option value="pending">대기중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거절됨</option>
              </select>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
            <div className="text-sm text-gray-600">총 신청</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {applications.filter(app => app.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">대기중</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-green-600">
              {applications.filter(app => app.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">승인됨</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-red-600">
              {applications.filter(app => app.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">거절됨</div>
          </div>
        </div>

        {/* 신청 목록 */}
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500">신청 내역을 불러오는 중...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500">
                {applications.length === 0 
                  ? "신청 내역이 없습니다." 
                  : "해당 조건의 신청이 없습니다."
                }
              </p>
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.brand_name} - {application.product_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      신청일: {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(application.status)}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 신청 상품 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">신청한 상품 옵션</h4>
                    <div className="space-y-3">
                      {application.requested_items.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{item.color} / {item.size}</p>
                              {item.product_url && (
                                <a 
                                  href={item.product_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:text-purple-800 text-sm"
                                >
                                  상품 페이지 →
                                </a>
                              )}
                            </div>
                            {item.image_url && (
                              <img 
                                src={item.image_url} 
                                alt={`${item.color} ${item.size}`}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 콘텐츠 URL 관리 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">콘텐츠 URL</h4>
                      {application.status === 'approved' && editingApplication !== application.id && (
                        <button
                          onClick={() => handleEditUrls(application)}
                          className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                          편집
                        </button>
                      )}
                    </div>

                    {application.status === 'pending' && (
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⏳ 협찬 승인을 기다리고 있습니다. 승인 후 콘텐츠 URL을 업로드할 수 있습니다.
                        </p>
                      </div>
                    )}

                    {application.status === 'rejected' && (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-800">
                          ❌ 협찬이 거절되었습니다.
                        </p>
                      </div>
                    )}

                    {application.status === 'approved' && (
                      <div>
                        {editingApplication === application.id ? (
                          /* URL 편집 폼 */
                          <form onSubmit={handleSubmit(onSubmitUrls)} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                W컨셉 스타일클립 URL
                              </label>
                              <input
                                {...register('wconcept_styleclip_url')}
                                type="url"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://www.wconcept.com/..."
                              />
                              {errors.wconcept_styleclip_url && (
                                <p className="mt-1 text-sm text-red-600">{errors.wconcept_styleclip_url.message}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                SNS 업로드 URL
                              </label>
                              <input
                                {...register('sns_upload_url')}
                                type="url"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="https://instagram.com/p/..."
                              />
                              {errors.sns_upload_url && (
                                <p className="mt-1 text-sm text-red-600">{errors.sns_upload_url.message}</p>
                              )}
                            </div>

                            <div className="flex space-x-3">
                              <button
                                type="submit"
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* URL 표시 */
                          <div className="space-y-3">
                            {application.wconcept_styleclip_url || application.sns_upload_url ? (
                              <div className="p-4 bg-green-50 rounded-lg">
                                <h5 className="font-medium text-green-800 mb-2">✅ 업로드된 콘텐츠</h5>
                                {application.wconcept_styleclip_url && (
                                  <p className="text-sm mb-1">
                                    <span className="font-medium text-green-700">W컨셉 스타일클립:</span>{' '}
                                    <a 
                                      href={application.wconcept_styleclip_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-purple-600 hover:text-purple-800 break-all"
                                    >
                                      {application.wconcept_styleclip_url}
                                    </a>
                                  </p>
                                )}
                                {application.sns_upload_url && (
                                  <p className="text-sm">
                                    <span className="font-medium text-green-700">SNS 업로드:</span>{' '}
                                    <a 
                                      href={application.sns_upload_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-purple-600 hover:text-purple-800 break-all"
                                    >
                                      {application.sns_upload_url}
                                    </a>
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  🎉 협찬이 승인되었습니다! 콘텐츠 제작 후 URL을 업로드해주세요.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreatorMyPage() {
  return (
    <ProtectedRoute requiredUserType="creator">
      <CreatorMyPageContent />
    </ProtectedRoute>
  );
}