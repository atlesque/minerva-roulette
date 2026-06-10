import { ref, onMounted } from 'vue'
import { NAMES } from '~/composables/useWinner'

export const WHEEL_SIZE = 420
const WHEEL_RADIUS = 185
const SPIN_DURATION = 5000

const SEGMENT_COLORS = [
  { bg: '#E63946', text: '#FFFFFF' }, // Kris – crimson
  { bg: '#FFD700', text: '#1A1A2E' }, // Gilles – gold
  { bg: '#4895EF', text: '#FFFFFF' }, // Tom – sky blue
  { bg: '#2DC653', text: '#FFFFFF' }, // Alex – emerald
]

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Segments are drawn starting from the top (angle = −π/2).
// Segment i spans: [−π/2 + i·(π/2),  −π/2 + (i+1)·(π/2)]
// Centre of segment i: −π/2 + i·(π/2) + π/4
//
// For segment i's centre to land under the top pointer after rotation r:
//   r = −π/2 − centre_i + k·2π  (k = 10 full spins)
//   r = (3555 − i·90) degrees
function getTargetRotation(index: number): number {
  return (3555 - index * 90) * (Math.PI / 180)
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

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, WHEEL_RADIUS, startAngle, endAngle)
    ctx.fillStyle = bg
    ctx.fill()

    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 3
    ctx.stroke()

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

  ctx.fillStyle = '#FFD700'
  ctx.font = '22px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('★', 0, 0)

  ctx.restore()
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useWheelCanvas(winnerIndex: number) {
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const spinComplete = ref(false)

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
      drawWheel(ctx!, targetRotation * easeOutCubic(progress))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setTimeout(() => {
          spinComplete.value = true
        }, 600)
      }
    }

    requestAnimationFrame(animate)
  })

  return { canvasRef, spinComplete, WHEEL_SIZE }
}
