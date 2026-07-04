import React from 'react';

const Card = React.forwardRef(
  ({ className = '', glass = false, hover = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          'rounded-2xl border transition-all duration-300',
          glass
            ? 'bg-black/40 backdrop-blur-lg border-white/10'
            : 'bg-[#0F1115] border-white/10',
          hover
            ? 'hover:-translate-y-1 hover:border-[#F7931A]/40 hover:shadow-[0_0_40px_-10px_rgba(247,147,26,0.25)]'
            : '',
          className,
        ].join(' ')}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = ({ className = '', children, ...props }) => (
  <div className={['p-6 pb-3', className].join(' ')} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className = '', children, ...props }) => (
  <h3
    className={['font-heading font-semibold text-xl text-white', className].join(' ')}
    {...props}
  >
    {children}
  </h3>
);

const CardDescription = ({ className = '', children, ...props }) => (
  <p className={['text-[#94A3B8] text-sm mt-1', className].join(' ')} {...props}>
    {children}
  </p>
);

const CardContent = ({ className = '', children, ...props }) => (
  <div className={['p-6 pt-3', className].join(' ')} {...props}>
    {children}
  </div>
);

const CardFooter = ({ className = '', children, ...props }) => (
  <div className={['p-6 pt-0', className].join(' ')} {...props}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
