import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline' | 'dark' | 'light' | 'ghost' | 'ghost-light' | 'ghost-dark' | 'link';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/50 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-ink hover:bg-brand-600 hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(217,158,11,.35)]',
  outline: 'border-[1.5px] border-brand-600 text-ink hover:bg-brand',
  dark: 'bg-ink text-cream hover:bg-ink-600',
  light: 'bg-cream text-ink hover:bg-white',
  ghost: 'text-ink-600 hover:bg-cream-100 hover:text-brand-700',
  'ghost-light': 'border-[1.5px] border-white/60 text-white hover:bg-white/10',
  'ghost-dark': 'border-[1.5px] border-ink/70 text-ink hover:bg-ink hover:text-cream',
  link: 'text-brand-700 underline-offset-4 hover:underline px-0 py-0 rounded-none',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-3 text-[0.95rem]',
  lg: 'px-7 py-3.5 text-base',
};

interface Common {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function buttonClass({ variant = 'primary', size = 'md', block, className }: Omit<Common, 'children'>) {
  return cn(base, variants[variant], variant !== 'link' && sizes[size], block && 'w-full', className);
}

export function Button({
  variant, size, block, loading, className, children, disabled, ...rest
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass({ variant, size, block, className })} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant, size, block, className, children, href, ...rest
}: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <Link href={href} className={buttonClass({ variant, size, block, className })} {...rest}>
      {children}
    </Link>
  );
}
