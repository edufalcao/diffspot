<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { DiffLine, ChangeGroup } from '@diffspot/core';
import { useVirtualScroll } from '../composables/useVirtualScroll';
import DiffLineComponent from './DiffLine.vue';
import DiffMinimap from './DiffMinimap.vue';

const props = withDefaults(
  defineProps<{
    lines: DiffLine[],
    isFullscreen?: boolean,
    currentChangeIndex?: number,
    changeGroups?: ChangeGroup[],
    scrollRatio?: number,
    viewportRatio?: number
  }>(),
  {
    isFullscreen: false,
    currentChangeIndex: -1,
    changeGroups: () => [],
    scrollRatio: 0,
    viewportRatio: 1
  }
);

const emit = defineEmits<{
  'scroll-to': [ratio: number],
  'scroll-container-ready': [el: HTMLElement | null]
}>();

const leftPanelRef = ref<HTMLElement | null>(null);
const rightPanelRef = ref<HTMLElement | null>(null);
let isSyncing = false;

// Map lines preserving original index before filtering
const leftLines = computed(() =>
  props.lines
    .map((l, i) => ({ ...l, originalIndex: i }))
    .filter(l => l.type === 'removed' || l.type === 'unchanged')
);

const rightLines = computed(() =>
  props.lines
    .map((l, i) => ({ ...l, originalIndex: i }))
    .filter(l => l.type === 'added' || l.type === 'unchanged')
);

// Virtual scroll for left panel
const leftTotalItems = computed(() => leftLines.value.length);
const leftVs = useVirtualScroll(leftPanelRef, leftTotalItems);

// Virtual scroll for right panel
const rightTotalItems = computed(() => rightLines.value.length);
const rightVs = useVirtualScroll(rightPanelRef, rightTotalItems);

const leftVisibleItems = computed(() => {
  const items = leftLines.value;
  return items.slice(leftVs.startIndex.value, leftVs.endIndex.value);
});

const rightVisibleItems = computed(() => {
  const items = rightLines.value;
  return items.slice(rightVs.startIndex.value, rightVs.endIndex.value);
});

// Compute highlighted line indices from current change group
const highlightedIndices = computed(() => {
  const set = new Set<number>();
  const group = props.currentChangeIndex >= 0 ? props.changeGroups?.[props.currentChangeIndex] : undefined;
  if (group) {
    for (let i = group.startIndex; i <= group.endIndex; i++) {
      set.add(i);
    }
  }
  return set;
});

function syncScroll(source: HTMLElement, target: HTMLElement) {
  if (isSyncing) return;
  isSyncing = true;
  requestAnimationFrame(() => {
    const sourceMax = source.scrollHeight - source.clientHeight;
    const targetMax = target.scrollHeight - target.clientHeight;
    if (sourceMax > 0 && targetMax > 0) {
      target.scrollTop = (source.scrollTop / sourceMax) * targetMax;
    }
    target.scrollLeft = source.scrollLeft;
    isSyncing = false;
  });
}

function onLeftScroll() {
  if (leftPanelRef.value && rightPanelRef.value) {
    syncScroll(leftPanelRef.value, rightPanelRef.value);
  }
}

function onRightScroll() {
  if (rightPanelRef.value && leftPanelRef.value) {
    syncScroll(rightPanelRef.value, leftPanelRef.value);
  }
}

function onMinimapScrollTo(ratio: number) {
  const el = leftPanelRef.value;
  if (!el) return;
  const maxScroll = el.scrollHeight - el.clientHeight;
  el.scrollTop = ratio * maxScroll;
}

onMounted(() => {
  leftPanelRef.value?.addEventListener('scroll', onLeftScroll);
  rightPanelRef.value?.addEventListener('scroll', onRightScroll);
  nextTick(() => {
    emit('scroll-container-ready', leftPanelRef.value);
  });
});

onBeforeUnmount(() => {
  leftPanelRef.value?.removeEventListener('scroll', onLeftScroll);
  rightPanelRef.value?.removeEventListener('scroll', onRightScroll);
});

defineExpose({
  getScrollContainer() {
    return leftPanelRef.value;
  }
});
</script>

<template>
  <div :class="['flex gap-1', isFullscreen ? 'h-full' : '']">
    <div class="grid grid-cols-2 gap-3 flex-1 min-w-0">
      <!-- Left column: old file -->
      <div
        ref="leftPanelRef"
        aria-label="Original file"
        :class="[
          'overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]',
          isFullscreen ? 'h-full' : 'max-h-[600px]'
        ]"
      >
        <div v-if="leftVs.isPrinting.value">
          <div
            v-for="(line, idx) in leftLines"
            :key="idx"
            :data-line-index="line.originalIndex"
          >
            <DiffLineComponent
              :line="line"
              :show-line-numbers="true"
              :is-highlighted="highlightedIndices.has(line.originalIndex)"
            />
          </div>
        </div>
        <div
          v-else
          :style="{ height: leftVs.totalHeight.value + 'px', position: 'relative' }"
        >
          <div :style="{ position: 'absolute', top: '0', left: '0', right: '0', transform: `translateY(${leftVs.offsetY.value}px)` }">
            <div
              v-for="item in leftVisibleItems"
              :key="item.originalIndex"
              :data-line-index="item.originalIndex"
            >
              <DiffLineComponent
                :line="item"
                :show-line-numbers="true"
                :is-highlighted="highlightedIndices.has(item.originalIndex)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right column: new file -->
      <div
        ref="rightPanelRef"
        aria-label="Modified file"
        :class="[
          'overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]',
          isFullscreen ? 'h-full' : 'max-h-[600px]'
        ]"
      >
        <div v-if="rightVs.isPrinting.value">
          <div
            v-for="(line, idx) in rightLines"
            :key="idx"
            :data-line-index="line.originalIndex"
          >
            <DiffLineComponent
              :line="line"
              :show-line-numbers="true"
              :is-highlighted="highlightedIndices.has(line.originalIndex)"
            />
          </div>
        </div>
        <div
          v-else
          :style="{ height: rightVs.totalHeight.value + 'px', position: 'relative' }"
        >
          <div :style="{ position: 'absolute', top: '0', left: '0', right: '0', transform: `translateY(${rightVs.offsetY.value}px)` }">
            <div
              v-for="item in rightVisibleItems"
              :key="item.originalIndex"
              :data-line-index="item.originalIndex"
            >
              <DiffLineComponent
                :line="item"
                :show-line-numbers="true"
                :is-highlighted="highlightedIndices.has(item.originalIndex)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Minimap -->
    <DiffMinimap
      :lines="lines"
      :scroll-ratio="scrollRatio ?? 0"
      :viewport-ratio="viewportRatio ?? 1"
      @scroll-to="onMinimapScrollTo"
    />
  </div>
</template>
