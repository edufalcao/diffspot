<script setup lang="ts">
defineProps<{
  additions: number
  removals: number
  unchanged: number
}>()
</script>

<template>
  <div class="flex items-center gap-4 font-[var(--font-mono)] text-sm">
    <span class="text-[var(--color-accent)]">
      +{{ additions }} addition{{ additions !== 1 ? 's' : '' }}
    </span>
    <span class="text-[var(--color-accent-2)]">
      -{{ removals }} removal{{ removals !== 1 ? 's' : '' }}
    </span>
    <span class="text-[var(--color-muted)]">
      {{ unchanged }} unchanged
    </span>
  </div>
</template>
