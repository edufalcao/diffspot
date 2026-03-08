<script setup lang="ts">
const { leftText, rightText, language } = useEditorState()
const { precision, ignoreWhitespace, ignoreCase, options } = useDiffOptions()
const { result, isComputing, compute } = useDiff(leftText, rightText, options)
const { exportAsPng, exportAsPdf } = useExport()

const viewMode = ref<'split' | 'unified'>('split')
const showDiff = ref(false)
const showLoading = ref(false)
const diffOutputRef = ref<HTMLElement | null>(null)
const diffSectionRef = ref<HTMLElement | null>(null)

// Hide diff results when both inputs are cleared
watch([leftText, rightText], ([l, r]) => {
  if (!l && !r) {
    showDiff.value = false
  }
})

// Auto-switch to unified view on small screens
const isMobile = ref(false)

onMounted(() => {
  const mql = window.matchMedia('(max-width: 767px)')
  isMobile.value = mql.matches
  if (mql.matches) {
    viewMode.value = 'unified'
  }
  const handler = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
    if (e.matches) {
      viewMode.value = 'unified'
    }
  }
  mql.addEventListener('change', handler)
  onBeforeUnmount(() => {
    mql.removeEventListener('change', handler)
  })

  // Keyboard shortcuts
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function findDifferences() {
  if (!leftText.value && !rightText.value) return

  showLoading.value = true
  showDiff.value = true

  nextTick(() => {
    compute()
    showLoading.value = false
    // Scroll to diff results
    nextTick(() => {
      diffSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
}

async function handleExport(type: 'png' | 'pdf') {
  if (!diffOutputRef.value) return
  if (type === 'png') {
    await exportAsPng(diffOutputRef.value)
  } else {
    await exportAsPdf(diffOutputRef.value)
  }
}

const hasDiff = computed(() => showDiff.value && (result.value.additions > 0 || result.value.removals > 0 || result.value.unchanged > 0))

/** True when diff was requested but both inputs are identical (no actual differences). */
const textsAreIdentical = computed(() => {
  if (!showDiff.value) return false
  if (!leftText.value && !rightText.value) return false
  return result.value.additions === 0 && result.value.removals === 0 && result.value.unchanged > 0
})

// ---------------------------------------------------------------------------
// Keyboard shortcuts
// ---------------------------------------------------------------------------
function handleKeydown(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey

  // Ctrl/Cmd + Enter — Find Differences
  if (mod && e.key === 'Enter') {
    e.preventDefault()
    if (leftText.value || rightText.value) {
      findDifferences()
    }
  }

}
</script>

<template>
  <div class="flex flex-col items-center px-6 py-10 md:py-16">
    <!-- Hero -->
    <div class="text-center animate-fade-in mb-8">
      <h1 class="text-4xl md:text-6xl font-bold font-[family-name:var(--font-display)] mb-3">
        <span class="font-mono text-[var(--color-muted)]">$ </span>
        <span class="gradient-text">diffspot</span>
      </h1>
      <p class="text-lg md:text-xl text-[var(--color-muted)] font-[family-name:var(--font-body)]">
        Paste. Compare. Ship.
      </p>
    </div>

    <!-- Editor pair (toolbar integrated) -->
    <div class="w-full max-w-7xl animate-slide-up mb-6">
      <EditorPair />
    </div>

    <!-- Find Differences button -->
    <UiGlowButton
      variant="primary"
      size="lg"
      class="animate-slide-up mb-10"
      style="animation-delay: 0.1s"
      :disabled="!leftText && !rightText"
      @click="findDifferences"
    >
      <template v-if="showLoading || isComputing">
        <svg
          class="animate-spin -ml-1 mr-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
        v-if="showLoading || isComputing"
        class="w-full max-w-6xl text-center py-12"
      >
        <svg
          class="animate-spin mx-auto h-8 w-8 mb-3"
          style="color: var(--color-accent)"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p
          class="text-sm"
          style="font-family: var(--font-mono); color: var(--color-muted)"
        >
          Computing diff...
        </p>
      </div>
    </Transition>

    <!-- Identical texts message -->
    <Transition
      enter-active-class="transition-all duration-300 ease-[var(--ease)]"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-[var(--ease)]"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="textsAreIdentical"
        class="w-full max-w-6xl text-center py-12 rounded-lg border border-[var(--color-border)]"
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
          Both texts are identical.
        </p>
      </div>
    </Transition>

    <!-- Diff output -->
    <Transition
      enter-active-class="transition-all duration-300 ease-[var(--ease)]"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
    >
      <div v-if="hasDiff && !textsAreIdentical" ref="diffSectionRef" class="w-full max-w-6xl animate-slide-up space-y-4">
        <!-- Controls -->
        <DiffControls
          :view-mode="viewMode"
          :precision="precision"
          :ignore-whitespace="ignoreWhitespace"
          :ignore-case="ignoreCase"
          :hide-split-option="isMobile"
          @update:view-mode="viewMode = $event"
          @update:precision="precision = $event"
          @update:ignore-whitespace="ignoreWhitespace = $event"
          @update:ignore-case="ignoreCase = $event"
          @export="handleExport"
        />

        <!-- Stats -->
        <DiffStats
          :additions="result.additions"
          :removals="result.removals"
          :unchanged="result.unchanged"
        />

        <!-- Diff view -->
        <div ref="diffOutputRef">
          <DiffView :result="result" :view-mode="viewMode" />
        </div>
      </div>
    </Transition>
  </div>
</template>
