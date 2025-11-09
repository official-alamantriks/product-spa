import axios from 'axios';
import { Product } from '@/types/product';

const API_URL = 'https://fakestoreapi.com/products';

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const response = await axios.get<Product[]>(API_URL);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке продуктов:', error);
    throw error;
  }
};

export const fetchProductById = async (id: string): Promise<Product> => {
  try {
    const response = await axios.get<Product>(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке продукта:', error);
    throw error;
  }
};

