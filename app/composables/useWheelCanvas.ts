import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { NAMES } from '~/composables/useWinner'

const SPIN_DURATION = 5000

const SEGMENT_COLORS = [
  { bg: '#E63946', text: '#FFFFFF' }, // Kris – crimson
  { bg: '#FFD700', text: '#FFFFFF' }, // Gilles – gold
  { bg: '#4895EF', text: '#FFFFFF' }, // Tom – sky blue
  { bg: '#F77F00', text: '#FFFFFF' }, // Thijs – orange
  { bg: '#2DC653', text: '#FFFFFF' }, // Alex – emerald
]

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Segments are drawn starting from the top (angle = −π/2).
// Segment i spans: [−π/2 + i·arc,  −π/2 + (i+1)·arc]  where arc = 2π/n.
// Centre of segment i: −π/2 + i·arc + arc/2
//
// For segment i's centre to land under the top pointer after rotation r:
//   r = −π/2 − centre_i + k·2π  (k = 10 full spins)
function getTargetRotation(index: number): number {
  const n = NAMES.length
  const arcDeg = 360 / n
  // 10 full spins (3600°) minus the segment centre offset, then minus index * arc
  return (3600 - arcDeg / 2 - index * arcDeg) * (Math.PI / 180)
}

// ─── 3D scene ─────────────────────────────────────────────────────────────────
// The angles above are screen angles (clockwise, y down). Three.js uses
// counter-clockwise angles with y up, so every screen angle θ maps to −θ and
// the wheel's z-rotation is the negated spin rotation.

const R = 5 // wheel radius in world units
const FACE_DEPTH = 0.35
const NUM_LIGHTS = 24

const GOLD = new THREE.MeshPhysicalMaterial({
  color: '#FFC83D',
  metalness: 1,
  roughness: 0.22,
  clearcoat: 0.6,
})

function makeLabelTexture(name: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  ctx.font = '900 76px "Poppins", system-ui, sans-serif'
  ctx.shadowColor = 'rgba(0,0,0,0.75)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 4
  ctx.lineWidth = 6
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.strokeText(name, 500, 66)
  ctx.fillStyle = color
  ctx.fillText(name, 500, 66)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,215,0,0.55)')
  g.addColorStop(0.45, 'rgba(218,112,214,0.25)')
  g.addColorStop(1, 'rgba(13,2,40,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function starShape(outer: number, inner: number): THREE.Shape {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}

function buildWheel(winnerIndex: number) {
  const n = NAMES.length
  const arc = (2 * Math.PI) / n
  const wheel = new THREE.Group()
  const segmentMaterials: THREE.MeshPhysicalMaterial[] = []
  const labelMaterials: THREE.MeshBasicMaterial[] = []

  // ── Back plate & rim ───────────────────────────────────────────────────────
  const back = new THREE.Mesh(
    new THREE.CylinderGeometry(R + 0.55, R + 0.55, 0.7, 96),
    new THREE.MeshPhysicalMaterial({ color: '#1A1A2E', metalness: 0.6, roughness: 0.4 }),
  )
  back.rotation.x = Math.PI / 2
  back.position.z = -0.2
  wheel.add(back)

  const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.3, 0.32, 32, 160), GOLD)
  rim.position.z = FACE_DEPTH
  wheel.add(rim)

  const innerRim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.08, 16, 160), GOLD)
  innerRim.position.z = FACE_DEPTH + 0.05
  wheel.add(innerRim)

  // ── Segments ───────────────────────────────────────────────────────────────
  for (let i = 0; i < n; i++) {
    const start = -(-Math.PI / 2 + (i + 1) * arc)
    const end = -(-Math.PI / 2 + i * arc)
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.absarc(0, 0, R, start, end, false)
    shape.lineTo(0, 0)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: FACE_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.04,
      bevelSegments: 3,
      curveSegments: 48,
    })
    const mat = new THREE.MeshPhysicalMaterial({
      color: SEGMENT_COLORS[i]!.bg,
      roughness: 0.6,
      metalness: 0,
      // The flat face points at both key light and camera; keep specular low so
      // a broad white highlight doesn't wash the colours out
      specularIntensity: 0.25,
      envMapIntensity: 0.25,
      emissive: SEGMENT_COLORS[i]!.bg,
      emissiveIntensity: 0,
    })
    // Punch up saturation so the lit segments stay vivid rather than pastel
    mat.color.offsetHSL(0, 0.15, -0.08)
    segmentMaterials.push(mat)
    wheel.add(new THREE.Mesh(geo, mat))

    // Name label, reading outward along the segment's centre line
    const mid = -(-Math.PI / 2 + i * arc + arc / 2)
    const labelMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false })
    labelMaterials.push(labelMat)
    const label = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), labelMat)
    const labelRadius = R - 0.35 - 2
    label.position.set(Math.cos(mid) * labelRadius, Math.sin(mid) * labelRadius, FACE_DEPTH + 0.08)
    label.rotation.z = mid
    wheel.add(label)

    // Divider & peg on each segment boundary
    const boundary = end
    const divider = new THREE.Mesh(new THREE.BoxGeometry(R - 0.9, 0.09, 0.12), GOLD)
    const dr = (R + 0.9) / 2
    divider.position.set(Math.cos(boundary) * dr, Math.sin(boundary) * dr, FACE_DEPTH + 0.08)
    divider.rotation.z = boundary
    wheel.add(divider)

    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16), GOLD)
    peg.rotation.x = Math.PI / 2
    peg.position.set(Math.cos(boundary) * (R + 0.3), Math.sin(boundary) * (R + 0.3), FACE_DEPTH + 0.45)
    wheel.add(peg)
    const pegCap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), GOLD)
    pegCap.position.set(peg.position.x, peg.position.y, FACE_DEPTH + 0.8)
    wheel.add(pegCap)
  }

  // ── Rim lights ─────────────────────────────────────────────────────────────
  const lightMaterials: THREE.MeshStandardMaterial[] = []
  const bulbGeo = new THREE.SphereGeometry(0.17, 16, 12)
  for (let i = 0; i < NUM_LIGHTS; i++) {
    const a = -(i / NUM_LIGHTS) * 2 * Math.PI
    const color = i % 2 === 0 ? '#FF4500' : '#FFFACD'
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2 })
    lightMaterials.push(mat)
    const bulb = new THREE.Mesh(bulbGeo, mat)
    bulb.position.set(Math.cos(a) * (R + 0.3), Math.sin(a) * (R + 0.3), FACE_DEPTH + 0.3)
    wheel.add(bulb)
  }

  // ── Centre hub ─────────────────────────────────────────────────────────────
  const hubBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.05, 0.4, 64),
    new THREE.MeshPhysicalMaterial({ color: '#2A2A48', metalness: 0.7, roughness: 0.3, clearcoat: 1 }),
  )
  hubBase.rotation.x = Math.PI / 2
  hubBase.position.z = FACE_DEPTH + 0.2
  wheel.add(hubBase)

  const hubRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.1, 16, 64), GOLD)
  hubRing.position.z = FACE_DEPTH + 0.4
  wheel.add(hubRing)

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({ color: '#3A3A5E', metalness: 0.8, roughness: 0.2, clearcoat: 1 }),
  )
  dome.rotation.x = Math.PI / 2
  dome.scale.set(1, 0.45, 1)
  dome.position.z = FACE_DEPTH + 0.4
  wheel.add(dome)

  const star = new THREE.Mesh(
    new THREE.ExtrudeGeometry(starShape(0.55, 0.23), {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.03,
      bevelSegments: 2,
    }),
    GOLD,
  )
  star.position.z = FACE_DEPTH + 0.72
  wheel.add(star)

  return { wheel, segmentMaterials, labelMaterials, lightMaterials, winnerMaterial: segmentMaterials[winnerIndex] }
}

function buildPointer() {
  // Pivot sits at the top so the pointer can flick as pegs pass underneath
  const pivot = new THREE.Group()
  pivot.position.set(0, R + 1.55, FACE_DEPTH + 0.9)

  const shape = new THREE.Shape()
  shape.moveTo(0, -1.45)
  shape.lineTo(-0.62, 0)
  shape.quadraticCurveTo(0, 0.45, 0.62, 0)
  shape.closePath()
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.06,
      bevelSegments: 4,
    }),
    GOLD,
  )
  body.position.z = -0.15
  pivot.add(body)

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22),
    new THREE.MeshPhysicalMaterial({
      color: '#E63946',
      emissive: '#E63946',
      emissiveIntensity: 0.6,
      metalness: 0,
      roughness: 0.05,
      clearcoat: 1,
    }),
  )
  gem.position.set(0, -0.05, 0.3)
  pivot.add(gem)

  return pivot
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useWheelCanvas(winnerIndex: number) {
  const canvasRef = ref<HTMLCanvasElement | null>(null)
  const spinComplete = ref(false)

  let frameId = 0
  let dispose: (() => void) | null = null

  onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 1
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.45

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    // Camera looks at the wheel from slightly below; distance is set on resize
    const CAMERA_DIR = new THREE.Vector3(0, -0.06, 1).normalize()
    const CAMERA_TARGET = new THREE.Vector3(0, 0.6, 0)
    const BASE_DISTANCE = 24

    scene.add(new THREE.AmbientLight('#ffffff', 0.25))
    const key = new THREE.DirectionalLight('#fff4e0', 1.1)
    key.position.set(6, 10, 14)
    scene.add(key)
    const magenta = new THREE.PointLight('#DA70D6', 25, 30)
    magenta.position.set(-9, -4, 6)
    scene.add(magenta)
    const cyan = new THREE.PointLight('#4895EF', 20, 30)
    cyan.position.set(9, -5, 5)
    scene.add(cyan)

    // Whole assembly is tilted so the wheel reads as a physical object
    const stage = new THREE.Group()
    stage.rotation.x = -0.14
    scene.add(stage)

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 22),
      new THREE.MeshBasicMaterial({
        map: makeGlowTexture(),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    )
    glow.position.z = -1.5
    stage.add(glow)

    const { wheel, labelMaterials, lightMaterials, winnerMaterial } = buildWheel(winnerIndex)
    stage.add(wheel)

    const pointer = buildPointer()
    stage.add(pointer)

    // Labels are drawn once the web font is available
    document.fonts.load('900 76px "Poppins"').finally(() => {
      labelMaterials.forEach((mat, i) => {
        mat.map = makeLabelTexture(NAMES[i]!, SEGMENT_COLORS[i]!.text)
        mat.needsUpdate = true
      })
    })

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      // The canvas fills the viewport so the glow never gets clipped; keep the
      // wheel itself at min(760px, 100vmin) by moving the camera back.
      const wheelPx = Math.min(760, 0.92 * Math.min(w, h))
      camera.position.copy(CAMERA_DIR).multiplyScalar((BASE_DISTANCE * h) / wheelPx).add(CAMERA_TARGET)
      camera.lookAt(CAMERA_TARGET)
    }
    resize()
    window.addEventListener('resize', resize)

    const targetRotation = getTargetRotation(winnerIndex)
    const arc = (2 * Math.PI) / NAMES.length
    const startTime = performance.now()
    let spinDone = false
    let lastBoundary = 0
    let flick = 0
    let flickVelocity = 0
    let doneAt = 0

    function animate(timestamp: number) {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / SPIN_DURATION, 1)
      const rotation = targetRotation * easeOutCubic(progress)
      wheel.rotation.z = -rotation

      // Pointer flicks each time a peg passes under it
      const boundary = Math.floor(rotation / arc)
      if (boundary !== lastBoundary) {
        lastBoundary = boundary
        flick = Math.min(flick + 0.45, 0.6)
      }
      flickVelocity += -flick * 0.35 - flickVelocity * 0.25
      flick += flickVelocity
      pointer.rotation.z = flick

      // Chasing rim lights, faster while spinning
      const t = timestamp / 1000
      const speed = 4 + (1 - progress) * 14
      lightMaterials.forEach((mat, i) => {
        mat.emissiveIntensity = 0.6 + 2.4 * (0.5 + 0.5 * Math.sin(t * speed - i * 0.8))
      })

      // Gentle idle sway of the whole stage
      stage.rotation.y = Math.sin(t * 0.5) * 0.15
      stage.position.y = Math.sin(t * 0.8) * 0.12

      if (progress >= 1 && !spinDone) {
        spinDone = true
        doneAt = timestamp
        setTimeout(() => {
          spinComplete.value = true
        }, 600)
      }

      // Winning segment pulses once the wheel has stopped
      if (spinDone && winnerMaterial) {
        const since = (timestamp - doneAt) / 1000
        winnerMaterial.emissiveIntensity = 0.25 + 0.25 * Math.sin(since * 5)
      }

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)

    dispose = () => {
      window.removeEventListener('resize', resize)
      pmrem.dispose()
      renderer.dispose()
    }
  })

  onUnmounted(() => {
    cancelAnimationFrame(frameId)
    dispose?.()
  })

  return { canvasRef, spinComplete }
}
