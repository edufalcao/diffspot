import { computed, ref, watch, nextTick, onBeforeUnmount, type Ref, type ComputedRef } from 'vue';
import type { DiffResult } from '@diffspot/core';
import { computeChangeGroups } from '@diffspot/core';

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

    const totalLines = result.value.lines.length;

    if (options?.itemHeight && totalLines > 0) {
      // Virtual scroll mode: reference the actual total virtual height, not el.scrollHeight
      // (el.scrollHeight only reflects the visible viewport, not the full virtual content)
      const totalVirtualHeight = totalLines * options.itemHeight;
      const maxScroll = totalVirtualHeight - el.clientHeight;
      scrollRatio.value = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
      viewportRatio.value = Math.min(el.clientHeight / totalVirtualHeight, 1);
    } else {
      const maxScroll = el.scrollHeight - el.clientHeight;
      scrollRatio.value = maxScroll > 0 ? el.scrollTop / maxScroll : 0;
      viewportRatio.value = el.scrollHeight > 0 ? el.clientHeight / el.scrollHeight : 1;
    }

    // Don't override currentChangeIndex during programmatic scrolls
    if (Date.now() < programmaticScrollUntil) return;

    // Infer current change from scroll position
    if (changeGroups.value.length === 0) {
      currentChangeIndex.value = -1;
      return;
    }

    if (totalLines === 0) return;

    let middleLineIndex: number;

    if (options?.itemHeight) {
      // Virtual scroll mode: use proportional estimation
      const totalVirtualHeight = totalLines * options.itemHeight;
      const ratio = totalVirtualHeight > 0 ? (el.scrollTop + el.clientHeight / 2) / totalVirtualHeight : 0;
      middleLineIndex = Math.floor(ratio * totalLines);
    } else {
      // DOM-based approach
      const viewportMiddle = el.scrollTop + el.clientHeight / 2;
      const lineHeight = el.scrollHeight / totalLines;
      middleLineIndex = Math.floor(viewportMiddle / lineHeight);
    }

    // Find the closest change group to the middle of the viewport
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
      // Virtual scroll mode: use proportional scrolling
      // Use total virtual height (totalLines * itemHeight), NOT el.scrollHeight
      // (el.scrollHeight only reflects the visible viewport, not the full virtual content)
      const totalLines = result.value.lines.length;
      const totalVirtualHeight = totalLines * options.itemHeight;
      const groupCenter = (group.startIndex + group.endIndex) / 2;
      const ratio = totalLines > 0 ? groupCenter / totalLines : 0;
      const targetTop = ratio * totalVirtualHeight - el.clientHeight / 2;
      el.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
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
