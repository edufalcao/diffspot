<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import type { DiffLine } from '@diffspot/core';
import { computeMinimapBlocks } from '@diffspot/core';

const props = defineProps<{
  lines: DiffLine[],
  scrollRatio: number,
  viewportRatio: number
}>();

const emit = defineEmits<{
  'scroll-to': [ratio: number]
}>();

const blocks = computed(() => computeMinimapBlocks(props.lines));

const viewportY = computed(() => {
  const maxY = 100 - props.viewportRatio * 100;
  return props.scrollRatio * maxY;
});

const viewportHeight = computed(() => Math.min(props.viewportRatio * 100, 100));

const isDragging = ref(false);
const containerRef = ref<HTMLElement | null>(null);

function calcRatioFromEvent(e: MouseEvent) {
  const el = containerRef.value;
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
  return y / rect.height;
}

function onMouseDown(e: MouseEvent) {
  isDragging.value = true;
  const ratio = calcRatioFromEvent(e);
  emit('scroll-to', ratio);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  e.preventDefault();
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  const ratio = calcRatioFromEvent(e);
  emit('scroll-to', ratio);
}

function onMouseUp() {
  isDragging.value = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
});
</script>

<template>
  <div
    ref="containerRef"
    class="hidden md:block w-10 flex-shrink-0 relative cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] print:hidden select-none"
    @mousedown="onMouseDown"
  >
    <!-- Change blocks -->
    <div
      v-for="(block, idx) in blocks"
      :key="idx"
      class="absolute left-1 right-1 rounded-sm"
      :class="block.type === 'added' ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-accent-2)]'"
      :style="{
        top: block.y + '%',
        height: block.height + '%',
        opacity: 0.6
      }"
    />

    <!-- Viewport indicator -->
    <div
      class="absolute left-0 right-0 border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 rounded-sm pointer-events-none transition-[top] duration-75"
      :style="{
        top: viewportY + '%',
        height: viewportHeight + '%'
      }"
    />
  </div>
</template>
