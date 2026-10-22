import { Building2, Cake, Camera, Castle, Gem, Mic, Wine, Sparkles, type LucideProps } from 'lucide-react';

const ICONS = { gem: Gem, castle: Castle, camera: Camera, cake: Cake, building: Building2, mic: Mic, wine: Wine };

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Sparkles;
  return <Icon {...props} />;
}
