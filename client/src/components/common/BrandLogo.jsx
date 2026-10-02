import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * BrandLogo - Theme-aware dynamic logo component for Pathshala AI.
 *
 * Automatically renders the crisp White variant in Dark mode and Black variant in Light mode.
 * Supports both 'icon' (square emblem) and 'full' (mark + company name) variants.
 */
export default function BrandLogo({
  variant = 'icon',
  className = '',
  themeOverride = null,
  alt = 'Pathshala AI',
  width,
  height,
  ...props
}) {
  const { isDark: contextIsDark } = useTheme();

  const isDark = themeOverride ? themeOverride === 'dark' : contextIsDark;

  let src = '';
  let defaultWidth = 24;
  let defaultHeight = 24;

  if (variant === 'full') {
    src = isDark ? '/logos/logo-full-white.png' : '/logos/logo-full-black.png';
    defaultWidth = 171;
    defaultHeight = 32;
  } else {
    // variant === 'icon'
    src = isDark ? '/logos/logo-icon-white.png' : '/logos/logo-icon-black.png';
    defaultWidth = 24;
    defaultHeight = 24;
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width || defaultWidth}
      height={height || defaultHeight}
      fetchPriority="high"
      decoding="async"
      className={`object-contain select-none shrink-0 ${className}`}
      {...props}
    />
  );
}
