/**
 * confetti.js
 * High-performance, zero-dependency HTML5 Canvas confetti celebration animation.
 * Features realistic particle physics: gravity, drag, 3D wobble rotation, and colorful theme palettes.
 */

const CONFETTI_COLORS = [
  '#f97316', // Orange 500
  '#fb923c', // Orange 400
  '#f59e0b', // Amber 500
  '#fbbf24', // Amber 400
  '#10b981', // Emerald 500
  '#34d399', // Emerald 400
  '#8b5cf6', // Violet 500
  '#06b6d4', // Cyan 500
  '#ec4899', // Pink 500
  '#ffffff', // Crisp white accent
];

export function triggerConfetti({
  particleCount = 240,
  duration = 4800,
  spread = 85,
} = {}) {
  // Prevent duplicate canvas elements
  const existingCanvas = document.getElementById('pathshala-confetti-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'pathshala-confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  canvas.style.overflow = 'hidden';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  // Scaled particle counts for screen sizes
  const totalParticles = isMobile 
    ? Math.min(particleCount, 160) 
    : isTablet 
      ? Math.min(particleCount, 210) 
      : particleCount;

  const actualSpread = isMobile ? Math.min(spread, 55) : isTablet ? Math.min(spread, 75) : spread;

  // Responsive burst origins with high blast launch points near bottom of screen
  const origins = isMobile
    ? [
        { x: width * 0.2, y: height * 0.88, angle: -82 },
        { x: width * 0.5, y: height * 0.85, angle: -90 },
        { x: width * 0.8, y: height * 0.88, angle: -98 },
      ]
    : [
        { x: width * 0.15, y: height * 0.85, angle: -72 },
        { x: width * 0.35, y: height * 0.80, angle: -84 },
        { x: width * 0.65, y: height * 0.80, angle: -96 },
        { x: width * 0.85, y: height * 0.85, angle: -108 },
      ];

  const particles = [];

  // Helper to create a single particle
  const createParticle = (origin, delayMs = 0) => {
    const angleRad = ((origin.angle + (Math.random() - 0.5) * actualSpread) * Math.PI) / 180;
    
    // High-blast speed calculation
    const baseSpeed = isMobile 
      ? (18 + Math.random() * 16) // Powerful high blast on small devices
      : isTablet 
        ? (18 + Math.random() * 18) 
        : (20 + Math.random() * 22);

    const size = isMobile 
      ? (4.5 + Math.random() * 4.5) 
      : (5.5 + Math.random() * 5.5);

    return {
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angleRad) * baseSpeed,
      vy: Math.sin(angleRad) * baseSpeed,
      size,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.07 + Math.random() * 0.07,
      opacity: 1,
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
      delayMs,
      active: delayMs === 0,
    };
  };

  // Wave 1: Immediate primary high blast (70% of particles)
  const wave1Count = Math.floor(totalParticles * 0.7);
  for (let i = 0; i < wave1Count; i++) {
    const origin = origins[i % origins.length];
    particles.push(createParticle(origin, 0));
  }

  // Wave 2: Booster secondary blast at 220ms (30% of particles)
  const wave2Count = totalParticles - wave1Count;
  for (let i = 0; i < wave2Count; i++) {
    const origin = origins[i % origins.length];
    particles.push(createParticle(origin, 220));
  }

  const startTime = performance.now();
  let animationFrameId;

  function render(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Activate delayed booster particles
      if (!p.active) {
        if (elapsed >= p.delayMs) {
          p.active = true;
        } else {
          continue;
        }
      }

      // Physics update: air resistance + slow gentle flutter gravity
      p.vx *= 0.978;
      p.vy *= 0.978;
      p.vy += isMobile ? 0.30 : 0.34; // Slower floating gravity for longer air time

      p.x += p.vx;
      p.y += p.vy;

      // Soft boundary containment to keep high-blast confetti on screen on mobile
      if (p.x < 6) {
        p.x = 6;
        p.vx = Math.abs(p.vx) * 0.35; // gentle inward rebound
      } else if (p.x > width - 6) {
        p.x = width - 6;
        p.vx = -Math.abs(p.vx) * 0.35; // gentle inward rebound
      }

      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      // Fade out smoothly towards the end
      if (progress > 0.72) {
        p.opacity = Math.max(0, 1 - (progress - 0.72) / 0.28);
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.scale(Math.cos(p.wobble), 1);

      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cleanup();
    }
  }

  function cleanup() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    window.removeEventListener('resize', handleResize);
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  }

  animationFrameId = requestAnimationFrame(render);

  return cleanup;
}
