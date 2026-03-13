<script setup lang="ts">
interface ToggleOption {
  label: string,
  value: string
}

interface Props {
  options: ToggleOption[],
  modelValue: string
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>();

function select(value: string) {
  emit('update:modelValue', value);
}
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="[
        'relative cursor-pointer rounded-md px-4 py-2 text-sm font-medium',
        'transition-all duration-[var(--duration)] ease-[var(--ease)]',
        modelValue === option.value
          ? 'bg-[var(--color-accent)] text-[var(--color-bg)] shadow-[0_0_20px_var(--glow-accent)]'
          : 'bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-text)]'
      ]"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
