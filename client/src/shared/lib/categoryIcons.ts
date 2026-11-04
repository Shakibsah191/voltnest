import { BatteryCharging, Cable, Car, Headphones, Plug, Usb, Zap, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  chargers: Plug,
  'power-banks': BatteryCharging,
  cables: Cable,
  'hubs-docks': Usb,
  audio: Headphones,
  'car-charging': Car,
};

export const categoryIcon = (slug: string): LucideIcon => ICONS[slug] ?? Zap;
