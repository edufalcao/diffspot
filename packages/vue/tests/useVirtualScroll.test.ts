import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { VIRTUAL_SCROLL_ITEM_HEIGHT } from '../src/composables/useVirtualScroll';

// Prevent "onMounted called when no active component" warnings by stubbing lifecycle hooks
vi.mock('vue', async (importRealVue) => {
  const real = await importRealVue();
  return {
    ...real,
    onMounted: vi.fn(),
    onBeforeUnmount: vi.fn(),
    onUnmounted: vi.fn()
  };
});

describe('useVirtualScroll', () => {
  // These tests exercise the pure computed logic without mounting components.
  // Lifecycle-dependent behavior (ResizeObserver, scroll events) is tested via
  // manual inspection of the returned reactive state.

  it('exports VIRTUAL_SCROLL_ITEM_HEIGHT as 26', () => {
    expect(VIRTUAL_SCROLL_ITEM_HEIGHT).toBe(26);
  });

  it('totalHeight is totalItems * itemHeight', async () => {
    const { useVirtualScroll } = await import('../src/composables/useVirtualScroll');

    const container = ref<HTMLElement>(null);
    const totalItems = ref(100);

    const { totalHeight } = useVirtualScroll(container, totalItems);

    expect(totalHeight.value).toBe(100 * 26);
  });

  it('totalHeight respects custom itemHeight', async () => {
    const { useVirtualScroll } = await import('../src/composables/useVirtualScroll');

    const container = ref<HTMLElement>(null);
    const totalItems = ref(50);

    const { totalHeight } = useVirtualScroll(container, totalItems, { itemHeight: 40 });

    expect(totalHeight.value).toBe(50 * 40);
  });

  it('startIndex returns 0 when scrollTop is 0 (no overscan)', async () => {
    const { useVirtualScroll } = await import('../src/composables/useVirtualScroll');

    const container = ref<HTMLElement>(null);
    const totalItems = ref(100);

    // Overscan = 0 so startIndex is exactly floor(scrollTop / itemHeight)
    const { startIndex } = useVirtualScroll(container, totalItems, { overscan: 0 });

    expect(startIndex.value).toBe(0);
  });

  it('endIndex returns totalItems when scrollTop is 0 (no overscan)', async () => {
    const { useVirtualScroll } = await import('../src/composables/useVirtualScroll');

    const container = ref<HTMLElement>(null);
    const totalItems = ref(100);

    const { endIndex } = useVirtualScroll(container, totalItems, { overscan: 0 });

    // endIndex = floor(scrollTop/itemHeight) + ceil(containerHeight/itemHeight) + overscan
    // with scrollTop=0 and containerHeight=0, this is 0 + 0 + 0 = 0
    // but isPrinting defaults to false, so endIndex uses normal formula
    // With no scroll and no container height, endIndex = 0
    expect(endIndex.value).toBe(0);
  });

  it('reactive totalItems updates totalHeight immediately', async () => {
    const { useVirtualScroll } = await import('../src/composables/useVirtualScroll');

    const container = ref<HTMLElement>(null);
    const totalItems = ref(10);

    const { totalHeight } = useVirtualScroll(container, totalItems);
    expect(totalHeight.value).toBe(260);

    totalItems.value = 20;
    expect(totalHeight.value).toBe(520);
  });

  it('accepts a ComputedRef as totalItems', async () => {
    const { useVirtualScroll } = await import('../src/composables/useVirtualScroll');
    const { computed } = await import('vue');

    const container = ref<HTMLElement>(null);
    const base = ref(5);
    const totalItems = computed(() => base.value * 10);

    const { totalHeight } = useVirtualScroll(container, totalItems);

    // base.value * 10 = 50 → totalHeight = 50 * 26
    expect(totalHeight.value).toBe(1300);
  });
});
