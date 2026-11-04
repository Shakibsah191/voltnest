export interface CartLine {
  variantSku: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string;
  image: string;
  /** Live price from the server. */
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  stock: number;
  maxQuantity: number;
  lineTotal: number;
  /** false when the variant sold out after it was added. */
  available: boolean;
}

export interface Cart {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  hasUnavailable: boolean;
  /** Changes the server made, e.g. "Only 3 left, so we lowered the quantity". */
  notices: string[];
}

export const EMPTY_CART: Cart = { items: [], itemCount: 0, subtotal: 0, hasUnavailable: false, notices: [] };
