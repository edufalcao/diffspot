<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import type { DiffLine, ChangeGroup, CollapsedRegion } from '@diffspot/core';
import { computeCollapsedRegions } from '@diffspot/core';
import { useVirtualScroll, VIRTUAL_SCROLL_ITEM_HEIGHT } from '../composables/useVirtualScroll';
import DiffLineComponent from './DiffLine.vue';
import DiffMinimap from './DiffMinimap.vue';

type DisplayItem
  = { kind: 'line', line: DiffLine, idx: number }
    | { kind: 'collapsed', region: CollapsedRegion };

const props = withDefaults(
  defineProps<{
    lines: DiffLine[],
    showLineNumbers?: boolean,
    isFullscreen?: boolean,
    collapseUnchanged?: boolean,
    currentChangeIndex?: number,
    changeGroups?: ChangeGroup[],
    scrollRatio?: number,
    viewportRatio?: number
  }>(),
  {
    showLineNumbers: true,
    isFullscreen: false,
    collapseUnchanged: true,
    currentChangeIndex: -1,
    changeGroups: () => [],
    scrollRatio: 0,
    viewportRatio: 1
  }
);

const emit = defineEmits<{
  'scroll-container-ready': [el: HTMLElement | null]
}>();

const scrollContainerRef = ref<HTMLElement | null>(null);

// Collapsible regions
const collapsedRegions = computed(() =>
  props.collapseUnchanged ? computeCollapsedRegions(props.lines) : []
);
const expandedRegions = ref(new Set<number>());

const displayItems = computed<DisplayItem[]>(() => {
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
      items.push({ kind: 'line', line: props.lines[i]!, idx: i });
      i++;
    }
  }

  return items;
});

function toggleRegion(startIndex: number) {
  const next = new Set(expandedRegions.value);
  if (next.has(startIndex)) {
    next.delete(startIndex);
  } else {
    next.add(startIndex);
  }
  expandedRegions.value = next;
}

const totalItems = computed(() => displayItems.value.length);

const { startIndex, endIndex, totalHeight, offsetY, isPrinting } = useVirtualScroll(
  scrollContainerRef,
  totalItems
);

const visibleItems = computed(() => {
  return displayItems.value.slice(startIndex.value, endIndex.value);
});

onMounted(() => {
  nextTick(() => {
    emit('scroll-container-ready', scrollContainerRef.value);
  });
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

function onMinimapScrollTo(ratio: number) {
  const el = scrollContainerRef.value;
  if (!el) return;
  // Use total virtual height (totalItems * itemHeight) as max scroll,
  // NOT el.scrollHeight (which only reflects the visible viewport in virtual scroll mode)
  const totalVirtualHeight = totalItems.value * VIRTUAL_SCROLL_ITEM_HEIGHT;
  const maxScroll = totalVirtualHeight - el.clientHeight;
  el.scrollTop = ratio * maxScroll;
}

defineExpose({
  getScrollContainer() {
    return scrollContainerRef.value;
  }
});
</script>

<template>
  <div :class="['flex gap-1', isFullscreen ? 'h-full' : '']">
    <div
      ref="scrollContainerRef"
      role="log"
      aria-label="Unified diff output"
      :class="[
        'flex-1 min-w-0 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] print:max-h-none! print:overflow-visible! print:h-auto!',
        isFullscreen ? 'h-full' : 'max-h-[600px]'
      ]"
    >
      <div v-if="isPrinting">
        <template
          v-for="(item, i) in displayItems"
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
            :data-line-index="item.idx"
          >
            <DiffLineComponent
              :line="item.line"
              :show-line-numbers="showLineNumbers"
              :is-highlighted="highlightedIndices.has(item.idx)"
            />
          </div>
        </template>
      </div>
      <div
        v-else
        :style="{ height: totalHeight + 'px', position: 'relative' }"
      >
        <div :style="{ position: 'absolute', top: '0', left: '0', right: '0', transform: `translateY(${offsetY}px)` }">
          <template
            v-for="(item, i) in visibleItems"
            :key="startIndex + i"
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
              :data-line-index="item.idx"
            >
              <DiffLineComponent
                :line="item.line"
                :show-line-numbers="showLineNumbers"
                :is-highlighted="highlightedIndices.has(item.idx)"
              />
            </div>
          </template>
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
