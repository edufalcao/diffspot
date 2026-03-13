<script setup lang="ts">
import type { DiffLine } from '@diffspot/core'

const props = withDefaults(
  defineProps<{
    line: DiffLine
    showLineNumbers?: boolean
    isHighlighted?: boolean
  }>(),
  {
    showLineNumbers: true,
    isHighlighted: false,
  },
)

const prefixMap: Record<DiffLine['type'], string> = {
  added: '+',
  removed: '-',
  unchanged: ' ',
}
</script>

<template>
  <div
    :class="[
      'flex min-h-[1.625rem] items-stretch',
      line.type === 'added' && 'border-l-[3px] border-l-[var(--color-accent)] bg-[var(--color-added-bg)]',
      line.type === 'removed' && 'border-l-[3px] border-l-[var(--color-accent-2)] bg-[var(--color-removed-bg)]',
      line.type === 'unchanged' && 'border-l-[3px] border-l-transparent',
      isHighlighted && line.type === 'added' && 'ring-1 ring-inset ring-[var(--color-accent)]/40',
      isHighlighted && line.type === 'removed' && 'ring-1 ring-inset ring-[var(--color-accent-2)]/40',
    ]"
  >
    <DiffGutter
      v-if="showLineNumbers"
      :old-line-number="line.oldLineNumber"
      :new-line-number="line.newLineNumber"
    />
    <span class="whitespace-pre px-1 font-[var(--font-mono)] text-sm leading-relaxed text-[var(--color-muted)] select-none">{{ prefixMap[line.type] }}</span>
    <span class="flex-1 whitespace-pre font-[var(--font-mono)] text-sm leading-relaxed text-[var(--color-text)]">
      <template v-if="line.words && line.words.length > 0">
        <span
          v-for="(word, idx) in line.words"
          :key="idx"
          :class="[
            word.added && 'bg-[var(--color-added-highlight)] rounded-sm',
            word.removed && 'bg-[var(--color-removed-highlight)] rounded-sm',
          ]"
        >{{ word.value }}</span>
      </template>
      <template v-else>{{ line.content }}</template>
    </span>
  </div>
</template>
