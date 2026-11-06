import { createBrowserRouter } from 'react-router-dom';
import { ShopLayout } from '@/layouts/ShopLayout/ShopLayout';
import { CheckoutLayout } from '@/layouts/CheckoutLayout';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { HomePage } from '@/pages/HomePage';
import { CollectionPage } from '@/pages/CollectionPage';
import { ProductPage } from '@/pages/ProductPage';
import { SearchPage } from '@/pages/SearchPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AccountPage } from '@/pages/AccountPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderSuccessPage } from '@/pages/OrderSuccessPage';
import { MyOrdersPage } from '@/pages/MyOrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { TrackOrderPage } from '@/pages/TrackOrderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <ShopLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'collections/:slug', element: <CollectionPage /> },
      { path: 'products/:slug', element: <ProductPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'account',
        element: (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        ),
      },
      {
        path: 'account/orders',
        element: (
          <RequireAuth>
            <MyOrdersPage />
          </RequireAuth>
        ),
      },
      {
        path: 'account/orders/:orderNumber',
        element: (
          <RequireAuth>
            <OrderDetailPage />
          </RequireAuth>
        ),
      },
      { path: 'track-order', element: <TrackOrderPage /> },
      { path: 'order-confirmed/:orderNumber', element: <OrderSuccessPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <CheckoutLayout />,
    children: [{ path: 'checkout', element: <CheckoutPage /> }],
  },
]);
