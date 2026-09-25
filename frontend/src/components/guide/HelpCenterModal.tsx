import React, { useState, useMemo } from "react";
import {
  HelpCircle,
  X,
  Compass,
  BookOpen,
  Keyboard,
  Layers,
  Search,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useGuideStore, type HelpTab } from "./guideStore";

interface SectionHelpItem {
  id: string;
  name: string;
  code: string;
  category: string;
  whatIsIt: string;
  howToUse: string;
  badge?: string;
}

const SECTION_HELP: SectionHelpItem[] = [
  {
    id: "home",
    name: "Ana Sayfa (Mission Control)",
    code: "HM",
    category: "Giriş & İzleme",
    whatIsIt:
      "Tüm finansal operasyonlarınızın merkez üssüdür. Dünya endeksleri, portföyünüzün toplam net değeri, sistem sağlığı ve son piyasa haberleri tek ekranda toplanır.",
    howToUse:
      "Günün ilk saatlerinde piyasaların yönünü kavramak ve yapay zeka piyasa raporunu (AI Outlook) tek tıkla üretmek için kullanın.",
    badge: "BAŞLANGIÇ",
  },
  {
    id: "stocks",
    name: "Piyasalar & Hisse Senetleri",
    code: "MK",
    category: "Analiz & Fiyat",
    whatIsIt:
      "Seçtiğiniz hissenin anlık fiyatını, gün içi en yüksek/en düşük seviyelerini, derinlik ve teknik mum grafiklerini gösteren ana analiz sayfasıdır.",
    howToUse:
      "Üstteki arama çubuğuna hisse sembolünü (örneğin AAPL, NVDA, THYAO) yazıp 'Load' butonuna basarak istediğiniz hissenin grafiğine ulaşabilirsiniz.",
  },
  {
    id: "workstation",
    name: "Grafik Çalışma İstasyonu",
    code: "WS",
    category: "Profesyonel Grafik",
    whatIsIt:
      "Birden fazla hisseyi aynı anda yan yana veya alt alta takip edebileceğiniz, esnek panellerden oluşan çoklu ekran çalışma masasıdır.",
    howToUse:
      "Aynı anda hem Apple hem Tesla hem de Altın grafiğini karşılaştırmalı olarak izlemek isteyen yatırımcılar için idealdir.",
  },
  {
    id: "screener",
    name: "Hisse Tarayıcısı (Screener)",
    code: "SC",
    category: "Filtreleme",
    whatIsIt:
      "Borsadaki binlerce hisseyi belirlediğiniz kriterlere göre filtreleyen arama motorudur.",
    howToUse:
      "'F/K oranı düşük olanlar', 'Günün en çok yükselenleri' veya 'Hacim rekoru kıranlar' gibi hazır filtreleri seçerek potansiyeli yüksek hisseleri anında bulun.",
  },
  {
    id: "portfolio",
    name: "Portföy & Sanal İşlemler (Paper Trading)",
    code: "PF",
    category: "Simülasyon",
    whatIsIt:
      "Kendi paranızı riske atmadan 100.000$ sanal bakiye ile gerçek zamanlı piyasa fiyatları üzerinden hisse alıp satabileceğiniz simülasyon ortamıdır.",
    howToUse:
      "Stratejilerinizi test edin, kâr/zarar (PnL) durumunuzu izleyin ve sermaye yönetimi deneyimi kazanın.",
    badge: "RİSKSİZ",
  },
  {
    id: "news",
    name: "Canlı Haberler & İstihbarat",
    code: "NW",
    category: "Haber & Bülten",
    whatIsIt:
      "Dünya finans basını ve borsa bültenlerinden toplanan haberleri piyasa duyarlılığına (Bullish / Pozitif veya Bearish / Negatif) göre etiketleyen haber akışıdır.",
    howToUse:
      "Haberleri hisse sembolüne göre filtreleyebilir, önemli gelişmeleri piyasalar açılmadan önce yakalayabilirsiniz.",
  },
  {
    id: "brain",
    name: "İkinci Beyin & Yatırım Notları",
    code: "BR",
    category: "Kişisel Notlar",
    whatIsIt:
      "Hisseler hakkında aldığınız notları, yatırım tezlerinizi ve hedeflerinizi saklayabileceğiniz entegre dijital defterdir.",
    howToUse:
      "Bir hisseyi neden aldığınızı veya hangi hedef fiyatta satacağınızı buraya kaydederek disiplinli işlem yapın.",
  },
  {
    id: "fno",
    name: "Vadeli İşlemler ve Opsiyonlar (F&O)",
    code: "FO",
    category: "Türev Piyasalar",
    whatIsIt:
      "Opsiyon zincirleri, Put/Call Rasyosu (PCR) ve vadeli kontratların risk/getiri profillerini inceleyen ileri seviye türev analiz modülüdür.",
    howToUse:
      "İleri düzey yatırımcıların piyasa yönünü ve oynaklık beklentilerini ölçmek için kullandığı bölümdür.",
  },
];

interface DictionaryTerm {
  term: string;
  english?: string;
  category: string;
  definition: string;
  example: string;
}

const DICTIONARY_TERMS: DictionaryTerm[] = [
  {
    term: "Ticker (Sembol)",
    english: "Ticker Symbol",
    category: "Temel Kavramlar",
    definition: "Bir şirketin borsada işlem gören kısa harf kodudur.",
    example: "Örneğin Apple için 'AAPL', Microsoft için 'MSFT', Türk Hava Yolları için 'THYAO'.",
  },
  {
    term: "Spot Fiyat",
    english: "Spot Price",
    category: "Temel Kavramlar",
    definition: "Varlığın hemen teslim ve anında nakit karşılığı alınıp satıldığı güncel borsa fiyatıdır.",
    example: "Hissenin anlık ekran fiyatı spot fiyattır.",
  },
  {
    term: "PnL (Kâr & Zarar)",
    english: "Profit & Loss",
    category: "İşlem Terimleri",
    definition: "Yatırımlarınızdan elde ettiğiniz toplam kâr veya zararı belirten finansal göstergedir.",
    example: "Pozitif değer yeşil renkle kârı (+), negatif değer kırmızı renkle zararı (-) gösterir.",
  },
  {
    term: "Boğa Piyasası (Bullish)",
    english: "Bull Market",
    category: "Piyasa Yönü",
    definition: "Fiyatların genel olarak yükseliş trendinde olduğu, yatırımcıların iyimser olduğu piyasa durumudur.",
    example: "Endeks sürekli yeni rekorlar kırıyorsa boğa piyasası hakimdir.",
  },
  {
    term: "Ayı Piyasası (Bearish)",
    english: "Bear Market",
    category: "Piyasa Yönü",
    definition: "Fiyatların düşüş trendinde olduğu, satış baskısının ve kötümserliğin arttığı piyasa durumudur.",
    example: "Zirveden %20'den fazla düşen piyasalar ayı piyasası olarak adlandırılır.",
  },
  {
    term: "Hacim (Volume)",
    english: "Trading Volume",
    category: "Teknik Analiz",
    definition: "Belirli bir zaman diliminde (örneğin 1 günde) el değiştiren toplam hisse adedidir.",
    example: "Fiyat artarken hacmin de artması yükselişin güçlü olduğuna işaret eder.",
  },
  {
    term: "RSI İndikatörü",
    english: "Relative Strength Index",
    category: "Teknik Analiz",
    definition: "0 ile 100 arasında değer alan aşırı alım/satım göstergesidir.",
    example: "RSI 70 üzerine çıkarsa hisse 'aşırı alınmış' (düzeltme gelebilir), 30 altına inerse 'aşırı satılmış' (tepki gelebilir) kabul edilir.",
  },
  {
    term: "Gecikmeli (Delayed) Veri",
    english: "Delayed Data",
    category: "Veri Akışı",
    definition: "Borsa kuralları ve veri lisansları gereğince kullanıcılara 15 dakika gecikmeyle iletilen resmi borsa verisidir.",
    example: "Ekranda sarı 'DELAYED' yazıyorsa fiyatlar 15 dakika önceki resmi takas verisini yansıtır.",
  },
  {
    term: "Seans (Market Status)",
    english: "Market Session",
    category: "Piyasa Durumu",
    definition: "Borsanın alım-satım işlemlerine açık (OPEN) ya da kapalı (CLOSED) olduğunu ifade eder.",
    example: "NYSE (New York Borsası) Türkiye saatiyle 16:30 - 23:00 arasında açıktır.",
  },
  {
    term: "F&O (Futures & Options)",
    english: "Futures & Options",
    category: "Türev Piyasalar",
    definition: "Gelecekteki belirli bir tarihte belirli bir fiyattan alma ya da satma hakkı veren vadeli türev sözleşmeleridir.",
    example: "Riskten korunmak (hedge) veya kaldıraçlı işlem yapmak için kullanılır.",
  },
];

export function HelpCenterModal() {
  const {
    isHelpOpen,
    activeHelpTab,
    setActiveHelpTab,
    closeHelp,
    startTour,
    resetOnboarding,
  } = useGuideStore();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTION_HELP;
    const q = searchQuery.toLowerCase();
    return SECTION_HELP.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.whatIsIt.toLowerCase().includes(q) ||
        s.howToUse.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return DICTIONARY_TERMS;
    const q = searchQuery.toLowerCase();
    return DICTIONARY_TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        (t.english && t.english.toLowerCase().includes(q)) ||
        t.definition.toLowerCase().includes(q) ||
        t.example.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isHelpOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-900/35 dark:bg-black/75 p-3 md:p-6 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-center-title"
    >
      <div className="relative flex h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-terminal-border/80 bg-terminal-panel shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-terminal-border px-5 py-3.5 bg-terminal-panel">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-terminal-accent/15 text-terminal-accent">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="help-center-title" className="text-base font-bold text-terminal-text">
                SoftBridge Finans • Yardım ve Rehber Merkezi
              </h2>
              <p className="text-[11px] text-terminal-muted">
                Platform bölümleri, yeni başlayanlar için terimler sözlüğü ve kullanım kılavuzu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeHelp();
                startTour(0);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded border border-terminal-accent/50 bg-terminal-accent/10 px-3 py-1.5 text-xs font-semibold text-terminal-accent transition-colors hover:bg-terminal-accent/20"
              title="Sitedeki her bölümü adım adım gezdiren turu başlat"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>İnteraktif Rehberi Başlat</span>
            </button>
            <button
              onClick={closeHelp}
              className="rounded p-1.5 text-terminal-muted transition-colors hover:bg-terminal-bg hover:text-terminal-text"
              aria-label="Kapat"
              title="Kapat (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation & Search bar */}
        <div className="flex shrink-0 flex-col gap-2 border-b border-terminal-border bg-terminal-panel/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveHelpTab("sections")}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeHelpTab === "sections"
                  ? "bg-terminal-accent text-black font-bold shadow-sm"
                  : "text-terminal-muted hover:bg-terminal-bg hover:text-terminal-text"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Sitedeki Bölümler ({filteredSections.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveHelpTab("dictionary")}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeHelpTab === "dictionary"
                  ? "bg-terminal-accent text-black font-bold shadow-sm"
                  : "text-terminal-muted hover:bg-terminal-bg hover:text-terminal-text"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Finans Sözlüğü ({filteredTerms.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveHelpTab("shortcuts")}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeHelpTab === "shortcuts"
                  ? "bg-terminal-accent text-black font-bold shadow-sm"
                  : "text-terminal-muted hover:bg-terminal-bg hover:text-terminal-text"
              }`}
            >
              <Keyboard className="h-3.5 w-3.5" />
              <span>Kısayollar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveHelpTab("start")}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeHelpTab === "start"
                  ? "bg-terminal-accent text-black font-bold shadow-sm"
                  : "text-terminal-muted hover:bg-terminal-bg hover:text-terminal-text"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Hızlı Başlangıç</span>
            </button>
          </div>

          {/* Search box */}
          {(activeHelpTab === "sections" || activeHelpTab === "dictionary") && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-terminal-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Arama yapın..."
                className="w-full rounded border border-terminal-border bg-terminal-bg py-1.5 pl-8 pr-3 text-xs text-terminal-text placeholder-terminal-muted outline-none focus:border-terminal-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-terminal-muted hover:text-terminal-text"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* TAB 1: Sitedeki Bölümler */}
          {activeHelpTab === "sections" && (
            <div className="space-y-3">
              <p className="mb-2 text-xs text-terminal-muted">
                Aşağıda SoftBridge Finans platformundaki tüm ana sayfaların ve araçların hiç borsa bilmeyen birine göre açıklaması yer almaktadır:
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {filteredSections.map((sec) => (
                  <div
                    key={sec.id}
                    className="flex flex-col justify-between rounded-md border border-terminal-border bg-terminal-bg/70 p-4 transition-all hover:border-terminal-accent/40"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-terminal-border/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-terminal-panel px-1.5 py-0.5 font-mono text-[10px] font-bold text-terminal-accent">
                            {sec.code}
                          </span>
                          <h4 className="text-sm font-bold text-terminal-text">{sec.name}</h4>
                        </div>
                        {sec.badge && (
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                            {sec.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-terminal-text/90">
                        {sec.whatIsIt}
                      </p>
                    </div>

                    <div className="mt-3 rounded border border-terminal-border/40 bg-terminal-panel/40 p-2.5 text-[11px] text-terminal-muted">
                      <span className="font-semibold text-terminal-accent">Nasıl Kullanılır? </span>
                      {sec.howToUse}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Finans Sözlüğü */}
          {activeHelpTab === "dictionary" && (
            <div className="space-y-3">
              <p className="mb-2 text-xs text-terminal-muted">
                Borsada ve finansal analizlerde en sık karşılaşacağınız terimlerin sade açıklamaları:
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {filteredTerms.map((term) => (
                  <div
                    key={term.term}
                    className="rounded-md border border-terminal-border bg-terminal-bg/70 p-4"
                  >
                    <div className="flex items-center justify-between border-b border-terminal-border/60 pb-1.5">
                      <h4 className="text-sm font-bold text-terminal-text">{term.term}</h4>
                      {term.english && (
                        <span className="text-[10px] font-mono text-terminal-muted">
                          {term.english}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-terminal-text/90">
                      {term.definition}
                    </p>
                    <div className="mt-2.5 rounded bg-terminal-panel/50 px-2 py-1.5 text-[11px] text-terminal-muted">
                      <span className="font-medium text-terminal-text">Örnek: </span>
                      {term.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Kısayollar */}
          {activeHelpTab === "shortcuts" && (
            <div className="max-w-2xl space-y-4">
              <p className="text-xs text-terminal-muted">
                Platform hızında işlem yapmak için tasarlanmış klavye kısayolları:
              </p>
              <div className="space-y-2 rounded-2xl border border-terminal-border/80 bg-terminal-bg/60 p-4">
                {[
                  { keys: "Ctrl + G", desc: "Hisse veya sembol arama çubuğuna hemen odaklanır" },
                  { keys: "Ctrl + K / Cmd + K", desc: "Hızlı komut paletini (Command Palette) açar" },
                  { keys: "Esc", desc: "Açık olan pencereleri, modalları ve menüleri kapatır" },
                  { keys: "R", desc: "Veri akışını ve canlı haber listesini tazeler" },
                  { keys: "Ctrl + Shift + S", desc: "Hisse Tarayıcısı (Screener) ekranına zıplar" },
                  { keys: "Ctrl + Shift + W", desc: "Gelişmiş Çalışma İstasyonu (Workstation) ekranını açar" },
                ].map((sc) => (
                  <div
                    key={sc.keys}
                    className="flex items-center justify-between border-b border-terminal-border/40 py-2 text-xs last:border-b-0"
                  >
                    <span className="text-terminal-text">{sc.desc}</span>
                    <kbd className="rounded-lg border border-terminal-border bg-terminal-panel px-2.5 py-1 font-mono text-[11px] font-semibold text-terminal-accent shadow-xs">
                      {sc.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Hızlı Başlangıç & Rehber */}
          {activeHelpTab === "start" && (
            <div className="max-w-2xl space-y-5">
              <div className="rounded-2xl border-2 border-terminal-accent/40 bg-terminal-accent/10 p-5">
                <div className="flex items-center gap-2.5 text-terminal-accent">
                  <Compass className="h-6 w-6" />
                  <h3 className="text-base font-bold text-terminal-text">
                    İnteraktif Tanıtım Rehberini Başlat
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-terminal-muted">
                  Platformun arama çubuğundan mum grafiklerine, yapay zeka analizinden portföy yönetimine kadar her bölümü 9 adımda canlı canlı tanıtan interaktif tura hemen katılın.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeHelp();
                    startTour(0);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-terminal-accent px-4 py-2 text-xs font-bold text-white shadow transition-all hover:bg-terminal-accent-hover active:scale-95"
                >
                  <span>Rehberi Başlat</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-terminal-border/80 bg-terminal-bg/60 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-terminal-text">
                  İlk Giriş Sorusunu Sıfırla
                </h4>
                <p className="mt-1 text-xs text-terminal-muted">
                  Sitenin ilk açılışında çıkan "Platformu Biliyor musunuz?" karşılama penceresini tekrar görmek isterseniz ayarınızı sıfırlayabilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    resetOnboarding();
                    closeHelp();
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-terminal-border px-3.5 py-1.5 text-xs text-terminal-muted transition-colors hover:border-terminal-text hover:text-terminal-text active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Karşılama Sorusunu Sıfırla ve Aç</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
