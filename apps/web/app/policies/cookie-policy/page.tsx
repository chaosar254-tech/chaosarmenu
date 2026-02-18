import React from "react";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <h1 className="text-4xl font-bold text-[#0F172A] mb-4">
          Çerez Politikası
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
              1. Çerez Nedir?
            </h2>
            <p>
              Çerezler (cookies), web sitelerini ziyaret ettiğinizde cihazınıza (bilgisayar, 
              tablet, telefon) kaydedilen küçük metin dosyalarıdır. Bu dosyalar, web sitesinin 
              düzgün çalışmasını sağlar ve kullanıcı deneyimini iyileştirir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              2. Çerezlerin Kullanım Amacı
            </h2>
            <p>
              ChaosAR web sitesinde çerezler aşağıdaki amaçlarla kullanılmaktadır:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Web sitesinin teknik olarak düzgün çalışmasını sağlamak</li>
              <li>Kullanıcı tercihlerini hatırlamak</li>
              <li>Site performansını analiz etmek ve iyileştirmek</li>
              <li>Güvenlik önlemlerini almak</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              3. Kullandığımız Çerez Türleri
            </h2>
            
            <h3 className="text-xl font-semibold text-[#0F172A] mt-6 mb-3">
              3.1. Zorunlu Çerezler
            </h3>
            <p>
              Bu çerezler, web sitesinin temel işlevlerini yerine getirmesi için gereklidir. 
              Bu çerezler olmadan web sitesi düzgün çalışmaz. Bu nedenle bu çerezler tarayıcı 
              ayarlarınızdan devre dışı bırakılamaz.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Oturum Çerezleri:</strong> Web sitesi oturumunuzu yönetmek için kullanılır</li>
              <li><strong>Güvenlik Çerezleri:</strong> Güvenlik ve dolandırıcılık önleme için kullanılır</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#0F172A] mt-6 mb-3">
              3.2. Analitik Çerezler
            </h3>
            <p>
              Bu çerezler, web sitesinin nasıl kullanıldığını anlamamıza yardımcı olur. 
              Hangi sayfaların daha çok ziyaret edildiği, kullanıcıların sitede nasıl 
              gezindiği gibi bilgileri toplarız. Bu bilgiler, hizmetlerimizi iyileştirmek 
              için kullanılır.
            </p>
            <p className="mt-4">
              <strong>Önemli:</strong> Bu çerezler anonimdir ve kişisel kimlik bilgilerinizi 
              içermez.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              4. Üçüncü Taraf Çerezler
            </h2>
            <p>
              Web sitemizde, hizmet kalitemizi artırmak için üçüncü taraf analitik araçları 
              kullanılmaktadır. Bu araçlar, yukarıda belirtilen analitik çerezleri kullanabilir.
            </p>
            <p className="mt-4">
              <strong>Önemli:</strong> Reklam çerezleri kullanılmamaktadır. Web sitemizde 
              reklam gösterimi yapılmamakta ve reklam amaçlı çerezler kullanılmamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              5. Çerezleri Yönetme
            </h2>
            <p>
              Tarayıcı ayarlarınızdan çerezleri yönetebilir veya silmeyi tercih edebilirsiniz. 
              Ancak, zorunlu çerezleri devre dışı bırakırsanız, web sitesinin bazı özellikleri 
              düzgün çalışmayabilir.
            </p>
            
            <h3 className="text-xl font-semibold text-[#0F172A] mt-6 mb-3">
              Tarayıcı Ayarları
            </h3>
            <p>Çerezleri yönetmek için kullandığınız tarayıcının ayarlar bölümüne gidebilirsiniz:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Chrome:</strong> Ayarlar → Gizlilik ve güvenlik → Çerezler</li>
              <li><strong>Firefox:</strong> Seçenekler → Gizlilik ve Güvenlik → Çerezler</li>
              <li><strong>Safari:</strong> Tercihler → Gizlilik → Çerezler</li>
              <li><strong>Edge:</strong> Ayarlar → Gizlilik, arama ve hizmetler → Çerezler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              6. Çerez Süreleri
            </h2>
            <p>
              Kullandığımız çerezler iki türlüdür:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>Oturum Çerezleri:</strong> Tarayıcınızı kapattığınızda otomatik olarak 
                silinir
              </li>
              <li>
                <strong>Kalıcı Çerezler:</strong> Belirli bir süre boyunca cihazınızda kalır 
                (genellikle 1 yıl veya daha kısa)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              7. Değişiklikler
            </h2>
            <p>
              Bu Çerez Politikası zaman zaman güncellenebilir. Önemli değişikliklerde size 
              bildirim yapılacaktır. Güncel versiyonu bu sayfada bulabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              8. İletişim
            </h2>
            <p>
              Çerez politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
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

