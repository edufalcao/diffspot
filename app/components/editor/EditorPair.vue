<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState'
import DiffEditor from './DiffEditor.vue'
import FileUpload from './FileUpload.vue'

const { leftText, rightText, language } = useEditorState()
const leftFocused = ref(false)
const rightFocused = ref(false)

function onLeftFileLoaded(content: string) {
  leftText.value = content
}

function onRightFileLoaded(content: string) {
  rightText.value = content
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span
          class="text-xs uppercase tracking-widest"
          style="font-family: var(--font-mono); color: var(--color-muted)"
        >
          Original
        </span>
      </div>
      <div class="relative" @focusin="leftFocused = true" @focusout="leftFocused = false">
        <DiffEditor
          v-model="leftText"
          :language="language"
          placeholder="Paste original text here..."
        />
        <FileUpload
          v-if="!leftText && !leftFocused"
          side="left"
          @file-loaded="onLeftFileLoaded"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span
          class="text-xs uppercase tracking-widest"
          style="font-family: var(--font-mono); color: var(--color-muted)"
        >
          Modified
        </span>
      </div>
      <div class="relative" @focusin="rightFocused = true" @focusout="rightFocused = false">
        <DiffEditor
          v-model="rightText"
          :language="language"
          placeholder="Paste modified text here..."
        />
        <FileUpload
          v-if="!rightText && !rightFocused"
          side="right"
          @file-loaded="onRightFileLoaded"
        />
      </div>
    </div>
  </div>
</template>
