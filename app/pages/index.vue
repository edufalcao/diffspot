<script setup lang="ts">
import type { ExportFormat } from '@diffspot/core';
import { useSyntaxHighlight } from '~/composables/useSyntaxHighlight';

const { leftText, rightText, language } = useEditorState();
const { precision, ignoreWhitespace, ignoreCase, options } = useDiffOptions();
const { result, isComputing, compute } = useDiff(leftText, rightText, options);
const { exportAs } = useExport();
const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();
const { highlightLine } = useSyntaxHighlight(leftText, rightText, language);

provide('diffspot:highlightLine', highlightLine);

const viewMode = ref<'split' | 'unified'>('split');
const collapseUnchanged = ref(true);
const showDiff = ref(false);
const showLoading = ref(false);
const diffSectionRef = ref<HTMLElement | null>(null);
const scrollContainerRef = ref<HTMLElement | null>(null);

const { changeGroups, totalChanges, currentChangeIndex, scrollRatio, viewportRatio, goToNextChange, goToPrevChange } = useDiffNavigation(result, scrollContainerRef, { itemHeight: VIRTUAL_SCROLL_ITEM_HEIGHT });

function onScrollContainerReady(el: HTMLElement | null) {
  scrollContainerRef.value = el;
}

// Hide diff results when both inputs are cleared
watch([leftText, rightText], ([l, r]) => {
  if (!l && !r) {
    showDiff.value = false;
  }
}, { flush: 'sync' });

// Auto-switch to unified view on small screens
const isMobile = ref(false);
let mobileMediaQuery: MediaQueryList | null = null;
let mobileMediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 767px)');
  isMobile.value = mobileMediaQuery.matches;
  if (mobileMediaQuery.matches) {
    viewMode.value = 'unified';
  }
  mobileMediaQueryHandler = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches;
    if (e.matches) {
      viewMode.value = 'unified';
    }
  };
  mobileMediaQuery.addEventListener('change', mobileMediaQueryHandler);

  // Keyboard shortcuts
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  if (mobileMediaQuery && mobileMediaQueryHandler) {
    mobileMediaQuery.removeEventListener('change', mobileMediaQueryHandler);
  }
  window.removeEventListener('keydown', handleKeydown);
});

async function computeDiffResult(options?: { showInitialLoading?: boolean, scrollIntoView?: boolean }) {
  if (!leftText.value && !rightText.value) return;

  showDiff.value = true;
  showLoading.value = options?.showInitialLoading ?? false;

  try {
    await compute();
  } finally {
    showLoading.value = false;
  }

  if (options?.scrollIntoView) {
    nextTick(() => {
      diffSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

async function findDifferences() {
  await computeDiffResult({
    showInitialLoading: true,
    scrollIntoView: true
  });
}

const totalLines = computed(() => result.value.lines.length);

function handleExport(format: ExportFormat) {
  exportAs(format, result.value, {
    timestamp: new Date().toISOString(),
    options: options.value
  });
}

const hasDiff = computed(() => showDiff.value && (result.value.additions > 0 || result.value.removals > 0 || result.value.unchanged > 0));

/** True when diff was requested but both inputs are identical (no actual differences). */
const textsAreIdentical = computed(() => {
  if (!showDiff.value) return false;
  if (!leftText.value && !rightText.value) return false;
  return result.value.additions === 0 && result.value.removals === 0 && result.value.unchanged > 0;
});

const emptyDiffMessage = computed(() => {
  const hiddenDifferences: string[] = [];

  if (ignoreWhitespace.value) {
    hiddenDifferences.push('whitespace');
  }

  if (ignoreCase.value) {
    hiddenDifferences.push('case');
  }

  if (hiddenDifferences.length === 0) {
    return 'Both texts are identical under the current diff options.';
  }

  if (hiddenDifferences.length === 1) {
    return `The active options above are ignoring ${hiddenDifferences[0]} differences.`;
  }

  return 'The active options above are ignoring whitespace and case differences.';
});

watch([precision, ignoreWhitespace, ignoreCase], async () => {
  if (!showDiff.value) return;
  if (!leftText.value && !rightText.value) return;

  await computeDiffResult();
});

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------
function handleKeydown(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey;

  // Escape — exit fullscreen
  if (e.key === 'Escape' && isFullscreen.value) {
    e.preventDefault();
    exitFullscreen();
    return;
  }

  // Ctrl/Cmd + Enter — Find Differences
  if (mod && e.key === 'Enter') {
    e.preventDefault();
    if (leftText.value || rightText.value) {
      findDifferences();
    }
  }

  // Alt + ArrowDown — Next change
  if (e.altKey && e.key === 'ArrowDown') {
    e.preventDefault();
    goToNextChange();
  }

  // Alt + ArrowUp — Previous change
  if (e.altKey && e.key === 'ArrowUp') {
    e.preventDefault();
    goToPrevChange();
  }
}
</script>

<template>
  <div class="flex flex-col items-center px-6 py-10 md:py-16 print:p-0 print:block">
    <!-- Hero -->
    <div class="text-center animate-fade-in mb-8 print:hidden">
      <h1 class="text-4xl md:text-6xl font-bold font-[family-name:var(--font-display)] mb-3">
        <span class="font-mono text-[var(--color-muted)]">$ </span>
        <span class="gradient-text">diffspot</span>
      </h1>
      <p class="text-lg md:text-xl text-[var(--color-muted)] font-[family-name:var(--font-body)]">
        Paste. Compare. Ship.
      </p>
    </div>

    <!-- Editor pair (toolbar integrated) -->
    <div class="w-full max-w-7xl animate-slide-up mb-6 print:hidden">
      <EditorPair @clear="showDiff = false" />
    </div>

    <!-- Find Differences button -->
    <UiGlowButton
      variant="primary"
      size="lg"
      class="animate-slide-up mb-10 print:hidden"
      style="animation-delay: 0.1s"
      :disabled="(!leftText && !rightText) || showLoading || isComputing"
      @click="findDifferences"
    >
      <template v-if="showLoading || isComputing">
        <svg
          class="animate-spin -ml-1 mr-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Computing diff...
      </template>
      <template v-else>
        Find Differences
      </template>
    </UiGlowButton>

    <!-- Loading state -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-[var(--ease)]"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-[var(--ease)]"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showLoading"
        class="w-full max-w-6xl text-center py-12"
      >
        <svg
          class="animate-spin mx-auto h-8 w-8 mb-3"
          style="color: var(--color-accent)"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p
          class="text-sm"
          style="font-family: var(--font-mono); color: var(--color-muted)"
        >
          Computing diff...
        </p>
      </div>
    </Transition>

    <!-- Diff output -->
    <div
      v-if="hasDiff"
      ref="diffSectionRef"
      :class="[
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] p-6 overflow-hidden'
          : 'w-full max-w-6xl animate-slide-up space-y-4'
      ]"
    >
      <!-- Controls -->
      <DiffControls
        :view-mode="viewMode"
        :precision="precision"
        :ignore-whitespace="ignoreWhitespace"
        :ignore-case="ignoreCase"
        :collapse-unchanged="collapseUnchanged"
        :hide-split-option="isMobile"
        :is-fullscreen="isFullscreen"
        :current-change-index="currentChangeIndex"
        :total-changes="totalChanges"
        :total-lines="totalLines"
        @update:view-mode="viewMode = $event"
        @update:precision="precision = $event"
        @update:ignore-whitespace="ignoreWhitespace = $event"
        @update:ignore-case="ignoreCase = $event"
        @update:collapse-unchanged="collapseUnchanged = $event"
        @export="handleExport"
        @toggle-fullscreen="toggleFullscreen"
        @prev-change="goToPrevChange"
        @next-change="goToNextChange"
      />

      <template v-if="textsAreIdentical">
        <div
          class="text-center py-12 rounded-lg border border-[var(--color-border)]"
          :class="isFullscreen ? 'flex-1 flex flex-col items-center justify-center' : ''"
          style="background-color: var(--color-surface)"
        >
          <div
            class="text-3xl mb-3"
            style="color: var(--color-accent)"
          >
            =
          </div>
          <p
            class="text-lg font-semibold mb-1"
            style="font-family: var(--font-display); color: var(--color-text)"
          >
            No differences found
          </p>
          <p
            class="text-sm"
            style="font-family: var(--font-mono); color: var(--color-muted)"
          >
            {{ emptyDiffMessage }}
          </p>
        </div>
      </template>
      <template v-else>
        <!-- Stats -->
        <DiffStats
          :additions="result.additions"
          :removals="result.removals"
          :unchanged="result.unchanged"
          :class="isFullscreen ? 'flex-shrink-0' : ''"
        />

        <!-- Diff view -->
        <DiffView
          :result="result"
          :view-mode="viewMode"
          :is-fullscreen="isFullscreen"
          :collapse-unchanged="collapseUnchanged"
          :current-change-index="currentChangeIndex"
          :change-groups="changeGroups"
          :scroll-ratio="scrollRatio"
          :viewport-ratio="viewportRatio"
          @scroll-container-ready="onScrollContainerReady"
        />
      </template>
    </div>
  </div>
</template>
