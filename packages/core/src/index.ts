export type {
  DiffPrecision,
  DiffWord,
  DiffLine,
  DiffResult,
  DiffOptions,
  ChangeGroup,
  MinimapBlock,
  ExportFormat,
  ExportMetadata
} from './types';

export { computeDiff } from './compute';
export { computeMinimapBlocks } from './minimap';
export { computeChangeGroups } from './navigation';
export { generateUnifiedDiff, generateHtmlExport, generateJsonExport } from './export';
