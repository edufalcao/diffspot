<script setup lang="ts">
interface Props {
  as?: string
}

withDefaults(defineProps<Props>(), {
  as: 'span',
})
</script>

<template>
  <component :is="as" class="gradient-text">
    <slot />
  </component>
</template>
