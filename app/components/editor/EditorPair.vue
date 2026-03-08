<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Copy, Trash2, ChevronDown, Check, Upload } from 'lucide-vue-next'
import { useEditorState } from '~/composables/useEditorState'
import DiffEditor from './DiffEditor.vue'

const { leftText, rightText, language, supportedLanguages } = useEditorState()

// Language dropdown
const dropdownOpen = ref(false)
const copyFeedback = ref(false)

// Drag-and-drop state: only show drop zones when a file is being dragged over the window
const isDraggingFile = ref(false)
let dragLeaveTimer: ReturnType<typeof setTimeout> | null = null

function onWindowDragEnter(e: DragEvent) {
  if (e.dataTransfer?.types.includes('Files')) {
    isDraggingFile.value = true
    if (dragLeaveTimer) clearTimeout(dragLeaveTimer)
  }
}

function onWindowDragOver(e: DragEvent) {
  e.preventDefault()
}

function onWindowDragLeave() {
  // Debounce to avoid flickering when moving between elements
  if (dragLeaveTimer) clearTimeout(dragLeaveTimer)
  dragLeaveTimer = setTimeout(() => {
    isDraggingFile.value = false
  }, 100)
}

function onWindowDrop() {
  isDraggingFile.value = false
}

onMounted(() => {
  window.addEventListener('dragenter', onWindowDragEnter)
  window.addEventListener('dragover', onWindowDragOver)
  window.addEventListener('dragleave', onWindowDragLeave)
  window.addEventListener('drop', onWindowDrop)
})

onBeforeUnmount(() => {
  window.removeEventListener('dragenter', onWindowDragEnter)
  window.removeEventListener('dragover', onWindowDragOver)
  window.removeEventListener('dragleave', onWindowDragLeave)
  window.removeEventListener('drop', onWindowDrop)
  if (dragLeaveTimer) clearTimeout(dragLeaveTimer)
})

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

// File input refs
const leftFileInput = ref<HTMLInputElement | null>(null)
const rightFileInput = ref<HTMLInputElement | null>(null)

function triggerFileInput(side: 'left' | 'right') {
  if (side === 'left') leftFileInput.value?.click()
  else rightFileInput.value?.click()
}

function handleFileInput(side: 'left' | 'right', e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    if (side === 'left') leftText.value = reader.result as string
    else rightText.value = reader.result as string
  }
  reader.readAsText(file)
  // Reset so the same file can be re-selected
  ;(e.target as HTMLInputElement).value = ''
}

function handleDrop(side: 'left' | 'right', e: DragEvent) {
  e.preventDefault()
  isDraggingFile.value = false
  const file = e.dataTransfer?.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    if (side === 'left') leftText.value = reader.result as string
    else rightText.value = reader.result as string
  }
  reader.readAsText(file)
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
        <div class="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)]">
          <span
            class="text-[10px] uppercase tracking-widest"
            style="font-family: var(--font-mono); color: var(--color-muted)"
          >
            Original
          </span>
          <input ref="leftFileInput" type="file" class="hidden" @change="handleFileInput('left', $event)">
          <button
            class="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors hover:bg-white/5 cursor-pointer"
            style="font-family: var(--font-mono); color: var(--color-muted)"
            title="Upload file"
            @click="triggerFileInput('left')"
          >
            <Upload :size="10" />
            <span class="hidden sm:inline">Upload</span>
          </button>
        </div>
        <div class="relative">
          <DiffEditor
            v-model="leftText"
            :language="language"
            placeholder="Paste original text here..."
          />
          <!-- Drop zone: only visible when dragging a file over the window -->
          <div
            v-if="isDraggingFile && !leftText"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-[var(--color-accent)] bg-[rgba(0,229,204,0.04)]"
            @dragover.prevent
            @drop="handleDrop('left', $event)"
          >
            <Upload :size="24" style="color: var(--color-accent)" />
            <span class="text-xs" style="font-family: var(--font-mono); color: var(--color-accent)">
              Drop file here
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Modified -->
      <div class="flex flex-col">
        <div class="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)]">
          <span
            class="text-[10px] uppercase tracking-widest"
            style="font-family: var(--font-mono); color: var(--color-muted)"
          >
            Modified
          </span>
          <input ref="rightFileInput" type="file" class="hidden" @change="handleFileInput('right', $event)">
          <button
            class="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors hover:bg-white/5 cursor-pointer"
            style="font-family: var(--font-mono); color: var(--color-muted)"
            title="Upload file"
            @click="triggerFileInput('right')"
          >
            <Upload :size="10" />
            <span class="hidden sm:inline">Upload</span>
          </button>
        </div>
        <div class="relative">
          <DiffEditor
            v-model="rightText"
            :language="language"
            placeholder="Paste modified text here..."
          />
          <!-- Drop zone: only visible when dragging a file over the window -->
          <div
            v-if="isDraggingFile && !rightText"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-[var(--color-accent)] bg-[rgba(0,229,204,0.04)]"
            @dragover.prevent
            @drop="handleDrop('right', $event)"
          >
            <Upload :size="24" style="color: var(--color-accent)" />
            <span class="text-xs" style="font-family: var(--font-mono); color: var(--color-accent)">
              Drop file here
            </span>
          </div>
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
