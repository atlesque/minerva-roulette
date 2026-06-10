<script setup lang="ts">
import { watch } from 'vue'
import { useWheelCanvas, WHEEL_SIZE } from '~/composables/useWheelCanvas'

const props = defineProps<{ winnerIndex: number }>()
const emit = defineEmits<{ spinComplete: [] }>()

const { canvasRef, spinComplete } = useWheelCanvas(props.winnerIndex)

watch(spinComplete, (done) => {
  if (done) emit('spinComplete')
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
    <p class="spin-hint">✨ Spinning… ✨</p>
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

.spin-hint {
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  font-weight: 300;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
</style>
