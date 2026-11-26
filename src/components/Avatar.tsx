import React from 'react';

interface AvatarProps {
  name: string;
  initials: string;
  imageUrl?: string;
  bgClass?: string;
  textClass?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  showOnlineDot?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-sm',
  md: 'w-11 h-11 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-14 h-14 text-lg',
  '2xl': 'w-28 h-28 text-3xl',
};

const DOT_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-2 h-2 ring-2',
  sm: 'w-2.5 h-2.5 ring-2',
  md: 'w-2.5 h-2.5 ring-2',
  lg: 'w-3 h-3 ring-2',
  xl: 'w-3 h-3 ring-2',
  '2xl': 'w-4 h-4 ring-[3px] bottom-1 right-1',
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  initials,
  imageUrl,
  bgClass = 'bg-primary-fixed',
  textClass = 'text-on-primary-fixed',
  size = 'md',
  isOnline = false,
  showOnlineDot = true,
  className = '',
}) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  React.useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  return (
    <div className={`relative shrink-0 inline-flex ${className}`}>
      <div
        className={`${SIZE_CLASSES[size]} rounded-full overflow-hidden flex items-center justify-center font-semibold select-none ${
          !imageUrl || imgFailed ? `${bgClass} ${textClass}` : 'bg-surface-container'
        }`}
      >
        {imageUrl && !imgFailed ? (
          <img
            src={imageUrl}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {showOnlineDot && isOnline && (
        <span
          title="Online"
          className={`absolute bottom-0 right-0 rounded-full bg-[#22c55e] ring-surface-container-lowest ${DOT_CLASSES[size]}`}
        />
      )}
    </div>
  );
};
