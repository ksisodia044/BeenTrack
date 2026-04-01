interface BrandMarkProps {
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: {
    frame: 'h-9 w-9 rounded-xl',
    image: 'h-7 w-7 rounded-lg',
  },
  md: {
    frame: 'h-14 w-14 rounded-2xl',
    image: 'h-10 w-10 rounded-xl',
  },
};

export function BrandMark({ size = 'md', className = '' }: BrandMarkProps) {
  const classes = sizeClasses[size];

  return (
    <div
      className={`inline-flex items-center justify-center border border-primary/10 bg-gradient-to-br from-white via-primary-50 to-secondary shadow-soft ${classes.frame} ${className}`.trim()}
    >
      <img
        src="/apple-touch-icon.png"
        alt="BeanTrack logo"
        className={`object-cover shadow-sm ${classes.image}`}
      />
    </div>
  );
}
