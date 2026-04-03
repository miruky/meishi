// 画面の描画。入力はinputイベントで確定し、プレビューだけを差し替える。
// 刷り上がりを見せるイントロと、編集机(エディタ)で構成する。

import type { CardData, CardStore, FontChoice, Layout, OgpSize } from './lib/card';
import { defaultCard } from './lib/card';
import { meishiSvg, ogpSvg } from './lib/svggen';
import { svgToPngBlob, pngFilename } from './lib/png';
import { cardToHash } from './lib/share';
import {
  loadThemePref,
  saveThemePref,
  resolveTheme,
  nextThemePref,
  themeLabel,
  type ThemePref,
} from './lib/theme';
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

const ACCENT_PRESETS: ReadonlyArray<readonly [string, string]> = [
  ['#2f6690', '藍'],
  ['#b9551c', '柿'],
  ['#2e7d4f', '常磐'],
  ['#94434b', '臙脂'],
  ['#5b4d8c', '菫'],
  ['#8a5a00', '黄土'],
];

const FONT_OPTIONS: ReadonlyArray<readonly [FontChoice, string]> = [
  ['sans', 'ゴシック'],
  ['mincho', '明朝'],
  ['mono', '等幅'],
];

const LAYOUT_OPTIONS: ReadonlyArray<readonly [Layout, string]> = [
  ['standard', '左寄せ'],
  ['centered', '中央'],
];

const OGP_OPTIONS: ReadonlyArray<readonly [OgpSize, string]> = [
  ['og', '横長'],
  ['square', '正方形'],
  ['wide', 'ワイド'],
];

const OGP_DIM_TEXT: Record<OgpSize, string> = {
  og: '1200 × 630 px',
  square: '1200 × 1200 px',
  wide: '1600 × 900 px',
};

export interface AppDeps {
  root: HTMLElement;
  store: CardStore;
  initialCard: CardData;
}

export function createApp({ root, store, initialCard }: AppDeps): void {
  const card = initialCard;
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  let themePref: ThemePref = loadThemePref(localStorage);

  function applyTheme(): void {
    const mode = resolveTheme(themePref, mql.matches);
    document.documentElement.dataset.theme = mode;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = mode === 'dark' ? '#15140f' : '#f4f1ea';
  }
  mql.addEventListener('change', () => {
    if (themePref === 'system') applyTheme();
  });

  function status(message: string): void {
    const live = root.querySelector('#status');
    if (live) live.textContent = message;
  }

  async function copyText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
      return ok;
    }
  }

  function updatePreviews(): void {
    for (const el of root.querySelectorAll<HTMLElement>('[data-preview="meishi"]')) {
      el.innerHTML = meishiSvg(card);
    }
    for (const el of root.querySelectorAll<HTMLElement>('[data-preview="ogp"]')) {
      el.innerHTML = ogpSvg(card);
    }
  }

  function commitAndPreview(): void {
    store.save(card);
    updatePreviews();
  }

  function downloadBlob(name: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadSvg(name: string, svg: string): void {
    downloadBlob(name, new Blob([svg], { type: 'image/svg+xml' }));
  }

  async function downloadPng(name: string, svg: string, scale: number): Promise<void> {
    try {
      const blob = await svgToPngBlob(svg, scale);
      downloadBlob(pngFilename(name), blob);
      status(`${pngFilename(name)} を保存しました`);
    } catch {
      status('PNGの書き出しに失敗しました');
    }
  }

  function shareUrl(): string {
    return location.origin + location.pathname + cardToHash(card);
  }

  function field(key: keyof CardData, label: string, placeholder = ''): string {
    const id = `f-${key}`;
    return `
      <div class="field">
        <label for="${id}">${label}</label>
        <input id="${id}" data-field="${key}" value="${esc(String(card[key]))}"
          placeholder="${esc(placeholder)}" autocomplete="off" spellcheck="false" />
      </div>`;
  }

  function segmented(
    field: 'font' | 'layout' | 'ogpSize',
    label: string,
    options: ReadonlyArray<readonly [string, string]>,
    current: string,
  ): string {
    const segs = options
      .map(
        ([value, text]) =>
          `<button type="button" role="radio" aria-checked="${value === current}"
            class="seg ${value === current ? 'active' : ''}" data-seg="${field}" data-value="${value}">${text}</button>`,
      )
      .join('');
    return `
      <div class="control">
        <p class="control-label">${label}</p>
        <div class="segmented" role="radiogroup" aria-label="${label}">${segs}</div>
      </div>`;
  }

  function themeButton(): string {
    const icon = themePref === 'light' ? icons.sun : themePref === 'dark' ? icons.moon : icons.auto;
    return `<button type="button" id="theme" class="ghost" aria-label="配色: ${themeLabel(themePref)}">
      ${icon}<span class="ghost-label">${themeLabel(themePref)}</span></button>`;
  }

  function previewBlock(kind: 'meishi' | 'ogp', heading: string, note: string): string {
    const dim = kind === 'meishi' ? '91 × 55 mm' : OGP_DIM_TEXT[card.ogpSize];
    return `
      <article class="proof">
        <div class="proof-head">
          <div>
            <p class="kicker">${heading}</p>
            <p class="proof-dim num">${dim}</p>
          </div>
          <div class="proof-actions">
            <button type="button" class="chip" data-act="svg" data-kind="${kind}">${icons.download}<span>SVG</span></button>
            <button type="button" class="chip" data-act="png" data-kind="${kind}">${icons.image}<span>PNG</span></button>
            <button type="button" class="chip" data-act="copy" data-kind="${kind}">${icons.copy}<span>コピー</span></button>
          </div>
        </div>
        <div class="proof-stage proof-${kind}">
          <div class="preview" data-preview="${kind}"></div>
        </div>
        ${note ? `<p class="hint">${note}</p>` : ''}
      </article>`;
  }

  function render(): void {
    const swatches = ACCENT_PRESETS.map(
      ([c, label]) => `
        <button type="button" class="swatch ${c === card.accent ? 'active' : ''}" data-accent="${c}"
          style="--swatch:${c}" title="${label}" aria-label="アクセント色 ${label}"></button>`,
    ).join('');

    root.innerHTML = `
      <a class="skip-link" href="#editor">編集へ移動</a>
      <header class="masthead">
        <div class="bar">
          <a class="brand" href="#top">${icons.logo}<span>meishi</span></a>
          <nav class="bar-actions">
            <a class="navlink" href="#editor">つくる</a>
            <a class="navlink" href="#spec">仕様</a>
            ${themeButton()}
          </nav>
        </div>
      </header>

      <main id="top">
        <section class="intro">
          <div class="intro-copy reveal">
            <p class="kicker">名刺 ＆ OGP ジェネレータ</p>
            <h1 class="display">ひとつの入力から、名刺とサムネイルを。</h1>
            <p class="lede">
              名前と肩書、連絡先を書き、色を選ぶ。印刷向けの名刺と、サイトに貼る
              1200×630 のOGPが、同じ内容・同じ配色でその場に立ち上がる。文字情報だけの、
              静かな仕上がり。入力はこの端末のブラウザにだけ残る。
            </p>
            <div class="intro-cta">
              <a class="button" href="#editor">${icons.refresh}<span>編集をはじめる</span></a>
              <span class="meta">ログイン不要・サーバー送信なし</span>
            </div>
          </div>
          <div class="intro-stage reveal" aria-hidden="true">
            <img class="desk-photo" src="https://picsum.photos/seed/meishi-atelier/1100/820"
              width="1100" height="820" alt="" loading="lazy" decoding="async" />
            <div class="sample-card">
              <div class="preview" data-preview="meishi"></div>
            </div>
          </div>
        </section>

        <section class="editor" id="editor">
          <div class="section-head reveal">
            <p class="kicker">つくる</p>
            <h2>のせる情報</h2>
            <p class="section-note">空欄にした項目はレイアウトから消える。載せたいものだけを書く。</p>
          </div>
          <div class="workbench">
            <form class="form reveal" autocomplete="off">
              ${field('name', '名前')}
              ${field('sub', '添え書き(ローマ字・読み)', 'Hanako Yamada')}
              ${field('title', '肩書', 'ソフトウェアエンジニア')}
              ${field('org', '所属・屋号', 'yamada.dev')}
              ${field('email', 'メール', 'hanako@example.com')}
              ${field('site', 'サイト', 'https://yamada.dev')}

              <div class="control">
                <p class="control-label">アクセント色</p>
                <div class="swatches" role="group" aria-label="アクセント色">
                  ${swatches}
                  <label class="custom-color" title="自由な色">
                    <input type="color" id="accent-custom" value="${esc(card.accent)}"
                      aria-label="自由なアクセント色" />
                  </label>
                </div>
              </div>

              <div class="control control-inline">
                <label class="switch" for="dark">
                  <input type="checkbox" id="dark" ${card.dark ? 'checked' : ''} />
                  <span>名刺の地色を暗くする</span>
                </label>
              </div>

              ${segmented('font', '書体', FONT_OPTIONS, card.font)}
              ${segmented('layout', '名刺の寄せ方', LAYOUT_OPTIONS, card.layout)}
              ${segmented('ogpSize', 'OGPの寸法', OGP_OPTIONS, card.ogpSize)}

              <div class="form-foot">
                <button type="button" class="chip" id="share">${icons.link}<span>共有リンクをコピー</span></button>
                <button type="button" class="chip" id="reset">${icons.refresh}<span>見本に戻す</span></button>
              </div>
            </form>

            <div class="proofs reveal">
              ${previewBlock('meishi', '名刺', '印刷データの下地。入稿前にアウトライン化が要る場合は保存後に変換する。')}
              ${previewBlock('ogp', 'OGP画像', 'og:image に使うときはPNGに変換して配信する(SVGを直接扱えるサービスは少ない)。')}
            </div>
          </div>
        </section>

        <section class="spec" id="spec">
          <div class="section-head reveal">
            <p class="kicker">仕様</p>
            <h2>出力の決まりごと</h2>
          </div>
          <div class="spec-grid reveal">
            <dl class="spec-list">
              <div><dt>名刺</dt><dd><span class="num">0 0 364 220</span> の viewBox(1mm = 4単位、91×55mm)</dd></div>
              <div><dt>OGP</dt><dd><span class="num">0 0 1200 630</span> の viewBox</dd></div>
              <div><dt>文字</dt><dd>パス化せず <code>text</code> のまま。フォントは表示環境に任せる</dd></div>
              <div><dt>空欄</dt><dd>要素ごと出力しない。プレースホルダは混入しない</dd></div>
              <div><dt>安全性</dt><dd>文字列はすべてXMLエスケープして埋め込む</dd></div>
            </dl>
            <p class="spec-prose">
              SVGで出すのは、入稿前の微調整や後からの文言修正をテキストエディタでも行えるからである。
              顔写真やロゴ画像の配置には対応しない。文字情報だけの構成に絞っている。
            </p>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <p>名刺とOGPのSVGジェネレータ。入力はこの端末のブラウザにだけ保存される。</p>
      </footer>

      <div id="status" class="visually-hidden" role="status" aria-live="polite"></div>`;

    bindEvents();
    applyTheme();
    updatePreviews();
    observeReveal();
  }

  function bindEvents(): void {
    for (const el of root.querySelectorAll<HTMLInputElement>('[data-field]')) {
      el.addEventListener('input', () => {
        const key = el.dataset.field as 'name' | 'sub' | 'title' | 'org' | 'email' | 'site';
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
    root.querySelector<HTMLInputElement>('#accent-custom')?.addEventListener('input', (e) => {
      card.accent = (e.target as HTMLInputElement).value;
      commitAndPreview();
      root.querySelectorAll<HTMLElement>('.swatch.active').forEach((s) => s.classList.remove('active'));
    });
    root.querySelector<HTMLInputElement>('#dark')?.addEventListener('change', (e) => {
      card.dark = (e.target as HTMLInputElement).checked;
      commitAndPreview();
    });

    for (const el of root.querySelectorAll<HTMLButtonElement>('[data-seg]')) {
      el.addEventListener('click', () => {
        const field = el.dataset.seg as 'font' | 'layout' | 'ogpSize';
        const value = el.dataset.value ?? '';
        if (field === 'font') card.font = value as FontChoice;
        else if (field === 'layout') card.layout = value as Layout;
        else card.ogpSize = value as OgpSize;
        store.save(card);
        render();
      });
    }

    for (const el of root.querySelectorAll<HTMLButtonElement>('[data-act]')) {
      el.addEventListener('click', () => {
        const kind = el.dataset.kind as 'meishi' | 'ogp';
        const svg = kind === 'meishi' ? meishiSvg(card) : ogpSvg(card);
        const name = `${kind}.svg`;
        if (el.dataset.act === 'svg') {
          downloadSvg(name, svg);
          status(`${name} を保存しました`);
        } else if (el.dataset.act === 'png') {
          void downloadPng(name, svg, kind === 'meishi' ? 4 : 2);
        } else if (el.dataset.act === 'copy') {
          void copyText(svg).then((ok) => status(ok ? 'SVGをコピーしました' : 'コピーできませんでした'));
        }
      });
    }

    root.querySelector('#share')?.addEventListener('click', () => {
      const url = shareUrl();
      history.replaceState(null, '', url);
      void copyText(url).then((ok) => status(ok ? '共有リンクをコピーしました' : 'コピーできませんでした'));
    });

    root.querySelector('#reset')?.addEventListener('click', () => {
      Object.assign(card, defaultCard());
      store.save(card);
      history.replaceState(null, '', location.pathname);
      render();
      status('見本の内容に戻しました');
    });

    root.querySelector('#theme')?.addEventListener('click', () => {
      themePref = nextThemePref(themePref);
      saveThemePref(localStorage, themePref);
      render();
    });
  }

  let observer: IntersectionObserver | null = null;
  function observeReveal(): void {
    const items = root.querySelectorAll<HTMLElement>('.reveal');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    items.forEach((el) => observer?.observe(el));
  }

  function setupParallax(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let ticking = false;
    const onScroll = (): void => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const p = Math.min(window.scrollY, 900);
        const photo = root.querySelector<HTMLElement>('.desk-photo');
        const sample = root.querySelector<HTMLElement>('.sample-card');
        if (photo) photo.style.transform = `translateY(${p * 0.06}px) scale(1.12)`;
        if (sample) sample.style.setProperty('--py', `${p * -0.035}px`);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  render();
  setupParallax();
}
