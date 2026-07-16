import React from "react";

interface StadiumGptLogoProps {
  className?: string;
  size?: number;
}

export const StadiumGptLogo: React.FC<StadiumGptLogoProps> = ({ className = "", size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none transition-transform duration-300 hover:scale-105 ${className}`}
      id="stadium-gpt-vector-logo"
    >
      <defs>
        {/* Metallic Gold Gradient */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF3D4" />
          <stop offset="30%" stopColor="#DFB76C" />
          <stop offset="70%" stopColor="#C5A059" />
          <stop offset="100%" stopColor="#8C6621" />
        </linearGradient>

        {/* Shiny Secondary Gold Gradient */}
        <linearGradient id="goldGradLight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF3D4" />
          <stop offset="50%" stopColor="#DFB76C" />
          <stop offset="100%" stopColor="#A37E36" />
        </linearGradient>

        {/* Deep Cyber Black-Blue Radial Gradient */}
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1C1E26" />
          <stop offset="60%" stopColor="#0B0C0F" />
          <stop offset="100%" stopColor="#060709" />
        </radialGradient>

        {/* Glowing Eyes Effect */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Soccer Hexagon Pattern for premium texture */}
        <pattern id="hexPattern" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M6 0 L12 3 L12 9 L6 12 L0 9 L0 3 Z" fill="none" stroke="#C5A059" strokeWidth="0.5" opacity="0.12" />
        </pattern>
      </defs>

      {/* Outer Glow / Soft shadow */}
      <circle cx="60" cy="60" r="56" fill="black" opacity="0.5" filter="blur(3px)" />

      {/* Main outer ring (Double gold border) */}
      <circle cx="60" cy="60" r="54" fill="url(#bgGrad)" stroke="url(#goldGrad)" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="49" stroke="url(#goldGrad)" strokeWidth="0.75" opacity="0.4" />

      {/* Hex pattern background inside */}
      <circle cx="60" cy="60" r="48" fill="url(#hexPattern)" />

      {/* Stadium Arc lines (Representing the Arena tier seating structure) */}
      <path d="M 18 78 A 44 44 0 0 0 102 78" stroke="url(#goldGrad)" strokeWidth="1" strokeDasharray="2,3" opacity="0.3" />
      <path d="M 22 84 A 40 40 0 0 0 98 84" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.5" />
      <path d="M 28 92 A 34 34 0 0 0 92 92" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

      {/* Robot Head Body */}
      {/* Ears/Headset */}
      <rect x="25" y="55" width="8" height="18" rx="3" fill="url(#goldGrad)" />
      <rect x="87" y="55" width="8" height="18" rx="3" fill="url(#goldGrad)" />
      {/* Headset arc */}
      <path d="M 29 57 A 31 31 0 0 1 91 57" fill="none" stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round" />

      {/* Robot Face Mask */}
      <rect x="33" y="44" width="54" height="42" rx="16" fill="#111217" stroke="url(#goldGrad)" strokeWidth="1.75" />
      
      {/* Glossy visor effect overlay */}
      <path d="M 35 60 C 35 48, 85 48, 85 60 C 85 53, 35 53, 35 60" fill="url(#goldGrad)" opacity="0.1" />

      {/* Glowing Eyes */}
      <ellipse cx="48" cy="62" rx="3.5" ry="6" fill="url(#goldGradLight)" filter="url(#glow)" />
      <ellipse cx="72" cy="62" rx="3.5" ry="6" fill="url(#goldGradLight)" filter="url(#glow)" />

      {/* Headset microphone */}
      <path d="M 31 69 L 41 77" stroke="url(#goldGrad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="42" cy="78" r="2" fill="url(#goldGrad)" />

      {/* Soccer Ball element positioned above the robot (Integrated soccer ball) */}
      <g transform="translate(60, 26)">
        {/* Ball Outer Shape */}
        <circle cx="0" cy="0" r="11" fill="#0A0B0D" stroke="url(#goldGrad)" strokeWidth="1.5" />
        {/* Soccer Hexagon/Pentagon Center */}
        <polygon points="0,-3 3,-1 2,2 -2,2 -3,-1" fill="url(#goldGrad)" />
        {/* Lines connecting center to outer ring */}
        <line x1="0" y1="-3" x2="0" y2="-11" stroke="url(#goldGrad)" strokeWidth="1" />
        <line x1="3" y1="-1" x2="9" y2="-6" stroke="url(#goldGrad)" strokeWidth="1" />
        <line x1="2" y1="2" x2="6.5" y2="8.5" stroke="url(#goldGrad)" strokeWidth="1" />
        <line x1="-2" y1="2" x2="-6.5" y2="8.5" stroke="url(#goldGrad)" strokeWidth="1" />
        <line x1="-3" y1="-1" x2="-9" y2="-6" stroke="url(#goldGrad)" strokeWidth="1" />
      </g>
    </svg>
  );
};
