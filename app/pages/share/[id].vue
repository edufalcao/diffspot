<script setup lang="ts">
import { useDiff } from '~/composables/useDiff'
import type { ShareData } from '~/composables/useShare'

definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: 'Shared Diff — diffspot',
  ogTitle: 'Shared Diff — diffspot',
  ogDescription: 'View a shared text comparison on diffspot',
  ogType: 'website',
  twitterCard: 'summary',
})

const route = useRoute()
const shareId = route.params.id as string

// Fetch share data on the server via useAsyncData
const { data: share, error } = await useAsyncData<ShareData>(
  `share-${shareId}`,
  () => $fetch(`/api/share/${shareId}`),
)

// Show error page if not found
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: 'Not Found',
    message: 'This shared diff could not be found.',
    fatal: true,
  })
}

// Compute the diff from the loaded texts
const leftText = computed(() => share.value?.leftText ?? '')
const rightText = computed(() => share.value?.rightText ?? '')

const diffOptions = computed(() => ({
  precision: 'line' as const,
  ignoreWhitespace: false,
  ignoreCase: false,
}))

const { result: diffResult } = useDiff(leftText, rightText, diffOptions)

// Format the creation date for display
const formattedDate = computed(() => {
  if (!share.value?.createdAt) return ''
  const date = new Date(share.value.createdAt + 'Z')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/"
            class="text-xl font-bold font-[family-name:var(--font-display)] gradient-text hover:opacity-80 transition-opacity"
          >
            diffspot
          </NuxtLink>
          <span class="text-[var(--color-muted)] text-sm">/</span>
          <h1 class="text-lg font-semibold font-[family-name:var(--font-display)] text-[var(--color-text)]">
            Shared Diff
          </h1>
        </div>

        <div class="flex items-center gap-3">
          <!-- Language badge -->
          <span
            v-if="share?.language && share.language !== 'plaintext'"
            class="px-2.5 py-1 text-xs font-mono rounded-md bg-[var(--color-elevated)] text-[var(--color-accent)] border border-[var(--color-border)]"
          >
            {{ share.language }}
          </span>

          <!-- Created date -->
          <span
            v-if="formattedDate"
            class="text-xs text-[var(--color-muted)] font-[family-name:var(--font-body)]"
          >
            {{ formattedDate }}
          </span>
        </div>
      </div>
    </header>

    <!-- Diff stats -->
    <div class="max-w-6xl mx-auto px-6 py-3 w-full">
      <div class="flex items-center gap-4 text-sm font-mono">
        <span class="text-[var(--color-accent)]">
          +{{ diffResult.additions }}
        </span>
        <span class="text-[var(--color-accent-2)]">
          -{{ diffResult.removals }}
        </span>
        <span class="text-[var(--color-muted)]">
          {{ diffResult.unchanged }} unchanged
        </span>
      </div>
    </div>

    <!-- Diff content -->
    <main class="flex-1 max-w-6xl mx-auto px-6 pb-8 w-full">
      <div class="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <!-- Diff lines -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm font-mono">
            <tbody>
              <tr
                v-for="(line, index) in diffResult.lines"
                :key="index"
                :class="{
                  'bg-[var(--color-diff-added-bg)]': line.type === 'added',
                  'bg-[var(--color-diff-removed-bg)]': line.type === 'removed',
                }"
              >
                <!-- Old line number -->
                <td class="w-12 px-3 py-0.5 text-right text-[var(--color-muted)] select-none border-r border-[var(--color-border)] opacity-50">
                  {{ line.oldLineNumber ?? '' }}
                </td>
                <!-- New line number -->
                <td class="w-12 px-3 py-0.5 text-right text-[var(--color-muted)] select-none border-r border-[var(--color-border)] opacity-50">
                  {{ line.newLineNumber ?? '' }}
                </td>
                <!-- Change indicator -->
                <td class="w-6 px-1 py-0.5 text-center select-none" :class="{
                  'text-[var(--color-accent)]': line.type === 'added',
                  'text-[var(--color-accent-2)]': line.type === 'removed',
                  'text-transparent': line.type === 'unchanged',
                }">
                  {{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}
                </td>
                <!-- Content -->
                <td class="px-3 py-0.5 whitespace-pre-wrap">
                  <template v-if="line.words && line.words.length > 0">
                    <span
                      v-for="(word, wIdx) in line.words"
                      :key="wIdx"
                      :class="{
                        'bg-[var(--color-diff-added-hl)] rounded-sm': word.added,
                        'bg-[var(--color-diff-removed-hl)] rounded-sm': word.removed,
                      }"
                    >{{ word.value }}</span>
                  </template>
                  <template v-else>
                    {{ line.content }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>
