<script setup lang="ts">
import { Printer, Maximize2, Minimize2, ChevronUp, ChevronDown } from 'lucide-vue-next'
import type { DiffPrecision } from '~/types/diff'

const props = withDefaults(
  defineProps<{
    viewMode: 'split' | 'unified'
    precision: DiffPrecision
    ignoreWhitespace: boolean
    ignoreCase: boolean
    hideSplitOption?: boolean
    isFullscreen?: boolean
    currentChangeIndex?: number
    totalChanges?: number
  }>(),
  {
    hideSplitOption: false,
    isFullscreen: false,
    currentChangeIndex: -1,
    totalChanges: 0,
  },
)

const emit = defineEmits<{
  'update:viewMode': [value: 'split' | 'unified']
  'update:precision': [value: DiffPrecision]
  'update:ignoreWhitespace': [value: boolean]
  'update:ignoreCase': [value: boolean]
  'print': []
  'toggle-fullscreen': []
  'prev-change': []
  'next-change': []
}>()

const viewModeOptions = computed(() =>
  props.hideSplitOption
    ? [{ label: 'Unified', value: 'unified' }]
    : [
        { label: 'Split', value: 'split' },
        { label: 'Unified', value: 'unified' },
      ],
)

const precisionOptions = [
  { label: 'Line', value: 'line' },
  { label: 'Word', value: 'word' },
  { label: 'Char', value: 'char' },
]

const changeDisplay = computed(() => {
  if (props.totalChanges === 0) return '0 / 0'
  return `${props.currentChangeIndex + 1} / ${props.totalChanges}`
})
</script>

<template>
  <div role="toolbar" aria-label="Diff controls" class="flex flex-wrap items-center gap-3 print:hidden">
    <!-- View mode toggle -->
    <UiToggleGroup
      :options="viewModeOptions"
      :model-value="viewMode"
      @update:model-value="emit('update:viewMode', $event as 'split' | 'unified')"
    />

    <!-- Precision selector -->
    <UiToggleGroup
      :options="precisionOptions"
      :model-value="precision"
      @update:model-value="emit('update:precision', $event as DiffPrecision)"
    />

    <!-- Divider -->
    <div class="h-6 w-px bg-[var(--color-border)]" />

    <!-- Ignore whitespace checkbox -->
    <label class="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]">
      <input
        type="checkbox"
        :checked="ignoreWhitespace"
        class="accent-[var(--color-accent)]"
        @change="emit('update:ignoreWhitespace', ($event.target as HTMLInputElement).checked)"
      >
      Ignore whitespace
    </label>

    <!-- Ignore case checkbox -->
    <label class="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]">
      <input
        type="checkbox"
        :checked="ignoreCase"
        class="accent-[var(--color-accent)]"
        @change="emit('update:ignoreCase', ($event.target as HTMLInputElement).checked)"
      >
      Ignore case
    </label>

    <!-- Divider -->
    <div class="h-6 w-px bg-[var(--color-border)]" />

    <!-- Jump navigation -->
    <div class="flex items-center gap-1">
      <button
        :disabled="totalChanges === 0 || currentChangeIndex <= 0"
        class="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Previous change (Alt+Up)"
        @click="emit('prev-change')"
      >
        <ChevronUp :size="16" />
      </button>
      <span
        class="text-xs tabular-nums min-w-[3.5rem] text-center text-[var(--color-muted)]"
        style="font-family: var(--font-mono)"
      >
        {{ changeDisplay }}
      </span>
      <button
        :disabled="totalChanges === 0 || currentChangeIndex >= totalChanges - 1"
        class="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Next change (Alt+Down)"
        @click="emit('next-change')"
      >
        <ChevronDown :size="16" />
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Fullscreen toggle -->
    <UiGlowButton variant="secondary" size="sm" @click="emit('toggle-fullscreen')">
      <Minimize2 v-if="isFullscreen" :size="16" />
      <Maximize2 v-else :size="16" />
      {{ isFullscreen ? 'Exit' : 'Fullscreen' }}
    </UiGlowButton>

    <!-- Print / Save as PDF -->
    <UiGlowButton variant="secondary" size="sm" @click="emit('print')">
      <Printer :size="16" />
      Print
    </UiGlowButton>
  </div>
</template>
