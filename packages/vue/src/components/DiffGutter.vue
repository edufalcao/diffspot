<script setup lang="ts">
withDefaults(
  defineProps<{
    oldLineNumber?: number
    newLineNumber?: number
  }>(),
  {
    oldLineNumber: undefined,
    newLineNumber: undefined,
  },
)
</script>

<template>
  <div class="flex shrink-0 select-none font-[var(--font-mono)] text-xs text-[var(--color-muted)]">
    <span class="inline-block min-w-[3rem] text-right px-2 py-0.5 border-r border-[var(--color-border)]">
      {{ oldLineNumber ?? '' }}
    </span>
    <span class="inline-block min-w-[3rem] text-right px-2 py-0.5 border-r border-[var(--color-border)]">
      {{ newLineNumber ?? '' }}
    </span>
  </div>
</template>
