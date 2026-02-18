export const constants = {
  marketing: {
    hero: {
      h1: "	Siparişte Belirsizliğe Son: Her Tabağın Gerçek Sunumunu Anında Keşfedin",
      sub: "Lezzetlerinizi 3D Canlandırın",
      ctaPrimary: "Hemen Canlı Demoyu Deneyin",
      chips: [
        { text: "12 saatte aktif", icon: "clock" },
        { text: "POS ve Garson düzeni değişmez", icon: "checkCircle2" },
        { text: "Anlık Güncelleme Paneli", icon: "users" },
        { text: "Uygulama indirme yok", icon: "smartphone" },
        { text: "Kararı hızlandır, satışları artır", icon: "zap" },
        { text: "Taahhüt yok, istediğin zaman iptal", icon: "shieldCheck" },
      ],
      microFlow: {
        title: "QR'ı tara → Ürünü Masanda Gör → Güvenle Sipariş Ver",
        description: "Mevcut düzeninizi bozmaz. Sadece satış deneyimini güçlendirir.",
        subDescription: "AR menü kullanan restoranların sipariş hızlarında artış görülür.",
        subDescription2: "Müşteriler daha hızlı ve güvenle sipariş verebilir.",
        
      },
      categories: [
        "Burger",
        "Pizza ",
        "Steakhouse",
        "Beach Club & Lounge",
        "Fine Dining",
      ],
      firstInTurkey: "Türkiye’de satış artırmaya odaklanan AR menü sistemlerinden biri.",
    },
    sections: {
      whyMoreSales: {
        h2: "Müşteriler gördüğünü daha kolay satın alır.",
        sub: "ChaosAR, karar sürecini hızlandırır ve sepeti büyütür.",
        cards: [
          {
            title: "Sipariş süresi kısalır",
            text: "Masada bekleme süresi %20–30 azalır.",
          },
          {
            title: "En kârlı ürünler daha çok satılır",
            text: "Yıldız ürünleri AR’de öne çıkararak sepet ortalamasını büyütürsün.",
          },
          {
            title: "İade/şikayet azalır",
            text: "Porsiyon ve ürün beklentisi netleşir, memnuniyet artar.",
          },
        ],
        bottomText: "ChaosAR, kararsızlığı azaltır, sipariş hızını artırır ve sepeti büyütür.",
      },
      howItWorks: {
        h2: "Menünüz vitrine dönüşür.",
        sub: "Müşteri ürünü görür, ne alacağını bilir. Menü daha ikna edici olur.",
        steps: [
          {
            title: "Ürünler AR’de Canlanır",
            text: "Müşteriler telefonlarıyla QR kodu tarar.",
            note: "Porsiyon, sunum ve detaylar netleşir.",
          },
          {
            title: "Karar Süresi Kısalır.",
            text: "Müşteri kafasında soru işareti kalmaz.",
            note: "Ne alacağını net görür, daha hızlı karar verir.",
          },
          {
            title: "Menü yönlendirir, müşteri seçer.",
            text: "Seçilen ürün AR ile görselleştirilir.",
            note: "Öne çıkarmak istediğiniz ürünler vurgulanır.",
            noteBold: false,
          },
        ],
        bottomText: "Her restoranın menüsü farklıdır. ChaosAR buna göre ölçeklenir.",
        bottomSubText: "Ürün sayısı, kategori yapısı ve vitrin kurgusu size özel hazırlanır.",
        
      },
      packages: {
        h2: "İhtiyacınıza göre ölçeklenen paketler",
        sub: "İhtiyacınıza uygun paketi seçin, süreci birlikte planlayalım.",
        plans: [
          {
            name: "Başlangıç",
            description: "AR menüye hızlı giriş yapmak isteyen küçük işletmeler için",
            features: [
              "3 ürün için AR deneyimi",
              "QR menü (mobil uyumlu)",
              "Kurulum ve yönlendirme dahil",
              "Temel destek",
            ],
            popular: false,
          },
          {
            name: "Standart",
            description:
              "İmza ürünleri öne çıkarır, menünün satış gücünü artırır.",
            features: [
              "6–8 ürün için AR deneyimi",
              "Sınırlı özel tasarım(Logo & Renkler)",
              "QR menü + çoklu kategori düzeni",
              "Ürün sıralama & vitrin optimizasyonu",
              "Öne çıkan ürün etiketleri",
              "Masa üstü QR yönlendirme yapısı",
              "Garson & sipariş süreciyle uyumlu yapı",
              "2 revize hakkı",
              "Öncelikli destek",
            ],
            popular: true,
          },
          {
            name: "Premium",
            description:
              "Tüm menüyü dijital vitrine dönüştürmek isteyen yüksek hacimli ve zincir restoranlar için",
            features: [
              "Standard’daki HER ŞEY +",
              "Tam menü AR (sınırsız ürün)",
              "Özel tasarım (marka rengi & tema)",
              "Kategori & ürün bazlı özel akışlar",
              "Kampanya / öne çıkan ürün senaryoları",
              "Aylık ürün ekleme & güncelleme",
              "Kullanım & etkileşim analiz raporu",
              "Sürekli revize imkânı",
              "Öncelikli & hızlı destek",
            ],
            popular: false,
          },
        ],
        pricingNotes: [
          "Kurulum süreci hızlıdır",
          "Mevcut sipariş düzeniniz değişmez",
          "Demo ücretsizdir, herhangi bir taahhüt içermez.",
        ],
        howToStart: {
          title: "Nasıl başlanır?",
          steps: [
            "Demo inceleyin",
            "İhtiyacınızı belirleyelim",
            "12 saatte yayına alalım",
          ],
        },
        cta: {
          primary: "Fiyat Al / Demo İste",
          subtext: "Ücretsiz demo ve ihtiyaç analizi",
        },
      },
    },
    whatsapp: {
      message: "Merhaba, ChaosAR AR menü sistemini web sitenizde inceledim. Restoranım için nasıl uygulanabileceğini ve demo görmek istiyorum.",
    },
  },
  demo: {
    title: "Demo Burger",
    subtitle: "by ChaosAR",
    items: [
      {
        id: "classic-burger",
        name: "Classic Burger",
        price: "₺145",
        description: "Taze et, marul, domates ve özel sos ile hazırlanmış klasik burger.",
        image: "/images/classic-burger.jpg",
      },
      {
        id: "pepperoni-pizza",
        name: "Pepperoni Pizza",
        price: "₺165",
        description: "Bol pepperoni, mozzarella peyniri ve özel pizza sosu ile.",
        image: "/images/pepperoni-pizza.jpg",
      },
      {
        id: "makarnalar",
        name: "Fettuccine Alfredo",
        price: "₺165",
        description: "Krema bazlı Alfredo sos, parmesan peyniri ve özel sos ile.",
        image: "/images/makarna.jpg",
      },
      {
        id: "chicken-wrap",
        name: "Tavuk Wrap",
        price: "₺95",
        description: "Izgara tavuk, taze sebzeler ve özel sos ile.",
        image: "/images/chicken-wrap.jpg",
      },
      {
        id: "kahvaltı tabağı",
        name: "Kahvaltı Tabağı",
        price: "₺85",
        description: "Taze marul, parmesan peyniri, kruton ve caesar sos.",
        image: "/images/kahvaltı-tabağı.jpg",
      },
      {
        id: "french-fries",
        name: "Patates Kızartması",
        price: "₺45",
        description: "Altın sarısı, çıtır patates kızartması.",
        image: "/images/french-fries.jpg",
      },
      {
        id: "patates-kızartması",
        name: "Patates Kızartması",
        price: "₺45",
        description: "Altın sarısı, çıtır patates kızartması.",
        image: "/images/patates-kızartması.jpg",
      },
      {
        id: "cola",
        name: "Kola",
        price: "₺25",
        description: "Soğuk, ferahlatıcı kola.",
        image: "/images/cola.jpg",
      },
      {
        id: "tatlılar",
        name: "SUfle",
        price: "₺25",
        description: "Soğuk, ferahlatıcı kola.",
        image: "/images/sufle.jpg",
      },
    ],
    footer: {
      text: "Bu menü ChaosAR ile hazırlanmıştır.",
      question: "Kendi restoranınızda denemek ister misiniz?",
      cta: "Ana siteye dön",
    },
  },
} as const;

