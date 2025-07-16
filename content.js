function removeRelated() {
    const related = document.getElementById('related');
    if (related) {
        related.remove();
    }
}

function removeShorts() {
    // Remove blocos de Shorts da home
    const shortsShelf = Array.from(document.querySelectorAll('ytd-rich-section-renderer'));
    shortsShelf.forEach(el => {
        if (el.innerText.includes('Shorts')) {
            el.remove();
        }
    });

    // Remove vídeos shorts individuais (cards) em recomendações
    const thumbnails = document.querySelectorAll('a#thumbnail[href*="/shorts/"]');
    thumbnails.forEach(el => {
        const parent = el.closest('ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-video-renderer');
        if (parent) parent.remove();
    });

    // Redireciona se for um vídeo curto aberto diretamente
    if (window.location.pathname.startsWith('/shorts/')) {
        const id = window.location.pathname.split('/')[2];
        window.location.replace(`https://www.youtube.com/watch?v=${id}`);
    }
}

function removeEndScreens() {
    const overlays = document.querySelectorAll('.ytp-ce-element'); // elementos de "cards" finais
    overlays.forEach(el => el.remove());

    const endScreenContainer = document.querySelector('.ytp-endscreen-content');
    if (endScreenContainer) endScreenContainer.remove();
}

// Tenta remover imediatamente
removeRelated();
removeShorts();
removeEndScreens();

// Reaplica a cada 1 segundo (porque o YouTube é SPA e recarrega dinamicamente)
setInterval(() => {
    removeRelated();
    removeShorts();
    removeEndScreens();
}, 1000);