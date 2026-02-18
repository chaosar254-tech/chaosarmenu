import React from "react";

export default function KVKKPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-4xl py-16">
        <h1 className="text-4xl font-bold text-[#0F172A] mb-4">
          KVKK Aydınlatma Metni
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
              1. Veri Sorumlusu
            </h2>
            <p>
              <strong>ChaosAR</strong> olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") 
              kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi işlemekteyiz.
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Unvan:</strong> ChaosAR</li>
              <li><strong>E-posta:</strong> <a href="mailto:info@cha0sar.com" className="text-blue-600 hover:underline">info@cha0sar.com</a></li>
              <li><strong>Telefon:</strong> +90 505 048 52 04</li>
              <li><strong>Adres:</strong> İstanbul, Türkiye</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              2. İşlenen Kişisel Veriler
            </h2>
            <p>
              Hizmetlerimiz kapsamında aşağıdaki kişisel verileriniz işlenmektedir:
            </p>
            
            <h3 className="text-xl font-semibold text-[#0F172A] mt-6 mb-3">
              2.1. Kimlik Bilgileri
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Yetkili kişi adı ve soyadı</li>
              <li>İşletme adı</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#0F172A] mt-6 mb-3">
              2.2. İletişim Bilgileri
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>E-posta adresi</li>
              <li>Telefon numarası</li>
              <li>Şehir bilgisi</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#0F172A] mt-6 mb-3">
              2.3. İşlem Güvenliği Bilgileri
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP adresi</li>
              <li>Tarayıcı bilgileri</li>
              <li>Cihaz bilgileri</li>
              <li>Site kullanım verileri</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              3. Kişisel Verilerin İşlenme Amaçları
            </h2>
            <p>
              Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>Demo Hizmeti Sunumu:</strong> AR menü demo kurulumu ve demo hizmetinin 
                sağlanması
              </li>
              <li>
                <strong>İletişim:</strong> Sizinle iletişim kurmak, taleplerinize yanıt vermek ve 
                bilgilendirme yapmak
              </li>
              <li>
                <strong>Hizmet Geliştirme:</strong> Hizmetlerimizi geliştirmek, iyileştirmek ve 
                kullanıcı deneyimini artırmak
              </li>
              <li>
                <strong>Yasal Yükümlülükler:</strong> Yasal düzenlemelerden kaynaklanan 
                yükümlülüklerin yerine getirilmesi
              </li>
              <li>
                <strong>Güvenlik:</strong> Güvenlik önlemlerinin alınması ve dolandırıcılık 
                faaliyetlerinin önlenmesi
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              4. Kişisel Verilerin İşlenme Hukuki Sebepleri
            </h2>
            <p>
              Kişisel verileriniz KVKK'nın 5. ve 6. maddelerinde belirtilen aşağıdaki hukuki 
              sebeplere dayanılarak işlenmektedir:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Açık rızanız</li>
              <li>Sözleşmenin kurulması veya ifası ile doğrudan ilgili olması</li>
              <li>Yasal yükümlülüğün yerine getirilmesi</li>
              <li>Meşru menfaatlerimiz (hizmet geliştirme, güvenlik)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              5. Kişisel Verilerin Aktarılması
            </h2>
            <p>
              Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi için 
              aşağıdaki kategorilerdeki kişi ve kuruluşlarla paylaşılabilir:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>
                <strong>Hizmet Sağlayıcılar:</strong> Hosting, e-posta servisleri, analitik 
                araçları gibi teknik hizmet sağlayıcılar (gizlilik sözleşmeleri ile korunmaktadır)
              </li>
              <li>
                <strong>Yasal Otoriteler:</strong> Yasal yükümlülüklerimiz gereği yetkili 
                kamu kurum ve kuruluşları
              </li>
            </ul>
            <p className="mt-4">
              Kişisel verileriniz, yukarıda belirtilenler dışında üçüncü kişilerle paylaşılmaz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              6. Kişisel Verilerin Toplanma Yöntemi
            </h2>
            <p>
              Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Web sitemizdeki demo talep formu aracılığıyla</li>
              <li>E-posta, telefon veya WhatsApp üzerinden yaptığınız iletişimler</li>
              <li>Web sitemizi ziyaret ettiğinizde otomatik olarak toplanan teknik veriler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              7. KVKK Kapsamındaki Haklarınız
            </h2>
            <p>
              KVKK'nın 11. maddesi uyarınca, kişisel verilerinizle ilgili aşağıdaki haklara 
              sahipsiniz:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>KVKK'da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
              <li>Düzeltme, silme, yok edilme işlemlerinin, kişisel verilerin aktarıldığı 
                  üçüncü kişilere bildirilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler ile analiz edilmesi suretiyle 
                  aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın 
                  giderilmesini talep etme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              8. Haklarınızı Kullanma
            </h2>
            <p>
              Yukarıda belirtilen haklarınızı kullanmak için, kimliğinizi tespit edici belgelerle 
              birlikte aşağıdaki iletişim kanallarından biriyle başvuruda bulunabilirsiniz:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>E-posta:</strong> <a href="mailto:info@cha0sar.com" className="text-blue-600 hover:underline">info@cha0sar.com</a></li>
              <li><strong>Telefon:</strong> +90 505 048 52 04</li>
              <li><strong>Adres:</strong> İstanbul, Türkiye</li>
            </ul>
            <p className="mt-4">
              Başvurularınız, KVKK'nın 13. maddesi uyarınca en geç 30 gün içinde sonuçlandırılacaktır.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              9. Veri Saklama Süresi
            </h2>
            <p>
              Kişisel verileriniz, işlenme amaçlarının gerektirdiği süre boyunca ve yasal 
              saklama sürelerine uygun olarak saklanmaktadır. İşlenme amacının ortadan kalkması 
              veya yasal saklama süresinin dolması halinde verileriniz silinir, yok edilir veya 
              anonim hale getirilir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#0F172A] mt-8 mb-4">
              10. İletişim
            </h2>
            <p>
              KVKK kapsamındaki haklarınız ve kişisel verilerinizin işlenmesi hakkında 
              sorularınız için bizimle iletişime geçebilirsiniz:
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

