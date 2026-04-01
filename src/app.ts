// 画面の描画。入力はchangeイベントで確定し、プレビューだけを差し替える。

import type { CardData, CardStore } from './lib/card';
import { meishiSvg, ogpSvg } from './lib/svggen';
import { icons } from './icons';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

const ACCENT_PRESETS = ['#2f6690', '#b9551c', '#2e7d4f', '#94434b', '#5b4d8c', '#8a5a00'];

export interface AppDeps {
  root: HTMLElement;
  store: CardStore;
  initialCard: CardData;
}

export function createApp({ root, store, initialCard }: AppDeps): void {
  const card = initialCard;

  function commitAndPreview(): void {
    store.save(card);
    updatePreviews();
  }

  function updatePreviews(): void {
    const meishi = root.querySelector<HTMLElement>('#preview-meishi');
    if (meishi) meishi.innerHTML = meishiSvg(card);
    const ogp = root.querySelector<HTMLElement>('#preview-ogp');
    if (ogp) ogp.innerHTML = ogpSvg(card);
  }

  function download(name: string, content: string): void {
    const url = URL.createObjectURL(new Blob([content], { type: 'image/svg+xml' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function field(key: keyof CardData, label: string, placeholder = ''): string {
    return `
      <label class="field"><span>${label}</span>
        <input data-field="${key}" value="${esc(String(card[key]))}" placeholder="${esc(placeholder)}" /></label>`;
  }

  function render(): void {
    const swatches = ACCENT_PRESETS.map(
      (c) => `
        <button type="button" class="swatch ${c === card.accent ? 'active' : ''}" data-accent="${c}"
          style="--swatch:${c}" aria-label="アクセント色 ${c}"></button>`,
    ).join('');
    root.innerHTML = `
      <header class="site-header">
        <div class="site-header-inner">
          <span class="brand">${icons.logo}<span>meishi</span></span>
        </div>
      </header>
      <main class="site-main">
        <div class="workspace">
          <section class="panel form-panel">
            <h2>のせる情報</h2>
            ${field('name', '名前')}
            ${field('sub', '添え書き(ローマ字・読み)', 'Hanako Yamada')}
            ${field('title', '肩書', 'ソフトウェアエンジニア')}
            ${field('org', '所属・屋号', 'yamada.dev')}
            ${field('email', 'メール', 'hanako@example.com')}
            ${field('site', 'サイト', 'https://yamada.dev')}
            <div class="theme-row">
              <div class="swatches" role="group" aria-label="アクセント色">
                ${swatches}
                <label class="custom-color"><input type="color" id="accent-custom"
                  value="${esc(card.accent)}" aria-label="自由なアクセント色" /></label>
              </div>
              <label class="dark-toggle">
                <input type="checkbox" id="dark" ${card.dark ? 'checked' : ''} />
                <span>暗い地色</span>
              </label>
            </div>
          </section>
          <div class="previews">
            <section class="panel">
              <div class="panel-head">
                <h2>名刺(91×55mm)</h2>
                <button type="button" class="button small" id="dl-meishi">
                  ${icons.download}<span>SVGを保存</span></button>
              </div>
              <div id="preview-meishi" class="preview meishi-preview"></div>
            </section>
            <section class="panel">
              <div class="panel-head">
                <h2>OGP画像(1200×630)</h2>
                <button type="button" class="button small" id="dl-ogp">
                  ${icons.download}<span>SVGを保存</span></button>
              </div>
              <div id="preview-ogp" class="preview"></div>
              <p class="hint">OGPとして使うときはPNGに変換して配信してください(SVGを直接OGPにできるサービスは少ないため)。</p>
            </section>
          </div>
        </div>
      </main>
      <footer class="site-footer">
        <p>meishi — 名刺とOGPのSVGジェネレータ。入力はこの端末のブラウザにだけ保存されます。</p>
      </footer>`;
    bindEvents();
    updatePreviews();
  }

  function bindEvents(): void {
    for (const el of root.querySelectorAll<HTMLInputElement>('[data-field]')) {
      el.addEventListener('input', () => {
        const key = el.dataset.field as Exclude<keyof CardData, 'dark'>;
        card[key] = el.value;
        commitAndPreview();
      });
    }
    for (const el of root.querySelectorAll<HTMLElement>('[data-accent]')) {
      el.addEventListener('click', () => {
        card.accent = el.dataset.accent ?? card.accent;
        store.save(card);
        render();
      });
    }
    root.querySelector<HTMLInputElement>('#accent-custom')?.addEventListener('change', (e) => {
      card.accent = (e.target as HTMLInputElement).value;
      store.save(card);
      render();
    });
    root.querySelector<HTMLInputElement>('#dark')?.addEventListener('change', (e) => {
      card.dark = (e.target as HTMLInputElement).checked;
      commitAndPreview();
    });
    root.querySelector('#dl-meishi')?.addEventListener('click', () => {
      download('meishi.svg', meishiSvg(card));
    });
    root.querySelector('#dl-ogp')?.addEventListener('click', () => {
      download('ogp.svg', ogpSvg(card));
    });
  }

  render();
}
