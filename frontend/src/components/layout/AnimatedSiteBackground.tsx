"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
  kind: "drop" | "ember";
};

type Drip = {
  x: number;
  y: number;
  speed: number;
  length: number;
  width: number;
  alpha: number;
  wobble: number;
};

type Splatter = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  points: number;
};

type StreamParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
};

type WaterBubble = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  phase: number;
};

type WaterRipple = {
  x: number;
  y: number;
  r: number;
  alpha: number;
};

type WaterStreak = {
  x: number;
  y: number;
  speed: number;
  length: number;
  alpha: number;
  phase: number;
};

const BLOOD = {
  bright: "rgba(200, 25, 25,",
  mid: "rgba(139, 0, 0,",
  dark: "rgba(70, 0, 0,",
  deep: "rgba(40, 0, 0,",
  highlight: "rgba(220, 50, 50,",
};

const WATER = {
  white: "rgba(255, 255, 255,",
  foam: "rgba(240, 248, 255,",
  mist: "rgba(220, 235, 255,",
  shimmer: "rgba(200, 230, 255,",
};

function createParticles(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => {
    const isDrop = Math.random() > 0.35;
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: isDrop ? 0.25 + Math.random() * 0.85 : -0.05 - Math.random() * 0.2,
      r: isDrop ? Math.random() * 2.8 + 1 : Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.45 + 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.008 + Math.random() * 0.014,
      kind: isDrop ? "drop" : "ember",
    };
  });
}

function createWaterBubbles(count: number, w: number, h: number): WaterBubble[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.25,
    vy: -0.25 - Math.random() * 0.65,
    r: Math.random() * 4 + 0.8,
    alpha: Math.random() * 0.4 + 0.14,
    phase: Math.random() * Math.PI * 2,
  }));
}

function createWaterStreaks(count: number, w: number, h: number): WaterStreak[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speed: 0.8 + Math.random() * 1.6,
    length: 20 + Math.random() * 50,
    alpha: 0.08 + Math.random() * 0.18,
    phase: Math.random() * Math.PI * 2,
  }));
}

function createDrip(w: number): Drip {
  return {
    x: Math.random() * w,
    y: -20 - Math.random() * 80,
    speed: 0.6 + Math.random() * 1.4,
    length: 18 + Math.random() * 42,
    width: 2 + Math.random() * 3.5,
    alpha: 0.35 + Math.random() * 0.45,
    wobble: Math.random() * Math.PI * 2,
  };
}

/** Blood + white water animated background with mouse-driven flow. */
export function AnimatedSiteBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waterCanvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const waterGlowRef = useRef<HTMLDivElement>(null);
  const glowTrailRef = useRef<HTMLDivElement>(null);
  const glowCoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rootBox = rootRef.current;
    const canvasEl = canvasRef.current;
    const waterCanvasEl = waterCanvasRef.current;
    const glowBox = glowRef.current;
    const waterGlowBox = waterGlowRef.current;
    const glowTrailBox = glowTrailRef.current;
    const glowCoreBox = glowCoreRef.current;
    if (!rootBox || !canvasEl || !waterCanvasEl || !glowBox || !waterGlowBox || !glowTrailBox || !glowCoreBox) {
      return;
    }

    const rootEl: HTMLDivElement = rootBox;
    const glowEl: HTMLDivElement = glowBox;
    const waterGlowEl: HTMLDivElement = waterGlowBox;
    const glowTrailEl: HTMLDivElement = glowTrailBox;
    const glowCoreEl: HTMLDivElement = glowCoreBox;

    const bloodCtxMaybe = canvasEl.getContext("2d");
    const waterCtxMaybe = waterCanvasEl.getContext("2d");
    if (bloodCtxMaybe === null || waterCtxMaybe === null) return;
    const bloodCtx: CanvasRenderingContext2D = bloodCtxMaybe;
    const waterCtx: CanvasRenderingContext2D = waterCtxMaybe;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const liteMotion = reducedMotion || isTouchDevice;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let waterBubbles: WaterBubble[] = [];
    let waterStreaks: WaterStreak[] = [];
    let drips: Drip[] = [];
    let splatters: Splatter[] = [];
    let streamParticles: StreamParticle[] = [];
    let waterRipples: WaterRipple[] = [];
    let frameId = 0;
    let running = true;
    let time = 0;
    let lastDripSpawn = 0;

    let targetX = 0.5;
    let targetY = 0.5;
    let smoothX = 0.5;
    let smoothY = 0.5;
    let targetPxX = 0;
    let targetPxY = 0;
    let smoothPxX = 0;
    let smoothPxY = 0;
    let prevPxX = 0;
    let prevPxY = 0;
    let mouseVelX = 0;
    let mouseVelY = 0;
    let mouseActive = false;
    let lastSplatterAt = 0;
    let lastStreamAt = 0;
    let lastWaterRippleAt = 0;

    function setPointer(clientX: number, clientY: number) {
      prevPxX = targetPxX || clientX;
      prevPxY = targetPxY || clientY;
      mouseVelX = clientX - prevPxX;
      mouseVelY = clientY - prevPxY;
      targetX = clientX / window.innerWidth;
      targetY = clientY / window.innerHeight;
      targetPxX = clientX;
      targetPxY = clientY;
      mouseActive = true;
    }

    function spawnSplatter(x: number, y: number) {
      splatters.push({
        x,
        y,
        r: 4 + Math.random() * 10,
        alpha: 0.45 + Math.random() * 0.3,
        points: 6 + Math.floor(Math.random() * 5),
      });
      if (splatters.length > 12) splatters.shift();

      for (let i = 0; i < 2; i++) {
        drips.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y - 5,
          speed: 0.8 + Math.random() * 1.2,
          length: 12 + Math.random() * 28,
          width: 1.5 + Math.random() * 2.5,
          alpha: 0.5 + Math.random() * 0.3,
          wobble: Math.random() * Math.PI * 2,
        });
      }
    }

    function spawnWaterRipple(x: number, y: number) {
      waterRipples.push({ x, y, r: 0, alpha: 0.45 + Math.random() * 0.2 });
      if (waterRipples.length > 10) waterRipples.shift();

      for (let i = 0; i < 2; i++) {
        waterBubbles.push({
          x: x + (Math.random() - 0.5) * 24,
          y: y + (Math.random() - 0.5) * 24,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.3 - Math.random() * 0.6,
          r: 1.5 + Math.random() * 3,
          alpha: 0.2 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2,
        });
      }
      if (waterBubbles.length > 120) waterBubbles = waterBubbles.slice(-120);
    }

    function spawnStream(clientX: number, clientY: number) {
      const speed = Math.hypot(mouseVelX, mouseVelY);
      const count = speed > 3 ? 4 : 2;

      for (let i = 0; i < count; i++) {
        streamParticles.push({
          x: clientX + (Math.random() - 0.5) * 16,
          y: clientY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 0.6 + mouseVelX * 0.03,
          vy: 0.4 + Math.random() * 1.2 + Math.abs(mouseVelY) * 0.02,
          life: 1,
          maxLife: 0.5 + Math.random() * 0.6,
          r: 1.5 + Math.random() * 2.5,
        });
      }

      if (streamParticles.length > 90) {
        streamParticles = streamParticles.slice(-90);
      }
    }

    function onMove(e: MouseEvent) {
      setPointer(e.clientX, e.clientY);
      const now = performance.now();

      if (!liteMotion) {
        if (now - lastSplatterAt > 90) {
          spawnSplatter(e.clientX, e.clientY);
          lastSplatterAt = now;
        }
        if (now - lastWaterRippleAt > 110) {
          spawnWaterRipple(e.clientX, e.clientY);
          lastWaterRippleAt = now;
        }
        if (now - lastStreamAt > 35) {
          spawnStream(e.clientX, e.clientY);
          lastStreamAt = now;
        }
      }
    }

    function onTouch(e: TouchEvent) {
      if (isTouchDevice) return;
      if (e.touches[0]) {
        setPointer(e.touches[0].clientX, e.touches[0].clientY);
        if (!liteMotion) {
          spawnStream(e.touches[0].clientX, e.touches[0].clientY);
          spawnWaterRipple(e.touches[0].clientX, e.touches[0].clientY);
        }
      }
    }

    function onLeave() {
      mouseActive = false;
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      for (const c of [canvasEl, waterCanvasEl] as HTMLCanvasElement[]) {
        c.width = Math.floor(w * dpr);
        c.height = Math.floor(h * dpr);
        c.style.width = `${w}px`;
        c.style.height = `${h}px`;
      }

      bloodCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      waterCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = createParticles(
        liteMotion ? 40 : Math.min(260, Math.floor((w * h) / 5500)),
        w,
        h
      );
      waterBubbles = createWaterBubbles(
        liteMotion ? 24 : Math.min(180, Math.floor((w * h) / 7500)),
        w,
        h
      );
      waterStreaks = createWaterStreaks(liteMotion ? 6 : 40, w, h);
      drips = Array.from({ length: liteMotion ? 4 : 14 }, () => createDrip(w));
    }

    function applyMouseFlow(p: Particle) {
      const dx = smoothPxX - p.x;
      const dy = smoothPxY - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      const radius = Math.min(w, h) * 0.38;

      if (!mouseActive || dist > radius) return;

      const t = 1 - dist / radius;
      const pull = t * t * 0.08;
      const swirl = t * 0.04;

      p.vx += (dx / dist) * pull + (-dy / dist) * swirl;
      p.vy += (dy / dist) * pull * 0.6 + (dx / dist) * swirl + t * 0.02;
    }

    function applyWaterFlow(b: WaterBubble) {
      const dx = smoothPxX - b.x;
      const dy = smoothPxY - b.y;
      const dist = Math.hypot(dx, dy) || 1;
      const radius = Math.min(w, h) * 0.32;

      if (!mouseActive || dist > radius) return;

      const t = 1 - dist / radius;
      b.vx += (dx / dist) * t * 0.04 + (-dy / dist) * t * 0.025;
      b.vy += (dy / dist) * t * 0.02 + (dx / dist) * t * 0.025;
    }

    function drawBloodDrop(x: number, y: number, r: number, alpha: number, stretch = 1) {
      bloodCtx.save();
      bloodCtx.translate(x, y);
      bloodCtx.scale(1, stretch);
      const grad = bloodCtx.createRadialGradient(0, -r * 0.3, 0, 0, 0, r * 2.2);
      grad.addColorStop(0, `${BLOOD.highlight}${alpha})`);
      grad.addColorStop(0.35, `${BLOOD.mid}${alpha * 0.85})`);
      grad.addColorStop(0.7, `${BLOOD.dark}${alpha * 0.5})`);
      grad.addColorStop(1, `${BLOOD.deep}0)`);
      bloodCtx.fillStyle = grad;
      bloodCtx.beginPath();
      bloodCtx.ellipse(0, 0, r, r * 1.35, 0, 0, Math.PI * 2);
      bloodCtx.fill();
      bloodCtx.restore();
    }

    function drawWaterBubble(b: WaterBubble) {
      const shimmer = 0.65 + Math.sin(b.phase + time * 0.03) * 0.35;
      const grad = waterCtx.createRadialGradient(
        b.x - b.r * 0.3,
        b.y - b.r * 0.3,
        0,
        b.x,
        b.y,
        b.r * 2
      );
      grad.addColorStop(0, `${WATER.white}${b.alpha * shimmer})`);
      grad.addColorStop(0.45, `${WATER.foam}${b.alpha * 0.5 * shimmer})`);
      grad.addColorStop(1, `${WATER.mist}0)`);

      waterCtx.beginPath();
      waterCtx.fillStyle = grad;
      waterCtx.arc(b.x, b.y, b.r * 1.6, 0, Math.PI * 2);
      waterCtx.fill();

      waterCtx.beginPath();
      waterCtx.fillStyle = `${WATER.white}${b.alpha * 0.7 * shimmer})`;
      waterCtx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.35, 0, Math.PI * 2);
      waterCtx.fill();
    }

    function drawAuroraRibbons() {
      const ribbons = 6;
      for (let i = 0; i < ribbons; i++) {
        const yBase = h * (0.15 + i * 0.13) + Math.sin(time * 0.008 + i * 1.7) * 40;
        const mouseOffset = mouseActive ? (smoothX - 0.5) * 60 : 0;

        waterCtx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const y =
            yBase +
            mouseOffset +
            Math.sin(x * 0.004 + time * 0.012 + i) * 55 +
            Math.sin(x * 0.009 + time * 0.006) * 18;
          if (x === 0) waterCtx.moveTo(x, y);
          else waterCtx.lineTo(x, y);
        }

        const grad = waterCtx.createLinearGradient(0, yBase - 60, w, yBase + 60);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.35, `rgba(255, 255, 255, ${0.06 + i * 0.012})`);
        grad.addColorStop(0.55, `rgba(220, 235, 255, ${0.08 + i * 0.01})`);
        grad.addColorStop(0.72, `rgba(255, 180, 180, ${0.04 + i * 0.008})`);
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");

        waterCtx.strokeStyle = grad;
        waterCtx.lineWidth = 2.2 + i * 0.3;
        waterCtx.globalAlpha = 0.55;
        waterCtx.stroke();
        waterCtx.globalAlpha = 1;
      }
    }

    function drawWaterStreaks() {
      for (const s of waterStreaks) {
        if (!liteMotion) {
          s.y += s.speed;
          s.phase += 0.03;
          if (mouseActive) {
            const dx = smoothPxX - s.x;
            if (Math.abs(dx) < 180) s.x += dx * 0.002;
          }
          if (s.y > h + s.length) {
            s.y = -s.length;
            s.x = Math.random() * w;
          }
        }

        const wobble = Math.sin(s.phase) * 3;
        const grad = waterCtx.createLinearGradient(s.x, s.y, s.x + wobble, s.y + s.length);
        grad.addColorStop(0, `${WATER.white}0)`);
        grad.addColorStop(0.3, `${WATER.white}${s.alpha})`);
        grad.addColorStop(0.7, `${WATER.foam}${s.alpha * 0.7})`);
        grad.addColorStop(1, `${WATER.mist}0)`);

        waterCtx.strokeStyle = grad;
        waterCtx.lineWidth = 1.2;
        waterCtx.lineCap = "round";
        waterCtx.beginPath();
        waterCtx.moveTo(s.x, s.y);
        waterCtx.lineTo(s.x + wobble, s.y + s.length);
        waterCtx.stroke();
      }
    }

    function drawWaterWaves() {
      const waveCount = 7;
      for (let i = 0; i < waveCount; i++) {
        const baseY = h * (0.42 + i * 0.085) + Math.sin(time * 0.012 + i) * 14;
        const mousePull = mouseActive ? (smoothY - 0.5) * 30 : 0;

        waterCtx.beginPath();
        waterCtx.moveTo(0, baseY + mousePull);

        for (let x = 0; x <= w; x += 12) {
          const y =
            baseY +
            mousePull +
            Math.sin(x * 0.008 + time * 0.018 + i * 1.4) * (14 - i * 2) +
            Math.sin(x * 0.02 + time * 0.01) * 4;
          waterCtx.lineTo(x, y);
        }

        waterCtx.lineTo(w, h);
        waterCtx.lineTo(0, h);
        waterCtx.closePath();

        const grad = waterCtx.createLinearGradient(0, baseY - 40, 0, h);
        grad.addColorStop(0, `${WATER.white}${0.06 + i * 0.018})`);
        grad.addColorStop(0.4, `${WATER.foam}${0.09 + i * 0.025})`);
        grad.addColorStop(1, `${WATER.mist}0)`);
        waterCtx.fillStyle = grad;
        waterCtx.fill();
      }
    }

    function drawDrip(d: Drip) {
      const wobbleX = Math.sin(d.wobble + time * 0.02) * 2;
      const tipY = d.y + d.length;

      const grad = bloodCtx.createLinearGradient(d.x, d.y, d.x + wobbleX, tipY);
      grad.addColorStop(0, `${BLOOD.mid}${d.alpha * 0.3})`);
      grad.addColorStop(0.2, `${BLOOD.bright}${d.alpha * 0.7})`);
      grad.addColorStop(0.75, `${BLOOD.mid}${d.alpha * 0.9})`);
      grad.addColorStop(1, `${BLOOD.dark}${d.alpha})`);

      bloodCtx.strokeStyle = grad;
      bloodCtx.lineWidth = d.width;
      bloodCtx.lineCap = "round";
      bloodCtx.beginPath();
      bloodCtx.moveTo(d.x, d.y);
      bloodCtx.quadraticCurveTo(d.x + wobbleX * 1.5, d.y + d.length * 0.5, d.x + wobbleX, tipY);
      bloodCtx.stroke();

      drawBloodDrop(d.x + wobbleX, tipY, d.width * 1.4, d.alpha);
    }

    function drawSplatter(s: Splatter) {
      bloodCtx.save();
      bloodCtx.translate(s.x, s.y);
      bloodCtx.beginPath();
      for (let i = 0; i < s.points; i++) {
        const angle = (i / s.points) * Math.PI * 2;
        const radius = s.r * (0.6 + Math.sin(i * 2.1) * 0.4);
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) bloodCtx.moveTo(px, py);
        else bloodCtx.lineTo(px, py);
      }
      bloodCtx.closePath();
      const grad = bloodCtx.createRadialGradient(0, 0, 0, 0, 0, s.r);
      grad.addColorStop(0, `${BLOOD.bright}${s.alpha})`);
      grad.addColorStop(0.5, `${BLOOD.mid}${s.alpha * 0.7})`);
      grad.addColorStop(1, `${BLOOD.deep}0)`);
      bloodCtx.fillStyle = grad;
      bloodCtx.fill();
      bloodCtx.restore();
    }

    function drawParticleLinks() {
      if (!mouseActive) return;

      const linkDist = 85;
      const nearby: Particle[] = [];

      for (const p of particles) {
        if (Math.hypot(smoothPxX - p.x, smoothPxY - p.y) < 240) nearby.push(p);
        if (nearby.length >= 40) break;
      }

      for (let i = 0; i < nearby.length; i++) {
        for (let j = i + 1; j < nearby.length; j++) {
          const a = nearby[i];
          const b = nearby[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > linkDist) continue;

          const alpha = (1 - d / linkDist) * 0.14;
          bloodCtx.beginPath();
          bloodCtx.strokeStyle = `${BLOOD.mid}${alpha})`;
          bloodCtx.lineWidth = 0.9;
          bloodCtx.moveTo(a.x, a.y);
          bloodCtx.lineTo(b.x, b.y);
          bloodCtx.stroke();
        }
      }
    }

    function drawWaterLayer() {
      waterCtx.clearRect(0, 0, w, h);

      if (!liteMotion) {
        drawAuroraRibbons();
        drawWaterWaves();
        drawWaterStreaks();

        if (mouseActive) {
          const aura = waterCtx.createRadialGradient(
            smoothPxX,
            smoothPxY,
            0,
            smoothPxX,
            smoothPxY,
            Math.min(w, h) * 0.35
          );
          aura.addColorStop(0, `${WATER.white}0.1)`);
          aura.addColorStop(0.4, `${WATER.foam}0.05)`);
          aura.addColorStop(1, `${WATER.mist}0)`);
          waterCtx.fillStyle = aura;
          waterCtx.fillRect(0, 0, w, h);
        }
      }

      waterRipples = waterRipples.filter((ripple) => {
        ripple.r += 2.4;
        ripple.alpha *= 0.94;
        if (ripple.alpha < 0.015) return false;

        waterCtx.beginPath();
        waterCtx.strokeStyle = `${WATER.white}${ripple.alpha})`;
        waterCtx.lineWidth = 1.2;
        waterCtx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
        waterCtx.stroke();

        waterCtx.beginPath();
        waterCtx.strokeStyle = `${WATER.foam}${ripple.alpha * 0.45})`;
        waterCtx.lineWidth = 0.6;
        waterCtx.arc(ripple.x, ripple.y, ripple.r * 0.65, 0, Math.PI * 2);
        waterCtx.stroke();
        return true;
      });

      for (const b of waterBubbles) {
        if (!liteMotion) {
          applyWaterFlow(b);
          b.x += b.vx;
          b.y += b.vy;
          b.phase += 0.02;
          b.vx *= 0.992;
          b.vy *= 0.995;

          if (b.y < -20) {
            b.y = h + 10;
            b.x = Math.random() * w;
          }
          if (b.x < -10) b.x = w + 10;
          if (b.x > w + 10) b.x = -10;
        }

        drawWaterBubble(b);
      }
    }

    function tick() {
      if (!running) return;
      time += 1;

      smoothX += (targetX - smoothX) * 0.09;
      smoothY += (targetY - smoothY) * 0.09;
      smoothPxX += (targetPxX - smoothPxX) * 0.12;
      smoothPxY += (targetPxY - smoothPxY) * 0.12;

      const strength = mouseActive ? 1 : 0;
      rootEl.style.setProperty("--mx", String(smoothX));
      rootEl.style.setProperty("--my", String(smoothY));
      rootEl.style.setProperty("--mouse-strength", String(strength));
      rootEl.style.setProperty("--water-tx", `${(smoothX - 0.5) * w * 0.1}px`);
      rootEl.style.setProperty("--water-ty", `${(smoothY - 0.5) * h * 0.08}px`);
      rootEl.style.setProperty("--aurora-rot", `${(smoothX - 0.5) * 18 + (smoothY - 0.5) * 12}deg`);

      const offsetX = (smoothX - 0.5) * w * 0.1;
      const offsetY = (smoothY - 0.5) * h * 0.08;
      rootEl.style.setProperty("--mesh-tx", `${offsetX}px`);
      rootEl.style.setProperty("--mesh-ty", `${offsetY}px`);
      rootEl.style.setProperty("--mesh-rot", `${(smoothX - 0.5) * 20 + (smoothY - 0.5) * 12}deg`);
      rootEl.style.setProperty("--mesh-scale", String(1 + strength * 0.03));

      const trailX = smoothPxX - mouseVelX * 3;
      const trailY = smoothPxY - mouseVelY * 3;

      glowEl.style.left = `${smoothPxX}px`;
      glowEl.style.top = `${smoothPxY}px`;
      glowEl.style.opacity = mouseActive ? "1" : "0.35";

      waterGlowEl.style.left = `${smoothPxX}px`;
      waterGlowEl.style.top = `${smoothPxY}px`;
      waterGlowEl.style.opacity = mouseActive ? "0.85" : "0.25";

      glowTrailEl.style.left = `${trailX}px`;
      glowTrailEl.style.top = `${trailY}px`;
      glowTrailEl.style.opacity = mouseActive ? "0.7" : "0";

      glowCoreEl.style.left = `${smoothPxX}px`;
      glowCoreEl.style.top = `${smoothPxY}px`;
      glowCoreEl.style.opacity = mouseActive ? "0.85" : "0";

      bloodCtx.clearRect(0, 0, w, h);

      if (!liteMotion && mouseActive) {
        const aura = bloodCtx.createRadialGradient(smoothPxX, smoothPxY, 0, smoothPxX, smoothPxY, Math.min(w, h) * 0.38);
        aura.addColorStop(0, `${BLOOD.bright}0.18)`);
        aura.addColorStop(0.35, `${BLOOD.mid}0.1)`);
        aura.addColorStop(0.7, `${BLOOD.dark}0.04)`);
        aura.addColorStop(1, `${BLOOD.deep}0)`);
        bloodCtx.fillStyle = aura;
        bloodCtx.fillRect(0, 0, w, h);
      }

      if (!liteMotion && performance.now() - lastDripSpawn > 900) {
        drips.push(createDrip(w));
        if (drips.length > 22) drips.shift();
        lastDripSpawn = performance.now();
      }

      drips = drips.filter((d) => {
        if (!liteMotion) {
          d.y += d.speed;
          d.wobble += 0.04;
          if (mouseActive) {
            const dx = smoothPxX - d.x;
            const dy = smoothPxY - d.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 200) {
              d.x += (dx / dist) * 0.4;
              d.speed += 0.008;
            }
          }
        }
        if (d.y > h + d.length) return false;
        drawDrip(d);
        return true;
      });

      splatters = splatters.filter((s) => {
        s.alpha *= 0.988;
        s.r += 0.15;
        if (s.alpha < 0.02) return false;
        drawSplatter(s);
        return true;
      });

      streamParticles = streamParticles.filter((sp) => {
        sp.life -= 0.02;
        if (sp.life <= 0) return false;

        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.04;
        sp.vx *= 0.98;

        const t = sp.life / sp.maxLife;
        drawBloodDrop(sp.x, sp.y, sp.r * (1 + t * 0.5), 0.6 * t, 1.4);
        return true;
      });

      for (const p of particles) {
        if (!liteMotion) {
          applyMouseFlow(p);
          if (p.kind === "drop") {
            p.vy += 0.008;
            p.vy = Math.min(p.vy, 1.8);
          }
          p.x += p.vx;
          p.y += p.vy;
          p.pulse += p.pulseSpeed;

          if (p.y > h + 15) {
            p.y = -10;
            p.x = Math.random() * w;
            p.vy = 0.3 + Math.random() * 0.7;
          }
          if (p.y < -15 && p.kind === "ember") {
            p.y = h + 10;
            p.x = Math.random() * w;
          }
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;

          p.vx *= 0.985;
        }

        const glowAmt = 0.5 + Math.sin(p.pulse) * 0.3;
        const nearMouse = mouseActive ? Math.max(0, 1 - Math.hypot(smoothPxX - p.x, smoothPxY - p.y) / 260) : 0;
        const alpha = p.alpha * glowAmt * (1 + nearMouse * 0.8);

        if (p.kind === "drop") {
          drawBloodDrop(p.x, p.y, p.r * (1 + nearMouse * 0.5), alpha, 1.6 + nearMouse * 0.4);
        } else {
          const size = p.r * (3.5 + nearMouse * 2);
          const gradient = bloodCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
          gradient.addColorStop(0, `${BLOOD.bright}${Math.min(1, alpha)})`);
          gradient.addColorStop(0.4, `${BLOOD.mid}${alpha * 0.6})`);
          gradient.addColorStop(1, `${BLOOD.deep}0)`);
          bloodCtx.beginPath();
          bloodCtx.fillStyle = gradient;
          bloodCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
          bloodCtx.fill();
        }
      }

      drawParticleLinks();
      drawWaterLayer();

      frameId = requestAnimationFrame(tick);
    }

    resize();
    tick();

    window.addEventListener("mousemove", onMove, { passive: true });
    if (!isTouchDevice) {
      window.addEventListener("touchmove", onTouch, { passive: true });
      window.addEventListener("touchstart", onTouch, { passive: true });
    }
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", resize);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMove);
      if (!isTouchDevice) {
        window.removeEventListener("touchmove", onTouch);
        window.removeEventListener("touchstart", onTouch);
      }
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="site-bg"
      aria-hidden
      style={{ "--mx": "0.5", "--my": "0.5", "--mouse-strength": "0" } as React.CSSProperties}
    >
      <div className="site-bg__base" />
      <div className="site-bg__aurora" />
      <div className="site-bg__aurora site-bg__aurora--2" />
      <div className="site-bg__water-mist" />
      <div className="site-bg__blood-pool" />
      <div className="site-bg__water-surface" />
      <div className="site-bg__water-fog" />
      <div className="site-bg__mesh-wrap">
        <div className="site-bg__mesh" />
      </div>
      <div className="site-bg__water-wrap">
        <div className="site-bg__water-mesh" />
      </div>
      <div className="site-bg__blob site-bg__blob--1">
        <div className="site-bg__blob-shape site-bg__blob-shape--1" />
      </div>
      <div className="site-bg__blob site-bg__blob--2">
        <div className="site-bg__blob-shape site-bg__blob-shape--2" />
      </div>
      <div className="site-bg__blob site-bg__blob--3">
        <div className="site-bg__blob-shape site-bg__blob-shape--3" />
      </div>
      <div className="site-bg__blob site-bg__blob--4">
        <div className="site-bg__blob-shape site-bg__blob-shape--4" />
      </div>
      <div className="site-bg__blob site-bg__blob--5">
        <div className="site-bg__blob-shape site-bg__blob-shape--5" />
      </div>
      <div className="site-bg__blob site-bg__blob--6">
        <div className="site-bg__blob-shape site-bg__blob-shape--6" />
      </div>
      <div className="site-bg__water-blob site-bg__water-blob--1">
        <div className="site-bg__water-blob-shape site-bg__water-blob-shape--1" />
      </div>
      <div className="site-bg__water-blob site-bg__water-blob--2">
        <div className="site-bg__water-blob-shape site-bg__water-blob-shape--2" />
      </div>
      <div className="site-bg__water-blob site-bg__water-blob--3">
        <div className="site-bg__water-blob-shape site-bg__water-blob-shape--3" />
      </div>
      <div className="site-bg__water-blob site-bg__water-blob--4">
        <div className="site-bg__water-blob-shape site-bg__water-blob-shape--4" />
      </div>
      <div className="site-bg__water-blob site-bg__water-blob--5">
        <div className="site-bg__water-blob-shape site-bg__water-blob-shape--5" />
      </div>
      <div className="site-bg__wave site-bg__wave--1" />
      <div className="site-bg__wave site-bg__wave--2" />
      <div className="site-bg__wave site-bg__wave--3" />
      <div className="site-bg__wave site-bg__wave--4" />
      <div className="site-bg__wave site-bg__wave--5" />
      <div className="site-bg__shimmer" />
      <canvas ref={canvasRef} className="site-bg__canvas" />
      <canvas ref={waterCanvasRef} className="site-bg__water-canvas" />
      <div ref={glowTrailRef} className="site-bg__cursor-trail" />
      <div ref={waterGlowRef} className="site-bg__cursor-water" />
      <div ref={glowRef} className="site-bg__cursor-glow" />
      <div ref={glowCoreRef} className="site-bg__cursor-core" />
      <div className="site-bg__vignette" />
      <div className="site-bg__grain" />
    </div>
  );
}
