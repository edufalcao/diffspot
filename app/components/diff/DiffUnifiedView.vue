<script setup lang="ts">
import type { DiffLine } from '~/types/diff'

withDefaults(
  defineProps<{
    lines: DiffLine[]
    showLineNumbers?: boolean
  }>(),
  {
    showLineNumbers: true,
  },
)
</script>

<template>
  <div
    role="log"
    aria-label="Unified diff output"
    class="max-h-[600px] overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
  >
    <div
      v-for="(line, idx) in lines"
      :key="idx"
    >
      <DiffLine
        :line="line"
        :show-line-numbers="showLineNumbers"
      />
    </div>
  </div>
</template>
