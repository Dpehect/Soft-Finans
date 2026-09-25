export interface TourStep {
  id: string;
  category: string;
  title: string;
  description: string;
  beginnerTip: string;
  targetSelector?: string;
  pageLink?: {
    path: string;
    label: string;
  };
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "search-command",
    category: "Hızlı Arama & Komutlar",
    title: "1. Arama ve Komut Çubuğu (Ctrl+G)",
    description:
      "Terminaldeki en güçlü gezinme aracıdır. Ekranın en üstünde yer alır. Buraya örneğin 'AAPL' (Apple) veya 'THYAO' yazarak doğrudan hisseye gidebilir, 'HOME', 'SCREENER' gibi komutlarla sayfalara anında sıçrayabilirsiniz.",
    beginnerTip:
      "Klavyeden 'Ctrl + G' (veya Mac'te Cmd + G) tuşlarına bastığınızda imleç hemen buraya odaklanır. 'Ctrl + K' ise hızlı komut paletini açar.",
    targetSelector: "#ot-command-bar",
    pageLink: { path: "/", label: "Ana Sayfada Göster" },
  },
  {
    id: "ticker-tape",
    category: "Piyasa Şeridi",
    title: "2. Canlı Piyasa ve Seans Bantları",
    description:
      "Arama kutusunun hemen altındaki bantta S&P 500, NASDAQ, DOW Jones, Altın (Gold) ve Petrol (Crude Oil) gibi dünya piyasalarının anlık fiyatlarını ve yüzdelik değişimlerini görürsünüz. Yeşil renk yükselişi (+), kırmızı renk düşüşü (-) ifade eder.",
    beginnerTip:
      "En sağdaki 'NSE / NYSE: OPEN / CLOSED' etiketleri borsaların şu anda işleme açık mı kapalı mı olduğunu gösterir.",
    targetSelector: ".ot-ticker-tape",
  },
  {
    id: "icon-rail",
    category: "Ana Gezinme",
    title: "3. Sol Menü Çubuğu (Icon Rail)",
    description:
      "Terminalin tüm ana modüllerine sol dikey çubuktan erişilir:\n• HM: Ana Sayfa (Mission Control & Özetler)\n• MK: Piyasalar & Hisse Senetleri\n• WS: Gelişmiş Çalışma İstasyonu (Workstation)\n• SC: Hisse Tarayıcısı (Filtreler)\n• PF: Portföy ve Sanal Alım-Satım\n• NW: Güncel Finans Haberleri\n• BR: Yatırım Notları & İkinci Beyin",
    beginnerTip:
      "Her butonun üzerine geldiğinizde sayfanın tam adını ve açıklamasını görebilirsiniz.",
    targetSelector: "aside[aria-label='Primary icon rail']",
  },
  {
    id: "top-controls",
    category: "Piyasa & Para Birimi",
    title: "4. Borsa ve Para Birimi Seçicisi",
    description:
      "Üst bardaki açılır menülerden işlem yapacağınız borsayı (ABD / US veya Hindistan / IN) ve gösterge para birimini (USD, EUR, INR) tek tıkla değiştirebilirsiniz. Tüm fiyatlar ve grafikler otomatik olarak seçtiğiniz piyasaya uyarlanır.",
    beginnerTip:
      "Ayrıca üst bardaki 'AÇIK / DENGELİ' butonu ile terminalin rengini göz dinlendirici orta ton veya aydınlık tema yapabilirsiniz.",
  },
  {
    id: "stock-charts",
    category: "Grafik & Teknik Analiz",
    title: "5. İnteraktif Mum Grafikleri (Stocks)",
    description:
      "Hisse ekranında dünyanın en popüler grafik motoru olan TradingView tarzı mum grafikler yer alır. Grafiğin zaman dilimini (1 dakika, 15 dakika, 1 gün, 1 ay) seçebilir; RSI, MACD, Hareketli Ortalamalar gibi 80'den fazla teknik analiz indikatörünü grafiğe ekleyebilirsiniz.",
    beginnerTip:
      "Mum grafiğinde yeşil mum o zaman aralığında fiyatın yükseldiğini, kırmızı mum ise düştüğünü gösterir.",
    pageLink: { path: "/equity/stocks", label: "Hisseler Sayfasına Git" },
  },
  {
    id: "ai-outlook",
    category: "Yapay Zeka",
    title: "6. Yapay Zeka Piyasa Raporu (AI Outlook)",
    description:
      "Ana sayfada bulunan 'AI Market Outlook' butonu, güncel piyasa verilerini ve son dakika haberlerini saniyeler içinde analiz eder. Karmaşık finansal terimlerle boğuşmak yerine yapay zekanın çıkardığı özet trend ve duyarlılık raporunu okuyabilirsiniz.",
    beginnerTip:
      "Yapay zeka analizi özellikle piyasa açılışlarında günün yönünü anlamak için harika bir yardımcıdır.",
    pageLink: { path: "/home", label: "Ana Sayfada İncele" },
  },
  {
    id: "portfolio-paper",
    category: "İşlem & Simülasyon",
    title: "7. Portföy ve Sanal Alım-Satım (Paper Trading)",
    description:
      "Hiçbir gerçek para riske atmadan 100.000$ sanal bakiye ile hisse alıp satabilirsiniz! Stratejilerinizi test edin, alım-satım emirleri verin ve kâr/zarar (PnL) durumunuzu profesyonel portföy grafikleriyle takip edin.",
    beginnerTip:
      "'Paper Trading' (Kağıt Üzerinde İşlem), profesyonel borsacıların bile yeni stratejileri denerken kullandığı risksiz simülasyon yöntemidir.",
    pageLink: { path: "/equity/portfolio", label: "Portföye Git" },
  },
  {
    id: "screener",
    category: "Filtreleme & Keşif",
    title: "8. Hisse Tarayıcısı (Screener)",
    description:
      "Borsadaki binlerce hisse senedi arasından kriterlerinize uyanları anında bulmanızı sağlar. Örneğin 'Fiyatı 50$'ın altında olan', 'Bugün %3'ten fazla yükselen' veya 'Hacmi en yüksek' hisseleri saniyeler içinde listeler.",
    beginnerTip:
      "Tarayıcıdaki hazır filtreleri kullanarak piyasanın en çok hareket gören yıldız hisselerini kolayca keşfedebilirsiniz.",
    pageLink: { path: "/equity/screener", label: "Tarayıcıyı Aç" },
  },
  {
    id: "help-support",
    category: "Destek & Sözlük",
    title: "9. Yardım Merkezi & Terimler Sözlüğü",
    description:
      "Tebrikler! SoftBridge Finans terminalinin temel bölümlerini öğrendiniz. Aklınıza takılan herhangi bir finansal terim (Spot, F&O, Ticker, Volatilite, PnL vb.) olduğunda sağ üstteki 'Yardım' butonuna tıklayarak sözlüğe ve kılavuza 7/24 ulaşabilirsiniz.",
    beginnerTip:
      "Bu tanıtım turunu dilediğiniz an üst menüdeki 'Rehber' butonuna basarak tekrar başlatabilirsiniz.",
  },
];
