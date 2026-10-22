import { cn } from '@/lib/cn';

export const inputClass =
  'w-full rounded-[10px] border-[1.5px] border-line bg-white px-3.5 py-2.5 text-ink transition placeholder:text-ink-400/70 focus:border-brand-600 focus:outline-none focus:ring-[3px] focus:ring-brand/25 aria-[invalid=true]:border-danger disabled:bg-cream-100 read-only:bg-cream-100/60';

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[0.8rem] font-semibold text-ink-600">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { ref?: React.Ref<HTMLSelectElement> }) {
  return (
    <select className={cn(inputClass, 'cursor-pointer', className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }) {
  return <textarea className={cn(inputClass, 'min-h-[96px] resize-y', className)} {...props} />;
}

export function Checkbox({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; ref?: React.Ref<HTMLInputElement> }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-sm', className)}>
      <input type="checkbox" className="mt-0.5 h-[18px] w-[18px] flex-none accent-brand-700" {...props} />
      <span>{label}</span>
    </label>
  );
}
