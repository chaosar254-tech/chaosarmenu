# Paket Kartları UI Güncellemesi - Özet

## Yapılan Değişiklikler

### 1. Yeni Component: PricingPlans
**Dosya:** `apps/dashboard/components/billing/PricingPlans.tsx`

- Reusable paket kart component'i
- 3 paket desteği (BASIC, PRO, ENTERPRISE)
- Aylık/Yıllık fiyat toggle'ı
- Seçim state yönetimi
- Badge desteği (PRO için "🔥 En Çok Tercih Edilen")
- Highlight desteği (PRO öne çıkarılmış)
- Responsive grid (mobilde 1 sütun, desktop'ta 3 sütun)

### 2. SubscriptionCard Güncellemesi
**Dosya:** `apps/dashboard/components/billing/SubscriptionCard.tsx`

**Değişiklikler:**
- ❌ Eski input alanları kaldırıldı (fiyat/link input'ları)
- ✅ Yeni PricingPlans component'i eklendi
- ✅ Aylık/Yıllık toggle korundu (üst kısımda)
- ✅ Paket seçimi state yönetimi eklendi
- ✅ Seçilen paket için ödeme linki gösterimi
- ✅ Enterprise paket için özel mesaj

**Paket Tanımları:**
- **BASIC:** 299₺/ay, 2990₺/yıl (Dijital Menü, QR Kod, Sınırsız Masa, 1 Şube)
- **PRO:** 599₺/ay, 5990₺/yıl (🔥 En Çok Tercih Edilen) (Dijital Menü, QR Kod, AR Menü, Satış Artırıcı Öneriler, Analytics, 3 Şube)
- **ENTERPRISE:** Teklif Al (Sınırsız Şube, Özel Tasarım, Öncelikli Destek)

### 3. Davranış

#### Paket Seçimi:
- Paket kartına tıklanınca `selectedPlan` state'e yazılıyor
- Seçilen paket highlight ediliyor (border + shadow)
- Toast notification gösteriliyor

#### Ödeme Linki:
- Seçilen paket için (BASIC/PRO) alt tarafta ödeme linki gösteriliyor
- Link varsa: input field + Copy/Test butonları
- Link yoksa: uyarı mesajı
- Enterprise için: iletişim mesajı

#### Aylık/Yıllık Toggle:
- Toggle değişince fiyatlar dinamik olarak güncelleniyor
- Linkler toggle'a göre değişiyor (monthlyLink / yearlyLink)

### 4. UI Özellikleri

**Paket Kartları:**
- Border (selected: primary-600, highlight: primary-300, default: gray-200)
- Shadow (selected: lg, highlight: md, default: sm)
- Scale effect (selected: scale-105)
- Badge (PRO için üstte)
- Check icon (özellikler için)
- CTA button (paket seçimi için)

**Responsive:**
- Mobil: `grid-cols-1` (kartlar alt alta)
- Desktop: `grid-cols-3` (kartlar yan yana)

**Stil:**
- Tailwind CSS kullanıldı
- Shadcn Card/Button uyumlu
- Primary color scheme (primary-600, primary-50, etc.)

### 5. Teknik Detaylar

**State Yönetimi:**
- `selectedPlan`: Seçilen paket ID (basic/pro/enterprise/null)
- `localPeriod`: Aylık/Yıllık toggle (monthly/yearly)

**Props:**
- SubscriptionCard: Mevcut props korundu (period, monthlyPrice, yearlyPrice, monthlyLink, yearlyLink, onUpdate)
- PricingPlans: period, selectedPlan, onSelectPlan, plans

**Paket Tanımları:**
- Şimdilik sabit (PLAN_DEFINITIONS constant)
- İleride API'den gelebilir
- Linkler mevcut billing_settings'den geliyor

### 6. Notlar

- ✅ Input alanları kaldırıldı (paket kartlarıyla değiştirildi)
- ✅ Paket seçimi state yönetimi eklendi
- ✅ Ödeme linkleri hala manuel girilecek (mevcut billing_settings üzerinden)
- ✅ API entegrasyonu henüz yok (UI katmanı tamamlandı)
- ✅ Enterprise paket için özel mesaj/iletişim
- ✅ Responsive tasarım
- ✅ Toast notifications

### 7. Gelecek Geliştirmeler

- [ ] Paket tanımlarını API'den çekme
- [ ] İyzico API entegrasyonu (otomatik link oluşturma)
- [ ] Paket bazlı link yönetimi (her paket için ayrı link)
- [ ] Link ayarları için ayrı bölüm (SetupFeeCard benzeri)
- [ ] Paket karşılaştırma tablosu
- [ ] Fiyat geçmişi/analiz

## Kullanım

1. Kullanıcı "Abonelik Ödemesi" bölümüne girer
2. Aylık/Yıllık toggle'ı seçer
3. Paket kartlarından birini seçer (BASIC/PRO/ENTERPRISE)
4. Seçilen paket için ödeme linki gösterilir
5. Linki kopyalayabilir veya test edebilir
6. Enterprise seçilirse iletişim mesajı gösterilir

