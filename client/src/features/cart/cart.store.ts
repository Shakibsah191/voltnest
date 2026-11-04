import { create } from 'zustand';

/** Most of one variant a customer can order at once (the server enforces the same limit). */
export const MAX_PER_LINE = 20;

/**
 * Since Day 3 the cart itself lives on the server (see hooks.ts).
 * This store only remembers whether the cart drawer is open.
 */
interface CartUiState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useCartStore = create<CartUiState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
