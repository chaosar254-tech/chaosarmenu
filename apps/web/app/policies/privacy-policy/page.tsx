import React from "react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <h1 className="text-4xl font-bold text-[#0F172A] mb-4">
          Gizlilik Politikası
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
              1. Genel Bilgiler
            </h2>
            <p>
              ChaosAR olarak, kullanıcılarımızın gizliliğini korumayı öncelikli görevimiz olarak görüyoruz. 
              Bu Gizlilik Politikası, ChaosAR AR menü hizmeti kapsamında toplanan, kullanılan ve korunan 
              kişisel verileriniz hakkında bilgi vermek amacıyla hazırlanmıştır.
            </p>
            <p>
              Bu politika, web sitemizi ziyaret ettiğinizde, demo hizmetimizi kullandığınızda veya bizimle 
              iletişime geçtiğinizde toplanan bilgileri kapsar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              2. Toplanan Bilgiler
            </h2>
            <p>
              Hizmetlerimizi sunabilmek için aşağıdaki bilgileri toplayabiliriz:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>İletişim Bilgileri:</strong> İşletme adı, yetkili kişi adı, e-posta adresi, 
                telefon numarası ve şehir bilgisi
              </li>
              <li>
                <strong>Teknik Bilgiler:</strong> IP adresi, tarayıcı türü, işletim sistemi, 
                cihaz bilgileri ve site kullanım verileri
              </li>
              <li>
                <strong>İletişim Kayıtları:</strong> Bizimle yaptığınız iletişimlerde paylaştığınız 
                mesajlar ve talepler
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              3. Bilgilerin Kullanım Amacı
            </h2>
            <p>Toplanan bilgileriniz aşağıdaki amaçlarla kullanılır:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Demo hizmeti sunmak ve demo kurulumunu gerçekleştirmek</li>
              <li>Sizinle iletişim kurmak ve taleplerinize yanıt vermek</li>
              <li>Hizmetlerimizi geliştirmek ve iyileştirmek</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              4. Bilgilerin Paylaşımı
            </h2>
            <p>
              Kişisel bilgileriniz, yasal yükümlülüklerimiz dışında üçüncü taraflarla paylaşılmaz. 
              Sadece hizmet sağlayıcılarımız (hosting, e-posta servisleri) teknik destek amaçlı 
              sınırlı erişime sahiptir ve bu erişim gizlilik sözleşmeleri ile korunmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              5. Veri Güvenliği
            </h2>
            <p>
              Verilerinizin güvenliği için endüstri standardı güvenlik önlemleri alıyoruz. 
              SSL şifreleme, güvenli sunucular ve düzenli güvenlik güncellemeleri ile 
              bilgilerinizi koruyoruz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              6. Çerezler
            </h2>
            <p>
              Web sitemizde çerezler kullanılmaktadır. Detaylı bilgi için 
              <a href="/policies/cookie-policy" className="text-blue-600 hover:underline ml-1">
                Çerez Politikası
              </a> sayfamızı inceleyebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              7. Haklarınız
            </h2>
            <p>
              KVKK kapsamında, kişisel verilerinizle ilgili aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenen verileriniz hakkında bilgi talep etme</li>
              <li>Verilerinizin silinmesini veya düzeltilmesini isteme</li>
              <li>İşleme faaliyetlerine itiraz etme</li>
            </ul>
            <p className="mt-4">
              Bu haklarınızı kullanmak için <a href="mailto:info@cha0sar.com" className="text-blue-600 hover:underline">info@cha0sar.com</a> 
              adresine e-posta gönderebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              8. Değişiklikler
            </h2>
            <p>
              Bu Gizlilik Politikası zaman zaman güncellenebilir. Önemli değişikliklerde 
              size bildirim yapılacaktır. Güncel versiyonu bu sayfada bulabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              9. İletişim
            </h2>
            <p>
              Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
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

