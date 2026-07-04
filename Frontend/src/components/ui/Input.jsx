import React from 'react';

const Input = React.forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      className = '',
      wrapperClassName = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    return (
      <div className={['flex flex-col gap-1', wrapperClassName].join(' ')}>
        {label && (
          <label className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <Icon
              size={16}
              className="absolute left-3 text-[#94A3B8] pointer-events-none"
            />
          )}
          <input
            ref={ref}
            type={type}
            className={[
              'w-full bg-black/50 text-white text-sm placeholder:text-white/25',
              'border-b-2 border-white/20 px-4 py-3',
              'focus:outline-none focus:border-[#F7931A]',
              'focus:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200',
              Icon ? 'pl-9' : '',
              error ? 'border-red-500 focus:border-red-400' : '',
              className,
            ].join(' ')}
            {...props}
          />
        </div>
        {error && (
          <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
