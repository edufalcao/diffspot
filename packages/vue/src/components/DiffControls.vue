<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import type { DiffPrecision, ExportFormat } from '@diffspot/core';
import { getActiveDiffOptions } from '../lib/diffOptions';

const LARGE_DIFF_THRESHOLD = 50_000;

const props = withDefaults(
  defineProps<{
    viewMode: 'split' | 'unified',
    precision: DiffPrecision,
    ignoreWhitespace: boolean,
    ignoreCase: boolean,
    collapseUnchanged: boolean,
    hideSplitOption?: boolean,
    isFullscreen?: boolean,
    currentChangeIndex?: number,
    totalChanges?: number,
    totalLines?: number
  }>(),
  {
    hideSplitOption: false,
    isFullscreen: false,
    currentChangeIndex: -1,
    totalChanges: 0,
    totalLines: 0
  }
);

const emit = defineEmits<{
  'update:viewMode': [value: 'split' | 'unified'],
  'update:precision': [value: DiffPrecision],
  'update:ignoreWhitespace': [value: boolean],
  'update:ignoreCase': [value: boolean],
  'update:collapseUnchanged': [value: boolean],
  'export': [format: ExportFormat],
  'toggle-fullscreen': [],
  'prev-change': [],
  'next-change': []
}>();

const viewModeOptions = computed(() =>
  props.hideSplitOption
    ? [{ label: 'Unified', value: 'unified' }]
    : [
        { label: 'Split', value: 'split' },
        { label: 'Unified', value: 'unified' }
      ]
);

const precisionOptions = [
  { label: 'Line', value: 'line' },
  { label: 'Word', value: 'word' },
  { label: 'Char', value: 'char' }
];

const changeDisplay = computed(() => {
  if (props.totalChanges === 0) return '0 / 0';
  return `${props.currentChangeIndex + 1} / ${props.totalChanges}`;
});

type DiffOptionKey = 'ignoreWhitespace' | 'ignoreCase' | 'collapseUnchanged';

const optionsOpen = ref(false);
const optionsRef = ref<HTMLElement | null>(null);

const diffOptions = computed(() => [
  {
    key: 'ignoreWhitespace' as const,
    label: 'Ignore whitespace',
    description: 'Treat whitespace-only changes as equal.',
    checked: props.ignoreWhitespace
  },
  {
    key: 'ignoreCase' as const,
    label: 'Ignore case',
    description: 'Compare uppercase and lowercase text equally.',
    checked: props.ignoreCase
  },
  {
    key: 'collapseUnchanged' as const,
    label: 'Collapse unchanged',
    description: 'Fold long unchanged sections in the diff output.',
    checked: props.collapseUnchanged
  }
]);

const activeOptions = computed(() =>
  getActiveDiffOptions({
    ignoreWhitespace: props.ignoreWhitespace,
    ignoreCase: props.ignoreCase,
    collapseUnchanged: props.collapseUnchanged
  })
);

const activeOptionCount = computed(() =>
  activeOptions.value.length
);

function toggleOptions() {
  optionsOpen.value = !optionsOpen.value;
  if (optionsOpen.value) {
    exportOpen.value = false;
  }
}

function updateDiffOption(option: DiffOptionKey, checked: boolean) {
  switch (option) {
    case 'ignoreWhitespace':
      emit('update:ignoreWhitespace', checked);
      break;
    case 'ignoreCase':
      emit('update:ignoreCase', checked);
      break;
    case 'collapseUnchanged':
      emit('update:collapseUnchanged', checked);
      break;
  }
}

// Export dropdown
const exportOpen = ref(false);
const exportRef = ref<HTMLElement | null>(null);

function toggleExport() {
  exportOpen.value = !exportOpen.value;
  if (exportOpen.value) {
    optionsOpen.value = false;
  }
}

function selectExport(format: ExportFormat) {
  exportOpen.value = false;
  emit('export', format);
}

function handleClickOutside(event: MouseEvent) {
  if (optionsRef.value && !optionsRef.value.contains(event.target as Node)) {
    optionsOpen.value = false;
  }

  if (exportRef.value && !exportRef.value.contains(event.target as Node)) {
    exportOpen.value = false;
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    optionsOpen.value = false;
    exportOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
});

const showPrintWarning = computed(() => props.totalLines > LARGE_DIFF_THRESHOLD);
</script>

<template>
  <div class="space-y-2 print:hidden">
    <div
      role="toolbar"
      aria-label="Diff controls"
      class="flex flex-wrap items-center gap-3"
    >
      <!-- View mode toggle -->
      <div class="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
        <button
          v-for="option in viewModeOptions"
          :key="option.value"
          type="button"
          :class="[
            'px-3 py-1 text-sm font-medium rounded-md transition-colors',
            viewMode === option.value
              ? 'bg-[var(--color-elevated)] text-[var(--color-text)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          ]"
          @click="emit('update:viewMode', option.value as 'split' | 'unified')"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- Precision selector -->
      <div class="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
        <button
          v-for="option in precisionOptions"
          :key="option.value"
          type="button"
          :class="[
            'px-3 py-1 text-sm font-medium rounded-md transition-colors',
            precision === option.value
              ? 'bg-[var(--color-elevated)] text-[var(--color-text)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          ]"
          @click="emit('update:precision', option.value as DiffPrecision)"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- Divider -->
      <div class="h-6 w-px bg-[var(--color-border)]" />

      <!-- Options dropdown -->
      <div
        ref="optionsRef"
        class="relative inline-block"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
          :aria-expanded="optionsOpen"
          aria-haspopup="menu"
          @click="toggleOptions"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line
              x1="4"
              y1="21"
              x2="4"
              y2="14"
            />
            <line
              x1="4"
              y1="10"
              x2="4"
              y2="3"
            />
            <line
              x1="12"
              y1="21"
              x2="12"
              y2="12"
            />
            <line
              x1="12"
              y1="8"
              x2="12"
              y2="3"
            />
            <line
              x1="20"
              y1="21"
              x2="20"
              y2="16"
            />
            <line
              x1="20"
              y1="12"
              x2="20"
              y2="3"
            />
            <line
              x1="2"
              y1="14"
              x2="6"
              y2="14"
            />
            <line
              x1="10"
              y1="8"
              x2="14"
              y2="8"
            />
            <line
              x1="18"
              y1="16"
              x2="22"
              y2="16"
            />
          </svg>
          Options
          <span
            v-if="activeOptionCount > 0"
            class="min-w-[1.25rem] rounded-full bg-[var(--color-accent)]/15 px-1.5 py-0.5 text-xs leading-none text-[var(--color-accent)]"
            style="font-family: var(--font-mono)"
          >
            {{ activeOptionCount }}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-transform"
            :class="{ 'rotate-180': optionsOpen }"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <Transition
          enter-active-class="transition duration-150 ease-[var(--ease)]"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-[var(--ease)]"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="optionsOpen"
            class="absolute left-0 z-50 mt-2 min-w-[260px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] py-1 shadow-xl"
            role="menu"
            aria-label="Diff options"
          >
            <label
              v-for="option in diffOptions"
              :key="option.key"
              class="flex cursor-pointer items-start gap-3 px-4 py-3 text-sm text-[var(--color-text)] transition-colors hover:bg-[hsla(0,0%,100%,0.03)]"
            >
              <input
                type="checkbox"
                :checked="option.checked"
                class="mt-0.5 accent-[var(--color-accent)]"
                @change="updateDiffOption(option.key, ($event.target as HTMLInputElement).checked)"
              >
              <span class="min-w-0">
                <span class="block">{{ option.label }}</span>
                <span class="block text-xs text-[var(--color-muted)]">
                  {{ option.description }}
                </span>
              </span>
            </label>
          </div>
        </Transition>
      </div>

      <!-- Divider -->
      <div class="h-6 w-px bg-[var(--color-border)]" />

      <!-- Jump navigation -->
      <div class="flex items-center gap-1">
        <button
          :disabled="totalChanges === 0 || currentChangeIndex <= 0"
          class="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous change (Alt+Up)"
          @click="emit('prev-change')"
        >
          <!-- ChevronUp icon -->
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
        <span
          class="text-xs tabular-nums min-w-[3.5rem] text-center text-[var(--color-muted)]"
          style="font-family: var(--font-mono)"
        >
          {{ changeDisplay }}
        </span>
        <button
          :disabled="totalChanges === 0 || currentChangeIndex >= totalChanges - 1"
          class="p-1 rounded text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next change (Alt+Down)"
          @click="emit('next-change')"
        >
          <!-- ChevronDown icon -->
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Fullscreen toggle -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
        @click="emit('toggle-fullscreen')"
      >
        <!-- Minimize2 icon when fullscreen -->
        <svg
          v-if="isFullscreen"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="4 14 10 14 10 20" />
          <polyline points="20 10 14 10 14 4" />
          <line
            x1="14"
            y1="10"
            x2="21"
            y2="3"
          />
          <line
            x1="3"
            y1="21"
            x2="10"
            y2="14"
          />
        </svg>
        <!-- Maximize2 icon when not fullscreen -->
        <svg
          v-else
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line
            x1="21"
            y1="3"
            x2="14"
            y2="10"
          />
          <line
            x1="3"
            y1="21"
            x2="10"
            y2="14"
          />
        </svg>
        {{ isFullscreen ? 'Exit' : 'Fullscreen' }}
      </button>

      <!-- Export dropdown -->
      <div
        ref="exportRef"
        class="relative inline-block"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
          @click="toggleExport"
        >
          <!-- Download icon -->
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line
              x1="12"
              y1="15"
              x2="12"
              y2="3"
            />
          </svg>
          Export
          <!-- ChevronDown -->
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <!-- Dropdown menu -->
        <Transition
          enter-active-class="transition duration-150 ease-[var(--ease)]"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-[var(--ease)]"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="exportOpen"
            class="absolute right-0 z-50 mt-2 min-w-[220px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] py-1 shadow-xl"
          >
            <!-- Print / PDF -->
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-text)] hover:bg-[hsla(0,0%,100%,0.03)] transition-colors"
              @click="selectExport('print')"
            >
              <!-- Printer icon -->
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect
                  x="6"
                  y="14"
                  width="12"
                  height="8"
                />
              </svg>
              <div>
                <div>Print / PDF</div>
                <div
                  v-if="showPrintWarning"
                  class="text-xs text-[var(--color-accent-2)] mt-0.5"
                >
                  Large diff ({{ totalLines.toLocaleString() }} lines) — may be slow
                </div>
              </div>
            </button>

            <!-- Unified Diff -->
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-text)] hover:bg-[hsla(0,0%,100%,0.03)] transition-colors"
              @click="selectExport('unified-diff')"
            >
              <!-- FileText icon -->
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line
                  x1="16"
                  y1="13"
                  x2="8"
                  y2="13"
                />
                <line
                  x1="16"
                  y1="17"
                  x2="8"
                  y2="17"
                />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Unified Diff (.diff)</span>
            </button>

            <!-- HTML Report -->
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-text)] hover:bg-[hsla(0,0%,100%,0.03)] transition-colors"
              @click="selectExport('html')"
            >
              <!-- Code icon -->
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>HTML Report (.html)</span>
            </button>

            <!-- JSON Data -->
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-text)] hover:bg-[hsla(0,0%,100%,0.03)] transition-colors"
              @click="selectExport('json')"
            >
              <!-- Braces icon -->
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              >
                <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
                <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
              </svg>
              <span>JSON Data (.json)</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <div
      v-if="activeOptions.length > 0"
      class="flex flex-wrap items-center gap-2"
      aria-label="Active diff options"
    >
      <span
        class="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]"
        style="font-family: var(--font-mono)"
      >
        Active options
      </span>
      <span
        v-for="option in activeOptions"
        :key="option.key"
        class="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text)]"
        style="font-family: var(--font-mono)"
      >
        {{ option.label }}
      </span>
    </div>
  </div>
</template>
