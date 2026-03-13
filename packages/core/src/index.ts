export type {
  DiffPrecision,
  DiffWord,
  DiffLine,
  DiffResult,
  DiffOptions,
  ChangeGroup,
  MinimapBlock,
} from './types'

export { computeDiff } from './compute'
export { computeMinimapBlocks } from './minimap'
export { computeChangeGroups } from './navigation'
