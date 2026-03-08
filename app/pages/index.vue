<template>
  <div class="flex flex-col items-center justify-center px-6 py-16 md:py-24">
    <!-- Hero -->
    <div class="text-center animate-fade-in mb-12">
      <h1 class="text-4xl md:text-6xl font-bold font-[family-name:var(--font-display)] mb-4">
        <span class="font-mono text-[var(--color-muted)]">$ </span>
        <span class="gradient-text">diffspot</span>
      </h1>
      <p class="text-lg md:text-xl text-[var(--color-muted)] font-[family-name:var(--font-body)]">
        Paste. Compare. Ship.
      </p>
    </div>

    <!-- Editor pair placeholder -->
    <div class="w-full max-w-6xl animate-slide-up grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 min-h-[300px] flex items-center justify-center">
        <p class="font-mono text-sm text-[var(--color-muted)]">
          <span class="text-[var(--color-accent)]">// </span>original text here...
        </p>
      </div>
      <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 min-h-[300px] flex items-center justify-center">
        <p class="font-mono text-sm text-[var(--color-muted)]">
          <span class="text-[var(--color-accent-2)]">// </span>modified text here...
        </p>
      </div>
    </div>

    <!-- CTA Button placeholder -->
    <button
      class="px-8 py-3 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold font-[family-name:var(--font-display)] transition-all duration-150 hover:shadow-[0_0_30px_var(--glow-accent)] hover:-translate-y-0.5 cursor-pointer animate-slide-up"
      style="animation-delay: 0.1s"
    >
      Find Differences
    </button>
  </div>
</template>
