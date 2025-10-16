// content.js - remoção agressiva e abrangente das telas finais
(function(){
  'use strict';
  console.log('[YC] content script loaded');

  // CSS abrangente para esconder vários padrões de endscreen/video wall
  const css = `
    /* containers de fullscreen/video wall / grid */
    .ytp-fullscreen-grid-stills-container,
    .ytp-fullscreen-grid-main-content,
    .ytp-fullscreen-grid-still,
    .ytp-modern-videowall-stills-container,
    .ytp-modern-videowall-still,
    .ytp-modern-videowall-still-image,
    .ytp-modern-videowall-still-#,
    /* antigos/sempre úteis */
    #related,
    .ytp-ce-element,
    .ytp-endscreen-content,
    ytd-watch-next-secondary-results-renderer {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    /* thumbs de shorts */
    a#thumbnail[href*="/shorts/"] { display: none !important; }

    /* garantia extra: esconder elementos com nomes que contenham "videowall" ou "grid-still" */
    [class*="videowall"] { display: none !important; }
    [class*="grid-still"] { display: none !important; }
  `;
  let style = document.getElementById('youtube-cleaner-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'youtube-cleaner-style';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
    console.log('[YC] injected CSS');
  } else {
    style.textContent = css;
  }

  // função de remoção mais "força bruta"
  function removeIfMatches(el) {
    if (!el || !(el instanceof Element)) return false;
    const cls = el.className || '';
    // Match por classes exatas detectadas e por substring
    const patterns = [
      'ytp-fullscreen-grid-stills-container',
      'ytp-fullscreen-grid-main-content',
      'ytp-fullscreen-grid-still',
      'ytp-modern-videowall-stills-container',
      'ytp-modern-videowall-still',
      'ytp-modern-videowall-still-image',
      'ytp-ce-element',
      'ytp-endscreen-content',
      'ytd-watch-next-secondary-results-renderer',
      'related' // #related
    ];
    for (const p of patterns) {
      if (cls.includes(p) || (el.id && el.id.includes(p))) {
        el.remove();
        console.log('[YC] removed by pattern:', p, el);
        return true;
      }
    }
    // substrings genéricas
    if (cls.includes('videowall') || cls.includes('grid-still') || cls.includes('stills-container')) {
      el.remove();
      console.log('[YC] removed by substring class:', cls, el);
      return true;
    }
    // thumbnails de short (link)
    if (el.matches && el.matches('a#thumbnail[href*="/shorts/"]')) {
      const parent = el.closest('ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-video-renderer');
      if (parent) { parent.remove(); console.log('[YC] removed short parent'); }
      else { el.remove(); console.log('[YC] removed short thumb'); }
      return true;
    }
    return false;
  }

  function cleanYouTube() {
    try {
      // seletores diretos
      document.querySelectorAll(
        '#related, .ytp-ce-element, .ytp-endscreen-content, ytd-watch-next-secondary-results-renderer, ' +
        '.ytp-fullscreen-grid-stills-container, .ytp-fullscreen-grid-main-content, .ytp-fullscreen-grid-still, ' +
        '.ytp-modern-videowall-stills-container, .ytp-modern-videowall-still'
      ).forEach(el => {
        if (el) {
          el.remove();
          console.log('[YC] removed direct selector:', el);
        }
      });

      // tentativa por classes dinâmicas (varredura mais ampla)
      document.querySelectorAll('div, section, a').forEach(el => {
        removeIfMatches(el);
      });

      // thumbs de shorts por seletor
      document.querySelectorAll('a#thumbnail[href*="/shorts/"]').forEach(el => {
        const parent = el.closest('ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-video-renderer');
        if (parent) { parent.remove(); console.log('[YC] removed short parent'); }
        else { el.remove(); console.log('[YC] removed short thumb'); }
      });

    } catch (err) {
      console.error('[YC] clean error', err);
    }
  }

  // execução inicial
  cleanYouTube();

  // Observer que detecta mutações relevantes (com inspeção de addedNodes)
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue;
        // se o nó ou seus filhos tem qualquer um dos selectores chave, roda limpeza
        if (node.querySelector && (
              node.querySelector('.ytp-endscreen-content') ||
              node.querySelector('.ytp-ce-element') ||
              node.querySelector('#related') ||
              node.querySelector('.ytp-fullscreen-grid-stills-container') ||
              node.querySelector('.ytp-modern-videowall-still') ||
              node.querySelector('a#thumbnail[href*="/shorts/"]')
            )) {
          console.log('[YC] mutation detected relevant node (added)', node);
          cleanYouTube();
          return;
        }
        // checa o próprio node
        if (removeIfMatches(node)) return;
      }
    }
  });
  observer.observe(document.documentElement || document, { childList: true, subtree: true });

  // aguarda o player e adiciona listeners
  const waitPlayer = setInterval(() => {
    const player = document.querySelector('.html5-video-player, #movie_player');
    if (player) {
      clearInterval(waitPlayer);
      console.log('[YC] found player, attaching player observer and listeners');

      // observador do player
      const pObs = new MutationObserver(() => cleanYouTube());
      pObs.observe(player, { childList: true, subtree: true });

      // eventos do elemento <video>
      const video = document.querySelector('video');
      if (video) {
        video.addEventListener('ended', () => {
          console.log('[YC] video ended, cleaning now');
          cleanYouTube();
          // limpeza repetida curta após end (garantia)
          let tries = 0;
          const after = setInterval(() => {
            cleanYouTube();
            tries++;
            if (tries >= 12) clearInterval(after); // cerca de 6s
          }, 500);
        });

        // limpeza nos últimos segundos (fallback)
        video.addEventListener('timeupdate', () => {
          const remain = (video.duration && video.currentTime) ? (video.duration - video.currentTime) : null;
          if (remain !== null && remain <= 3) {
            console.log('[YC] video near end, cleaning (remain s):', remain);
            cleanYouTube();
          }
        });
      }
    }
  }, 500);

  // expõe função para testes
  window.__youtubeCleaner = { cleanYouTube, removeIfMatches };

  console.log('[YC] init complete');
})();
