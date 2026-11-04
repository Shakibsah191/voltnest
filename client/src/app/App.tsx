import { RouterProvider } from 'react-router-dom';
import { useLegacyCartImport } from '@/features/cart/hooks';
import { Providers } from './providers';
import { router } from './router';

/** Start-up work that needs React Query but not the router. */
function AppEffects() {
  useLegacyCartImport();
  return null;
}

export function App() {
  return (
    <Providers>
      <AppEffects />
      <RouterProvider router={router} />
    </Providers>
  );
}
