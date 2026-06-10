<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

defineProps<{ winnerName: string }>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const animationId = ref(0)
let cleanupResize: (() => void) | null = null

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  width: number
  height: number
  angle: number
  angularVelocity: number
  opacity: number
}

const COLORS = ['#E63946', '#FFD700', '#4895EF', '#2DC653', '#FF8C00', '#DA70D6', '#FF69B4', '#00CED1']

function createParticles(count: number, canvasWidth: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * canvasWidth,
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

onMounted(() => {
  const canvas = canvasRef.value
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

  const particles: Particle[] = createParticles(180, canvas.width)

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
  <div class="winner-stage">
    <canvas ref="canvasRef" class="confetti-canvas" aria-hidden="true" />
    <div class="winner-content">
      <p class="prefix">And the winner is…</p>
      <h1 class="winner-name">{{ winnerName }}</h1>
      <p class="suffix">🎉 MIN Ticket Support this week 🎉</p>
    </div>
  </div>
</template>

<style scoped>
.winner-stage {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.confetti-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  background: transparent;
}

.winner-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
  width: 100%;
}

.prefix {
  color: #fff;
  -webkit-text-fill-color: #fff;
  font-size: clamp(1.3rem, 3.5vw, 1.9rem);
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.7);
}

.winner-name {
  color: #fff;
  -webkit-text-fill-color: #fff;
  font-size: clamp(6rem, 22vw, 14rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow:
    0 0 32px rgba(255, 255, 255, 0.4),
    0 8px 28px rgba(0, 0, 0, 0.85);
}

.suffix {
  color: #fff;
  -webkit-text-fill-color: #fff;
  font-size: clamp(1.1rem, 2.8vw, 1.5rem);
  font-weight: 500;
  letter-spacing: 0.1em;
  margin-top: 16px;
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.7);
}
</style>
