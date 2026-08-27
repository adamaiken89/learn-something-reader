import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const TOGGLE_ACTIVE_CLASSES = 'bg-indigo-600 text-white';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // Legacy CourseReader variants — class lists preserved verbatim from
        // the pre-shadcn Button so call sites keep identical visuals.
        primary:
          'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 hover:shadow-md hover:-translate-y-0.5',
        secondary:
          'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm hover:-translate-y-0.5',
        danger: 'bg-red-700 text-white hover:bg-red-600 hover:shadow-sm hover:-translate-y-0.5',
        ghost: 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50',
        outline:
          'border border-gray-600/30 text-gray-400 hover:border-gray-400 hover:text-gray-200 hover:bg-gray-600/20 hover:shadow-sm hover:-translate-y-0.5',
        toggleActive: TOGGLE_ACTIVE_CLASSES,
        toggle: 'bg-gray-700 text-gray-200 hover:bg-gray-600',
        // shadcn-standard aliases.
        default:
          'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm hover:-translate-y-0.5',
        destructive:
          'bg-red-700 text-white hover:bg-red-600 hover:shadow-sm hover:-translate-y-0.5',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-sm',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
);

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
  ref?: React.Ref<HTMLButtonElement>;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = ({
  ref,
  className,
  variant,
  size,
  asChild = false,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
      ) : null}
      {children}
    </Comp>
  );
};

Button.displayName = 'Button';
