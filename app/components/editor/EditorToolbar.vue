<script setup lang="ts">
import { ref } from 'vue'
import { Copy, Trash2, ChevronDown, Check } from 'lucide-vue-next'
import { useEditorState } from '~/composables/useEditorState'

const { leftText, rightText, language, supportedLanguages } = useEditorState()

const dropdownOpen = ref(false)
const copyFeedback = ref(false)

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function selectLanguage(lang: string) {
  language.value = lang
  dropdownOpen.value = false
}

async function copyToClipboard() {
  const content = [leftText.value, rightText.value].filter(Boolean).join('\n---\n')
  if (!content) return

  try {
    await navigator.clipboard.writeText(content)
    copyFeedback.value = true
    setTimeout(() => {
      copyFeedback.value = false
    }, 2000)
  } catch {
    // Clipboard API not available
  }
}

function clearEditors() {
  leftText.value = ''
  rightText.value = ''
}

const selectedLabel = computed(() => {
  const entry = supportedLanguages.value.find((l) => l.value === language.value)
  return entry?.label ?? 'Plain Text'
})
</script>

<template>
  <div
    class="flex items-center gap-3 px-4 py-3 rounded-lg"
    style="
      background-color: var(--color-surface);
      border: 1px solid var(--color-border);
    "
  >
    <!-- Language selector -->
    <div class="relative">
      <button
        class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors"
        style="
          font-family: var(--font-mono);
          color: var(--color-text);
          background-color: var(--color-elevated);
          border: 1px solid var(--color-border);
        "
        @click="toggleDropdown"
      >
        <span>{{ selectedLabel }}</span>
        <ChevronDown
          :size="14"
          class="transition-transform"
          :class="{ 'rotate-180': dropdownOpen }"
          style="color: var(--color-muted)"
        />
      </button>

      <Transition name="dropdown">
        <div
          v-if="dropdownOpen"
          class="absolute top-full left-0 mt-1 z-50 min-w-[200px] max-h-[300px] overflow-y-auto rounded-lg py-1 shadow-lg"
          style="
            background-color: var(--color-elevated);
            border: 1px solid var(--color-border);
          "
        >
          <button
            v-for="lang in supportedLanguages"
            :key="lang.value"
            class="w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-white/5"
            :class="{
              'text-[var(--color-accent)]': language === lang.value,
            }"
            style="font-family: var(--font-mono); color: var(--color-text)"
            @click="selectLanguage(lang.value)"
          >
            {{ lang.label }}
          </button>
        </div>
      </Transition>
    </div>

    <div class="flex-1" />

    <!-- Copy button -->
    <button
      class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-white/5"
      style="
        font-family: var(--font-mono);
        color: var(--color-muted);
        border: 1px solid var(--color-border);
      "
      title="Copy editor content"
      @click="copyToClipboard"
    >
      <component
        :is="copyFeedback ? Check : Copy"
        :size="14"
        :style="{ color: copyFeedback ? 'var(--color-accent)' : undefined }"
      />
      <span class="hidden sm:inline">{{ copyFeedback ? 'Copied' : 'Copy' }}</span>
    </button>

    <!-- Clear button -->
    <button
      class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-white/5"
      style="
        font-family: var(--font-mono);
        color: var(--color-muted);
        border: 1px solid var(--color-border);
      "
      title="Clear both editors"
      @click="clearEditors"
    >
      <Trash2 :size="14" />
      <span class="hidden sm:inline">Clear</span>
    </button>
  </div>

  <!-- Click-away overlay to close dropdown -->
  <div
    v-if="dropdownOpen"
    class="fixed inset-0 z-40"
    @click="dropdownOpen = false"
  />
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
