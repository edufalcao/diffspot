<script setup lang="ts">
import { computed } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { getLanguageExtension } from '~/composables/useEditorState'

const props = withDefaults(
  defineProps<{
    modelValue: string
    language: string
    placeholder?: string
    readonly?: boolean
    ariaLabel?: string
  }>(),
  {
    placeholder: '',
    readonly: false,
    ariaLabel: '',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

const customTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-text)',
      fontFamily: "var(--font-mono)",
      fontSize: '13px',
      minHeight: '150px',
      maxHeight: 'calc(100vh - 400px)',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-content': {
      caretColor: 'var(--color-accent)',
      fontFamily: "var(--font-mono)",
      padding: '12px 0',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--color-accent)',
      borderLeftWidth: '2px',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    '.cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(0, 229, 204, 0.15) !important',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--color-surface)',
      color: 'var(--color-muted)',
      border: 'none',
      fontFamily: "var(--font-mono)",
      fontSize: '12px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
      color: 'var(--color-accent)',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 12px 0 8px',
    },
    '.cm-placeholder': {
      color: 'var(--color-muted)',
      fontStyle: 'italic',
    },
    '.cm-scroller': {
      overflow: 'auto',
    },
  },
  { dark: true }
)

const extensions = computed(() => {
  const exts = [
    customTheme,
    oneDark,
    EditorView.lineWrapping,
    getLanguageExtension(props.language),
  ]

  if (props.readonly) {
    exts.push(EditorView.editable.of(false))
  }

  return exts
})
</script>

<template>
  <div class="diff-editor-wrapper" :aria-label="ariaLabel || undefined">
    <Codemirror
      v-model="localValue"
      :placeholder="placeholder"
      :extensions="extensions"
      :disabled="readonly"
    />
  </div>
</template>

<style scoped>
.diff-editor-wrapper {
  overflow: hidden;
  background-color: var(--color-surface);
  min-height: 150px;
  max-height: calc(100vh - 400px);
}

.diff-editor-wrapper :deep(.cm-editor) {
  min-height: 150px;
  max-height: calc(100vh - 400px);
}

.diff-editor-wrapper :deep(.cm-scroller) {
  min-height: 150px;
  max-height: calc(100vh - 400px);
  overflow: auto;
}
</style>
