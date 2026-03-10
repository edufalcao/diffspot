<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { DiffLine, ChangeGroup } from '~/types/diff'

const props = withDefaults(
  defineProps<{
    lines: DiffLine[]
    showLineNumbers?: boolean
    isFullscreen?: boolean
    currentChangeIndex?: number
    changeGroups?: ChangeGroup[]
    scrollRatio?: number
    viewportRatio?: number
  }>(),
  {
    showLineNumbers: true,
    isFullscreen: false,
    currentChangeIndex: -1,
    changeGroups: () => [],
    scrollRatio: 0,
    viewportRatio: 1,
  },
)

const emit = defineEmits<{
  'scroll-container-ready': [el: HTMLElement | null]
}>()

const scrollContainerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  nextTick(() => {
    emit('scroll-container-ready', scrollContainerRef.value)
  })
})

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

function onMinimapScrollTo(ratio: number) {
  const el = scrollContainerRef.value
  if (!el) return
  const maxScroll = el.scrollHeight - el.clientHeight
  el.scrollTop = ratio * maxScroll
}

defineExpose({
  getScrollContainer() {
    return scrollContainerRef.value
  },
})
</script>

<template>
  <div class="flex gap-1">
    <div
      ref="scrollContainerRef"
      role="log"
      aria-label="Unified diff output"
      :class="[
        'flex-1 min-w-0 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]',
        isFullscreen ? 'h-full' : 'max-h-[600px]',
      ]"
    >
      <div
        v-for="(line, idx) in lines"
        :key="idx"
        :data-line-index="idx"
      >
        <DiffLine
          :line="line"
          :show-line-numbers="showLineNumbers"
          :is-highlighted="highlightedIndices.has(idx)"
        />
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
