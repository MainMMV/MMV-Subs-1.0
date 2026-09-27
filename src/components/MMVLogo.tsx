import React from "react";

interface MMVLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const MMVLogo: React.FC<MMVLogoProps> = ({ 
  size = 32, 
  className = "",
  showText = false 
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Stylized M Ribbon Mark without words below */}
      <div 
        className="shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-2xs"
        style={{ width: size, height: size }}
      >
        <svg 
          viewBox="0 0 256 256" 
          width="100%" 
          height="100%" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#282D35" />
              <stop offset="100%" stopColor="#21252C" />
            </linearGradient>
            <linearGradient id="logoMain" x1="15%" y1="20%" x2="85%" y2="80%">
              <stop offset="0%" stopColor="#B2CE81" />
              <stop offset="50%" stopColor="#A2C36E" />
              <stop offset="100%" stopColor="#8DB059" />
            </linearGradient>
            <linearGradient id="logoLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#768F51" />
              <stop offset="100%" stopColor="#556939" />
            </linearGradient>
            <linearGradient id="logoLeftFold" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4E6034" />
              <stop offset="100%" stopColor="#6B8349" />
            </linearGradient>
            <linearGradient id="logoRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#728B4E" />
              <stop offset="50%" stopColor="#819C5B" />
              <stop offset="100%" stopColor="#617741" />
            </linearGradient>
            <filter id="logoShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="-1" dy="3" stdDeviation="3" floodColor="#181B20" floodOpacity="0.38" />
            </filter>
          </defs>

          <rect width="256" height="256" rx="56" fill="url(#logoBg)" />

          <g transform="translate(32, 44)">
            {/* Left Lower Fold */}
            <path
              d="M 16,112 C 16,134 32,148 50,148 C 68,148 76,134 76,112 L 76,46 C 76,28 66,20 50,20 C 34,20 16,32 16,56 Z"
              fill="url(#logoLeft)"
            />
            {/* Left Arc */}
            <path
              d="M 16,84 C 16,118 28,148 48,148 C 64,148 74,136 74,110 C 74,80 52,62 38,62 C 26,62 16,70 16,84 Z"
              fill="url(#logoLeftFold)"
              opacity="0.9"
            />
            {/* Right Stem */}
            <path
              d="M 176,112 C 176,134 160,148 142,148 C 124,148 116,134 116,112 L 116,72 L 156,20 C 168,20 176,30 176,48 Z"
              fill="url(#logoRight)"
            />
            {/* Front Ribbon V */}
            <path
              d="M 16,54 C 16,28 32,16 52,16 C 68,16 82,26 96,44 L 118,74 C 124,82 130,82 136,74 L 160,40 C 170,24 176,16 192,16 L 192,20 C 192,38 182,54 168,72 L 114,144 C 106,154 94,154 86,144 L 32,74 C 22,60 16,50 16,54 Z"
              fill="url(#logoMain)"
              filter="url(#logoShadow)"
            />
            {/* Top Left Arch Cap */}
            <path
              d="M 16,48 C 16,26 32,16 52,16 C 70,16 84,28 94,44 L 62,88 C 46,66 32,56 16,48 Z"
              fill="#ADC778"
            />
            {/* Top Right Overlap */}
            <path
              d="M 152,48 L 174,16 C 184,20 192,30 192,44 L 192,112 C 192,134 178,148 160,148 C 146,148 138,138 138,122 L 138,82 Z"
              fill="url(#logoRight)"
            />
            {/* Center Fold Highlight */}
            <path
              d="M 52,16 C 70,16 84,28 98,48 L 106,128 C 102,136 94,136 90,128 L 36,54 C 40,32 46,16 52,16 Z"
              fill="#B8D485"
              opacity="0.85"
            />
          </g>
        </svg>
      </div>

      {/* Brand Text Name (MMV in primary text, Host in warm beige) */}
      {showText && (
        <div className="flex items-center gap-1 font-medium tracking-tight">
          <span className="text-sm text-neutral-900 tracking-wide font-medium">MMV</span>
          <span className="text-sm text-[#B6B29B] font-normal">Host</span>
        </div>
      )}
    </div>
  );
};
