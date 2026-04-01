// 名刺とOGP画像のSVG生成。フォントは閲覧環境のシステムフォントに任せ、
// 文字はすべてエスケープして埋め込む。

import type { CardData } from './card';

export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface Palette {
  bg: string;
  ink: string;
  muted: string;
}

function palette(dark: boolean): Palette {
  return dark
    ? { bg: '#1e1f22', ink: '#f0efec', muted: '#a8a69f' }
    : { bg: '#fdfcfa', ink: '#26241f', muted: '#6e6a60' };
}

const FONT = `'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif`;

/**
 * 名刺(91×55mm)のSVG。1mm=4単位のviewBox(364×220)で、
 * 印刷時はそのまま91×55mmに合わせられる。
 */
export function meishiSvg(card: CardData): string {
  const p = palette(card.dark);
  const contacts = [card.email, card.site].filter((v) => v.trim() !== '');
  const contactLines = contacts
    .map(
      (line, i) =>
        `  <text x="28" y="${168 + i * 18}" font-size="11" fill="${p.muted}">${esc(line)}</text>`,
    )
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 364 220" role="img" aria-label="${esc(card.name)}の名刺">
  <title>${esc(card.name)}の名刺</title>
  <g font-family="${FONT}">
  <rect width="364" height="220" rx="10" fill="${p.bg}"/>
  <rect x="0" y="0" width="10" height="220" rx="5" fill="${card.accent}"/>
  ${card.org.trim() !== '' ? `<text x="28" y="44" font-size="13" fill="${p.muted}">${esc(card.org)}</text>` : ''}
  <text x="28" y="98" font-size="30" font-weight="700" fill="${p.ink}">${esc(card.name)}</text>
  ${card.sub.trim() !== '' ? `<text x="28" y="120" font-size="12" letter-spacing="1" fill="${p.muted}">${esc(card.sub)}</text>` : ''}
  ${card.title.trim() !== '' ? `<text x="28" y="143" font-size="13" fill="${card.accent}" font-weight="600">${esc(card.title)}</text>` : ''}
${contactLines}
  </g>
</svg>`;
}

/** OGP画像(1200×630)のSVG */
export function ogpSvg(card: CardData): string {
  const p = palette(card.dark);
  const footer = [card.org, card.site].filter((v) => v.trim() !== '').join('   ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="${esc(card.name)}のOGP画像">
  <title>${esc(card.name)}のOGP画像</title>
  <g font-family="${FONT}">
  <rect width="1200" height="630" fill="${p.bg}"/>
  <rect x="0" y="610" width="1200" height="20" fill="${card.accent}"/>
  <circle cx="1050" cy="120" r="170" fill="${card.accent}" opacity="0.12"/>
  <circle cx="1120" cy="60" r="90" fill="${card.accent}" opacity="0.18"/>
  ${card.title.trim() !== '' ? `<text x="90" y="250" font-size="34" fill="${card.accent}" font-weight="600">${esc(card.title)}</text>` : ''}
  <text x="90" y="350" font-size="76" font-weight="700" fill="${p.ink}">${esc(card.name)}</text>
  ${card.sub.trim() !== '' ? `<text x="90" y="408" font-size="28" letter-spacing="2" fill="${p.muted}">${esc(card.sub)}</text>` : ''}
  ${footer !== '' ? `<text x="90" y="540" font-size="26" fill="${p.muted}">${esc(footer)}</text>` : ''}
  </g>
</svg>`;
}
