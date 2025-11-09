export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  category?: string;
  rating?: {
    rate: number;
    count: number;
  };
}

export interface UserProduct extends Omit<Product, 'id'> {
  id: string;
}

export type ProductItem = Product | UserProduct;

