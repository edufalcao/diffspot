<script setup lang="ts">
import { Terminal } from 'lucide-vue-next';
</script>

<template>
  <header class="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
    <NuxtLink
      to="/"
      class="flex items-center gap-2 no-underline group"
    >
      <Terminal
        :size="20"
        class="text-[var(--color-accent)] transition-transform duration-150 group-hover:scale-110"
      />
      <span class="font-mono text-lg font-semibold">
        <span class="text-[var(--color-muted)]">$ </span>
        <span class="gradient-text">diffspot</span>
      </span>
    </NuxtLink>

    <div class="flex items-center gap-3">
      <a
        href="https://github.com/edufalcao/diffspot"
        target="_blank"
        rel="noopener noreferrer"
        class="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors duration-150 text-sm font-mono"
      >
        GitHub
      </a>
      <LayoutThemeToggle />
    </div>
  </header>
</template>
