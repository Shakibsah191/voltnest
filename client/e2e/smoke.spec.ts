import { expect, test } from '@playwright/test';

// Read-only checks: nothing here places an order, so it's safe to run against the live shop.

test('the API is up', async ({ request }) => {
  const res = await request.get('/api/v1/health');
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).data.db).toBe('connected');
});

test('a shopper can browse to checkout', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /voltnest/i }).first()).toBeVisible();

  await page.goto('/collections/all');
  const firstProduct = page.locator('main a[href^="/products/"]').first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();

  await page.getByRole('button', { name: 'Add to cart' }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByText(/Your cart \(\d+\)/)).toBeVisible();
  await drawer.getByRole('button', { name: 'Checkout' }).click();

  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await expect(page.getByText('Inside Rajshahi')).toBeVisible();
  await expect(page.getByText('Not available yet')).toBeVisible(); // online payment stays off
});

test('login keeps working through the /api rewrite', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#login-email', 'nobody@example.com');
  await page.fill('#login-password', 'wrong-password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByText('Email or password is incorrect')).toBeVisible();
});

test('the admin panel asks guests to log in', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
});

test('footer pages exist', async ({ page }) => {
  for (const slug of ['shipping', 'returns', 'warranty', 'privacy', 'terms', 'contact']) {
    const res = await page.goto(`/pages/${slug}`);
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator('h1')).not.toHaveText('');
  }
});
