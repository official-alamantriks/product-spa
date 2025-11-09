'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProductsStore } from '@/store/productsStore';
import { fetchProductById } from '@/services/api';
import { ProductItem } from '@/types/product';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { getAllProducts } = useProductsStore();
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const allProducts = getAllProducts();
        const localProduct = allProducts.find((p: ProductItem) => String(p.id) === id);

        if (localProduct) {
          setProduct(localProduct);
          setIsLoading(false);
        } else {
          const apiProduct = await fetchProductById(id);
          setProduct(apiProduct);
          setIsLoading(false);
        }
      } catch (err) {
        setError('Продукт не найден');
        setIsLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id, getAllProducts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Загрузка...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Продукт не найден'}</p>
          <Link
            href="/products"
            className="text-blue-500 hover:underline"
          >
            Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  const placeholderImage = 'https://via.placeholder.com/600x600?text=No+Image';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Link
          href="/products"
          className="inline-flex items-center text-blue-500 hover:text-blue-700 mb-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Назад к списку продуктов
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
          <div className="md:flex">
            <div className="md:w-1/2 bg-gray-200">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderImage;
                }}
              />
            </div>

            <div className="md:w-1/2 p-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {product.title}
              </h1>

              {product.category && (
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mb-4">
                  {product.category}
                </span>
              )}

              <div className="mb-6">
                <p className="text-3xl font-bold text-blue-600 mb-4">
                  ${typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Описание
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.rating && (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">★</span>
                  <span className="text-gray-700 font-semibold">
                    {product.rating.rate}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ({product.rating.count} отзывов)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

