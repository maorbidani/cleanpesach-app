import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Lock } from 'lucide-react';

interface CelebrationOverlayProps {
  roomName: string | null;
}

interface Particle {
  id: number;
  kind: 'spark' | 'leaf';
  startX: number;
  driftX: number;
  delay: number;
  duration: number;
  scale: number;
  rotation: number;
  color: string;
}

const PARTICLES: Particle[] = Array.from({ length: 18 }, (_, index) => {
  const isSpark = index % 2 === 0;
  const startX = 6 + ((index * 41) % 88);
  const driftX = ((index % 5) - 2) * 24;
  const delay = (index % 6) * 0.14;
  const duration = 2.0 + (index % 4) * 0.22;
  const scale = 0.78 + (index % 4) * 0.18;
  const rotation = (index * 47) % 360;
  const sparkColors = ['#D49A3A', '#E7B95D', '#C98A2B'];
  const leafColors = ['#5E8C7D', '#7AA697', '#8FB8CA'];

  return {
    id: index,
    kind: isSpark ? 'spark' : 'leaf',
    startX,
    driftX,
    delay,
    duration,
    scale,
    rotation,
    color: isSpark
      ? sparkColors[index % sparkColors.length]
      : leafColors[index % leafColors.length],
  };
});

export function CelebrationOverlay({ roomName }: CelebrationOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {roomName && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
          aria-live="polite"
        >
          {/* Floating Gold Sparks & Spring Leaves */}
          {!prefersReducedMotion &&
            PARTICLES.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{
                  opacity: 0,
                  y: -30,
                  x: `${particle.startX}vw`,
                  rotate: particle.rotation,
                  scale: particle.scale * 0.6,
                }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: ['0vh', '42vh', '88vh'],
                  x: [
                    `${particle.startX}vw`,
                    `${particle.startX + particle.driftX * 0.45}vw`,
                    `${particle.startX + particle.driftX}vw`,
                  ],
                  rotate:
                    particle.rotation + (particle.kind === 'leaf' ? 160 : 90),
                  scale: [
                    particle.scale * 0.7,
                    particle.scale * 1.1,
                    particle.scale * 0.85,
                  ],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: 'easeOut',
                }}
                className="absolute top-0 left-0 will-change-transform"
              >
              {particle.kind === 'spark' ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={particle.color}
                  aria-hidden="true"
                >
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={particle.color}
                  aria-hidden="true"
                >
                  <path d="M17 3C11.5 3 6.5 6.8 5 13C4.6 14.8 4.8 16.7 5.6 18.4L3.5 20.5L4.9 21.9L7 19.8C8.7 20.6 10.6 20.8 12.4 20.4C18.6 18.9 21 13.5 21 8V3H17ZM10.4 16.8C9.8 16.8 9.2 16.6 8.7 16.4L14.3 10.8L12.9 9.4L7.3 15C7.1 14.5 7 13.9 7 13.3C8.2 8.7 12.2 5.2 17 5H19V8C19 12.7 16.7 15.8 12 16.8H10.4Z" />
                </svg>
              )}
            </motion.div>
          ))}

          {/* Celebratory Top Banner */}
          <div className="w-full flex justify-center pt-20 px-4">
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.94 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#5E8C7D] text-white shadow-xl shadow-[#2D312E]/15 border border-white/20"
            >
              <Lock className="w-4 h-4 text-[#F5D68B] shrink-0" aria-hidden="true" />
              <span className="text-sm sm:text-base font-bold">
                {roomName} ננעל כנקי מחמץ! כל הכבוד
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
