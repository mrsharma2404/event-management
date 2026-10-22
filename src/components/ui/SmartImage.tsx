import Image, { type ImageProps } from 'next/image';
import { unsplash } from '@/lib/data/images';
import { cn } from '@/lib/cn';

/** next/image wrapper that accepts our Unsplash photo ids and adds a branded placeholder background. */
export function SmartImage({ photo, width = 1200, className, alt = '', ...rest }: Omit<ImageProps, 'src' | 'alt'> & { photo: string; width?: number; alt?: string }) {
  return (
    <Image
      src={unsplash(photo, width)}
      alt={alt}
      className={cn('bg-gradient-to-br from-cream-200 to-brand-600/40 object-cover', className)}
      {...(rest.fill ? {} : { width, height: Math.round(width * 0.66) })}
      {...rest}
    />
  );
}
