<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import type { DiffPrecision } from '~/types/diff'

const props = withDefaults(
  defineProps<{
    viewMode: 'split' | 'unified'
    precision: DiffPrecision
    ignoreWhitespace: boolean
    ignoreCase: boolean
    hideSplitOption?: boolean
  }>(),
  {
    hideSplitOption: false,
  },
)

const emit = defineEmits<{
  'update:viewMode': [value: 'split' | 'unified']
  'update:precision': [value: DiffPrecision]
  'update:ignoreWhitespace': [value: boolean]
  'update:ignoreCase': [value: boolean]
  'export': [type: 'png' | 'pdf']
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

const exportItems = [
  { label: 'Export as PNG', value: 'png' },
  { label: 'Export as PDF', value: 'pdf' },
]

function onExport(value: string) {
  emit('export', value as 'png' | 'pdf')
}
</script>

<template>
  <div role="toolbar" aria-label="Diff controls" class="flex flex-wrap items-center gap-3">
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

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Export dropdown -->
    <UiDropdownMenu
      :items="exportItems"
      @update:model-value="onExport"
    >
      <template #trigger>
        <UiGlowButton variant="secondary" size="sm">
          <Download :size="16" />
          Export
        </UiGlowButton>
      </template>
    </UiDropdownMenu>

  </div>
</template>
