import { describe, expect, it } from 'vitest';

describe('public api', () => {
  it('exports the package surface from the entrypoint', async () => {
    const mod = await import('../src');

    expect(mod.DiffView).toBeTruthy();
    expect(mod.DiffSplitView).toBeTruthy();
    expect(mod.DiffUnifiedView).toBeTruthy();
    expect(mod.DiffLine).toBeTruthy();
    expect(mod.DiffGutter).toBeTruthy();
    expect(mod.DiffMinimap).toBeTruthy();
    expect(mod.DiffControls).toBeTruthy();
    expect(mod.DiffStats).toBeTruthy();

    expect(mod.useDiff).toBeTypeOf('function');
    expect(mod.useDiffOptions).toBeTypeOf('function');
    expect(mod.useDiffNavigation).toBeTypeOf('function');
    expect(mod.useVirtualScroll).toBeTypeOf('function');
    expect(mod.useExport).toBeTypeOf('function');
    expect(mod.usePrint).toBeTypeOf('function');
  });
});
