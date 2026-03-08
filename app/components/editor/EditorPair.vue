<script setup lang="ts">
import { ref, computed } from 'vue'
import { Copy, Trash2, ChevronDown, Check } from 'lucide-vue-next'
import { useEditorState } from '~/composables/useEditorState'
import DiffEditor from './DiffEditor.vue'
import FileUpload from './FileUpload.vue'

const { leftText, rightText, language, supportedLanguages } = useEditorState()
const leftFocused = ref(false)
const rightFocused = ref(false)

// Language dropdown
const dropdownOpen = ref(false)
const copyFeedback = ref(false)

const selectedLabel = computed(() => {
  const entry = supportedLanguages.value.find((l) => l.value === language.value)
  return entry?.label ?? 'Plain Text'
})

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
    setTimeout(() => { copyFeedback.value = false }, 2000)
  } catch {}
}

function clearEditors() {
  leftText.value = ''
  rightText.value = ''
}

function onLeftFileLoaded(content: string) {
  leftText.value = content
}

function onRightFileLoaded(content: string) {
  rightText.value = content
}
</script>

<template>
  <div
    class="rounded-lg overflow-hidden border border-[var(--color-border)]"
    style="background-color: var(--color-surface)"
  >
    <!-- Toolbar row -->
    <div
      class="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)]"
      style="background-color: var(--color-elevated)"
    >
      <!-- Language selector -->
      <div class="relative">
        <button
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer hover:bg-white/5"
          style="font-family: var(--font-mono); color: var(--color-text); border: 1px solid var(--color-border)"
          @click="dropdownOpen = !dropdownOpen"
        >
          <span>{{ selectedLabel }}</span>
          <ChevronDown
            :size="12"
            class="transition-transform"
            :class="{ 'rotate-180': dropdownOpen }"
            style="color: var(--color-muted)"
          />
        </button>

        <Transition name="dropdown">
          <div
            v-if="dropdownOpen"
            class="absolute top-full left-0 mt-1 z-50 min-w-[180px] max-h-[250px] overflow-y-auto rounded-lg py-1 shadow-lg"
            style="background-color: var(--color-elevated); border: 1px solid var(--color-border)"
          >
            <button
              v-for="lang in supportedLanguages"
              :key="lang.value"
              class="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/5 cursor-pointer"
              :class="{ 'text-[var(--color-accent)]': language === lang.value }"
              style="font-family: var(--font-mono); color: var(--color-text)"
              @click="selectLanguage(lang.value)"
            >
              {{ lang.label }}
            </button>
          </div>
        </Transition>
      </div>

      <div class="flex-1" />

      <!-- Copy -->
      <button
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors hover:bg-white/5 cursor-pointer"
        style="font-family: var(--font-mono); color: var(--color-muted)"
        title="Copy editor content"
        @click="copyToClipboard"
      >
        <component
          :is="copyFeedback ? Check : Copy"
          :size="12"
          :style="{ color: copyFeedback ? 'var(--color-accent)' : undefined }"
        />
        <span class="hidden sm:inline">{{ copyFeedback ? 'Copied' : 'Copy' }}</span>
      </button>

      <!-- Clear -->
      <button
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors hover:bg-white/5 cursor-pointer"
        style="font-family: var(--font-mono); color: var(--color-muted)"
        title="Clear both editors"
        @click="clearEditors"
      >
        <Trash2 :size="12" />
        <span class="hidden sm:inline">Clear</span>
      </button>
    </div>

    <!-- Editors -->
    <div class="grid grid-cols-1 md:grid-cols-2">
      <!-- Left: Original -->
      <div class="flex flex-col border-r border-[var(--color-border)] md:border-r">
        <div class="px-3 py-1.5 border-b border-[var(--color-border)]">
          <span
            class="text-[10px] uppercase tracking-widest"
            style="font-family: var(--font-mono); color: var(--color-muted)"
          >
            Original
          </span>
        </div>
        <div class="group relative" @focusin="leftFocused = true" @focusout="leftFocused = false">
          <DiffEditor
            v-model="leftText"
            :language="language"
            placeholder="Paste original text here..."
          />
          <FileUpload
            v-if="!leftText && !leftFocused"
            side="left"
            class="opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration)] ease-[var(--ease)]"
            @file-loaded="onLeftFileLoaded"
          />
        </div>
      </div>

      <!-- Right: Modified -->
      <div class="flex flex-col">
        <div class="px-3 py-1.5 border-b border-[var(--color-border)]">
          <span
            class="text-[10px] uppercase tracking-widest"
            style="font-family: var(--font-mono); color: var(--color-muted)"
          >
            Modified
          </span>
        </div>
        <div class="group relative" @focusin="rightFocused = true" @focusout="rightFocused = false">
          <DiffEditor
            v-model="rightText"
            :language="language"
            placeholder="Paste modified text here..."
          />
          <FileUpload
            v-if="!rightText && !rightFocused"
            side="right"
            class="opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration)] ease-[var(--ease)]"
            @file-loaded="onRightFileLoaded"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Click-away overlay for dropdown -->
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
