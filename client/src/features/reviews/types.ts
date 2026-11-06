export interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verifiedPurchase: true;
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export interface CreateReviewInput {
  orderNumber: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
}
