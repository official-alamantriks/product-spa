'use client';

import { useRouter } from 'next/navigation';
import { ProductItem } from '@/types/product';
import { useProductsStore } from '@/store/productsStore';

interface ProductCardProps {
  product: ProductItem;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { toggleLike, deleteProduct, isLiked } = useProductsStore();
  const liked = isLiked(product.id);
  
  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const clickedElement = event.target as HTMLElement;
    const isButtonClicked = clickedElement.closest('.like-button') || clickedElement.closest('.delete-button');
    if (isButtonClicked) return;
    router.push(`/products/${product.id}`);
  };

  const handleLike = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    toggleLike(product.id);
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (confirm('Вы уверены, что хотите удалить этот продукт?')) {
      deleteProduct(product.id);
    }
  };

  const placeholderImage = 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
    >
      <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />
        
        <button
          onClick={handleLike}
          className={`like-button absolute top-2 right-2 p-2 rounded-full transition-colors ${
            liked
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
          aria-label={liked ? 'Убрать лайк' : 'Поставить лайк'}
        >
          <svg
            className="w-5 h-5"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        <button
          onClick={handleDelete}
          className="delete-button absolute top-2 left-2 p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Удалить продукт"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          {product.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 flex-grow">
          {truncateDescription(product.description)}
        </p>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-xl font-bold text-blue-600">
            ${typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}
          </span>
          {product.category && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {product.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

