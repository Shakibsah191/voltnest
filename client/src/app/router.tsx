import { createBrowserRouter } from 'react-router-dom';
import { ShopLayout } from '@/layouts/ShopLayout/ShopLayout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <ShopLayout />,
    children: [
      { index: true, element: <HomePage /> },
      // Day 2: /collections/:slug and /products/:slug
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
