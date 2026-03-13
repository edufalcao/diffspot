<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, type Component } from 'vue';

interface DropdownItem {
  label: string,
  value: string,
  icon?: Component
}

interface Props {
  items: DropdownItem[],
  modelValue?: string
}

const _props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

function toggle() {
  isOpen.value = !isOpen.value;
}

function selectItem(value: string) {
  emit('update:modelValue', value);
  isOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div
    ref="dropdownRef"
    class="relative inline-block"
  >
    <!-- Trigger -->
    <div @click="toggle">
      <slot name="trigger" />
    </div>

    <!-- Menu -->
    <Transition
      enter-active-class="transition duration-150 ease-[var(--ease)]"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-[var(--ease)]"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-50 mt-2 min-w-[200px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] py-1 shadow-xl"
      >
        <button
          v-for="item in items"
          :key="item.value"
          type="button"
          :class="[
            'flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-2.5 text-left text-sm',
            'transition-all duration-[var(--duration)] ease-[var(--ease)]',
            modelValue === item.value
              ? 'border-l-[var(--color-accent)] bg-[var(--glow-accent)] text-[var(--color-accent)]'
              : 'border-l-transparent text-[var(--color-text)] hover:border-l-[var(--color-accent)] hover:bg-[hsla(0,0%,100%,0.03)]'
          ]"
          @click="selectItem(item.value)"
        >
          <component
            :is="item.icon"
            v-if="item.icon"
            :size="16"
            class="shrink-0"
          />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
