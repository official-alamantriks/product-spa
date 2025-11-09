'use client';

import { useEffect, useState, useMemo } from 'react';
import { useProductsStore } from '@/store/productsStore';
import ProductCard from '@/components/ProductCard';
import { ProductItem } from '@/types/product';

type FilterType = 'all' | 'liked';

export default function ProductsPage() {
  const {
    getAllProducts,
    getLikedProducts,
    loadProducts,
    isLoading,
    error,
    apiProductsLoaded,
    userProducts,
  } = useProductsStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Инициализируем из localStorage (если нужно)
    const currentState = useProductsStore.getState();
    
    // Загружаем продукты из API только если еще не загружены
    if (!currentState.apiProductsLoaded && !currentState.isLoading) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    const allProducts = filter === 'liked' ? getLikedProducts() : getAllProducts();
    
    if (!searchQuery.trim()) {
      return allProducts;
    }

    const searchQueryLower = searchQuery.toLowerCase();
    return allProducts.filter(
      (product: ProductItem) =>
        product.title.toLowerCase().includes(searchQueryLower) ||
        product.description.toLowerCase().includes(searchQueryLower)
    );
  }, [filter, searchQuery, getLikedProducts, getAllProducts]);

  const emptyMessage = filter === 'liked' 
    ? 'Нет избранных продуктов' 
    : 'Продукты не найдены';

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Список продуктов
          </h1>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Поиск продуктов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Все продукты
            </button>
            <button
              onClick={() => setFilter('liked')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'liked'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Избранное
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Загрузка продуктов...</p>
          </div>
        )}

        {error && !isLoading && apiProductsLoaded && userProducts.length === 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {error && !isLoading && apiProductsLoaded && userProducts.length > 0 && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            Не удалось загрузить продукты с API, но ваши созданные продукты отображаются
          </div>
        )}

        {!isLoading && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">{emptyMessage}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <a
            href="/create-product"
            className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            + Создать продукт
          </a>
        </div>
      </div>
    </div>
  );
}

