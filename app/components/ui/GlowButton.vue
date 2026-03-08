<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
})

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold border border-transparent',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]',
  ghost:
    'bg-transparent text-[var(--color-text)] border border-transparent',
}

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-lg cursor-pointer',
  'font-[var(--font-body)]',
  'transition-all duration-[var(--duration)] ease-[var(--ease)]',
  sizeClasses[props.size],
  variantClasses[props.variant],
  {
    'opacity-40 cursor-not-allowed': props.disabled,
    'hover:shadow-[0_0_30px_var(--glow-accent)] hover:-translate-y-0.5 active:translate-y-0':
      !props.disabled,
  },
])
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
