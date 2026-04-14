import { useEffect, useRef } from 'react';

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>{}[]'.split('');
    let cols: number;
    let drops: number[];
    let animationFrameId: number;

    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      cols = Math.floor(c.width / 14);
      if (!drops || drops.length !== cols) {
        drops = Array.from({ length: cols }, () => Math.random() * -50);
      }
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(7,9,13,0.18)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.font = '13px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.97 ? 'rgba(0,230,118,0.5)' : 'rgba(0,230,118,0.09)';
        ctx.fillText(ch, i * 14, drops[i] * 14);
        if (drops[i] * 14 > c.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.35;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize, { passive: true });
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      id="matrix" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.4
      }} 
    />
  );
}
