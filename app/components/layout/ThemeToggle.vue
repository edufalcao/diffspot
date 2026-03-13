<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next';

const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === 'dark');

function toggle() {
  colorMode.preference = isDark.value ? 'light' : 'dark';
}
</script>

<template>
  <button
    class="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-150 hover:border-[var(--color-accent)] hover:shadow-[0_0_20px_var(--glow-accent)] cursor-pointer"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggle"
  >
    <Moon
      v-if="isDark"
      :size="16"
      class="text-[var(--color-accent)]"
    />
    <Sun
      v-else
      :size="16"
      class="text-[var(--color-accent)]"
    />
  </button>
</template>
