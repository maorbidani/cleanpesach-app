import {
  Archive,
  BedDouble,
  Car,
  Home,
  Puzzle,
  Sofa,
  Sun,
  Utensils,
} from 'lucide-react';
import { RoomIconKey } from '../types';

interface RoomIconProps {
  icon: RoomIconKey;
  className?: string;
}

export function RoomIcon({ icon, className = 'w-5 h-5' }: RoomIconProps) {
  switch (icon) {
    case 'kitchen':
      return <Utensils className={className} aria-hidden="true" />;
    case 'living':
      return <Sofa className={className} aria-hidden="true" />;
    case 'master':
      return <BedDouble className={className} aria-hidden="true" />;
    case 'kids':
      return <Puzzle className={className} aria-hidden="true" />;
    case 'balcony':
      return <Sun className={className} aria-hidden="true" />;
    case 'storage':
      return <Archive className={className} aria-hidden="true" />;
    case 'car':
      return <Car className={className} aria-hidden="true" />;
    case 'custom':
    default:
      return <Home className={className} aria-hidden="true" />;
  }
}
