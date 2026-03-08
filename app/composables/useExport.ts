/**
 * Triggers the browser's print dialog, which allows saving as PDF.
 * Print-specific CSS in main.css handles hiding non-diff elements
 * and removing scroll constraints.
 */
export function usePrint() {
  function print() {
    window.print()
  }

  return { print }
}
