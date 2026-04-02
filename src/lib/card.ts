// 名刺・OGPに載せる情報の型と永続化。描画はsvggen.tsに分離する。

export type FontChoice = 'sans' | 'mincho' | 'mono';
export type Layout = 'standard' | 'centered';
export type OgpSize = 'og' | 'square' | 'wide';

export const FONT_CHOICES: readonly FontChoice[] = ['sans', 'mincho', 'mono'];
export const LAYOUTS: readonly Layout[] = ['standard', 'centered'];
export const OGP_SIZES: readonly OgpSize[] = ['og', 'square', 'wide'];

export interface CardData {
  /** 名前(必須) */
  name: string;
  /** ローマ字や読みなどの添え書き */
  sub: string;
  title: string;
  org: string;
  email: string;
  site: string;
  /** アクセント色(#rrggbb) */
  accent: string;
  /** 地色を暗くするか */
  dark: boolean;
  /** 書体の系統 */
  font: FontChoice;
  /** 文字の寄せ方 */
  layout: Layout;
  /** OGPの寸法プリセット */
  ogpSize: OgpSize;
}

const COLOR_RE = /^#[0-9a-f]{6}$/i;

export function defaultCard(): CardData {
  return {
    name: '山田 花子',
    sub: 'Hanako Yamada',
    title: 'ソフトウェアエンジニア',
    org: 'yamada.dev',
    email: 'hanako@example.com',
    site: 'https://yamada.dev',
    accent: '#2f6690',
    dark: false,
    font: 'sans',
    layout: 'standard',
    ogpSize: 'og',
  };
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** 必須(コア)項目だけを検証する。後から増えた項目はnormalizeで補う。 */
function hasCoreFields(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.name === 'string' &&
    typeof c.sub === 'string' &&
    typeof c.title === 'string' &&
    typeof c.org === 'string' &&
    typeof c.email === 'string' &&
    typeof c.site === 'string' &&
    typeof c.accent === 'string' &&
    COLOR_RE.test(c.accent) &&
    typeof c.dark === 'boolean'
  );
}

/**
 * コア項目を満たす生データを、欠けた項目を既定で補った完全なCardDataにする。
 * 旧バージョンの保存値や、項目が増える前の共有リンクをそのまま読めるようにする。
 */
export function normalizeCard(raw: Record<string, unknown>): CardData {
  const d = defaultCard();
  return {
    name: String(raw.name),
    sub: String(raw.sub),
    title: String(raw.title),
    org: String(raw.org),
    email: String(raw.email),
    site: String(raw.site),
    accent: String(raw.accent),
    dark: Boolean(raw.dark),
    font: pick(raw.font, FONT_CHOICES, d.font),
    layout: pick(raw.layout, LAYOUTS, d.layout),
    ogpSize: pick(raw.ogpSize, OGP_SIZES, d.ogpSize),
  };
}

export function isCardData(value: unknown): value is CardData {
  return hasCoreFields(value);
}

export function deserializeCard(json: string): CardData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  return hasCoreFields(parsed) ? normalizeCard(parsed) : null;
}

export interface CardStore {
  load(): CardData | null;
  save(card: CardData): void;
}

const STORAGE_KEY = 'meishi.card.v1';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createStore(storage: StorageLike): CardStore {
  return {
    load() {
      const raw = storage.getItem(STORAGE_KEY);
      return raw === null ? null : deserializeCard(raw);
    },
    save(card) {
      storage.setItem(STORAGE_KEY, JSON.stringify(card));
    },
  };
}
