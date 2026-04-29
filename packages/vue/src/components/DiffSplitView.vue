<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { DiffLine, ChangeGroup, CollapsedRegion } from '@diffspot/core';
import { computeCollapsedRegions } from '@diffspot/core';
import { useVirtualScroll } from '../composables/useVirtualScroll';
import DiffLineComponent from './DiffLine.vue';
import DiffMinimap from './DiffMinimap.vue';

type DisplayItem
  = { kind: 'line', line: DiffLine & { originalIndex: number } }
    | { kind: 'collapsed', region: CollapsedRegion };

function resolveLineForSide(
  line: DiffLine,
  side: 'left' | 'right'
): DiffLine {
  if (line.type !== 'unchanged') return line;

  const content = side === 'left'
    ? line.oldContent ?? line.content
    : line.newContent ?? line.content;

  if (content === line.content) return line;

  return {
    ...line,
    content
  };
}

const props = withDefaults(
  defineProps<{
    lines: DiffLine[],
    isFullscreen?: boolean,
    collapseUnchanged?: boolean,
    currentChangeIndex?: number,
    changeGroups?: ChangeGroup[],
    scrollRatio?: number,
    viewportRatio?: number
  }>(),
  {
    isFullscreen: false,
    collapseUnchanged: true,
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

// Collapsible regions
const collapsedRegions = computed(() =>
  props.collapseUnchanged ? computeCollapsedRegions(props.lines) : []
);
const expandedRegions = ref(new Set<number>());

// Build display items from full lines array, then filter for each panel.
// Collapsed regions contain only unchanged lines, so they appear in both panels.
const allDisplayItems = computed<DisplayItem[]>(() => {
  const regions = collapsedRegions.value;
  const expanded = expandedRegions.value;
  const items: DisplayItem[] = [];
  const regionMap = new Map<number, CollapsedRegion>();

  for (const region of regions) {
    if (!expanded.has(region.startIndex)) {
      regionMap.set(region.startIndex, region);
    }
  }

  let i = 0;
  while (i < props.lines.length) {
    const region = regionMap.get(i);
    if (region) {
      items.push({ kind: 'collapsed', region });
      i = region.endIndex + 1;
    } else {
      items.push({ kind: 'line', line: { ...props.lines[i]!, originalIndex: i } });
      i++;
    }
  }

  return items;
});

const leftDisplayItems = computed(() =>
  allDisplayItems.value.filter(item =>
    item.kind === 'collapsed' || item.line.type === 'removed' || item.line.type === 'unchanged'
  ).map((item) => {
    if (item.kind === 'collapsed') return item;

    return {
      ...item,
      line: {
        ...item.line,
        ...resolveLineForSide(item.line, 'left')
      }
    };
  })
);

const rightDisplayItems = computed(() =>
  allDisplayItems.value.filter(item =>
    item.kind === 'collapsed' || item.line.type === 'added' || item.line.type === 'unchanged'
  ).map((item) => {
    if (item.kind === 'collapsed') return item;

    return {
      ...item,
      line: {
        ...item.line,
        ...resolveLineForSide(item.line, 'right')
      }
    };
  })
);

function toggleRegion(startIndex: number) {
  const next = new Set(expandedRegions.value);
  if (next.has(startIndex)) {
    next.delete(startIndex);
  } else {
    next.add(startIndex);
  }
  expandedRegions.value = next;
}

// Virtual scroll for left panel
const leftTotalItems = computed(() => leftDisplayItems.value.length);
const leftVs = useVirtualScroll(leftPanelRef, leftTotalItems);

// Virtual scroll for right panel
const rightTotalItems = computed(() => rightDisplayItems.value.length);
const rightVs = useVirtualScroll(rightPanelRef, rightTotalItems);

const leftVisibleItems = computed(() =>
  leftDisplayItems.value.slice(leftVs.startIndex.value, leftVs.endIndex.value)
);

const rightVisibleItems = computed(() =>
  rightDisplayItems.value.slice(rightVs.startIndex.value, rightVs.endIndex.value)
);

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
  // Scroll so the clicked minimap position ends up centered in the viewport.
  // ratio * el.scrollHeight = the scroll position where the clicked point
  // would be at the TOP of the viewport. Subtract clientHeight/2 to center it.
  const centered = ratio * el.scrollHeight - el.clientHeight / 2;
  el.scrollTo({ top: Math.max(0, Math.min(centered, el.scrollHeight - el.clientHeight)), behavior: 'instant' });
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
          'overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] print:max-h-none! print:overflow-visible! print:h-auto!',
          isFullscreen ? 'h-full' : 'max-h-[600px]'
        ]"
      >
        <div v-if="leftVs.isPrinting.value">
          <template
            v-for="(item, i) in leftDisplayItems"
            :key="i"
          >
            <div
              v-if="item.kind === 'collapsed'"
              class="flex items-center justify-center min-h-[1.625rem] text-xs text-[var(--color-muted)] bg-[var(--color-elevated)] border-y border-[var(--color-border)] font-[var(--font-mono)]"
            >
              ··· {{ item.region.count }} unchanged lines ···
            </div>
            <div
              v-else
              :data-line-index="item.line.originalIndex"
            >
              <DiffLineComponent
                :line="item.line"
                :show-line-numbers="true"
                :is-highlighted="highlightedIndices.has(item.line.originalIndex)"
              />
            </div>
          </template>
        </div>
        <div
          v-else
          :style="{ height: leftVs.totalHeight.value + 'px', position: 'relative' }"
        >
          <div :style="{ position: 'absolute', top: '0', left: '0', right: '0', transform: `translateY(${leftVs.offsetY.value}px)` }">
            <template
              v-for="(item, i) in leftVisibleItems"
              :key="leftVs.startIndex.value + i"
            >
              <button
                v-if="item.kind === 'collapsed'"
                type="button"
                class="flex w-full items-center justify-center min-h-[1.625rem] text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] bg-[var(--color-elevated)] hover:bg-[var(--color-surface)] border-y border-[var(--color-border)] font-[var(--font-mono)] cursor-pointer transition-colors"
                @click="toggleRegion(item.region.startIndex)"
              >
                ··· {{ item.region.count }} unchanged lines ···
              </button>
              <div
                v-else
                :data-line-index="item.line.originalIndex"
              >
                <DiffLineComponent
                  :line="item.line"
                  :show-line-numbers="true"
                  :is-highlighted="highlightedIndices.has(item.line.originalIndex)"
                />
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Right column: new file -->
      <div
        ref="rightPanelRef"
        aria-label="Modified file"
        :class="[
          'overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] print:max-h-none! print:overflow-visible! print:h-auto!',
          isFullscreen ? 'h-full' : 'max-h-[600px]'
        ]"
      >
        <div v-if="rightVs.isPrinting.value">
          <template
            v-for="(item, i) in rightDisplayItems"
            :key="i"
          >
            <div
              v-if="item.kind === 'collapsed'"
              class="flex items-center justify-center min-h-[1.625rem] text-xs text-[var(--color-muted)] bg-[var(--color-elevated)] border-y border-[var(--color-border)] font-[var(--font-mono)]"
            >
              ··· {{ item.region.count }} unchanged lines ···
            </div>
            <div
              v-else
              :data-line-index="item.line.originalIndex"
            >
              <DiffLineComponent
                :line="item.line"
                :show-line-numbers="true"
                :is-highlighted="highlightedIndices.has(item.line.originalIndex)"
              />
            </div>
          </template>
        </div>
        <div
          v-else
          :style="{ height: rightVs.totalHeight.value + 'px', position: 'relative' }"
        >
          <div :style="{ position: 'absolute', top: '0', left: '0', right: '0', transform: `translateY(${rightVs.offsetY.value}px)` }">
            <template
              v-for="(item, i) in rightVisibleItems"
              :key="rightVs.startIndex.value + i"
            >
              <button
                v-if="item.kind === 'collapsed'"
                type="button"
                class="flex w-full items-center justify-center min-h-[1.625rem] text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] bg-[var(--color-elevated)] hover:bg-[var(--color-surface)] border-y border-[var(--color-border)] font-[var(--font-mono)] cursor-pointer transition-colors"
                @click="toggleRegion(item.region.startIndex)"
              >
                ··· {{ item.region.count }} unchanged lines ···
              </button>
              <div
                v-else
                :data-line-index="item.line.originalIndex"
              >
                <DiffLineComponent
                  :line="item.line"
                  :show-line-numbers="true"
                  :is-highlighted="highlightedIndices.has(item.line.originalIndex)"
                />
              </div>
            </template>
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
