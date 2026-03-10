<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { DiffLine, ChangeGroup } from '~/types/diff'

const props = withDefaults(
  defineProps<{
    lines: DiffLine[]
    isFullscreen?: boolean
    currentChangeIndex?: number
    changeGroups?: ChangeGroup[]
    scrollRatio?: number
    viewportRatio?: number
  }>(),
  {
    isFullscreen: false,
    currentChangeIndex: -1,
    changeGroups: () => [],
    scrollRatio: 0,
    viewportRatio: 1,
  },
)

const emit = defineEmits<{
  'scroll-to': [ratio: number]
  'scroll-container-ready': [el: HTMLElement | null]
}>()

const leftPanelRef = ref<HTMLElement | null>(null)
const rightPanelRef = ref<HTMLElement | null>(null)
let isSyncing = false

// Map lines preserving original index before filtering
const leftLines = computed(() =>
  props.lines
    .map((l, i) => ({ ...l, originalIndex: i }))
    .filter((l) => l.type === 'removed' || l.type === 'unchanged'),
)

const rightLines = computed(() =>
  props.lines
    .map((l, i) => ({ ...l, originalIndex: i }))
    .filter((l) => l.type === 'added' || l.type === 'unchanged'),
)

// Compute highlighted line indices from current change group
const highlightedIndices = computed(() => {
  const set = new Set<number>()
  const group = props.currentChangeIndex >= 0 ? props.changeGroups?.[props.currentChangeIndex] : undefined
  if (group) {
    for (let i = group.startIndex; i <= group.endIndex; i++) {
      set.add(i)
    }
  }
  return set
})

function syncScroll(source: HTMLElement, target: HTMLElement) {
  if (isSyncing) return
  isSyncing = true
  requestAnimationFrame(() => {
    target.scrollTop = source.scrollTop
    target.scrollLeft = source.scrollLeft
    isSyncing = false
  })
}

function onLeftScroll() {
  if (leftPanelRef.value && rightPanelRef.value) {
    syncScroll(leftPanelRef.value, rightPanelRef.value)
  }
}

function onRightScroll() {
  if (rightPanelRef.value && leftPanelRef.value) {
    syncScroll(rightPanelRef.value, leftPanelRef.value)
  }
}

function onMinimapScrollTo(ratio: number) {
  const el = leftPanelRef.value
  if (!el) return
  const maxScroll = el.scrollHeight - el.clientHeight
  el.scrollTop = ratio * maxScroll
}

onMounted(() => {
  leftPanelRef.value?.addEventListener('scroll', onLeftScroll)
  rightPanelRef.value?.addEventListener('scroll', onRightScroll)
  nextTick(() => {
    emit('scroll-container-ready', leftPanelRef.value)
  })
})

onBeforeUnmount(() => {
  leftPanelRef.value?.removeEventListener('scroll', onLeftScroll)
  rightPanelRef.value?.removeEventListener('scroll', onRightScroll)
})

defineExpose({
  getScrollContainer() {
    return leftPanelRef.value
  },
})
</script>

<template>
  <div class="flex gap-1">
    <div class="grid grid-cols-2 gap-3 flex-1 min-w-0">
      <!-- Left column: old file -->
      <div
        ref="leftPanelRef"
        aria-label="Original file"
        :class="[
          'overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]',
          isFullscreen ? 'h-full' : 'max-h-[600px]',
        ]"
      >
        <div
          v-for="(line, idx) in leftLines"
          :key="idx"
          :data-line-index="line.originalIndex"
        >
          <DiffLine
            :line="line"
            :show-line-numbers="true"
            :is-highlighted="highlightedIndices.has(line.originalIndex)"
          />
        </div>
      </div>

      <!-- Right column: new file -->
      <div
        ref="rightPanelRef"
        aria-label="Modified file"
        :class="[
          'overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]',
          isFullscreen ? 'h-full' : 'max-h-[600px]',
        ]"
      >
        <div
          v-for="(line, idx) in rightLines"
          :key="idx"
          :data-line-index="line.originalIndex"
        >
          <DiffLine
            :line="line"
            :show-line-numbers="true"
            :is-highlighted="highlightedIndices.has(line.originalIndex)"
          />
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
