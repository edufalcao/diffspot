export type DiffOptionKey = 'ignoreWhitespace' | 'ignoreCase' | 'collapseUnchanged';

export interface DiffOptionState {
  ignoreWhitespace: boolean,
  ignoreCase: boolean,
  collapseUnchanged: boolean
}

export interface ActiveDiffOption {
  key: DiffOptionKey,
  label: string
}

const ACTIVE_DIFF_OPTIONS: ActiveDiffOption[] = [
  { key: 'ignoreWhitespace', label: 'Ignore whitespace' },
  { key: 'ignoreCase', label: 'Ignore case' },
  { key: 'collapseUnchanged', label: 'Collapse unchanged' }
];

export function getActiveDiffOptions(options: DiffOptionState): ActiveDiffOption[] {
  return ACTIVE_DIFF_OPTIONS.filter(option => options[option.key]);
}
