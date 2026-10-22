import type { Metadata } from 'next';
import { WishlistView } from '@/components/account/WishlistView';

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false } };

export default function WishlistPage() {
  return (
    <div className="container">
      <h1 className="py-8 font-serif text-3xl font-bold">Your wishlist</h1>
      <WishlistView />
    </div>
  );
}
