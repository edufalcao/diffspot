<script setup lang="ts">
import { ref } from 'vue';
import { Upload } from 'lucide-vue-next';

defineProps<{
  side: 'left' | 'right'
}>();

const emit = defineEmits<{
  'file-loaded': [content: string]
}>();

const isDragOver = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const acceptedExtensions = [
  '.txt', '.js', '.ts', '.py', '.json', '.xml', '.html', '.css', '.md',
  '.go', '.rs', '.java', '.cpp', '.c', '.php', '.sql', '.yaml', '.yml', '.toml'
].join(',');

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave() {
  isDragOver.value = false;
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;

  const file = event.dataTransfer?.files[0];
  if (file) {
    readFile(file);
  }
}

function handleClick() {
  fileInput.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    readFile(file);
  }
  // Reset input so the same file can be re-selected
  target.value = '';
}

function readFile(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    const content = reader.result as string;
    emit('file-loaded', content);
  };
  reader.readAsText(file);
}
</script>

<template>
  <div
    class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 cursor-pointer rounded-lg transition-all"
    :class="isDragOver ? 'file-upload-active' : 'file-upload-idle'"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="handleClick"
  >
    <Upload
      :size="28"
      :style="{ color: isDragOver ? 'var(--color-accent)' : 'var(--color-muted)' }"
      class="transition-colors"
    />
    <p
      class="text-sm text-center px-4"
      style="font-family: var(--font-mono); color: var(--color-muted)"
    >
      Drop file here or click to upload
    </p>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="acceptedExtensions"
      @change="handleFileChange"
    >
  </div>
</template>

<style scoped>
.file-upload-idle {
  border: 2px dashed var(--color-border);
  background-color: transparent;
}

.file-upload-active {
  border: 2px dashed var(--color-accent);
  background-color: rgba(0, 229, 204, 0.04);
}

.file-upload-idle:hover {
  border-color: var(--color-muted);
  background-color: rgba(255, 255, 255, 0.02);
}
</style>
