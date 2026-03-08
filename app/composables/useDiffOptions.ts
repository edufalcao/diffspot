import { ref, computed } from 'vue'
import type { DiffPrecision, DiffOptions } from '~/types/diff'

/**
 * Reactive state for diff configuration options.
 *
 * Provides individual refs for each option as well as a computed
 * `options` object that can be passed directly to `useDiff`.
 */
export function useDiffOptions() {
  /** The granularity of the diff comparison. */
  const precision = ref<DiffPrecision>('line')

  /** Whether to ignore leading/trailing whitespace differences. */
  const ignoreWhitespace = ref(false)

  /** Whether to treat uppercase and lowercase characters as equal. */
  const ignoreCase = ref(false)

  /** Computed options object suitable for passing to `useDiff`. */
  const options = computed<DiffOptions>(() => ({
    precision: precision.value,
    ignoreWhitespace: ignoreWhitespace.value,
    ignoreCase: ignoreCase.value,
  }))

  return {
    precision,
    ignoreWhitespace,
    ignoreCase,
    options,
  }
}
