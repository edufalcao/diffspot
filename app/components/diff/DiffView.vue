<script setup lang="ts">
import type { DiffResult } from '~/types/diff'

defineProps<{
  result: DiffResult
  viewMode: 'split' | 'unified'
}>()
</script>

<template>
  <div role="region" aria-label="Diff output">
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-300 ease-[var(--ease)]"
      enter-from-class="opacity-0 translate-y-2 scale-[0.99]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-150 ease-[var(--ease)]"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-1 scale-[0.99]"
    >
      <DiffSplitView
        v-if="viewMode === 'split'"
        :key="'split'"
        :lines="result.lines"
      />
      <DiffUnifiedView
        v-else
        :key="'unified'"
        :lines="result.lines"
      />
    </Transition>
  </div>
</template>
