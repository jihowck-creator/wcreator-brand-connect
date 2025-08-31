-- 브랜드별, 상품별 크리에이터 신청 정보 조회 쿼리들

-- 1. 기본 쿼리: 브랜드별, 상품별 크리에이터 신청 정보
SELECT 
  b.name as brand_name,
  p.name as product_name,
  po.color,
  po.size,
  sa.creator_name,
  sa.phone_number,
  sa.address,
  sa.wconcept_id,
  sa.sns_links,
  sa.status,
  sa.created_at as application_date
FROM sponsorship_applications sa
JOIN sponsorship_product_options spo ON sa.id = spo.sponsorship_application_id
JOIN product_options po ON spo.product_option_id = po.id
JOIN products p ON po.product_id = p.id
JOIN brands b ON p.brand_id = b.id
ORDER BY b.name, p.name, sa.created_at DESC;

-- 2. 브랜드별로 그룹화된 뷰
SELECT 
  b.name as brand_name,
  COUNT(DISTINCT sa.id) as total_applications,
  COUNT(DISTINCT p.id) as products_with_applications,
  COUNT(DISTINCT sa.creator_name) as unique_creators
FROM sponsorship_applications sa
JOIN sponsorship_product_options spo ON sa.id = spo.sponsorship_application_id
JOIN product_options po ON spo.product_option_id = po.id
JOIN products p ON po.product_id = p.id
JOIN brands b ON p.brand_id = b.id
GROUP BY b.id, b.name
ORDER BY total_applications DESC;

-- 3. 특정 브랜드의 상품별 신청 현황
SELECT 
  p.name as product_name,
  po.color,
  po.size,
  COUNT(sa.id) as application_count,
  ARRAY_AGG(sa.creator_name ORDER BY sa.created_at DESC) as creators,
  ARRAY_AGG(sa.status ORDER BY sa.created_at DESC) as statuses
FROM products p
LEFT JOIN product_options po ON p.id = po.product_id
LEFT JOIN sponsorship_product_options spo ON po.id = spo.product_option_id
LEFT JOIN sponsorship_applications sa ON spo.sponsorship_application_id = sa.id
JOIN brands b ON p.brand_id = b.id
WHERE b.name = '특정브랜드명'  -- 여기에 브랜드명 입력
GROUP BY p.id, p.name, po.id, po.color, po.size
ORDER BY p.name, po.color, po.size;

-- 4. 크리에이터별 신청 상품 리스트
SELECT 
  sa.creator_name,
  sa.phone_number,
  sa.wconcept_id,
  sa.sns_links,
  COUNT(spo.id) as total_items_requested,
  ARRAY_AGG(
    b.name || ' - ' || p.name || ' (' || po.color || '/' || po.size || ')'
    ORDER BY b.name, p.name
  ) as requested_products,
  sa.status,
  sa.created_at
FROM sponsorship_applications sa
JOIN sponsorship_product_options spo ON sa.id = spo.sponsorship_application_id
JOIN product_options po ON spo.product_option_id = po.id
JOIN products p ON po.product_id = p.id
JOIN brands b ON p.brand_id = b.id
GROUP BY sa.id, sa.creator_name, sa.phone_number, sa.wconcept_id, sa.sns_links, sa.status, sa.created_at
ORDER BY sa.created_at DESC;

-- 5. 상태별 신청 현황 (승인/대기/거절)
SELECT 
  b.name as brand_name,
  p.name as product_name,
  sa.status,
  COUNT(*) as count,
  ARRAY_AGG(sa.creator_name) as creators
FROM sponsorship_applications sa
JOIN sponsorship_product_options spo ON sa.id = spo.sponsorship_application_id
JOIN product_options po ON spo.product_option_id = po.id
JOIN products p ON po.product_id = p.id
JOIN brands b ON p.brand_id = b.id
GROUP BY b.name, p.name, sa.status
ORDER BY b.name, p.name, sa.status;

-- 6. 가장 인기있는 상품 (신청 수 기준)
SELECT 
  b.name as brand_name,
  p.name as product_name,
  po.color,
  po.size,
  COUNT(sa.id) as application_count,
  COUNT(CASE WHEN sa.status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN sa.status = 'pending' THEN 1 END) as pending_count
FROM product_options po
JOIN products p ON po.product_id = p.id
JOIN brands b ON p.brand_id = b.id
LEFT JOIN sponsorship_product_options spo ON po.id = spo.product_option_id
LEFT JOIN sponsorship_applications sa ON spo.sponsorship_application_id = sa.id
GROUP BY b.id, b.name, p.id, p.name, po.id, po.color, po.size
HAVING COUNT(sa.id) > 0
ORDER BY application_count DESC;

-- 7. 최근 일주일간 신청 현황
SELECT 
  b.name as brand_name,
  p.name as product_name,
  sa.creator_name,
  sa.status,
  sa.created_at
FROM sponsorship_applications sa
JOIN sponsorship_product_options spo ON sa.id = spo.sponsorship_application_id
JOIN product_options po ON spo.product_option_id = po.id
JOIN products p ON po.product_id = p.id
JOIN brands b ON p.brand_id = b.id
WHERE sa.created_at >= NOW() - INTERVAL '7 days'
ORDER BY sa.created_at DESC;

-- 8. 브랜드 관리자용: 자세한 크리에이터 정보 with JSON 형태
SELECT 
  b.name as brand_name,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'product_name', p.name,
      'applications', product_applications
    )
  ) as products
FROM brands b
JOIN products p ON b.id = p.brand_id
JOIN (
  SELECT 
    p.id as product_id,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'creator_name', sa.creator_name,
        'phone_number', sa.phone_number,
        'address', sa.address,
        'wconcept_id', sa.wconcept_id,
        'sns_links', sa.sns_links,
        'status', sa.status,
        'application_date', sa.created_at,
        'requested_items', requested_items
      )
    ) as product_applications
  FROM products p
  JOIN product_options po ON p.id = po.product_id
  JOIN sponsorship_product_options spo ON po.id = spo.product_option_id
  JOIN sponsorship_applications sa ON spo.sponsorship_application_id = sa.id
  JOIN (
    SELECT 
      sa.id as application_id,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'color', po.color,
          'size', po.size,
          'product_url', po.product_url,
          'image_url', po.image_url
        )
      ) as requested_items
    FROM sponsorship_applications sa
    JOIN sponsorship_product_options spo ON sa.id = spo.sponsorship_application_id
    JOIN product_options po ON spo.product_option_id = po.id
    GROUP BY sa.id
  ) items ON sa.id = items.application_id
  GROUP BY p.id
) pa ON p.id = pa.product_id
GROUP BY b.id, b.name
ORDER BY b.name;
