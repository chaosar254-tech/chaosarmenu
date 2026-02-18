# Ödeme Yöntemleri Sayfası - Uygulama Özeti

## Yapılan Değişiklikler

### 1. Database Migration
**Dosya:** `supabase/migrations/027_create_billing_settings.sql`

- `billing_settings` tablosu oluşturuldu
- Restaurant bazlı unique constraint
- RLS policies eklendi (owner-only access)
- Trigger: `updated_at` timestamp otomatik güncelleme
- Index: `restaurant_id` için performans

**Tablo Yapısı:**
- `setup_fee_enabled`, `setup_fee_amount`, `setup_fee_payment_link`
- `subscription_period` (monthly/yearly)
- `subscription_monthly_price`, `subscription_yearly_price`
- `subscription_monthly_link`, `subscription_yearly_link`
- `plan` (trial/monthly/yearly)
- `status` (active/past_due/canceled/trial)
- `trial_end_at`

### 2. API Route
**Dosya:** `apps/dashboard/app/api/billing/route.ts`

**GET /api/billing:**
- Restaurant'ın billing settings'ini getirir
- Yoksa otomatik default oluşturur
- RLS ile korunur

**PUT /api/billing:**
- Billing settings'i upsert eder
- Validation: amounts >= 0, URL formatı
- Partial update desteği
- RLS ile korunur

### 3. Sidebar Navigation
**Dosya:** `apps/dashboard/components/Sidebar.tsx`

- Yeni menü item eklendi: "Ödeme Yöntemleri" 💳
- Route: `/dashboard/billing`
- Mevcut menü öğelerinden sonra, "Restoran Ayarları"ndan önce

### 4. Page Component
**Dosya:** `apps/dashboard/app/dashboard/billing/page.tsx`

- Server Component
- Authentication check
- Restaurant ownership validation
- Billing settings fetch (default oluşturur)
- Client component'e props olarak geçer

### 5. Client Component
**Dosya:** `apps/dashboard/components/billing/BillingClient.tsx`

- Client Component (state management)
- Settings fetch/update logic
- Card component'lerini orchestrate eder
- Toast notifications
- Error handling

### 6. Card Components

#### PlanStatusCard
**Dosya:** `apps/dashboard/components/billing/PlanStatusCard.tsx`

- Plan bilgisi (Trial/Monthly/Yearly)
- Durum badge (Active/Past Due/Canceled/Trial)
- Trial gün sayacı
- "Planı Yükselt" butonu → `/dashboard/billing/upgrade`
- "İptal Et" butonu (confirmation + status update)

#### SetupFeeCard
**Dosya:** `apps/dashboard/components/billing/SetupFeeCard.tsx`

- Enable/Disable toggle
- Kurulum ücreti amount input
- Ödeme linki input (İyzico Link/Pay Link)
- "Linki kopyala" butonu (Copy icon)
- "Test et" butonu (ExternalLink icon, new tab)
- Validation: amount >= 0, link required if enabled
- "Kaydet" butonu (hasChanges tracking)

#### SubscriptionCard
**Dosya:** `apps/dashboard/components/billing/SubscriptionCard.tsx`

- Billing period selector (monthly/yearly radio)
- Aylık abonelik: price + link
- Yıllık abonelik: price + link
- Her link için copy/test butonları
- Info text: "İyzico Abonelik API gelince otomatikleşecek"
- Validation: amounts >= 0
- "Kaydet" butonu (hasChanges tracking)

#### PaymentsList
**Dosya:** `apps/dashboard/components/billing/PaymentsList.tsx`

- Placeholder component
- Empty state: "Ödeme kaydı bulunmuyor"
- Gelecekte ödeme kayıtları burada gösterilecek

## Özellikler

✅ **Plan & Durum Kartı:**
- Plan bilgisi (Trial/Monthly/Yearly)
- Durum badge (renkli)
- Trial gün sayacı (trial plan için)
- Planı Yükselt butonu
- İptal Et butonu (confirmation)

✅ **Kurulum Ücreti Kartı:**
- Enable/Disable toggle
- Amount input (TRY)
- Payment link input (İyzico Link)
- Copy link butonu
- Test link butonu (new tab)
- Validation

✅ **Abonelik Kartı:**
- Billing period selector
- Monthly/Yearly fiyatlar
- Monthly/Yearly payment linkler
- Copy/Test butonları
- İyzico API info text

✅ **Ödemeler Listesi:**
- Placeholder (boş state)

✅ **Genel:**
- Mobile responsive
- Toast notifications
- Error handling
- Loading states
- Unsaved changes tracking (UI)
- RLS security
- Auto-create default settings

## Route Yapısı

```
/dashboard/billing          → Billing page (main)
/dashboard/billing/upgrade  → Plan upgrade (future)
```

## API Endpoints

```
GET  /api/billing  → Get billing settings (auto-create if not exists)
PUT  /api/billing  → Update billing settings (upsert)
```

## Database

**Table:** `billing_settings`
- Restaurant bazlı (one-to-one)
- RLS enabled
- Auto-update `updated_at` trigger

## Gelecek Geliştirmeler

- [ ] İyzico API entegrasyonu (abonelik otomatikleşecek)
- [ ] Ödeme kayıtları tablosu ve listesi
- [ ] Plan upgrade sayfası (`/dashboard/billing/upgrade`)
- [ ] Fatura indirme
- [ ] Ödeme geçmişi detay sayfası
- [ ] Email bildirimleri (ödeme başarılı/başarısız)

## Notlar

- İyzico API henüz aktif değil, şimdilik manuel link kullanılıyor
- Component'ler modüler yapıda, ileride iyzico API eklenince kolayca genişletilebilir
- RLS policies ile güvenlik sağlandı
- Toast notifications kullanıldı (react-hot-toast)
- lucide-react icons kullanıldı (projede zaten mevcut)

