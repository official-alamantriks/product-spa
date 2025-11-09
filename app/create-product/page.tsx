'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useProductsStore } from '@/store/productsStore';
import { UserProduct } from '@/types/product';

interface ProductFormData {
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const { addProduct } = useProductsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>();

  const generateProductId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const extraRandom = Math.random().toString(36).substr(2, 5);
    return `user-${timestamp}-${random}-${extraRandom}`;
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);

    const newProduct: UserProduct = {
      id: generateProductId(),
      title: data.title,
      description: data.description,
      price: Number(data.price),
      image: data.image || 'https://via.placeholder.com/300x200?text=No+Image',
      category: data.category,
    };

    addProduct(newProduct);
    router.push('/products');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Создать продукт
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Название продукта *
              </label>
              <input
                type="text"
                id="title"
                {...register('title', {
                  required: 'Название обязательно',
                  minLength: {
                    value: 3,
                    message: 'Минимум 3 символа',
                  },
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Введите название"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Описание *
              </label>
              <textarea
                id="description"
                {...register('description', {
                  required: 'Описание обязательно',
                  minLength: {
                    value: 10,
                    message: 'Минимум 10 символов',
                  },
                })}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.description
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Введите описание"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Цена *
              </label>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0"
                {...register('price', {
                  required: 'Цена обязательна',
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: 'Цена должна быть положительной',
                  },
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.price
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                URL изображения
              </label>
              <input
                type="url"
                id="image"
                {...register('image')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Категория
              </label>
              <input
                type="text"
                id="category"
                {...register('category')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите категорию"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Создание...' : 'Создать продукт'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

