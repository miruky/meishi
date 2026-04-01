import { describe, expect, it } from 'vitest';
import {
  isThemePref,
  resolveTheme,
  nextThemePref,
  themeLabel,
  loadThemePref,
  saveThemePref,
} from './theme';

describe('isThemePref', () => {
  it('3値だけを受け入れる', () => {
    expect(isThemePref('system')).toBe(true);
    expect(isThemePref('light')).toBe(true);
    expect(isThemePref('dark')).toBe(true);
    expect(isThemePref('auto')).toBe(false);
    expect(isThemePref(null)).toBe(false);
  });
});

describe('resolveTheme', () => {
  it('systemは端末の好みに従う', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('明示指定は端末の好みを上書きする', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('nextThemePref', () => {
  it('system → light → dark → system と巡回する', () => {
    expect(nextThemePref('system')).toBe('light');
    expect(nextThemePref('light')).toBe('dark');
    expect(nextThemePref('dark')).toBe('system');
  });
});

describe('themeLabel', () => {
  it('状態ごとに日本語の説明を返す', () => {
    expect(themeLabel('system')).toContain('端末');
    expect(themeLabel('light')).toContain('明');
    expect(themeLabel('dark')).toContain('暗');
  });
});

describe('load/save', () => {
  it('未保存はsystem、保存値は読み戻せる', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    };
    expect(loadThemePref(storage)).toBe('system');
    saveThemePref(storage, 'dark');
    expect(loadThemePref(storage)).toBe('dark');
  });

  it('壊れた保存値はsystemに倒す', () => {
    const storage = {
      getItem: () => 'nonsense',
      setItem: () => {},
    };
    expect(loadThemePref(storage)).toBe('system');
  });
});
