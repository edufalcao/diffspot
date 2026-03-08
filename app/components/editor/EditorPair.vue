<script setup lang="ts">
import { useEditorState } from '~/composables/useEditorState'
import DiffEditor from './DiffEditor.vue'
import FileUpload from './FileUpload.vue'

const { leftText, rightText, language } = useEditorState()

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
      <div class="relative">
        <DiffEditor
          v-model="leftText"
          :language="language"
          placeholder="Paste original text here..."
        />
        <FileUpload
          v-if="!leftText"
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
      <div class="relative">
        <DiffEditor
          v-model="rightText"
          :language="language"
          placeholder="Paste modified text here..."
        />
        <FileUpload
          v-if="!rightText"
          side="right"
          @file-loaded="onRightFileLoaded"
        />
      </div>
    </div>
  </div>
</template>
