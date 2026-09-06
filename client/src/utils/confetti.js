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
  particleCount = 120,
  duration = 3500,
  spread = 100,
} = {}) {
  // Prevent duplicate canvas elements
  const existingCanvas = document.getElementById('pathshala-confetti-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'pathshala-confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  // Generate particles bursting from both lower quarters of the screen
  const particles = [];
  const origins = [
    { x: width * 0.2, y: height * 0.75, angle: -65 },
    { x: width * 0.5, y: height * 0.65, angle: -90 },
    { x: width * 0.8, y: height * 0.75, angle: -115 },
  ];

  for (let i = 0; i < particleCount; i++) {
    const origin = origins[i % origins.length];
    const angleRad = ((origin.angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const speed = 18 + Math.random() * 22;

    particles.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angleRad) * speed,
      vy: Math.sin(angleRad) * speed,
      size: 6 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      wobble: Math.random() * 10,
      wobbleSpeed: 0.08 + Math.random() * 0.08,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    });
  }

  const startTime = performance.now();
  let animationFrameId;

  function render(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Physics update: air drag + gravity
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vy += 0.42; // Gravity

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      // Fade out towards the end
      if (progress > 0.7) {
        p.opacity = Math.max(0, 1 - (progress - 0.7) / 0.3);
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.scale(Math.cos(p.wobble), 1);

      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
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
