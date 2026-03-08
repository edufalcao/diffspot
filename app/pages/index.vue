<script setup lang="ts">
const { leftText, rightText, language } = useEditorState()
const { precision, ignoreWhitespace, ignoreCase, options } = useDiffOptions()
const { result } = useDiff(leftText, rightText, options)
const { saveShare, copyShareLink } = useShare()
const { exportAsPng, exportAsPdf } = useExport()

const viewMode = ref<'split' | 'unified'>('split')
const showDiff = ref(false)
const diffOutputRef = ref<HTMLElement | null>(null)

function findDifferences() {
  showDiff.value = true
}

async function handleExport(type: 'png' | 'pdf') {
  if (!diffOutputRef.value) return
  if (type === 'png') {
    await exportAsPng(diffOutputRef.value)
  } else {
    await exportAsPdf(diffOutputRef.value)
  }
}

async function handleShare() {
  const url = await saveShare(leftText.value, rightText.value, language.value)
  await copyShareLink(url)
}

const hasDiff = computed(() => showDiff.value && (result.value.additions > 0 || result.value.removals > 0 || result.value.unchanged > 0))
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

    <!-- Editor toolbar + pair -->
    <div class="w-full max-w-6xl animate-slide-up">
      <EditorToolbar class="mb-3" />
      <EditorPair class="mb-6" />
    </div>

    <!-- Find Differences button -->
    <GlowButton
      variant="primary"
      size="lg"
      class="animate-slide-up mb-10"
      style="animation-delay: 0.1s"
      :disabled="!leftText && !rightText"
      @click="findDifferences"
    >
      Find Differences
    </GlowButton>

    <!-- Diff output -->
    <template v-if="hasDiff">
      <div class="w-full max-w-6xl animate-slide-up space-y-4">
        <!-- Controls -->
        <DiffControls
          :view-mode="viewMode"
          :precision="precision"
          :ignore-whitespace="ignoreWhitespace"
          :ignore-case="ignoreCase"
          @update:view-mode="viewMode = $event"
          @update:precision="precision = $event"
          @update:ignore-whitespace="ignoreWhitespace = $event"
          @update:ignore-case="ignoreCase = $event"
          @export="handleExport"
          @share="handleShare"
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
    </template>
  </div>
</template>
