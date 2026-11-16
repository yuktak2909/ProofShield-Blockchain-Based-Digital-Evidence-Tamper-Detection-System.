import React from "react";

/**
 * ProofShield Redesigned Official Logo
 * Palette: Charcoal (#343239) & Burgundy (#873D50)
 * Concepts: Digital evidence protection, security, blockchain-backed trust & integrity.
 */
export const ProofShieldLogoIcon = ({ size = 36, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <defs>
      <linearGradient id="psBurgundyGrad" x1="24" y1="4" x2="41" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9C445C" />
        <stop offset="100%" stopColor="#732F40" />
      </linearGradient>
      <linearGradient id="psCharcoalGrad" x1="7" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4A4652" />
        <stop offset="100%" stopColor="#28262C" />
      </linearGradient>
    </defs>

    {/* Left Facet: Structural Charcoal */}
    <path
      d="M24 4C14.5 4.5 7 8.5 7 19C7 31 16.5 40.5 24 44V4Z"
      fill="url(#psCharcoalGrad)"
    />

    {/* Right Facet: Protective Burgundy */}
    <path
      d="M24 4C33.5 4.5 41 8.5 41 19C41 31 31.5 40.5 24 44V4Z"
      fill="url(#psBurgundyGrad)"
    />

    {/* Center Division Line */}
    <line
      x1="24"
      y1="4"
      x2="24"
      y2="44"
      stroke="#FFFFFF"
      strokeOpacity="0.18"
      strokeWidth="0.75"
    />

    {/* Evidence Verification Checkmark */}
    <path
      d="M14.5 23.5L21.5 30.5L33.5 16.5"
      stroke="#FFFFFF"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Cryptographic Node Anchor */}
    <circle cx="33.5" cy="16.5" r="2.25" fill="#FFFFFF" />
    <circle cx="33.5" cy="16.5" r="4.2" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="1" />
  </svg>
);

const ProofShieldLogo = ({
  variant = "dark", // "dark" (for charcoal sidebar), "light" (for white/warm background), "icon"
  size = "md",      // "sm", "md", "lg"
  className = ""
}) => {
  const iconSizes = { sm: 28, md: 36, lg: 44 };
  const iconSize = iconSizes[size] || 36;

  if (variant === "icon") {
    return <ProofShieldLogoIcon size={iconSize} className={className} />;
  }

  const isDark = variant === "dark";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <ProofShieldLogoIcon size={iconSize} />
      <div className="flex flex-col">
        <span
          className={`font-extrabold tracking-tight leading-none ${
            size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg"
          } ${isDark ? "text-white" : "text-[#343239]"}`}
        >
          Proof<span className={isDark ? "text-[#F2E2E7]" : "text-[#873D50]"}>Shield</span>
        </span>
        <span
          className={`font-semibold tracking-widest uppercase mt-1 leading-none ${
            size === "sm" ? "text-[8px]" : "text-[9px]"
          } ${isDark ? "text-[#BDB7C2]" : "text-[#57515A]"}`}
        >
          Digital Evidence Integrity
        </span>
      </div>
    </div>
  );
};

export default ProofShieldLogo;

