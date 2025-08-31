'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';

// Zod 스키마 정의
const productOptionSchema = z.object({
  color: z.string().min(1, '컬러를 입력해주세요'),
  size: z.string().min(1, '사이즈를 입력해주세요'),
  product_url: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  image_url: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  stock_quantity: z.number().min(0, '재고는 0 이상이어야 합니다'),
});

const productSchema = z.object({
  product_name: z.string().min(1, '상품명을 입력해주세요'),
  base_url: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  base_image_url: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  description: z.string().optional(),
  options: z.array(productOptionSchema).min(1, '최소 1개의 옵션이 필요합니다'),
});

type ProductFormData = z.infer<typeof productSchema>;

function SellerRegisterPageContent() {
  const { sellerBrands, selectedBrand, setSelectedBrand } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [existingProducts, setExistingProducts] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      options: [{ color: '', size: '', product_url: '', image_url: '', stock_quantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const watchedProductName = watch('product_name');

  // 상품명 검색
  const searchProducts = async (query: string) => {
    if (query.length < 2) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setExistingProducts(data?.map(product => product.name) || []);
    } catch (error) {
      console.error('상품 검색 오류:', error);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!selectedBrand) {
      setSubmitMessage('브랜드를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // 1. 선택된 브랜드 조회 (brand_code로)
      let brandId: string;
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id')
        .eq('brand_code', selectedBrand.brand_code)
        .single();

      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
        // 브랜드가 없으면 생성 (선택된 브랜드 정보 기반)
        const { data: newBrand, error: brandError } = await supabase
          .from('brands')
          .insert({ 
            name: selectedBrand.brand_name,
            brand_code: selectedBrand.brand_code
          })
          .select('id')
          .single();

        if (brandError) throw brandError;
        brandId = newBrand.id;
      }

      // 2. 상품 등록
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          brand_id: brandId,
          name: data.product_name,
          base_url: data.base_url || null,
          base_image_url: data.base_image_url || null,
          description: data.description || null,
        })
        .select('id')
        .single();

      if (productError) throw productError;

      // 3. 상품 옵션 등록
      const optionsToInsert = data.options.map(option => ({
        product_id: newProduct.id,
        color: option.color,
        size: option.size,
        product_url: option.product_url || null,
        image_url: option.image_url || null,
        stock_quantity: option.stock_quantity,
      }));

      const { error: optionsError } = await supabase
        .from('product_options')
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;

      setSubmitMessage('상품이 성공적으로 등록되었습니다!');
      
      // 폼 초기화
      setValue('product_name', '');
      setValue('base_url', '');
      setValue('base_image_url', '');
      setValue('description', '');
      setValue('options', [{ color: '', size: '', product_url: '', image_url: '', stock_quantity: 0 }]);

    } catch (error) {
      console.error('상품 등록 오류:', error);
      setSubmitMessage('상품 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← 홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">상품 등록</h1>
          <p className="text-gray-600">브랜드 상품을 등록하고 크리에이터와의 협찬을 시작하세요</p>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 브랜드 선택 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">브랜드 선택</h2>
              
              {sellerBrands.length > 0 ? (
                <div className="space-y-4">
                  {sellerBrands.length === 1 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <p className="text-sm text-blue-600 font-medium">등록된 브랜드</p>
                          <p className="text-lg font-semibold text-blue-900">{sellerBrands[0].brand_name}</p>
                          <p className="text-sm text-blue-700">브랜드 코드: {sellerBrands[0].brand_code}</p>
                        </div>
                        <div className="text-blue-500">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        브랜드 선택 *
                      </label>
                      <select
                        value={selectedBrand?.id || ''}
                        onChange={(e) => {
                          const brand = sellerBrands.find(b => b.id === e.target.value);
                          if (brand) setSelectedBrand(brand);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">브랜드를 선택하세요</option>
                        {sellerBrands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.brand_name} ({brand.brand_code})
                          </option>
                        ))}
                      </select>
                      
                      {selectedBrand && (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            선택된 브랜드: <span className="font-medium">{selectedBrand.brand_name}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">셀러 정보를 불러올 수 없습니다. 다시 로그인해주세요.</p>
                </div>
              )}
            </div>

            {/* 상품 정보 */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">상품 정보</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품명 *
                  </label>
                  <input
                    {...register('product_name')}
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="상품명을 입력하거나 검색하세요"
                    onChange={(e) => {
                      setValue('product_name', e.target.value);
                      searchProducts(e.target.value);
                    }}
                  />
                  {existingProducts.length > 0 && watchedProductName && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                      {existingProducts.map((product, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                          onClick={() => {
                            setValue('product_name', product);
                            setExistingProducts([]);
                          }}
                        >
                          {product}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.product_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.product_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 상품 URL
                  </label>
                  <input
                    {...register('base_url')}
                    type="url"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/product"
                  />
                  {errors.base_url && (
                    <p className="mt-1 text-sm text-red-600">{errors.base_url.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 상품 이미지 URL
                  </label>
                  <input
                    {...register('base_image_url')}
                    type="url"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.base_image_url && (
                    <p className="mt-1 text-sm text-red-600">{errors.base_image_url.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 설명
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="상품에 대한 간단한 설명을 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 상품 옵션 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">상품 옵션</h2>
                <button
                  type="button"
                  onClick={() => append({ color: '', size: '', product_url: '', image_url: '', stock_quantity: 0 })}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  옵션 추가
                </button>
              </div>

              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">옵션 {index + 1}</h3>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          컬러 *
                        </label>
                        <input
                          {...register(`options.${index}.color`)}
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="예: 블랙, 화이트, 네이비"
                        />
                        {errors.options?.[index]?.color && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.options[index]?.color?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          사이즈 *
                        </label>
                        <input
                          {...register(`options.${index}.size`)}
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="예: S, M, L, XL"
                        />
                        {errors.options?.[index]?.size && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.options[index]?.size?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          옵션별 상품 URL
                        </label>
                        <input
                          {...register(`options.${index}.product_url`)}
                          type="url"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="해당 옵션의 특정 URL (선택사항)"
                        />
                        {errors.options?.[index]?.product_url && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.options[index]?.product_url?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          옵션별 이미지 URL
                        </label>
                        <input
                          {...register(`options.${index}.image_url`)}
                          type="url"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="해당 옵션의 특정 이미지 URL (선택사항)"
                        />
                        {errors.options?.[index]?.image_url && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.options[index]?.image_url?.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          재고 수량
                        </label>
                        <input
                          {...register(`options.${index}.stock_quantity`, { valueAsNumber: true })}
                          type="number"
                          min="0"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                        {errors.options?.[index]?.stock_quantity && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.options[index]?.stock_quantity?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {errors.options && (
                <p className="mt-2 text-sm text-red-600">{errors.options.message}</p>
              )}
            </div>

            {/* 제출 버튼 */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '등록 중...' : '상품 등록하기'}
              </button>
            </div>

            {/* 메시지 */}
            {submitMessage && (
              <div className={`p-4 rounded-lg ${
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
  );
}

export default function SellerRegisterPage() {
  return (
    <ProtectedRoute requiredUserType="seller">
      <SellerRegisterPageContent />
    </ProtectedRoute>
  );
}
