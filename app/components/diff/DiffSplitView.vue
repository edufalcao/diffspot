<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { DiffLine } from '~/types/diff'

const props = defineProps<{
  lines: DiffLine[]
}>()

const leftPanelRef = ref<HTMLElement | null>(null)
const rightPanelRef = ref<HTMLElement | null>(null)
let isSyncing = false

const leftLines = computed(() =>
  props.lines.filter((l) => l.type === 'removed' || l.type === 'unchanged'),
)

const rightLines = computed(() =>
  props.lines.filter((l) => l.type === 'added' || l.type === 'unchanged'),
)

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

onMounted(() => {
  leftPanelRef.value?.addEventListener('scroll', onLeftScroll)
  rightPanelRef.value?.addEventListener('scroll', onRightScroll)
})

onBeforeUnmount(() => {
  leftPanelRef.value?.removeEventListener('scroll', onLeftScroll)
  rightPanelRef.value?.removeEventListener('scroll', onRightScroll)
})
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <!-- Left column: old file -->
    <div
      ref="leftPanelRef"
      aria-label="Original file"
      class="max-h-[600px] overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div
        v-for="(line, idx) in leftLines"
        :key="idx"
      >
        <DiffLine
          :line="line"
          :show-line-numbers="true"
        />
      </div>
    </div>

    <!-- Right column: new file -->
    <div
      ref="rightPanelRef"
      aria-label="Modified file"
      class="max-h-[600px] overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div
        v-for="(line, idx) in rightLines"
        :key="idx"
      >
        <DiffLine
          :line="line"
          :show-line-numbers="true"
        />
      </div>
    </div>
  </div>
</template>
