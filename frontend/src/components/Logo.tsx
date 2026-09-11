import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  dark?: boolean;
}

export default function Logo({ size = 32, className = '', showText = true, dark = true }: LogoProps) {
  const textColor = dark ? 'text-white' : 'text-gray-800';
  const subColor = dark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="ph-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#818CF8" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#ph-grad)" />
        <path
          d="M12 13.5C12 12.12 13.12 11 14.5 11H20C21.38 11 22.5 12.12 22.5 13.5V20C22.5 21.38 21.38 22.5 20 22.5H14.5C13.12 22.5 12 21.38 12 20V13.5Z"
          fill="white"
          fillOpacity="0.95"
        />
        <path
          d="M23 17.5C23 16.12 24.12 15 25.5 15H28C29.38 15 30.5 16.12 30.5 17.5V26.5C30.5 27.88 29.38 29 28 29H25.5C24.12 29 23 27.88 23 26.5V17.5Z"
          fill="white"
          fillOpacity="0.65"
        />
        <rect x="14" y="14" width="4" height="3" rx="0.5" fill="#6366F1" fillOpacity="0.5" />
        <rect x="14" y="18.5" width="5" height="2" rx="0.5" fill="#6366F1" fillOpacity="0.35" />
        <rect x="25" y="18" width="3" height="2" rx="0.5" fill="#6366F1" fillOpacity="0.5" />
        <rect x="25" y="21.5" width="4" height="2" rx="0.5" fill="#6366F1" fillOpacity="0.35" />
      </svg>
      {showText && (
        <div className="leading-tight">
          <p className={`text-base font-bold tracking-tight ${textColor}`}>ProjectHub</p>
          <p className={`text-[10px] font-medium ${subColor} -mt-0.5`}>Project Management</p>
        </div>
      )}
    </div>
  );
}