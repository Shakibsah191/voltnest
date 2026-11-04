import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/auth.store';
import { cartApi } from './api';
import { useCartStore } from './cart.store';
import { EMPTY_CART, type Cart } from './types';

/** Each account has its own cache entry, so logging in or out never shows the wrong cart. */
export const cartKey = (userId: string | null | undefined) => ['cart', userId ?? 'guest'] as const;

function useCartKey() {
  const userId = useAuthStore((s) => s.user?.id);
  return cartKey(userId);
}

export function useCart() {
  const status = useAuthStore((s) => s.status);
  const key = useCartKey();
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => cartApi.get(signal),
    enabled: status !== 'unknown', // wait until we know who is asking
    staleTime: 30_000,
    refetchOnWindowFocus: true, // stock may have changed in another tab
  });
}

/** Cart mutations run one at a time, in order, so fast taps on + never arrive out of order. */
const scope = { id: 'cart' };

function withTotals(cart: Cart, items: Cart['items']): Cart {
  return {
    ...cart,
    items,
    itemCount: items.reduce((s, l) => s + l.quantity, 0),
    subtotal: items.reduce((s, l) => s + (l.available ? l.unitPrice * l.quantity : 0), 0),
    hasUnavailable: items.some((l) => !l.available),
    notices: [],
  };
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const key = useCartKey();
  const openDrawer = useCartStore((s) => s.open);
  return useMutation({
    scope,
    mutationFn: cartApi.add,
    onSuccess: (cart) => {
      queryClient.setQueryData(key, cart);
      openDrawer();
    },
  });
}

export function useSetCartQuantity() {
  const queryClient = useQueryClient();
  const key = useCartKey();
  return useMutation({
    scope,
    mutationFn: cartApi.setQuantity,
    // show the new number straight away; undo if the server says no
    onMutate: async ({ sku, quantity }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Cart>(key);
      if (previous) {
        const items = previous.items.map((l) =>
          l.variantSku === sku ? { ...l, quantity, lineTotal: l.available ? l.unitPrice * quantity : 0 } : l,
        );
        queryClient.setQueryData(key, withTotals(previous, items));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && queryClient.setQueryData(key, ctx.previous),
    onSuccess: (cart) => queryClient.setQueryData(key, cart),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const key = useCartKey();
  return useMutation({
    scope,
    mutationFn: cartApi.remove,
    onMutate: async (sku) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Cart>(key);
      if (previous) queryClient.setQueryData(key, withTotals(previous, previous.items.filter((l) => l.variantSku !== sku)));
      return { previous };
    },
    onError: (_err, _vars, ctx) => ctx?.previous && queryClient.setQueryData(key, ctx.previous),
    onSuccess: (cart) => queryClient.setQueryData(key, cart),
  });
}

/** After an order the cart is empty on the server; show that without another request. */
export function useClearCartCache() {
  const queryClient = useQueryClient();
  const key = useCartKey();
  return () => queryClient.setQueryData(key, EMPTY_CART);
}

const LEGACY_KEY = 'voltnest-cart'; // the Day 2 browser-only cart

/**
 * One-time move: items added before the cart moved to the server are sent to
 * the server cart, then the old browser copy is deleted.
 */
export function useLegacyCartImport() {
  const status = useAuthStore((s) => s.status);
  const key = useCartKey();
  const queryClient = useQueryClient();
  const done = useRef(false);

  useEffect(() => {
    if (status === 'unknown' || done.current) return;
    done.current = true;

    let items: { sku: string; quantity: number }[] = [];
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const lines = JSON.parse(raw)?.state?.lines;
      if (Array.isArray(lines)) {
        items = lines
          .filter((l) => typeof l?.variantSku === 'string' && Number(l?.quantity) > 0)
          .map((l) => ({ sku: l.variantSku as string, quantity: Math.min(20, Math.floor(Number(l.quantity))) }))
          .slice(0, 50);
      }
    } catch {
      /* unreadable: just drop it */
    }

    const finish = () => {
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* ignore */
      }
    };
    if (items.length === 0) return finish();

    cartApi
      .import(items)
      .then(async (cart) => {
        // a cart request that started before the import would show the old, empty cart
        await queryClient.cancelQueries({ queryKey: key });
        queryClient.setQueryData(key, cart);
        finish();
      })
      .catch(() => {
        done.current = false; // server down: try again next time
      });
  }, [status, key, queryClient]);
}
