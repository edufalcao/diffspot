import { computed, ref, watch, nextTick, onBeforeUnmount, type Ref, type ComputedRef } from 'vue';
import type { DiffResult } from '@diffspot/core';
import { computeChangeGroups, computeCollapsedRegions } from '@diffspot/core';

export function useDiffNavigation(
  result: Ref<DiffResult> | ComputedRef<DiffResult>,
  scrollContainerRef: Ref<HTMLElement | null>,
  options?: { itemHeight?: number }
) {
  const currentChangeIndex = ref(-1);
  const scrollRatio = ref(0);
  const viewportRatio = ref(0);

  const changeGroups = computed(() => computeChangeGroups(result.value.lines));
  const totalChanges = computed(() => changeGroups.value.length);

  // Lock to prevent scroll events from overriding programmatic index changes
  let programmaticScrollUntil = 0;

  function getScrollContainer(): HTMLElement | null {
    if (scrollContainerRef.value) return scrollContainerRef.value;
    // Fallback: query the DOM for the canonical scroll container
    return document.querySelector('[aria-label="Original file"]')
      ?? document.querySelector('[role="log"][aria-label="Unified diff output"]');
  }

  function updateScrollMetrics() {
    const el = getScrollContainer();
    if (!el) return;

    // Always use el.scrollHeight as the source of truth for total scrollable height.
    // This works correctly in all modes:
    // - Non-virtual: el.scrollHeight = totalLines * lineHeight (accurate)
    // - Virtual no-collapse: el.scrollHeight = totalLines * itemHeight (accurate)
    // - Virtual + collapse: el.scrollHeight = displayItems.length * itemHeight (accurate for scroll)
    const totalScrollHeight = el.scrollHeight;
    const maxScroll = totalScrollHeight - el.clientHeight;
    scrollRatio.value = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
    viewportRatio.value = totalScrollHeight > 0 ? el.clientHeight / totalScrollHeight : 1;

    // Don't override currentChangeIndex during programmatic scrolls
    if (Date.now() < programmaticScrollUntil) return;

    // Infer current change from scroll position
    if (changeGroups.value.length === 0) {
      currentChangeIndex.value = -1;
      return;
    }

    const totalLines = result.value.lines.length;
    if (totalLines === 0) return;

    // Map scroll position (display-item space) back to original line index.
    // scrollableRatio: what fraction of the scrollable content has been scrolled past
    const scrollableRatio = el.scrollTop / totalScrollHeight;
    const middleLineIndex = Math.floor(scrollableRatio * totalLines);

    // Find the closest change group to the estimated middle line
    let closestIdx = 0;
    let closestDist = Infinity;

    for (let i = 0; i < changeGroups.value.length; i++) {
      const group = changeGroups.value[i]!;
      const groupMiddle = (group.startIndex + group.endIndex) / 2;
      const dist = Math.abs(groupMiddle - middleLineIndex);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }

    currentChangeIndex.value = closestIdx;
  }

  function scrollToChange(index: number) {
    const el = getScrollContainer();
    if (!el || index < 0 || index >= changeGroups.value.length) return;

    const group = changeGroups.value[index]!;
    programmaticScrollUntil = Date.now() + 500;
    currentChangeIndex.value = index;

    if (options?.itemHeight) {
      // Virtual scroll mode: the container scrolls in display-item coordinate space.
      // We need to find the display-item index that corresponds to group.startIndex
      // (original line index), accounting for collapsed regions which insert
      // additional display items between lines.
      const itemHeight = options.itemHeight;
      const collapsedRegions = computeCollapsedRegions(result.value.lines);
      const regionMap = new Map<number, typeof collapsedRegions[0]>();
      for (const region of collapsedRegions) {
        regionMap.set(region.startIndex, region);
      }

      let displayItemIndex = 0;
      for (let lineIdx = 0; lineIdx < result.value.lines.length; lineIdx++) {
        if (lineIdx === group.startIndex) {
          // Found the target — scroll to this display item position
          el.scrollTo({ top: displayItemIndex * itemHeight, behavior: 'smooth' });
          return;
        }

        const region = regionMap.get(lineIdx);
        if (region && result.value.lines[lineIdx]!.type === 'unchanged') {
          // This line is the start of a collapsed region — insert collapsed item,
          // skip all region lines, then continue
          displayItemIndex++; // collapsed indicator
          lineIdx = region.endIndex; // skip to end of region (loop will ++)
        } else {
          displayItemIndex++; // normal line item
        }
      }

      // Fallback: scroll to end
      el.scrollTo({ top: el.scrollHeight - el.clientHeight, behavior: 'smooth' });
      return;
    }

    // DOM query with fallback strategies
    let lineEl: HTMLElement | null = null;

    // Strategy 1: Try exact match at startIndex
    lineEl = el.querySelector(`[data-line-index="${group.startIndex}"]`);

    // Strategy 2: Walk group lines looking for any element
    if (!lineEl) {
      for (let i = group.startIndex; i <= group.endIndex; i++) {
        lineEl = el.querySelector(`[data-line-index="${i}"]`);
        if (lineEl) break;
      }
    }

    // Strategy 3: Find nearest context line before the group
    if (!lineEl) {
      for (let i = group.startIndex - 1; i >= 0; i--) {
        lineEl = el.querySelector(`[data-line-index="${i}"]`);
        if (lineEl) break;
      }
    }

    // Strategy 4: Find nearest context line after the group
    if (!lineEl) {
      for (let i = group.endIndex + 1; i < result.value.lines.length; i++) {
        lineEl = el.querySelector(`[data-line-index="${i}"]`);
        if (lineEl) break;
      }
    }

    if (lineEl) {
      lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Last resort: proportional scroll estimation
      const totalLines = result.value.lines.length;
      const ratio = totalLines > 0 ? group.startIndex / totalLines : 0;
      const targetTop = ratio * el.scrollHeight - el.clientHeight / 2;
      el.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }
  }

  function goToNextChange() {
    if (changeGroups.value.length === 0) return;
    const next = Math.min(currentChangeIndex.value + 1, changeGroups.value.length - 1);
    scrollToChange(next);
  }

  function goToPrevChange() {
    if (changeGroups.value.length === 0) return;
    const prev = Math.max(currentChangeIndex.value - 1, 0);
    scrollToChange(prev);
  }

  // Attach scroll listener when container ref changes or becomes available
  let cleanup: (() => void) | null = null;
  let attachedEl: HTMLElement | null = null;

  function attachScrollListener() {
    const el = getScrollContainer();
    if (el === attachedEl) return; // already attached to this element
    if (cleanup) {
      cleanup();
      cleanup = null;
      attachedEl = null;
    }
    if (el) {
      el.addEventListener('scroll', updateScrollMetrics, { passive: true });
      attachedEl = el;
      cleanup = () => {
        el.removeEventListener('scroll', updateScrollMetrics);
        attachedEl = null;
      };
      updateScrollMetrics();
    }
  }

  watch(scrollContainerRef, attachScrollListener, { immediate: true });

  onBeforeUnmount(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });

  // Reset when result changes and re-attach scroll listener after DOM updates
  watch(result, () => {
    currentChangeIndex.value = changeGroups.value.length > 0 ? 0 : -1;
    scrollRatio.value = 0;
    viewportRatio.value = 0;
    // Re-attach after DOM updates (the scroll container may be a new element)
    nextTick(() => {
      nextTick(() => {
        attachScrollListener();
      });
    });
  });

  return {
    changeGroups,
    totalChanges,
    currentChangeIndex,
    scrollRatio,
    viewportRatio,
    goToNextChange,
    goToPrevChange,
    scrollToChange
  };
}
