<script setup lang="ts">
import type { DiffResult } from '~/types/diff'

defineProps<{
  result: DiffResult
  viewMode: 'split' | 'unified'
}>()
</script>

<template>
  <div>
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-200 ease-[var(--ease)]"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-[var(--ease)]"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
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
