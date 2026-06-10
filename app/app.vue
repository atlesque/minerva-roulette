<script setup lang="ts">
import { ref } from 'vue'
import { useWinner } from '~/composables/useWinner'

const { winnerIndex, winnerName } = useWinner()
const spinComplete = ref(false)
</script>

<template>
  <div class="carnival-app">
    <div class="confetti-bg" aria-hidden="true" />
    <Transition name="wheel">
      <SpinningWheel v-if="!spinComplete" :winner-index="winnerIndex" @spin-complete="spinComplete = true" />
    </Transition>
    <Transition name="winner">
      <WinnerReveal v-if="spinComplete" :winner-name="winnerName" />
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
