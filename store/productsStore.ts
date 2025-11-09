import { create } from 'zustand';
import { ProductItem } from '@/types/product';
import { fetchProducts } from '@/services/api';

interface ProductsState {
  apiProducts: ProductItem[];
  userProducts: ProductItem[];
  likedProducts: Set<number | string>;
  isLoading: boolean;
  error: string | null;
  apiProductsLoaded: boolean;
  
  loadProducts: () => Promise<void>;
  addProduct: (product: ProductItem) => void;
  deleteProduct: (id: number | string) => void;
  toggleLike: (id: number | string) => void;
  getAllProducts: () => ProductItem[];
  getLikedProducts: () => ProductItem[];
  isLiked: (id: number | string) => boolean;
  initializeFromStorage: () => void;
}

const saveToStorage = (userProducts: ProductItem[], likedProducts: Set<number | string>, apiProductsLoaded?: boolean, getState?: () => ProductsState) => {
  if (typeof window === 'undefined') return;
  
  try {
    let currentApiProductsLoaded = apiProductsLoaded;
    if (currentApiProductsLoaded === undefined && getState) {
      currentApiProductsLoaded = getState().apiProductsLoaded;
    }
    
    localStorage.setItem('products-store', JSON.stringify({
      state: {
        userProducts,
        likedProducts: Array.from(likedProducts),
        apiProductsLoaded: currentApiProductsLoaded !== undefined ? currentApiProductsLoaded : false,
      },
    }));
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error);
  }
};

const loadFromStorage = (): { userProducts: ProductItem[]; likedProducts: Set<number | string>; apiProductsLoaded: boolean } | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('products-store');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state) {
        return {
          userProducts: parsed.state.userProducts || [],
          likedProducts: new Set(parsed.state.likedProducts || []),
          apiProductsLoaded: parsed.state.apiProductsLoaded || false,
        };
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки из localStorage:', error);
  }
  return null;
};

export const useProductsStore = create<ProductsState>((set, get) => {
  // Загружаем начальное состояние из localStorage
  const stored = loadFromStorage();
  
  return {
    apiProducts: [],
    userProducts: stored?.userProducts || [],
    likedProducts: stored?.likedProducts || new Set<number | string>(),
    isLoading: false,
    error: null,
    apiProductsLoaded: stored?.apiProductsLoaded || false,

  initializeFromStorage: () => {
    const stored = loadFromStorage();
    if (stored) {
      set({
        userProducts: stored.userProducts,
        likedProducts: stored.likedProducts,
        apiProductsLoaded: stored.apiProductsLoaded,
      });
    }
  },

  loadProducts: async () => {
    const state = get();
    if (state.apiProductsLoaded || state.isLoading) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const products = await fetchProducts();
      set((currentState) => {
        saveToStorage(currentState.userProducts, currentState.likedProducts, true, get);
        return {
          apiProducts: products, 
          isLoading: false, 
          error: null,
          apiProductsLoaded: true 
        };
      });
    } catch (error) {
      set((currentState) => {
        saveToStorage(currentState.userProducts, currentState.likedProducts, true, get);
        return {
          error: 'Не удалось загрузить продукты с API. Созданные вами продукты будут отображаться.', 
          isLoading: false,
          apiProductsLoaded: true
        };
      });
    }
  },

  addProduct: (product: ProductItem) => {
    set((state: ProductsState) => {
      const productExists = state.userProducts.some((p: ProductItem) => p.id === product.id);
      if (productExists) {
        console.warn('Продукт с таким ID уже существует:', product.id);
        return state;
      }
      
      const updatedUserProducts = [...state.userProducts, product];
      saveToStorage(updatedUserProducts, state.likedProducts, state.apiProductsLoaded, get);
      return { userProducts: updatedUserProducts };
    });
  },

  deleteProduct: (productId: number | string) => {
    set((state: ProductsState) => {
      const updatedLikedProducts = new Set(state.likedProducts);
      updatedLikedProducts.delete(productId);
      const updatedUserProducts = state.userProducts.filter((product: ProductItem) => product.id !== productId);
      
      saveToStorage(updatedUserProducts, updatedLikedProducts, state.apiProductsLoaded, get);
      
      return {
        apiProducts: state.apiProducts.filter((product: ProductItem) => product.id !== productId),
        userProducts: updatedUserProducts,
        likedProducts: updatedLikedProducts,
      };
    });
  },

  toggleLike: (productId: number | string) => {
    set((state: ProductsState) => {
      const updatedLikedProducts = new Set(state.likedProducts);
      if (updatedLikedProducts.has(productId)) {
        updatedLikedProducts.delete(productId);
      } else {
        updatedLikedProducts.add(productId);
      }
      saveToStorage(state.userProducts, updatedLikedProducts, state.apiProductsLoaded, get);
      return { likedProducts: updatedLikedProducts };
    });
  },

  getAllProducts: () => {
    const state = get();
    return [...state.apiProducts, ...state.userProducts];
  },

  getLikedProducts: () => {
    const state = get();
    const allProducts = state.getAllProducts();
    return allProducts.filter((product: ProductItem) => state.likedProducts.has(product.id));
  },

  isLiked: (productId: number | string) => {
    return get().likedProducts.has(productId);
  },
  };
});

