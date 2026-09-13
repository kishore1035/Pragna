'use client';

import React, { memo, useMemo } from 'react';
import AppIcon from './AppIcon';
import AppImage from './AppImage';

interface AppLogoProps {
  src?: string; // Image source (optional)
  variant?: 'shield' | 'full' | 'wordmark' | 'icon'; // Pragna variant
  iconName?: string; // Icon name when no image
  size?: number; // Size for icon/image (height for full/wordmark)
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
}

const AppLogo = memo(function AppLogo({
  src,
  variant = 'shield',
  iconName = 'SparklesIcon',
  size = 40,
  className = '',
  onClick,
}: AppLogoProps) {
  // Determine source image based on variant or custom src
  const imageSrc = useMemo(() => {
    if (src) return src;
    switch (variant) {
      case 'full':
        return '/assets/images/pragna-logo-full.png';
      case 'wordmark':
        return '/assets/images/pragna-wordmark.png';
      case 'icon':
        return '/assets/images/pragna-logo-icon.png';
      case 'shield':
      default:
        return '/assets/images/pragna-shield-icon.png';
    }
  }, [src, variant]);

  // Memoize className calculation
  const containerClassName = useMemo(() => {
    const classes = ['flex items-center select-none'];
    if (onClick) classes.push('cursor-pointer hover:opacity-85 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  // Aspect ratio calculation for horizontal variants
  const { width, height } = useMemo(() => {
    if (variant === 'full') {
      // 320 x 89 ~ 3.6:1
      return { width: Math.round(size * 3.6), height: size };
    }
    if (variant === 'wordmark') {
      // 215 x 26 ~ 8.2:1
      return { width: Math.round(size * 8.2), height: size };
    }
    return { width: size, height: size };
  }, [variant, size]);

  return (
    <div className={containerClassName} onClick={onClick}>
      {imageSrc ? (
        <AppImage
          src={imageSrc}
          alt="Pragna"
          width={width}
          height={height}
          className="flex-shrink-0 object-contain drop-shadow-sm"
          priority={true}
          unoptimized={imageSrc.endsWith('.svg')}
        />
      ) : (
        <AppIcon name={iconName} size={size} className="flex-shrink-0" />
      )}
    </div>
  );
});

export default AppLogo;
