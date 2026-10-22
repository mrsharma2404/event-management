import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BookingRecord, BookingRequest, Coupon, EnquiryRecord, EventPackage } from '@/types';
import type { EnquiryInput } from '@/lib/validation';
import { visitorHeaders } from '@/lib/analytics/client';

/** RTK Query client for the Next.js route handlers under /api. */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    // Lets the server tie bookings/enquiries (and their conversion events) to the visitor's session.
    prepareHeaders: headers => {
      for (const [k, v] of Object.entries(visitorHeaders())) headers.set(k, v);
      return headers;
    },
  }),
  tagTypes: ['Booking', 'Enquiry'],
  endpoints: build => ({
    searchPackages: build.query<{ total: number; items: EventPackage[] }, string>({
      query: qs => `packages${qs ? `?${qs}` : ''}`,
    }),
    validateCoupon: build.mutation<Coupon, { code: string }>({
      query: body => ({ url: 'coupons/validate', method: 'POST', body }),
    }),
    createEnquiry: build.mutation<EnquiryRecord, EnquiryInput>({
      query: body => ({ url: 'enquiries', method: 'POST', body }),
      invalidatesTags: ['Enquiry'],
    }),
    getEnquiries: build.query<EnquiryRecord[], string[]>({
      query: ids => `enquiries?ids=${ids.join(',')}`,
      providesTags: ['Enquiry'],
    }),
    createBooking: build.mutation<BookingRecord, BookingRequest>({
      query: body => ({ url: 'bookings', method: 'POST', body }),
      invalidatesTags: ['Booking'],
    }),
    getBooking: build.query<BookingRecord, string>({
      query: id => `bookings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Booking', id }],
    }),
    getBookings: build.query<BookingRecord[], string[]>({
      query: ids => `bookings?ids=${ids.join(',')}`,
      providesTags: ['Booking'],
    }),
    sendOtp: build.mutation<{ sent: boolean; demoCode: string }, { phone: string }>({
      query: body => ({ url: 'auth/otp', method: 'POST', body }),
    }),
    verifyOtp: build.mutation<{ name: string; phone: string }, { phone: string; code: string; name: string }>({
      query: body => ({ url: 'auth/verify', method: 'POST', body }),
    }),
  }),
});

export const {
  useSearchPackagesQuery,
  useValidateCouponMutation,
  useCreateEnquiryMutation,
  useGetEnquiriesQuery,
  useCreateBookingMutation,
  useGetBookingQuery,
  useGetBookingsQuery,
  useSendOtpMutation,
  useVerifyOtpMutation,
} = api;
