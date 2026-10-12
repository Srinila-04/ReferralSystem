import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default',
  className = ''
}) => {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary-50 text-secondary",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    navy: "bg-navy/10 text-navy",
    periwinkle: "bg-[#7188C9]/15 text-[#092565]",
    gold: "bg-[#F8BB08]/20 text-amber-900",
    neutral: "bg-slate-100 text-slate-600",
  };

  const selectedVariantClass = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedVariantClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;

