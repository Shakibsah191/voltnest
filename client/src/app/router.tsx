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
import { PolicyPage } from '@/pages/PolicyPage';
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
      { path: 'pages/:slug', element: <PolicyPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <CheckoutLayout />,
    children: [{ path: 'checkout', element: <CheckoutPage /> }],
  },
  {
    // staff and the owner only; AdminLayout checks the role.
    // Loaded on demand, so shoppers never download the admin code.
    path: 'admin',
    lazy: async () => ({ Component: (await import('@/layouts/AdminLayout')).AdminLayout }),
    children: [
      { index: true, lazy: async () => ({ Component: (await import('@/pages/admin/AdminDashboardPage')).AdminDashboardPage }) },
      { path: 'orders', lazy: async () => ({ Component: (await import('@/pages/admin/AdminOrdersPage')).AdminOrdersPage }) },
      { path: 'orders/:orderNumber', lazy: async () => ({ Component: (await import('@/pages/admin/AdminOrderPage')).AdminOrderPage }) },
      { path: 'products', lazy: async () => ({ Component: (await import('@/pages/admin/AdminProductsPage')).AdminProductsPage }) },
      { path: 'products/:id', lazy: async () => ({ Component: (await import('@/pages/admin/AdminProductPage')).AdminProductPage }) },
      { path: 'staff', lazy: async () => ({ Component: (await import('@/pages/admin/AdminStaffPage')).AdminStaffPage }) },
    ],
  },
]);
