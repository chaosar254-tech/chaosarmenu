# Kurulum Adımları

## 1. Bağımlılıkları Yükleyin

```bash
pnpm install
```

## 2. Supabase Kurulumu

1. [Supabase](https://supabase.com) üzerinde yeni bir proje oluşturun
2. SQL Editor'da migration dosyalarını sırayla çalıştırın:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_add_ar_support.sql`

## 3. Environment Variables

### Root dizinde `.env.local` (seed script için):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
TEST_USER_ID=your_user_id_from_auth
```

### `apps/dashboard/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_MENU_URL=http://localhost:3001
```

### `apps/menu/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 4. Test Kullanıcısı Oluşturma

1. Supabase Dashboard > Authentication > Users
2. "Add user" ile yeni kullanıcı oluşturun
3. Kullanıcı ID'sini kopyalayın
4. Root `.env.local` dosyasına `TEST_USER_ID` olarak ekleyin

## 5. Seed Script Çalıştırma

```bash
pnpm seed
```

Bu komut:
- Örnek restoran oluşturur (slug: `ornek-restoran`)
- 2 kategori ekler (Ana Yemekler, Tatlılar)
- 6 ürün ekler (1 tanesi AR destekli)
- 3 QR kod oluşturur

## 6. Uygulamaları Başlatma

```bash
# Her iki app'i aynı anda
pnpm dev

# Veya ayrı ayrı
cd apps/dashboard && pnpm dev  # Port 3000
cd apps/menu && pnpm dev      # Port 3001
```

## 7. İlk Giriş

1. Dashboard'a gidin: http://localhost:3000
2. Supabase Auth'ta oluşturduğunuz kullanıcı ile giriş yapın
3. Eğer restoran yoksa, seed script'i çalıştırdıysanız restoran görünecektir

## 8. Menüyü Görüntüleme

### Yeni AR Destekli Menü (Demo Tasarımı):
- Genel menü: http://localhost:3001/menu/ornek-restoran
- Masa bazlı: http://localhost:3001/menu/ornek-restoran?table=5

### Eski Basit Menü (Hala çalışıyor):
- http://localhost:3001/m/ornek-restoran

## 9. AR Test

AR özelliğini test etmek için:
1. Mobil cihazdan menüyü açın
2. "Classic Burger" ürününü seçin
3. "AR'de Gör" butonuna tıklayın
4. **iOS:** Quick Look açılır (USDZ model)
5. **Android:** Scene Viewer açılır (GLB model)

## Sorun Giderme

### "Missing Supabase environment variables" hatası
- Tüm `.env.local` dosyalarının doğru oluşturulduğundan emin olun
- Değişken isimlerinin doğru olduğunu kontrol edin

### RLS policy hatası
- Migration dosyalarının çalıştırıldığından emin olun
- Supabase Dashboard > Table Editor'da RLS'in aktif olduğunu kontrol edin

### AR model yüklenmiyor
- Public klasöründe models ve images klasörlerinin olduğunu kontrol edin
- Browser console'da 404 hatası var mı bakın

### Framer Motion / Lucide React import hatası
```bash
cd apps/menu
pnpm add framer-motion lucide-react
```

### Port zaten kullanılıyor
- Dashboard: `next.config.js` veya `package.json`'da port değiştirin
- Menu: `package.json`'da port değiştirin

## 🎨 Demo Menü Özellikleri

- ✅ Dark/Premium/Neon UI (altın renk paleti)
- ✅ Splash screen animasyonu
- ✅ Kategori grid
- ✅ Ürün grid + modal detay
- ✅ AR butonu (has_ar=true olan ürünlerde)
- ✅ Framer Motion animasyonları
- ✅ Mobil responsive
- ✅ iOS/Android AR desteği
