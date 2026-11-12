# Putting VoltNest online

Order matters: **server first (Render), then the website (Vercel)**, because the website needs the server's address.

Before you start: push everything to GitHub (`git add .`, `git commit`, `git push`).

---

## 1. MongoDB Atlas: let Render connect

1. Atlas → **Network Access**.
2. You already added `0.0.0.0/0` while building. Keep it, because Render's free plan has no fixed IP address.
3. Make sure your database user's password is strong. With `0.0.0.0/0`, the password is the lock.

## 2. Render: the API server

1. Go to **render.com** → sign in with GitHub.
2. **New → Blueprint** → pick the `voltnest` repository. Render finds `render.yaml` and proposes a service called **voltnest-api**.
3. It asks for the secret values. Copy them from your `server\.env`:

   | Key | Value |
   |---|---|
   | `MONGODB_URI` | same as in `.env` |
   | `MONGODB_USER`, `MONGODB_PASSWORD` | same as in `.env` (no quotes) |
   | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | **make new ones** for production with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `CLIENT_URL` | leave as `https://example.com` for now; you'll fix it in step 4 |
   | `RESEND_API_KEY`, `EMAIL_FROM` | if you have them; otherwise leave empty |
   | `CLOUDINARY_*` | if you have them; otherwise leave empty |

4. Click **Apply**. The first build takes 3–5 minutes.
5. When it says **Live**, copy the address, e.g. `https://voltnest-api.onrender.com`.
6. Test it in your browser: `https://voltnest-api.onrender.com/api/v1/health` should show `"db":"connected"`.

> If the build fails, open **Logs** and send me the red lines.

## 3. Vercel: the website

1. Open `client\vercel.json` in VS Code and replace `YOUR-RENDER-SERVICE` with your Render name, so the line reads
   `"destination": "https://voltnest-api.onrender.com/api/:path*"`. Save, commit and push.
2. Go to **vercel.com** → sign in with GitHub → **Add New → Project** → import `voltnest`.
3. Set **Root Directory** to `client`. Vercel detects Vite by itself (build `npm run build`, output `dist`).
4. No environment variables are needed. Click **Deploy**.
5. Copy your site address, e.g. `https://voltnest.vercel.app`.

## 4. Connect them

1. Render → voltnest-api → **Environment** → set `CLIENT_URL` to your Vercel address (no slash at the end) → **Save**. Render restarts the server.
2. Open your Vercel address. The products should load. If you see "Can’t reach the VoltNest server", wait a minute: the free server takes up to 50 seconds to wake up the first time.

## 5. Keep the server awake (for demos)

Render's free server sleeps after 15 minutes without visitors.

1. Make a free account at **uptimerobot.com**.
2. **Add New Monitor** → type **HTTP(s)** → URL `https://voltnest-api.onrender.com/api/v1/health` → every **5 minutes**.
3. That's it. It also emails you if the server goes down.

## 6. Final check on your phone (the Day 5 gate)

1. Open the Vercel link on your phone. Browse, add to cart, place a **COD order**.
2. Log in as the customer → **My orders**: the order is there.
3. On a laptop, log in as the owner → **Admin panel** → **Staff** → add an employee.
4. Log in as that employee on your phone → **Orders** → open the order → **Confirm order** → **Mark as shipped** → **Mark delivered**.
5. On the customer's side, the timeline moves and the emails arrive (or show in Render's **Logs** without a Resend key).

**Before you share the link:** log in as `admin@voltnest.test` and change the password, or seed with a new `ADMIN_PASSWORD`. The default one is public in the code.

## 7. Extra checks for the CV

- **Smoke test** (from your computer, in `client`):
  ```powershell
  npx playwright install chromium      # first time only
  $env:BASE_URL="https://voltnest.vercel.app"; npm run test:smoke
  ```
- **Lighthouse:** Chrome → open the site → `F12` → **Lighthouse** tab → **Analyze page load**, on the home page and one product page. Put the scores in the README.
- **Screenshots** for the README go in `docs/screenshots/` (home.png, admin-order-mobile.png and any others you like).
- **Demo video, 2 minutes:** shop → order → admin confirms and ships on a phone → customer sees "On the way" → review after delivery.
