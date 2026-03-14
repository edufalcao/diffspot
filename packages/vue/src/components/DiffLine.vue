<script setup lang="ts">
import { computed, inject } from 'vue';
import type { DiffLine } from '@diffspot/core';
import DiffGutter from './DiffGutter.vue';

interface SyntaxSpan {
  text: string,
  cls: string
}

type HighlightLineFn = (line: DiffLine) => SyntaxSpan[] | null;

const props = withDefaults(
  defineProps<{
    line: DiffLine,
    showLineNumbers?: boolean,
    isHighlighted?: boolean
  }>(),
  {
    showLineNumbers: true,
    isHighlighted: false
  }
);

const highlightLineFn = inject<HighlightLineFn | null>('diffspot:highlightLine', null);

const syntaxSpans = computed(() => {
  // Skip syntax highlighting when word-level diff highlights are active
  if (props.line.words && props.line.words.length > 0) return null;
  if (!highlightLineFn) return null;
  return highlightLineFn(props.line);
});

const prefixMap: Record<DiffLine['type'], string> = {
  added: '+',
  removed: '-',
  unchanged: ' '
};

const lineClasses = computed(() => [
  'flex min-h-[1.625rem] items-stretch',
  props.line.type === 'added' && 'border-l-[3px] border-l-[var(--color-accent)] bg-[var(--color-added-bg)]',
  props.line.type === 'removed' && 'border-l-[3px] border-l-[var(--color-accent-2)] bg-[var(--color-removed-bg)]',
  props.line.type === 'unchanged' && 'border-l-[3px] border-l-transparent',
  props.isHighlighted && props.line.type === 'added' && 'ring-1 ring-inset ring-[var(--color-accent)]/40',
  props.isHighlighted && props.line.type === 'removed' && 'ring-1 ring-inset ring-[var(--color-accent-2)]/40'
]);
</script>

<template>
  <div :class="lineClasses">
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
            word.added && 'bg-[var(--color-added-highlight)] rounded-xs',
            word.removed && 'bg-[var(--color-removed-highlight)] rounded-xs'
          ]"
        >{{ word.value }}</span>
      </template>
      <template v-else-if="syntaxSpans && syntaxSpans.length > 0">
        <span
          v-for="(span, idx) in syntaxSpans"
          :key="idx"
          :class="span.cls || undefined"
        >{{ span.text }}</span>
      </template>
      <template v-else>{{ line.content }}</template>
    </span>
  </div>
</template>
