# SoftBridge Finans & Kripto — Vercel Deployment Rehberi

Bu proje, hem **React + TypeScript (Vite)** ön yüzünü hem de **FastAPI (Python)** arka yüzünü tek bir çatı altında Vercel Serverless mimarisine hazır şekilde yapılandırılmıştır.

---

## 🚀 1-Tıkla Vercel Dağıtımı (Zero-Config)

1. **[Vercel Dashboard](https://vercel.com/dashboard)** sayfasına gidin.
2. **"Add New..." -> "Project"** seçin.
3. GitHub hesabınızı bağlayıp **`Dpehect/Soft-Finans`** reposunu seçin ve **Import** butonuna tıklayın.
4. **Vercel Proje Ayarları:**
   - **Framework Preset:** `Vite` (veya `Other`)
   - **Root Directory:** `./` (Varsayılan kök dizin)
   - **Build Command:** `npm --prefix frontend install && npm --prefix frontend run build` *(otomatik tanımlıdır)*
   - **Output Directory:** `frontend/dist` *(otomatik tanımlıdır)*
5. **Deploy** butonuna basın!

---

## 🛠️ Mimari ve Nasıl Çalışır?

| Katman | Konum | Açıklama |
|---|---|---|
| **Frontend** | `/frontend` | Vite + React + TypeScript + Tailwind CSS |
| **Backend API** | `/api/index.py` | Vercel Python Serverless Function (FastAPI `app`) |
| **Yönlendirmeler** | `/vercel.json` | `/api/*` isteklerini `api/index.py` servisine, diğer sayfaları SPA `/index.html`'e iletir |
| **Veritabanı** | `/tmp/openterminalui.db` | Serverless ortamda `/tmp` dizini kullanılarak yazma hataları önlenir |

---

## ⚙️ İsteğe Bağlı Ortam Değişkenleri (Environment Variables)

Vercel Proje Ayarları -> **Environment Variables** bölümünden aşağıdaki değerleri tanımlayabilirsiniz:

- `DATABASE_URL`: Kalıcı PostgreSQL veritabanı bağlantısı (Neon, Supabase, Vercel Postgres vb.)
- `AUTH_MIDDLEWARE_ENABLED`: `0` (Varsayılan hızlı demo/admin girişi)
- `FRED_API_KEY`: Opsiyonel makroekonomik veri sağlayıcı anahtarı
- `COINGECKO_API_KEY`: Opsiyonel kripto veri sağlayıcı anahtarı
