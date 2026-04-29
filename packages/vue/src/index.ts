// Components — public surface
export { default as DiffView } from './components/DiffView.vue';
export { default as DiffSplitView } from './components/DiffSplitView.vue';
export { default as DiffUnifiedView } from './components/DiffUnifiedView.vue';
export { default as DiffMinimap } from './components/DiffMinimap.vue';
export { default as DiffControls } from './components/DiffControls.vue';
export { default as DiffStats } from './components/DiffStats.vue';

// Composables
export { useDiff } from './composables/useDiff';
export { useDiffOptions } from './composables/useDiffOptions';
export { useDiffNavigation } from './composables/useDiffNavigation';
export { useVirtualScroll, VIRTUAL_SCROLL_ITEM_HEIGHT } from './composables/useVirtualScroll';
export { useExport, usePrint } from './composables/useExport';
