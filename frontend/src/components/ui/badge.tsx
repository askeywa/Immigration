import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className = '', children, ...props }) => {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  const styles = variant === 'outline'
    ? 'border border-gray-300 text-gray-700 bg-white'
    : 'bg-red-600 text-white';
  return (
    <span className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Badge;

