// 名刺・OGPに載せる情報の型と永続化。描画はsvggen.tsに分離する。

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
  };
}

export function isCardData(value: unknown): value is CardData {
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

export function deserializeCard(json: string): CardData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  return isCardData(parsed) ? parsed : null;
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
