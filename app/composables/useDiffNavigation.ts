import { computed, ref, watch, nextTick, onBeforeUnmount, type Ref, type ComputedRef } from 'vue'
import type { DiffResult, DiffLine, ChangeGroup } from '~/types/diff'

/**
 * Groups consecutive non-unchanged lines into change groups.
 */
function computeChangeGroups(lines: DiffLine[]): ChangeGroup[] {
  const groups: ChangeGroup[] = []
  let i = 0

  while (i < lines.length) {
    const currentLine = lines[i]!
    if (currentLine.type !== 'unchanged') {
      const startIndex = i
      const types = new Set<'added' | 'removed'>()

      while (i < lines.length && lines[i]!.type !== 'unchanged') {
        types.add(lines[i]!.type as 'added' | 'removed')
        i++
      }

      const type = types.size > 1 ? 'mixed' : ([...types][0] as 'added' | 'removed')
      groups.push({ startIndex, endIndex: i - 1, type })
    } else {
      i++
    }
  }

  return groups
}

export function useDiffNavigation(
  result: Ref<DiffResult> | ComputedRef<DiffResult>,
  scrollContainerRef: Ref<HTMLElement | null>,
) {
  const currentChangeIndex = ref(-1)
  const scrollRatio = ref(0)
  const viewportRatio = ref(0)

  const changeGroups = computed(() => computeChangeGroups(result.value.lines))
  const totalChanges = computed(() => changeGroups.value.length)

  // Lock to prevent scroll events from overriding programmatic index changes
  let programmaticScrollUntil = 0

  function getScrollContainer(): HTMLElement | null {
    if (scrollContainerRef.value) return scrollContainerRef.value
    // Fallback: query the DOM for the canonical scroll container
    return document.querySelector('[aria-label="Original file"]')
      ?? document.querySelector('[role="log"][aria-label="Unified diff output"]')
  }

  function updateScrollMetrics() {
    const el = getScrollContainer()
    if (!el) return

    const maxScroll = el.scrollHeight - el.clientHeight
    scrollRatio.value = maxScroll > 0 ? el.scrollTop / maxScroll : 0
    viewportRatio.value = el.scrollHeight > 0 ? el.clientHeight / el.scrollHeight : 1

    // Don't override currentChangeIndex during programmatic scrolls
    if (Date.now() < programmaticScrollUntil) return

    // Infer current change from scroll position
    if (changeGroups.value.length === 0) {
      currentChangeIndex.value = -1
      return
    }

    const totalLines = result.value.lines.length
    if (totalLines === 0) return

    const viewportMiddle = el.scrollTop + el.clientHeight / 2
    const lineHeight = el.scrollHeight / totalLines
    const middleLineIndex = Math.floor(viewportMiddle / lineHeight)

    // Find the closest change group to the middle of the viewport
    let closestIdx = 0
    let closestDist = Infinity

    for (let i = 0; i < changeGroups.value.length; i++) {
      const group = changeGroups.value[i]!
      const groupMiddle = (group.startIndex + group.endIndex) / 2
      const dist = Math.abs(groupMiddle - middleLineIndex)
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = i
      }
    }

    currentChangeIndex.value = closestIdx
  }

  function scrollToChange(index: number) {
    const el = getScrollContainer()
    if (!el || index < 0 || index >= changeGroups.value.length) return

    const group = changeGroups.value[index]!
    const lineEl = el.querySelector(`[data-line-index="${group.startIndex}"]`) as HTMLElement | null
    if (lineEl) {
      // Lock for 500ms to prevent scroll events from overriding the index
      programmaticScrollUntil = Date.now() + 500
      currentChangeIndex.value = index
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function goToNextChange() {
    if (changeGroups.value.length === 0) return
    const next = Math.min(currentChangeIndex.value + 1, changeGroups.value.length - 1)
    scrollToChange(next)
  }

  function goToPrevChange() {
    if (changeGroups.value.length === 0) return
    const prev = Math.max(currentChangeIndex.value - 1, 0)
    scrollToChange(prev)
  }

  // Attach scroll listener when container ref changes or becomes available
  let cleanup: (() => void) | null = null
  let attachedEl: HTMLElement | null = null

  function attachScrollListener() {
    const el = getScrollContainer()
    if (el === attachedEl) return // already attached to this element
    if (cleanup) {
      cleanup()
      cleanup = null
      attachedEl = null
    }
    if (el) {
      el.addEventListener('scroll', updateScrollMetrics, { passive: true })
      attachedEl = el
      cleanup = () => {
        el.removeEventListener('scroll', updateScrollMetrics)
        attachedEl = null
      }
      updateScrollMetrics()
    }
  }

  watch(scrollContainerRef, attachScrollListener, { immediate: true })

  onBeforeUnmount(() => {
    if (cleanup) {
      cleanup()
      cleanup = null
    }
  })

  // Reset when result changes and re-attach scroll listener after DOM updates
  watch(result, () => {
    currentChangeIndex.value = changeGroups.value.length > 0 ? 0 : -1
    scrollRatio.value = 0
    viewportRatio.value = 0
    // Re-attach after DOM updates (the scroll container may be a new element)
    nextTick(() => {
      nextTick(() => {
        attachScrollListener()
      })
    })
  })

  return {
    changeGroups,
    totalChanges,
    currentChangeIndex,
    scrollRatio,
    viewportRatio,
    goToNextChange,
    goToPrevChange,
    scrollToChange,
  }
}
