<script setup lang="ts">
interface Props {
  command?: string
}

withDefaults(defineProps<Props>(), {
  command: 'diff a.txt b.txt'
});
</script>

<template>
  <div class="inline-flex items-center gap-2 font-[var(--font-mono)] text-sm">
    <span class="text-[var(--color-muted)]">$</span>
    <span class="text-[var(--color-accent)]">{{ command }}</span>
    <span class="cursor-blink text-[var(--color-accent)]">|</span>
  </div>
</template>

<style scoped>
@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.cursor-blink {
  animation: blink 1s step-end infinite;
}
</style>
