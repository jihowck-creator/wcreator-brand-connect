'use client';

import { useState, useEffect, useCallback } from 'react';
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

function SellerMyPageContent() {
  const { sellerBrands, selectedBrand, setSelectedBrand } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadApplications = useCallback(async () => {
    if (!selectedBrand) {
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
        .order('created_at', { ascending: false });

      if (error) throw error;

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

      // 선택된 브랜드의 상품에 대한 신청만 필터링
      const filteredApplications = processedApplications.filter(app => 
        app.brand_name === selectedBrand?.brand_name
      );
      
      setApplications(filteredApplications);
      
    } catch (error) {
      console.error('신청 내역 로드 오류:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBrand]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);



  const updateApplicationStatus = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('sponsorship_applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      );
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      alert('상태 업데이트 중 오류가 발생했습니다.');
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

  const getStatusText = (status: string) => {
    const labels = {
      pending: '대기중',
      approved: '승인됨',
      rejected: '거절됨',
    };
    return labels[status as keyof typeof labels] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">신청 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">셀러 마이페이지</h1>
          <p className="text-gray-600">브랜드 상품에 대한 협찬 신청을 관리하세요</p>
        </div>

        {/* 브랜드 선택 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관리할 브랜드 선택
              </label>
              {sellerBrands.length > 1 ? (
                <select
                  value={selectedBrand?.id || ''}
                  onChange={(e) => {
                    const brand = sellerBrands.find(b => b.id === e.target.value);
                    if (brand) setSelectedBrand(brand);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">브랜드를 선택하세요</option>
                  {sellerBrands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.brand_name} ({brand.brand_code})
                    </option>
                  ))}
                </select>
              ) : sellerBrands.length === 1 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-900 font-medium">{sellerBrands[0].brand_name}</p>
                  <p className="text-blue-700 text-sm">브랜드 코드: {sellerBrands[0].brand_code}</p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">등록된 브랜드가 없습니다.</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태 필터</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          {!selectedBrand ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500">브랜드를 선택해주세요.</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500">
                {selectedBrand.brand_name}에 대한 {statusFilter === 'all' ? '' : getStatusText(statusFilter)} 신청이 없습니다.
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
                  {/* 크리에이터 정보 */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">크리에이터 정보</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">이름:</span> {application.creator_name}</p>
                      <p><span className="font-medium">연락처:</span> {application.phone_number}</p>
                      <p><span className="font-medium">주소:</span> {application.address}</p>
                      {application.wconcept_id && (
                        <p><span className="font-medium">W컨셉 ID:</span> {application.wconcept_id}</p>
                      )}
                      {application.sns_links && application.sns_links.length > 0 && (
                        <div>
                          <span className="font-medium">SNS:</span>
                          <ul className="mt-1 space-y-1">
                            {application.sns_links.map((link, index) => (
                              <li key={index}>
                                <a 
                                  href={link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 break-all"
                                >
                                  {link}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* 콘텐츠 URL (승인된 경우) */}
                    {application.status === 'approved' && (application.wconcept_styleclip_url || application.sns_upload_url) && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-2">업로드된 콘텐츠</h5>
                        {application.wconcept_styleclip_url && (
                          <p className="text-sm">
                            <span className="font-medium text-green-700">W컨셉 스타일클립:</span>{' '}
                            <a 
                              href={application.wconcept_styleclip_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 break-all"
                            >
                              {application.wconcept_styleclip_url}
                            </a>
                          </p>
                        )}
                        {application.sns_upload_url && (
                          <p className="text-sm mt-1">
                            <span className="font-medium text-green-700">SNS 업로드:</span>{' '}
                            <a 
                              href={application.sns_upload_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 break-all"
                            >
                              {application.sns_upload_url}
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

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
                                  className="text-blue-600 hover:text-blue-800 text-sm"
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
                </div>

                {/* 액션 버튼 */}
                {application.status === 'pending' && (
                  <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'approved')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      승인하기
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'rejected')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      거절하기
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function SellerMyPage() {
  return (
    <ProtectedRoute requiredUserType="seller">
      <SellerMyPageContent />
    </ProtectedRoute>
  );
}
