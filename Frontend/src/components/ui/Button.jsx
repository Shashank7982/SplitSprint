import React from 'react';

const variants = {
  primary:
    'bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white font-semibold shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] hover:shadow-[0_0_35px_-5px_rgba(247,147,26,0.7)] hover:scale-105',
  outline:
    'bg-transparent border-2 border-white/20 text-white hover:border-white hover:bg-white/10',
  ghost:
    'bg-transparent text-white hover:bg-white/10 hover:text-[#F7931A]',
  danger:
    'bg-gradient-to-r from-red-700 to-red-500 text-white font-semibold hover:scale-105 shadow-[0_0_20px_-5px_rgba(220,38,38,0.4)]',
};

const sizes = {
  sm:  'px-4 py-2 text-sm',
  md:  'px-6 py-3 text-sm',
  lg:  'px-8 py-4 text-base',
};

const Button = React.forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      className = '',
      disabled = false,
      loading = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'relative inline-flex items-center justify-center gap-2',
          'rounded-full transition-all duration-300 tracking-wide',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F7931A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#030304]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
          'min-h-[44px]',
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          className,
        ].join(' ')}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
