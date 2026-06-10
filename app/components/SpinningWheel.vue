<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useWheelCanvas, WHEEL_SIZE } from '~/composables/useWheelCanvas'

const props = defineProps<{ winnerIndex: number }>()
const emit = defineEmits<{ spinComplete: [] }>()

const { canvasRef, spinComplete } = useWheelCanvas(props.winnerIndex)

watch(spinComplete, (done) => {
  if (done) emit('spinComplete')
})

// ── Confetti ──────────────────────────────────────────────────────────────────

const confettiRef = ref<HTMLCanvasElement | null>(null)
const animationId = ref(0)
let cleanupResize: (() => void) | null = null

const COLORS = ['#E63946', '#FFD700', '#4895EF', '#2DC653', '#FF8C00', '#DA70D6', '#FF69B4', '#00CED1']

interface Particle {
  x: number; y: number; vx: number; vy: number
  color: string; width: number; height: number
  angle: number; angularVelocity: number; opacity: number
}

function createParticles(count: number, w: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: -10 - Math.random() * 100,
    vx: (Math.random() - 0.5) * 3,
    vy: 2 + Math.random() * 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] as string,
    width: 6 + Math.random() * 8,
    height: 10 + Math.random() * 6,
    angle: Math.random() * Math.PI * 2,
    angularVelocity: (Math.random() - 0.5) * 0.2,
    opacity: 0.85 + Math.random() * 0.15,
  }))
}

watch(spinComplete, (done) => {
  if (!done) return
  const canvas = confettiRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)
  cleanupResize = () => window.removeEventListener('resize', resize)

  const particles = createParticles(180, canvas.width)

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      ctx.save()
      ctx.globalAlpha = p.opacity
      ctx.translate(p.x + p.width / 2, p.y + p.height / 2)
      ctx.rotate(p.angle)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
      ctx.restore()
      p.x += p.vx
      p.y += p.vy
      p.angle += p.angularVelocity
      p.vx += (Math.random() - 0.5) * 0.1
      if (p.y > canvas.height + 20) {
        p.y = -20
        p.x = Math.random() * canvas.width
        p.vy = 2 + Math.random() * 4
      }
    }
    animationId.value = requestAnimationFrame(draw)
  }

  draw()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId.value)
  cleanupResize?.()
})
</script>

<template>
  <div class="wheel-stage">
    <div class="wheel-wrapper">
      <div class="pointer" aria-hidden="true">
        <svg width="40" height="48" viewBox="0 0 40 48">
          <polygon points="20,48 0,4 40,4" fill="#FFD700" />
          <polygon points="20,48 0,4 40,4" fill="none" stroke="#B8860B" stroke-width="2" />
        </svg>
      </div>
      <canvas ref="canvasRef" :width="WHEEL_SIZE" :height="WHEEL_SIZE" class="wheel-canvas" />
    </div>
    <canvas v-if="spinComplete" ref="confettiRef" class="confetti-canvas" aria-hidden="true" />
  </div>
</template>

<style scoped>
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
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6));
  z-index: 2;
}

.wheel-canvas {
  display: block;
  width: min(420px, 88vmin);
  height: min(420px, 88vmin);
  filter: drop-shadow(0 8px 32px rgba(0, 0, 0, 0.7));
}

.confetti-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: transparent;
  z-index: 10;
}
</style>
