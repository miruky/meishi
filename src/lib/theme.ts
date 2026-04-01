// ページの明暗テーマ。名刺SVGの地色(CardData.dark)とは別物で、
// 画面全体の見た目を system / light / dark の3状態で切り替える。
// data-theme属性で駆動し、メディアクエリには依存しない(初回描画前にindex.html
// 先頭のスクリプトで解決してFOUCを防ぐ)。

export type ThemePref = 'system' | 'light' | 'dark';

const PREFS: readonly ThemePref[] = ['system', 'light', 'dark'];

export function isThemePref(value: unknown): value is ThemePref {
  return typeof value === 'string' && (PREFS as readonly string[]).includes(value);
}

/** 設定と端末の好みから、実際に適用する明暗を決める。 */
export function resolveTheme(pref: ThemePref, prefersDark: boolean): 'light' | 'dark' {
  if (pref === 'system') return prefersDark ? 'dark' : 'light';
  return pref;
}

/** トグルで巡回する次の状態。system → light → dark → system の順。 */
export function nextThemePref(current: ThemePref): ThemePref {
  const i = PREFS.indexOf(current);
  return PREFS[(i + 1) % PREFS.length] ?? 'system';
}

export function themeLabel(pref: ThemePref): string {
  switch (pref) {
    case 'light':
      return '明るい配色';
    case 'dark':
      return '暗い配色';
    default:
      return '端末に合わせる';
  }
}

const THEME_KEY = 'meishi.theme.v1';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function loadThemePref(storage: StorageLike): ThemePref {
  const raw = storage.getItem(THEME_KEY);
  return isThemePref(raw) ? raw : 'system';
}

export function saveThemePref(storage: StorageLike, pref: ThemePref): void {
  storage.setItem(THEME_KEY, pref);
}
