# ChaosAR - Müşteri Menü SaaS Platformu

Tek bir codebase üzerinden çoklu restoran yönetimi sağlayan SaaS platformu. Her restoran kendi slug'ı ile menüsünü yönetir ve müşterilerine sunar.

## 🏗️ Proje Yapısı

```
customer-menu/
├── apps/
│   ├── dashboard/     # Restoran yönetim paneli (port 3000)
│   └── menu/          # Public menü uygulaması (port 3001)
├── supabase/
│   └── migrations/    # Supabase migration dosyaları
└── scripts/
    └── seed.js        # Örnek veri scripti
```

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
pnpm install
```

### 2. Supabase Kurulumu

1. Supabase projesi oluşturun
2. Migration dosyalarını sırayla çalıştırın:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_add_ar_support.sql`
   - `supabase/migrations/004_add_plan_and_model_fields.sql`
   - `supabase/migrations/006_add_image_path_column.sql`
   - `supabase/migrations/007_storage_rls_policies.sql`
   - `supabase/migrations/008_add_theme_columns.sql`
   - `supabase/migrations/009_add_logo_path_column.sql`
   - `supabase/migrations/010_menu_logos_storage_rls.sql`
   - `supabase/migrations/011_create_profiles_table.sql` (Admin panel)
   - `supabase/migrations/012_update_restaurants_for_admin.sql`
   - `supabase/migrations/013_update_qr_codes_for_admin.sql`
   - `supabase/migrations/014_create_menu_events_table.sql` (Analytics)

3. **Admin Kullanıcı Oluşturma:**
   - Supabase Dashboard > Authentication > Users > Add User
   - Veya SQL ile:
   ```sql
   -- Create admin user (replace with your email/password)
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
   VALUES ('admin@example.com', crypt('your_password', gen_salt('bf')), NOW(), NOW(), NOW())
   RETURNING id;
   
   -- Set as admin (replace USER_ID with the returned id)
   INSERT INTO profiles (id, is_admin)
   VALUES ('USER_ID', true)
   ON CONFLICT (id) DO UPDATE SET is_admin = true;
   ```

### 3. Environment Variables

Her iki app için `.env.local` dosyası oluşturun:

**apps/dashboard/.env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_MENU_URL=http://localhost:3001
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for admin panel (server-side only, NEVER expose to client)
```

**apps/menu/.env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for signed URL generation (server-side only)
```

### 4. Seed Script (Örnek Veri)

```bash
# Root dizinde .env.local oluşturun (service role key için)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TEST_USER_ID=your_user_id_from_auth  # Supabase Auth'tan kullanıcı oluşturup ID'sini alın

# Seed çalıştırın
pnpm seed
```

## 🎯 Kullanım

### Development

```bash
# Her iki app'i aynı anda çalıştır
pnpm dev

# Veya ayrı ayrı
cd apps/dashboard && pnpm dev
cd apps/menu && pnpm dev
```

### URL'ler

- **Dashboard:** http://localhost:3000
- **AR Destekli Menü (Demo Tasarımı):** http://localhost:3001/menu/[restaurantSlug]
- **Masa Bazlı Menü:** http://localhost:3001/menu/[restaurantSlug]?table=5
- **Basit Menü (Eski):** http://localhost:3001/m/[restaurantSlug]

## 📋 Özellikler

### Dashboard (Restoran Paneli)

- ✅ Kullanıcı girişi (Supabase Auth)
- ✅ Dashboard istatistikleri
- ✅ Menü yönetimi:
  - Kategori CRUD
  - Ürün CRUD
  - Sıralama (sort_order)
  - Aktif/Pasif durumu
- ✅ QR Kod yönetimi:
  - QR kod oluşturma (masa bazlı veya genel)
  - Link kopyalama
  - SVG/PNG indirme
  - QR kod silme
- ✅ Restoran ayarları:
  - Restoran adı
  - Slug yönetimi (slug değişikliği uyarısı)

### Public Menü (AR Destekli - Demo Tasarımı)

- ✅ Dark/Premium/Neon UI (altın renk paleti)
- ✅ Splash screen animasyonu (3 saniye)
- ✅ Kategori grid navigasyonu
- ✅ Ürün grid + modal detay
- ✅ AR butonu (has_ar=true olan ürünlerde)
- ✅ iOS Quick Look + Android Scene Viewer desteği
- ✅ Framer Motion animasyonları
- ✅ Restoran slug'ına göre dinamik menü
- ✅ Masa bazlı hoş geldin mesajı
- ✅ Responsive tasarım
- ✅ SEO optimizasyonu

## 🔒 Güvenlik (RLS)

- Restoran sahipleri sadece kendi restoranlarını görebilir
- Public menü sadece aktif kategoriler ve ürünleri gösterir
- RLS politikaları Supabase'de otomatik uygulanır

## 📦 Bağımlılıklar

### Dashboard
- `@supabase/ssr` - Server-side Supabase client
- `@supabase/supabase-js` - Supabase client
- `qrcode.react` - QR kod oluşturma
- `react-hot-toast` - Bildirimler

### Menu
- `@supabase/supabase-js` - Supabase client
- `framer-motion` - Animasyonlar
- `lucide-react` - İkonlar
- `@google/model-viewer` - AR/3D model görüntüleme (CDN)

## 🗄️ Veri Modeli

- **restaurants**: Restoran bilgileri
- **menu_categories**: Menü kategorileri
- **menu_items**: Menü ürünleri (AR model alanları dahil)
  - `has_ar`: AR desteği var mı
  - `ar_model_glb`: GLB model dosyası (Android/Web)
  - `ar_model_usdz`: USDZ model dosyası (iOS)
- **qr_codes**: QR kodlar

Detaylar için `supabase/migrations/` klasöründeki SQL dosyalarına bakın.

## 🆕 Yeni Müşteri Ekleme

1. Supabase Auth'ta yeni kullanıcı oluşturun
2. Dashboard'a giriş yapın
3. İlk girişte restoran oluşturulur (veya manuel olarak `restaurants` tablosuna ekleyin)
4. Menü içeriğini ekleyin
5. QR kodlar oluşturun

## 🐛 Sorun Giderme

### QR kod import hatası
```bash
cd apps/dashboard
pnpm add qrcode.react
```

### Supabase connection hatası
- `.env.local` dosyalarının doğru olduğundan emin olun
- Supabase projenizin aktif olduğunu kontrol edin

### RLS policy hatası
- Migration dosyalarının çalıştırıldığından emin olun
- Supabase dashboard'da RLS'in aktif olduğunu kontrol edin

## 📝 Notlar

- Service role key asla browser'a gönderilmemeli
- Slug değişikliği mevcut QR kodları etkileyebilir
- Production'da `NEXT_PUBLIC_MENU_URL` gerçek domain'e ayarlanmalı

