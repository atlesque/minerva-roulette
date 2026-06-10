<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ─── Configuration ────────────────────────────────────────────────────────────
const NAMES = ['Kris', 'Gilles', 'Tom', 'Alex']

/** 2026-06-11 09:30 CEST (UTC+2) = 07:30 UTC */
const EPOCH_MS = new Date('2026-06-11T07:30:00Z').getTime()
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const SPIN_DURATION = 5000 // ms
const WHEEL_SIZE = 420
const WHEEL_RADIUS = 185

const SEGMENT_COLORS = [
  { bg: '#E63946', text: '#FFFFFF' }, // Kris – crimson
  { bg: '#FFD700', text: '#1A1A2E' }, // Gilles – gold
  { bg: '#4895EF', text: '#FFFFFF' }, // Tom – sky blue
  { bg: '#2DC653', text: '#FFFFFF' }, // Alex – emerald
]

// ─── State ────────────────────────────────────────────────────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)
const spinComplete = ref(false)

// ─── Winner logic ─────────────────────────────────────────────────────────────
function getWinnerIndex(): number {
  const diff = Date.now() - EPOCH_MS
  if (diff < 0) return 0
  return Math.floor(diff / WEEK_MS) % NAMES.length
}

const winnerIndex = getWinnerIndex()
const winnerName = NAMES[winnerIndex]

// ─── Wheel maths ──────────────────────────────────────────────────────────────
// Segments are drawn starting from the top (angle = −π/2).
// Segment i spans: [−π/2 + i·(π/2),  −π/2 + (i+1)·(π/2)]
// Centre of segment i: −π/2 + i·(π/2) + π/4
//
// For segment i's centre to land under the top pointer after rotation r:
//   centre_i + r ≡ −π/2  (mod 2π)
//   r = −π/2 − centre_i + k·2π
//     = −π/2 − (−π/2 + i·π/2 + π/4) + k·2π
//     = −i·π/2 − π/4 + k·2π
//
// With k = 10 (ten full spins + landing):
//   r = (3555 − i·90) degrees
function getTargetRotation(index: number): number {
  return (3555 - index * 90) * (Math.PI / 180)
}

// ─── Animation ────────────────────────────────────────────────────────────────
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function drawWheel(ctx: CanvasRenderingContext2D, rotation: number) {
  const cx = WHEEL_SIZE / 2
  const cy = WHEEL_SIZE / 2
  const n = NAMES.length
  const arc = (2 * Math.PI) / n

  ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE)

  // ── Outer decorative ring ──────────────────────────────────────────────────
  ctx.beginPath()
  ctx.arc(cx, cy, WHEEL_RADIUS + 16, 0, 2 * Math.PI)
  const ringGrad = ctx.createRadialGradient(cx, cy, WHEEL_RADIUS + 8, cx, cy, WHEEL_RADIUS + 20)
  ringGrad.addColorStop(0, '#B8860B')
  ringGrad.addColorStop(0.5, '#FFD700')
  ringGrad.addColorStop(1, '#B8860B')
  ctx.fillStyle = ringGrad
  ctx.fill()

  // ── Rotating decorative lights on rim ─────────────────────────────────────
  const numLights = 24
  for (let i = 0; i < numLights; i++) {
    const angle = (i / numLights) * 2 * Math.PI + rotation
    const lx = cx + (WHEEL_RADIUS + 8) * Math.cos(angle)
    const ly = cy + (WHEEL_RADIUS + 8) * Math.sin(angle)
    ctx.beginPath()
    ctx.arc(lx, ly, 5, 0, 2 * Math.PI)
    ctx.fillStyle = i % 2 === 0 ? '#FF4500' : '#FFFACD'
    ctx.fill()
  }

  // ── Segments ───────────────────────────────────────────────────────────────
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotation)

  for (let i = 0; i < n; i++) {
    const startAngle = -Math.PI / 2 + i * arc
    const endAngle = startAngle + arc
    const { bg, text } = SEGMENT_COLORS[i]

    // Segment fill
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, WHEEL_RADIUS, startAngle, endAngle)
    ctx.fillStyle = bg
    ctx.fill()

    // Segment border
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 3
    ctx.stroke()

    // Name label
    const midAngle = startAngle + arc / 2
    ctx.save()
    ctx.rotate(midAngle)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = text
    ctx.font = 'bold 26px "Poppins", system-ui, sans-serif'
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 4
    ctx.fillText(NAMES[i], WHEEL_RADIUS - 18, 0)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  // ── Centre hub ─────────────────────────────────────────────────────────────
  const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 28)
  hubGrad.addColorStop(0, '#4A4A6A')
  hubGrad.addColorStop(1, '#1A1A2E')
  ctx.beginPath()
  ctx.arc(0, 0, 28, 0, 2 * Math.PI)
  ctx.fillStyle = hubGrad
  ctx.fill()
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 3
  ctx.stroke()

  // Star on hub
  ctx.fillStyle = '#FFD700'
  ctx.font = '22px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('★', 0, 0)

  ctx.restore()
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const targetRotation = getTargetRotation(winnerIndex)
  const startTime = performance.now()

  function animate(timestamp: number) {
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / SPIN_DURATION, 1)
    const currentRotation = targetRotation * easeOutCubic(progress)

    drawWheel(ctx, currentRotation)

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // Brief pause, then reveal winner
      setTimeout(() => {
        spinComplete.value = true
      }, 600)
    }
  }

  requestAnimationFrame(animate)
})
</script>

<template>
  <div class="carnival-app">
    <!-- Carnival confetti background -->
    <div class="confetti-bg" aria-hidden="true" />

    <!-- Spinning wheel phase -->
    <Transition name="wheel">
      <div v-if="!spinComplete" class="wheel-stage">
        <div class="wheel-wrapper">
          <!-- Pointer / ticker -->
          <div class="pointer" aria-hidden="true">
            <svg width="40" height="48" viewBox="0 0 40 48">
              <polygon points="20,48 0,4 40,4" fill="#FFD700" />
              <polygon points="20,48 0,4 40,4" fill="none" stroke="#B8860B" stroke-width="2" />
            </svg>
          </div>
          <canvas ref="canvasRef" :width="WHEEL_SIZE" :height="WHEEL_SIZE" class="wheel-canvas" />
        </div>
        <p class="spin-hint">✨ Spinning… ✨</p>
      </div>
    </Transition>

    <!-- Winner reveal phase -->
    <Transition name="winner">
      <div v-if="spinComplete" class="winner-stage">
        <p class="prefix">And the winner is…</p>
        <h1 class="winner-name">{{ winnerName }}</h1>
        <p class="suffix">🎉 MIN Ticket Support this week 🎉</p>
      </div>
    </Transition>
  </div>
</template>

<style>
/* ── Reset & base ─────────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Poppins', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ── App shell ────────────────────────────────────────────────────────────── */
.carnival-app {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  /* Carnival dark background with coloured dot confetti */
  background-color: #0d0228;
  background-image:
    radial-gradient(circle, #E63946 2px, transparent 2px),
    radial-gradient(circle, #FFD700 2px, transparent 2px),
    radial-gradient(circle, #4895EF 2px, transparent 2px),
    radial-gradient(circle, #2DC653 2px, transparent 2px),
    radial-gradient(circle, #FF8C00 2px, transparent 2px),
    radial-gradient(circle, #DA70D6 2px, transparent 2px);
  background-size:
    90px 90px,
    90px 90px,
    90px 90px,
    90px 90px,
    90px 90px,
    90px 90px;
  background-position:
    0px 0px,
    45px 45px,
    22px 67px,
    67px 22px,
    11px 34px,
    56px 11px;
}

/* Soft vignette so centre pops */
.carnival-app::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 75% 75% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
  z-index: 0;
}

/* ── Spinning wheel ───────────────────────────────────────────────────────── */
.wheel-stage {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 1;
}

.wheel-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pointer {
  position: absolute;
  top: -42px;
  left: 50%;
  transform: translateX(-50%);
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6));
  z-index: 2;
}

.wheel-canvas {
  display: block;
  width: min(420px, 88vmin);
  height: min(420px, 88vmin);
  filter: drop-shadow(0 8px 32px rgba(0,0,0,0.7));
}

.spin-hint {
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  font-weight: 300;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

/* ── Winner display ───────────────────────────────────────────────────────── */
.winner-stage {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 1;
  padding: 24px;
  text-align: center;
}

.prefix {
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(0.9rem, 2.5vw, 1.2rem);
  font-weight: 300;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.winner-name {
  color: #FFD700;
  font-size: clamp(4rem, 16vw, 9rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow:
    0 0 40px rgba(255, 215, 0, 0.5),
    0 4px 12px rgba(0,0,0,0.6);
}

.suffix {
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(0.75rem, 2vw, 1rem);
  font-weight: 300;
  letter-spacing: 0.1em;
  margin-top: 16px;
}

/* ── Transitions ──────────────────────────────────────────────────────────── */
.wheel-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.wheel-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.winner-enter-active {
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.winner-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.97);
}
.winner-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
