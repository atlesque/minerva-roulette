<script setup lang="ts">
defineProps<{ winnerName: string }>()
</script>

<template>
  <div class="winner-stage">
    <p class="prefix">And the winner is…</p>
    <h1 class="winner-name">{{ winnerName }}</h1>
    <p class="suffix">🎉 MIN Ticket Support this week 🎉</p>
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
  gap: 8px;
  z-index: 1;
  padding: 24px;
  text-align: center;
}

.prefix {
  color: #fff;
  -webkit-text-fill-color: #fff;
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.7);
}

.winner-name {
  color: #fff;
  -webkit-text-fill-color: #fff;
  font-size: clamp(4.6rem, 18vw, 10.5rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow:
    0 0 24px rgba(255, 255, 255, 0.35),
    0 6px 20px rgba(0, 0, 0, 0.8);
}

.suffix {
  color: #fff;
  -webkit-text-fill-color: #fff;
  font-size: clamp(0.95rem, 2.3vw, 1.2rem);
  font-weight: 500;
  letter-spacing: 0.1em;
  margin-top: 16px;
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.7);
}
</style>
