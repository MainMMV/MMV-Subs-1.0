import React from "react";

interface MMVLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const MMVLogo: React.FC<MMVLogoProps> = ({ size = 32, className = "", showText = false }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <img src="/favicon.svg" width={size} height={size} alt="" className="shrink-0 rounded-lg" />
    {showText && (
      <span className="text-sm font-medium text-neutral-900">
        MMV <span className="text-neutral-500">Hub</span>
      </span>
    )}
  </div>
);
