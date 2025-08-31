'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { supabase, ProductOption, Product, Brand } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';

// Zod 스키마 정의
const sponsorshipSchema = z.object({
  creator_name: z.string().min(1, '크리에이터 이름을 입력해주세요'),
  phone_number: z.string().min(10, '올바른 핸드폰 번호를 입력해주세요'),
  address: z.string().min(5, '주소를 입력해주세요'),
  wconcept_id: z.string().min(1, 'W컨셉 아이디를 입력해주세요'),
  sns_links: z.array(z.string().url('올바른 URL을 입력해주세요')).min(1, '최소 1개의 SNS 링크를 입력해주세요'),
  selected_options: z.array(z.string()).min(1, '최소 1개의 상품을 선택해주세요'),
});

type SponsorshipFormData = z.infer<typeof sponsorshipSchema>;

interface ProductWithOptions extends Product {
  brand: Brand;
  product_options: ProductOption[];
}

function CreatorApplyPageContent() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [products, setProducts] = useState<ProductWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [snsLinks, setSnsLinks] = useState<string[]>(['']);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<SponsorshipFormData>({
    resolver: zodResolver(sponsorshipSchema),
    defaultValues: {
      sns_links: [''],
      selected_options: [],
    },
  });

  // 상품 데이터 로드
  useEffect(() => {
    loadProducts();
  }, []);

  // 사용자 정보 자동 입력
  useEffect(() => {
    if (user && user.user_metadata) {
      // 카카오 로그인 시 이름 자동 입력
      if (user.user_metadata.name) {
        setValue('creator_name', user.user_metadata.name);
      }
    }
  }, [user, setValue]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(*),
          product_options(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('상품 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 옵션 선택/해제
  const toggleOption = (optionId: string) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelectedOptions(newSelected);
    
    const selectedArray = Array.from(newSelected);
    setValue('selected_options', selectedArray);
    
    // 선택된 옵션이 있으면 에러 클리어
    if (selectedArray.length > 0) {
      clearErrors('selected_options');
    }
  };

  // SNS 링크 추가
  const addSnsLink = () => {
    const newLinks = [...snsLinks, ''];
    setSnsLinks(newLinks);
    setValue('sns_links', newLinks.filter(link => link.trim() !== ''));
  };

  // SNS 링크 제거
  const removeSnsLink = (index: number) => {
    const newLinks = snsLinks.filter((_, i) => i !== index);
    setSnsLinks(newLinks);
    setValue('sns_links', newLinks.filter(link => link.trim() !== ''));
  };

  // SNS 링크 업데이트
  const updateSnsLink = (index: number, value: string) => {
    const newLinks = [...snsLinks];
    newLinks[index] = value;
    setSnsLinks(newLinks);
    const validLinks = newLinks.filter(link => link.trim() !== '');
    setValue('sns_links', validLinks);
    
    // 유효한 링크가 있으면 검증 트리거
    if (validLinks.length > 0) {
      setValue('sns_links', validLinks, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: SponsorshipFormData) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // 1. 협찬 신청 등록
      const { data: application, error: applicationError } = await supabase
        .from('sponsorship_applications')
        .insert({
          creator_name: data.creator_name,
          phone_number: data.phone_number,
          address: data.address,
          wconcept_id: data.wconcept_id,
          sns_links: data.sns_links,
        })
        .select('id')
        .single();

      if (applicationError) throw applicationError;

      // 2. 선택된 상품 옵션들 연결
      const optionMappings = data.selected_options.map(optionId => ({
        sponsorship_application_id: application.id,
        product_option_id: optionId,
      }));

      const { error: mappingError } = await supabase
        .from('sponsorship_product_options')
        .insert(optionMappings);

      if (mappingError) throw mappingError;

      setSubmitMessage('협찬 신청이 성공적으로 제출되었습니다!');
      
      // 폼 초기화
      setValue('creator_name', '');
      setValue('phone_number', '');
      setValue('address', '');
      setValue('wconcept_id', '');
      setSnsLinks(['']);
      setValue('sns_links', []);
      setSelectedOptions(new Set());
      setValue('selected_options', []);

    } catch (error) {
      console.error('협찬 신청 오류:', error);
      setSubmitMessage('협찬 신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">상품 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-purple-600 hover:text-purple-800 font-medium">
            ← 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">협찬 신청</h1>
          <p className="text-gray-600">원하는 상품을 선택하고 협찬을 신청하세요</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 상품 카탈로그 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">상품 카탈로그</h2>
              
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">등록된 상품이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {products.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.brand?.name}</p>
                          {product.description && (
                            <p className="text-sm text-gray-500 mt-2">{product.description}</p>
                          )}
                        </div>
                        {product.base_image_url && (
                          <img
                            src={product.base_image_url}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                      </div>

                      {product.base_url && (
                        <a
                          href={product.base_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-blue-600 hover:text-blue-800 text-sm mb-4"
                        >
                          상품 페이지 보기 →
                        </a>
                      )}

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">이용 가능한 옵션:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {product.product_options?.map((option) => (
                            <div
                              key={option.id}
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                selectedOptions.has(option.id)
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => toggleOption(option.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {option.color} / {option.size}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    재고: {option.stock_quantity}개
                                  </p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedOptions.has(option.id)
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-gray-300'
                                }`}>
                                  {selectedOptions.has(option.id) && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>

                              {option.image_url && (
                                <img
                                  src={option.image_url}
                                  alt={`${option.color} ${option.size}`}
                                  className="w-full h-32 object-cover rounded mt-3"
                                />
                              )}

                              {option.product_url && (
                                <a
                                  href={option.product_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block text-blue-600 hover:text-blue-800 text-xs mt-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  옵션별 페이지 보기 →
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 신청 폼 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">신청자 정보</h2>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    크리에이터 이름 *
                  </label>
                  <input
                    {...register('creator_name')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="이름을 입력하세요"
                  />
                  {errors.creator_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.creator_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    핸드폰 번호 *
                  </label>
                  <input
                    {...register('phone_number')}
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="010-1234-5678"
                  />
                  {errors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    주소 *
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="상품을 받을 주소를 입력하세요"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    W컨셉 아이디 *
                  </label>
                  <input
                    {...register('wconcept_id')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="W컨셉 아이디를 입력하세요"
                  />
                  {errors.wconcept_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.wconcept_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SNS 링크 *
                  </label>
                  <div className="space-y-2">
                    {snsLinks.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => updateSnsLink(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="https://instagram.com/username"
                        />
                        {snsLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSnsLink(index)}
                            className="text-red-600 hover:text-red-800 px-2"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSnsLink}
                      className="text-purple-600 hover:text-purple-800 text-sm"
                    >
                      + SNS 링크 추가
                    </button>
                  </div>
                  {errors.sns_links && (
                    <p className="mt-1 text-sm text-red-600">{errors.sns_links.message}</p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4 mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    선택된 상품: {selectedOptions.size}개
                  </p>
                  {errors.selected_options && (
                    <p className="text-sm text-red-600">
                      {errors.selected_options.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || selectedOptions.size === 0}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '신청 중...' : '협찬 신청하기'}
                </button>

                {submitMessage && (
                  <div className={`p-3 rounded-lg text-sm ${
                    submitMessage.includes('성공') 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {submitMessage}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatorApplyPage() {
  return (
    <ProtectedRoute requiredUserType="creator">
      <CreatorApplyPageContent />
    </ProtectedRoute>
  );
}
