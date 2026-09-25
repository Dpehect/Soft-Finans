type UmayFoxLogoProps = {
  className?: string;
  size?: number;
  showRays?: boolean;
};

/**
 * Umay (UMY) Token Göksel Koruyucu Tilki Logosu
 * Eski Türk mitolojisindeki Umay Ana bereket ve koruyuculuk ruhunu temsil eden,
 * SoftBridge tilkisinden tamamen farklı; hilal auralı, göksel kanatlı ve altın-turkuaz taçlı
 * mistik "Umay Tilkisi" sikke (coin) madalyonu.
 */
export function UmayFoxLogo({ className = "", size = 48, showRays = true }: UmayFoxLogoProps) {
  const idPrefix = "umay_fox_coin_";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Umay Token Göksel Tilki Logosu"
    >
      <defs>
        {/* Altın Sikke Kenarlık Gradyanı */}
        <linearGradient id={`${idPrefix}gold_rim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF1B8" />
          <stop offset="25%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="75%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Göksel Turkuaz Gradyanı */}
        <linearGradient id={`${idPrefix}cyan_glow`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0891B2" />
          <stop offset="45%" stopColor="#06B6D4" />
          <stop offset="85%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>

        {/* Derin Göksel Madalyon Zemin Gradyanı */}
        <radialGradient id={`${idPrefix}coin_bg`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#162544" />
          <stop offset="60%" stopColor="#0B132B" />
          <stop offset="100%" stopColor="#050814" />
        </radialGradient>

        {/* Tilki Yüzü Altın/Turuncu Gradyanı */}
        <linearGradient id={`${idPrefix}fox_fur_main`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="80%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Mistik Beyaz / İpeksi Yanak Gradyanı */}
        <linearGradient id={`${idPrefix}fox_white_fur`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F0FDFA" />
          <stop offset="100%" stopColor="#CCFBF1" />
        </linearGradient>

        {/* Parlama Filtresi */}
        <filter id={`${idPrefix}glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. SİKKE TABANI VE DIŞ HALKA */}
      {/* Arka Işıma */}
      <circle cx="50" cy="50" r="48" fill={`url(#${idPrefix}coin_bg)`} />
      
      {/* Sikke Dış Dişli / Noktalı Çerçevesi */}
      <circle
        cx="50"
        cy="50"
        r="47"
        stroke={`url(#${idPrefix}gold_rim)`}
        strokeWidth="2.5"
        strokeDasharray="4 2.5"
        className="opacity-90"
      />
      <circle
        cx="50"
        cy="50"
        r="43.5"
        stroke={`url(#${idPrefix}cyan_glow)`}
        strokeWidth="1.2"
        opacity="0.8"
      />

      {/* 2. ARKA GÖKSEL HİLAL & IŞIK HALKASI (Umay Ana Aurası) */}
      {showRays && (
        <path
          d="M 50 10 A 38 38 0 0 1 85 64 A 36 36 0 0 0 50 16 Z"
          fill={`url(#${idPrefix}gold_rim)`}
          opacity="0.25"
        />
      )}

      {/* Göksel Koruyucu Kanat / Rüzgar Çizgileri */}
      <path
        d="M 16 48 C 12 36 20 22 34 26 C 26 28 22 36 25 45 Z"
        fill={`url(#${idPrefix}cyan_glow)`}
        opacity="0.85"
      />
      <path
        d="M 84 48 C 88 36 80 22 66 26 C 74 28 78 36 75 45 Z"
        fill={`url(#${idPrefix}gold_rim)`}
        opacity="0.9"
      />

      {/* 3. UMAY GÖKSEL TİLKİSİ (BAŞ VE KULAKLAR) */}
      <g filter={`url(#${idPrefix}glow)`}>
        {/* Sol Uzun Göksel Kulak */}
        <path
          d="M 50 40 L 26 13 C 28 24 35 34 40 43 Z"
          fill={`url(#${idPrefix}cyan_glow)`}
        />
        {/* Sağ Uzun Göksel Kulak */}
        <path
          d="M 50 40 L 74 13 C 72 24 65 34 60 43 Z"
          fill={`url(#${idPrefix}fox_fur_main)`}
        />

        {/* Sol Kulak İçi Mistik Tüy */}
        <path
          d="M 46 38 L 30 18 C 32 26 38 34 41 38 Z"
          fill="#E0F2FE"
          opacity="0.9"
        />
        {/* Sağ Kulak İçi Altın Tüy */}
        <path
          d="M 54 38 L 70 18 C 68 26 62 34 59 38 Z"
          fill="#FEF3C7"
          opacity="0.9"
        />

        {/* Alın & Baş Gövdesi */}
        <path
          d="M 50 34 L 38 46 L 50 56 L 62 46 Z"
          fill={`url(#${idPrefix}fox_fur_main)`}
        />

        {/* Umay Alın Taç Kristali (Üçüncü Göz / Umay Ana Ruhu) */}
        <polygon points="50,28 54,35 50,42 46,35" fill={`url(#${idPrefix}cyan_glow)`} />
        <circle cx="50" cy="35" r="2" fill="#FFFFFF" />

        {/* Göksel Hilal Alın Deseni */}
        <path
          d="M 44 26 C 47 24 53 24 56 26 C 53 25 47 25 44 26 Z"
          stroke={`url(#${idPrefix}gold_rim)`}
          strokeWidth="1.5"
          fill="none"
        />

        {/* Sol Mistik Yanak Tüyleri (Geniş & Zarif Kanatvari) */}
        <path
          d="M 38 46 C 24 48 18 58 26 67 C 32 64 36 58 40 55 Z"
          fill={`url(#${idPrefix}fox_white_fur)`}
        />
        {/* Sağ Mistik Yanak Tüyleri */}
        <path
          d="M 62 46 C 76 48 82 58 74 67 C 68 64 64 58 60 55 Z"
          fill={`url(#${idPrefix}fox_white_fur)`}
        />

        {/* Burun Üst Köprüsü */}
        <path
          d="M 50 52 L 42 62 L 50 75 L 58 62 Z"
          fill={`url(#${idPrefix}fox_fur_main)`}
        />

        {/* Çene ve Burun Ucu */}
        <polygon points="46.5,73 53.5,73 50,77.5" fill="#0F172A" />
        <circle cx="50" cy="74" r="1.2" fill={`url(#${idPrefix}gold_rim)`} />

        {/* Gözler - Çekik, Bilge ve Büyülü Umay Bakışı */}
        {/* Sol Göz */}
        <path
          d="M 36 51 C 39 49 43 51 45 54 C 42 55 38 54 36 51 Z"
          fill="#0B132B"
        />
        <circle cx="41" cy="52" r="1.6" fill="#00F0FF" />
        <circle cx="41.5" cy="51.5" r="0.6" fill="#FFFFFF" />

        {/* Sağ Göz */}
        <path
          d="M 64 51 C 61 49 57 51 55 54 C 58 55 62 54 64 51 Z"
          fill="#0B132B"
        />
        <circle cx="59" cy="52" r="1.6" fill="#F59E0B" />
        <circle cx="58.5" cy="51.5" r="0.6" fill="#FFFFFF" />

        {/* Çene Altı Göksel Göğüs Yelesi */}
        <path
          d="M 42 68 L 50 82 L 58 68 C 55 72 45 72 42 68 Z"
          fill={`url(#${idPrefix}cyan_glow)`}
          opacity="0.95"
        />
      </g>

      {/* 4. SİKKE YAZILARI & SİMGELERİ */}
      {/* Sikke Alt Şeridi: UMY */}
      <rect
        x="36"
        y="83"
        width="28"
        height="10"
        rx="5"
        fill="#080F1F"
        stroke={`url(#${idPrefix}gold_rim)`}
        strokeWidth="1.2"
      />
      <text
        x="50"
        y="90.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="900"
        fontFamily="sans-serif"
        letterSpacing="1.5"
        fill={`url(#${idPrefix}gold_rim)`}
      >
        UMY
      </text>

      {/* Yan Mini Yıldızlar */}
      <circle cx="28" cy="88" r="1.2" fill="#67E8F9" />
      <circle cx="72" cy="88" r="1.2" fill="#FDE68A" />
      <circle cx="20" cy="50" r="1" fill="#FDE68A" />
      <circle cx="80" cy="50" r="1" fill="#67E8F9" />
    </svg>
  );
}

export default UmayFoxLogo;
