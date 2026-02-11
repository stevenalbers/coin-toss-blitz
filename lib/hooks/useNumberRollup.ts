import { useState, useEffect } from "react";

/**
 * Hook for animating number changes with smooth rollup effect
 *
 * @param target - Target value to animate to
 * @param duration - Animation duration in milliseconds (default: 1000ms)
 * @param onComplete - Optional callback when animation completes
 * @returns Current animated value (rounded to integer)
 *
 * @example
 * const displayValue = useNumberRollup(player.chips, 1500);
 * return <span>{displayValue} 🪙</span>
 */
export function useNumberRollup(
  target: number,
  duration: number = 1000,
  onComplete?: () => void
): number {
  const [current, setCurrent] = useState(target);
  const [startValue, setStartValue] = useState(target);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    // Reset animation when target changes
    setStartValue(current);
    setStartTime(Date.now());

    let animationFrame: number;

    const animate = () => {
      if (!startTime) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutQuart for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 4);

      const newValue = startValue + (target - startValue) * eased;
      setCurrent(newValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setCurrent(target);
        onComplete?.();
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration]);

  return Math.round(current);
}

/**
 * Formats a chip change value with + or - prefix
 * @example formatChipChange(35) => "+35"
 * @example formatChipChange(-25) => "-25"
 */
export function formatChipChange(change: number): string {
  return change > 0 ? `+${change}` : `${change}`;
}
