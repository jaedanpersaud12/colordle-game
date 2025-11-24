'use client';

import { useEffect, useRef } from 'react';
import { HSL } from '@/lib/colors';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface ColorWheelProps {
  targetHsl: HSL | null;
  showHint: boolean;
  hintEnabled: boolean;
  onToggleHint: () => void;
  size?: number;
}

export function ColorWheel({
  targetHsl,
  showHint,
  hintEnabled,
  onToggleHint,
  size = 200
}: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size / 2 - 10;
    const innerRadius = outerRadius * 0.35;

    ctx.clearRect(0, 0, size, size);

    // Draw color wheel as a ring
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 90) * (Math.PI / 180);
      const endAngle = (angle + 1 - 90) * (Math.PI / 180);

      // Create gradient from inner to outer
      const gradient = ctx.createRadialGradient(
        centerX, centerY, innerRadius,
        centerX, centerY, outerRadius
      );
      gradient.addColorStop(0, `hsl(${angle}, 50%, 95%)`);
      gradient.addColorStop(0.5, `hsl(${angle}, 100%, 60%)`);
      gradient.addColorStop(1, `hsl(${angle}, 100%, 40%)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw center circle with subtle gradient
    const centerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, innerRadius
    );
    centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    centerGradient.addColorStop(1, 'rgba(240, 240, 240, 0.8)');

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = centerGradient;
    ctx.fill();

    // Draw hint if enabled
    if (showHint && hintEnabled && targetHsl) {
      const hintAngle = (targetHsl.h - 90) * (Math.PI / 180);
      const hintRadius = (outerRadius + innerRadius) / 2;

      // Draw hint indicator as a wedge
      const wedgeWidth = 15 * (Math.PI / 180); // 15 degrees wide
      ctx.beginPath();
      ctx.arc(
        centerX,
        centerY,
        outerRadius + 5,
        hintAngle - wedgeWidth / 2,
        hintAngle + wedgeWidth / 2
      );
      ctx.arc(
        centerX,
        centerY,
        innerRadius - 5,
        hintAngle + wedgeWidth / 2,
        hintAngle - wedgeWidth / 2,
        true
      );
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw a small dot at the hint position
      ctx.beginPath();
      ctx.arc(
        centerX + Math.cos(hintAngle) * hintRadius,
        centerY + Math.sin(hintAngle) * hintRadius,
        6,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [targetHsl, showHint, hintEnabled, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
      />
      {showHint && (
        <Button
          onClick={onToggleHint}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {hintEnabled ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Hint
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Show Hint
            </>
          )}
        </Button>
      )}
      {!showHint && (
        <p className="text-sm text-muted-foreground">Hint available after 3 guesses</p>
      )}
    </div>
  );
}
