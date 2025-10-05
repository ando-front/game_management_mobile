import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  onLongPress,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  className = ''
}) => {
  const [pressing, setPressing] = React.useState(false);
  const longPressTimer = React.useRef<number | null>(null);

  const handleTouchStart = () => {
    if (disabled || !onLongPress) return;

    setPressing(true);
    longPressTimer.current = window.setTimeout(() => {
      onLongPress();
      setPressing(false);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setPressing(false);
  };

  const handleClick = () => {
    if (disabled) return;
    if (onClick && !onLongPress) {
      onClick();
    }
  };

  const baseClasses = 'rounded-lg font-bold transition-all duration-200 active:scale-95';

  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300'
  };

  const sizeClasses = {
    small: 'px-4 py-2 text-sm min-h-[44px]',
    medium: 'px-6 py-3 text-base min-h-[48px]',
    large: 'px-8 py-4 text-lg min-h-[56px] w-4/5 mx-auto'
  };

  const pressingClass = pressing ? 'opacity-70 scale-95' : '';

  return (
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={onLongPress ? handleTouchStart : undefined}
      onMouseUp={onLongPress ? handleTouchEnd : undefined}
      onMouseLeave={onLongPress ? handleTouchEnd : undefined}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${pressingClass} ${className}`}
    >
      {children}
    </button>
  );
};
