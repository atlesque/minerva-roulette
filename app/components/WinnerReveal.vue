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
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(0.9rem, 2.5vw, 1.2rem);
  font-weight: 300;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.winner-name {
  color: #ffd700;
  font-size: clamp(4rem, 16vw, 9rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  text-shadow:
    0 0 40px rgba(255, 215, 0, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.6);
}

.suffix {
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(0.75rem, 2vw, 1rem);
  font-weight: 300;
  letter-spacing: 0.1em;
  margin-top: 16px;
}
</style>
