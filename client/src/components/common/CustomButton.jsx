import { forwardRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * CustomButton — A sleek, highly tactile, custom-styled button component
 * designed specifically for Pathshala AI's dark/light design system.
 *
 * Variants:
 *  - 'primary'   : High-contrast solid button (white in dark / zinc-900 in light)
 *  - 'secondary' : Sleek glass-panel dark/light container with hover border highlight
 *  - 'accent'    : Subtle orange tint button with orange glow on hover
 *  - 'tab'       : Interactive tab button with distinct active/inactive pill states
 *  - 'ghost'     : Minimal borderless button with subtle hover background
 *  - 'icon'      : Circular or rounded-xl tactile icon action button
 */
const CustomButton = forwardRef(function CustomButton(
  {
    children,
    variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'tab' | 'ghost' | 'icon'
    size = 'md',        // 'xs' | 'sm' | 'md' | 'lg' | 'icon'
    icon: Icon = null,
    iconRight: IconRight = null,
    isActive = false,
    badge = null,
    className = '',
    disabled = false,
    type = 'button',
    onClick,
    ...props
  },
  ref
) {
  const { isDark } = useTheme();

  // 1. Size styles
  const sizeClasses = {
    xs: 'px-2 py-1 text-[10px] gap-1 rounded-md min-h-[26px]',
    sm: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg min-h-[32px]',
    md: 'px-3.5 py-2 text-xs sm:text-sm gap-2 rounded-xl min-h-[38px]',
    lg: 'px-4 py-2.5 text-sm sm:text-base gap-2.5 rounded-xl min-h-[44px]',
    icon: 'p-2 rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center'
  }[size] || 'px-3 py-1.5 text-xs gap-1.5 rounded-lg';

  // 2. Variant styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return isDark
          ? `
            bg-white hover:bg-zinc-100 text-zinc-950 font-bold
            active:scale-[0.97] transition-all duration-200
          `
          : `
            bg-zinc-900 hover:bg-black text-white font-bold shadow-xs
            active:scale-[0.97] transition-all duration-200
          `;

      case 'secondary':
        return isDark
          ? `
            bg-zinc-900/80 hover:bg-zinc-850 text-zinc-200 hover:text-zinc-50 font-semibold
            active:scale-[0.97] transition-all duration-150
          `
          : `
            bg-zinc-100 hover:bg-zinc-200/80 text-zinc-900 font-semibold
            active:scale-[0.97] transition-all duration-150
          `;

      case 'accent':
        return isDark
          ? `
            bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 hover:text-orange-300 font-bold
            active:scale-[0.97] transition-all duration-150
          `
          : `
            bg-orange-100 hover:bg-orange-200 text-orange-800 hover:text-orange-900 font-bold
            active:scale-[0.97] transition-all duration-150
          `;

      case 'tab':
        if (isActive) {
          return isDark
            ? `
              bg-orange-500/25 text-orange-400 font-bold
              transition-all duration-150
            `
            : `
              bg-zinc-200/80 text-zinc-900 font-bold
              transition-all duration-150
            `;
        }
        return isDark
          ? `
            text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60 font-medium
            transition-all duration-150
          `
          : `
            text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 font-medium
            transition-all duration-150
          `;

      case 'ghost':
        return isDark
          ? `
            text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70 font-medium
            active:scale-[0.97] transition-all duration-150
          `
          : `
            text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 font-medium
            active:scale-[0.97] transition-all duration-150
          `;

      case 'icon':
        return isDark
          ? `
            bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-orange-400
            active:scale-95 transition-all duration-150
          `
          : `
            bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900
            active:scale-95 transition-all duration-150
          `;

      default:
        return '';
    }
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center font-sans select-none cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${sizeClasses}
        ${getVariantClasses()}
        ${className}
      `.trim()}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />}
      {children && <span>{children}</span>}
      {badge !== null && badge !== undefined && (
        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/20 font-bold ml-0.5">
          {badge}
        </span>
      )}
      {IconRight && <IconRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
});

export default CustomButton;
