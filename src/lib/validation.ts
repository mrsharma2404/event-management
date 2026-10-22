import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .transform(v => v.replace(/\D/g, '').slice(-10))
  .refine(v => /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit mobile number');

const optionalNumber = z.preprocess(v => (v === '' || v == null ? undefined : Number(v)), z.number().int().positive().optional());

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name'),
  phone,
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email')]).optional(),
  category: z.string().optional(),
  destination: z.string().optional(),
  date: z.string().optional(),
  guests: optionalNumber,
  budget: z.string().optional(),
  message: z.string().max(1000).optional(),
  packageSlug: z.string().optional(),
  source: z.string().default('website'),
});
export type EnquiryInput = z.input<typeof enquirySchema>;

export const contactSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your name'),
    phone,
    email: z.string().trim().email('Enter a valid email'),
    city: z.string().optional(),
    whatsapp: z.boolean(),
    gstInvoice: z.boolean(),
    company: z.string().optional(),
    gstin: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.gstInvoice) return;
    if (!v.company?.trim()) ctx.addIssue({ code: 'custom', path: ['company'], message: 'Company name is required' });
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(v.gstin?.trim() ?? ''))
      ctx.addIssue({ code: 'custom', path: ['gstin'], message: 'Enter a valid 15-character GSTIN' });
  });

export const eventDetailsSchema = z.object({
  time: z.string(),
  hosts: z.string().optional(),
  food: z.string(),
  notes: z.string().max(1000).optional(),
});

export const bookingDetailsSchema = z.object({
  contact: contactSchema,
  event: eventDetailsSchema,
  date: z.string().min(1, 'Pick a date'),
  guests: z.coerce.number().int().positive(),
  terms: z.literal(true, { errorMap: () => ({ message: 'Please accept to continue' }) }),
});
export type BookingDetailsInput = z.input<typeof bookingDetailsSchema>;
export type BookingDetailsValues = z.output<typeof bookingDetailsSchema>;

export const bookingRequestSchema = z.object({
  packageSlug: z.string(),
  tier: z.enum(['classic', 'premium', 'luxe']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().positive(),
  addons: z.array(z.string()),
  coupon: z.string().nullable().optional(),
  contact: contactSchema,
  event: eventDetailsSchema,
  paymentMode: z.enum(['advance', 'full']),
  paymentMethod: z.enum(['upi', 'card', 'netbanking', 'emi']),
});

export function luhn(num: string) {
  if (!/^\d{13,19}$/.test(num)) return false;
  let sum = 0;
  [...num].reverse().forEach((d, i) => {
    let n = +d;
    if (i % 2) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  });
  return sum % 10 === 0;
}
