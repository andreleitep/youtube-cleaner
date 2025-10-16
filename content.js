function cleanYouTube() {
    // Remove vídeos relacionados (sidebar)
    const related = document.querySelector('#related');
    if (related) related.remove();

    // Remove blocos de Shorts da home
    const shortsShelves = document.querySelectorAll('ytd-rich-section-renderer');
    shortsShelves.forEach(el => {
        if (el.innerText.toLowerCase().includes('shorts')) el.remove();
    });

    // Remove vídeos shorts individuais (em grades e recomendações)
    const shortThumbs = document.querySelectorAll('a#thumbnail[href*="/shorts/"]');
    shortThumbs.forEach(el => {
        const parent = el.closest('ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-video-renderer');
        if (parent) parent.remove();
    });

    // Remove sugestões de vídeos ao final dos vídeos (endscreen)
    const endOverlays = document.querySelectorAll('.ytp-ce-element, .ytp-endscreen-content');
    endOverlays.forEach(el => el.remove());

    // Redireciona Shorts abertos diretamente
    if (window.location.pathname.startsWith('/shorts/')) {
        const id = window.location.pathname.split('/')[2];
        if (id) window.location.replace(`https://www.youtube.com/watch?v${id}`);
    }
}

// Executa imediatamente
cleanYouTube();

// Observa mudanças no DOM (SPA = Single Page App)
const observer = new MutationObserver(() => cleanYouTube());
observer.observe(document.body, {childList: true, subtree: true});