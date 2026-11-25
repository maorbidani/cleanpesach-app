import { ReactNode, useState } from 'react';

interface ResilientImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackGradient?: string;
  fallbackIcon?: ReactNode;
  loading?: 'eager' | 'lazy';
}

export function ResilientImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackGradient = 'from-[#DFECF2] via-[#EFECE6] to-[#D6E8DF]',
  fallbackIcon,
  loading = 'eager',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`w-full h-full bg-gradient-to-br ${fallbackGradient} dark:from-[#273630] dark:via-[#1E2B26] dark:to-[#243E35] flex items-center justify-center`}
      >
        {fallbackIcon}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
