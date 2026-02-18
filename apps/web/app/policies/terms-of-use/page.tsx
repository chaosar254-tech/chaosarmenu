import React from "react";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <h1 className="text-4xl font-bold text-[#0F172A] mb-4">
          Kullanım Koşulları
        </h1>
        
        <p className="text-sm text-gray-500 mb-8">
          Son güncelleme: {new Date().toLocaleDateString("tr-TR", { 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              1. Genel Hükümler
            </h2>
            <p>
              Bu Kullanım Koşulları, ChaosAR web sitesi ve AR menü demo hizmetinin kullanımına 
              ilişkin kuralları belirlemektedir. Web sitemizi ziyaret ederek veya hizmetlerimizi 
              kullanarak bu koşulları kabul etmiş sayılırsınız.
            </p>
            <p className="mt-4">
              ChaosAR, bu koşulları önceden haber vermeksizin değiştirme hakkını saklı tutar. 
              Değişiklikler, bu sayfada yayınlandığı tarihten itibaren geçerlidir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              2. Hizmet Tanımı
            </h2>
            <p>
              ChaosAR, restoranlar için Artırılmış Gerçeklik (AR) teknolojisi ile çalışan 
              dijital menü hizmeti sunmaktadır. Web sitemizde, hizmetimizi tanıtan bilgiler 
              ve demo uygulaması bulunmaktadır.
            </p>
            <p className="mt-4">
              <strong>Önemli:</strong> Web sitemizdeki demo uygulaması, hizmetimizin önizlemesi 
              ve tanıtımı amacıyla sunulmaktadır. Demo uygulaması ücretsizdir ve gerçek sipariş 
              veya ödeme işlemleri içermez.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              3. Demo Hizmeti
            </h2>
            <p>
              Demo hizmetimiz aşağıdaki özelliklere sahiptir:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>Ücretsizdir:</strong> Demo hizmeti tamamen ücretsizdir ve herhangi bir 
                ödeme gerektirmez
              </li>
              <li>
                <strong>Önizleme Amaçlıdır:</strong> Demo, hizmetimizin nasıl çalıştığını 
                göstermek için hazırlanmıştır
              </li>
              <li>
                <strong>Sipariş/Ödeme İçermez:</strong> Demo uygulamasında gerçek sipariş verme 
                veya ödeme yapma özelliği bulunmamaktadır
              </li>
              <li>
                <strong>İçerik Değişikliği:</strong> ChaosAR, demo içeriğini (ürünler, fiyatlar, 
                görseller) önceden haber vermeksizin değiştirme hakkını saklı tutar
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              4. Kullanıcı Yükümlülükleri
            </h2>
            <p>
              Hizmetlerimizi kullanırken aşağıdaki kurallara uymanız gerekmektedir:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Hizmetleri yasalara uygun şekilde kullanmak</li>
              <li>Başkalarının haklarına saygı göstermek</li>
              <li>Hizmetleri kötüye kullanmamak, zararlı yazılım yüklememek veya sistem güvenliğini 
                  tehdit etmemek</li>
              <li>Telif hakkı, marka veya diğer fikri mülkiyet haklarını ihlal etmemek</li>
              <li>Yanlış, yanıltıcı veya yasadışı bilgi paylaşmamak</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              5. Fikri Mülkiyet Hakları
            </h2>
            <p>
              Web sitemizdeki tüm içerikler (metinler, görseller, logolar, tasarımlar, yazılımlar) 
              ChaosAR'a aittir ve telif hakkı, marka ve diğer fikri mülkiyet yasaları ile korunmaktadır.
            </p>
            <p className="mt-4">
              İçerikleri, ChaosAR'ın yazılı izni olmadan kopyalayamaz, çoğaltamaz, dağıtamaz, 
              değiştiremez veya ticari amaçlarla kullanamazsınız.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              6. Sorumluluk Reddi
            </h2>
            <p>
              ChaosAR, aşağıdaki durumlarda sorumluluk kabul etmez:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Hizmetlerin geçici olarak kesintiye uğraması veya erişilemez olması</li>
              <li>Teknik arızalar, bakım çalışmaları veya zorunlu güncellemeler</li>
              <li>Üçüncü taraf hizmetlerindeki sorunlar</li>
              <li>Kullanıcıların hizmetleri yanlış kullanmasından kaynaklanan zararlar</li>
              <li>Demo içeriğindeki değişiklikler</li>
            </ul>
            <p className="mt-4">
              Hizmetlerimiz "olduğu gibi" sunulmaktadır ve herhangi bir garanti verilmemektedir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              7. İletişim ve Demo Talebi
            </h2>
            <p>
              Demo hizmeti veya hizmetlerimiz hakkında bilgi almak için bizimle iletişime 
              geçebilirsiniz. Demo talep formu aracılığıyla paylaştığınız bilgiler, sizinle 
              iletişim kurmak ve demo kurulumunu gerçekleştirmek amacıyla kullanılır.
            </p>
            <p className="mt-4">
              Detaylı bilgi için <a href="/policies/privacy-policy" className="text-blue-600 hover:underline">Gizlilik Politikası</a> ve 
              <a href="/policies/kvkk" className="text-blue-600 hover:underline ml-1">KVKK Aydınlatma Metni</a> sayfalarımızı inceleyebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              8. Hizmet Değişiklikleri ve Sonlandırma
            </h2>
            <p>
              ChaosAR, hizmetlerini önceden haber vermeksizin değiştirme, güncelleme veya 
              sonlandırma hakkını saklı tutar. Demo içeriği, ürün bilgileri, fiyatlar ve 
              görseller zaman zaman güncellenebilir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              9. Üçüncü Taraf Bağlantılar
            </h2>
            <p>
              Web sitemizde üçüncü taraf web sitelerine bağlantılar bulunabilir. Bu bağlantılar, 
              sadece bilgilendirme amaçlıdır. ChaosAR, bu sitelerin içeriği veya gizlilik 
              uygulamalarından sorumlu değildir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              10. Uygulanacak Hukuk ve Uyuşmazlık Çözümü
            </h2>
            <p>
              Bu Kullanım Koşulları, Türkiye Cumhuriyeti yasalarına tabidir. Bu koşullardan 
              kaynaklanan uyuşmazlıklar, İstanbul Mahkemeleri ve İcra Daireleri'nin yetkisi 
              altındadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              11. İletişim
            </h2>
            <p>
              Kullanım koşullarımız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>E-posta:</strong> <a href="mailto:info@cha0sar.com" className="text-blue-600 hover:underline">info@cha0sar.com</a></li>
              <li><strong>Telefon:</strong> +90 505 048 52 04</li>
              <li><strong>Adres:</strong> İstanbul, Türkiye</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

