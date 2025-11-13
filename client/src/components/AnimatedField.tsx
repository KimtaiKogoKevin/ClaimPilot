import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedFieldProps {
  children: React.ReactNode;
  shouldAnimate: boolean;
  onAnimationComplete?: () => void;
}

export function AnimatedField({ 
  children, 
  shouldAnimate,
  onAnimationComplete 
}: AnimatedFieldProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (shouldAnimate) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        onAnimationComplete?.();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [shouldAnimate, onAnimationComplete]);

  if (!isAnimating) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
      animate={{ backgroundColor: 'rgba(34, 197, 94, 0)' }}
      transition={{ duration: 2, ease: 'easeOut' }}
      className="rounded-md"
      style={{ position: 'relative' }}
    >
      <motion.div
        initial={{ boxShadow: '0 0 0 4px rgba(34, 197, 94, 0.4)' }}
        animate={{ boxShadow: '0 0 0 0px rgba(34, 197, 94, 0)' }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="rounded-md"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
