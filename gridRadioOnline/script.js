// ====================================
// GRID RÁDIO ONLINE — SCRIPT PRINCIPAL
// ====================================

function fixEmailLinksIn(container) {
    if (!container || typeof container.querySelectorAll !== 'function') return;
    const emailLinks = container.querySelectorAll('a[href^="mailto:"]');
    emailLinks.forEach((link) => {
        link.setAttribute('rel', 'noopener noreferrer');
    });
}

// =========================
// EFEITO DA IMAGEM DO HERO
// =========================
document.addEventListener('DOMContentLoaded', function() {
    fixEmailLinksIn(document);

    const heroSection = document.getElementById('hero-section');
    const backToTopBtn = document.getElementById('backToTopBtn');

    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        if (heroSection) {
            heroSection.classList.toggle('scrolled', scrolled > 50);
        }
        if (backToTopBtn) {
            backToTopBtn.classList.toggle('visible', scrolled > 400);
        }
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});

// ===================================
// CONFIGURAÇÕES DE SEGURANÇA
// ===================================
const SECURITY_CONFIG = {
    ALLOWED_PROTOCOLS: ['http:', 'https:'],
    ALLOWED_AUDIO_DOMAINS: [
        'cast.streamhosting.rs', 's2.voscast.com', 'streaming.radio.co',
        'stream.zeno.fm', 'live.hunter.fm', 'icecast-fan.musicradio.com',
        'live.stream', 'stream.host', 'stream.serv', 'stream.audio', 'stream.radio'
    ],
    BLOCKED_DOMAINS: ['script', 'virus', 'malware', 'bad', 'evil', 'spam', 'ad', 'tracker', 'analytic', 'miner'],
    SUSPICIOUS_PATTERNS: [/(\.exe|\.js|\.php|\.cgi|\.pl)$/i, /eval\(|Function\(|document\.write/i]
};

// ==================
// VARIÁVEIS GLOBAIS
// ==================
const API_BASE = "https://de1.api.radio-browser.info/json";
const radiosContainer = document.getElementById("radios");
const favoritesList   = document.getElementById("favoritesList");
const historyList     = document.getElementById("historyList");
const nowPlaying      = document.getElementById("nowPlaying");
const playerSubtitle  = document.getElementById("playerSubtitle");
const playerCover     = document.getElementById("playerCover");
const securityWarning = document.getElementById("securityWarning");
const searchInput     = document.getElementById("searchInput");
const searchBtn       = document.getElementById("searchBtn");
const countrySelect   = document.getElementById("countrySelect");
const genreSelect     = document.getElementById("genreSelect");
const genreSearchInput= document.getElementById("genreSearchInput");
const genreResultsList= document.getElementById("genreResultsList");
const filtersModal    = document.getElementById("filtersModal");
const favoritesModal  = document.getElementById("favoritesModal");
const historyModal    = document.getElementById("historyModal");
const pageModal       = document.getElementById("pageModal");
const pageContent     = document.getElementById("pageContent");
const openFilters     = document.getElementById("openFilters");
const openFavorites   = document.getElementById("openFavorites");
const openHistory     = document.getElementById("openHistory");
const closeFilters    = document.getElementById("closeFilters");
const closeFavorites  = document.getElementById("closeFavorites");
const closeHistory    = document.getElementById("closeHistory");
const closePageModal  = document.getElementById("closePageModal");
const themeToggle     = document.getElementById("themeToggle");
const toggleFavorite  = document.getElementById("toggleFavorite");
const playPauseBtn    = document.getElementById("playPauseBtn");
const notification    = document.getElementById("notification");
const tabs            = document.querySelectorAll('.tab');
const tabContents     = document.querySelectorAll('.tab-content');
const loadMoreBtn     = document.getElementById('loadMoreBtn');
const securityStatusEl= document.getElementById("securityStatus");
const playerFixedEl   = document.querySelector('.player-fixed');

// =============================
// VARIÁVEIS DE ESTADO
// =============================
let allGenreTags = [];
let page = 1;
let loading = false;
let currentQuery = "";
let currentCountry = "";
let currentTag = "";
let currentRadio = null;
let favorites = [];
let history = [];
let isPlaying = false;
let progressInterval;
let hasMoreResults = true;
let audioErrorCount = 0;
const MAX_AUDIO_ERRORS = 3;
let isUserInteraction = false;
let retryTimeout = null;
let isClosingPlayer = false;
let isPageHidden = false;

const audioPlayer = new Audio();
audioPlayer.volume = 0.8;

const MUSIC_ICON_SVG = 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'>
        <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'/>
    </svg>
`);

const DEFAULT_ICON = 'https://cdn-icons-png.flaticon.com/512/727/727245.png';

// ============================================================
// GÊNEROS CURADOS — garante que gêneros importantes apareçam
// mesmo que a API não os retorne na lista padrão (ex.: gospel,
// christian/cristã, sertanejo, etc.) e adiciona sinônimos para
// a busca rápida funcionar com abreviações (gos, chris, cristã...).
// ============================================================
const CURATED_GENRES = [
    // ----- Gospel / Cristã -----
    { tag: 'gospel',    display: 'Gospel',              terms: ['gospel','gospe','gos','evangelico','evangélico','evangelho','adoracao','adoração'] },
    { tag: 'christian', display: 'Cristã / Christian',  terms: ['christian','chris','chr','crista','cristã','cristao','cristão','cristianismo'] },
    { tag: 'worship',   display: 'Worship / Adoração',  terms: ['worship','adoracao','adoração','louvor'] },

    // ----- Brasileiros -----
    { tag: 'sertanejo',               display: 'Sertanejo',                  terms: ['sertanejo','sertanej','serta'] },
    { tag: 'sertanejo universitario', display: 'Sertanejo Universitário',    terms: ['sertanejo universitario','universitario'] },
    { tag: 'forro',                   display: 'Forró',                      terms: ['forro','forró','forrozeiro'] },
    { tag: 'mpb',                     display: 'MPB',                        terms: ['mpb','musica popular brasileira'] },
    { tag: 'samba',                   display: 'Samba',                      terms: ['samba','samb'] },
    { tag: 'pagode',                  display: 'Pagode',                     terms: ['pagode','pagod'] },
    { tag: 'funk',                    display: 'Funk',                       terms: ['funk','funk carioca'] },
    { tag: 'axe',                     display: 'Axé',                        terms: ['axe','axé'] },
    { tag: 'arrocha',                 display: 'Arrocha',                    terms: ['arrocha','arroc'] },
    { tag: 'pisadinha',               display: 'Pisadinha',                  terms: ['pisadinha','pisad'] },
    { tag: 'bossa nova',              display: 'Bossa Nova',                 terms: ['bossa','bossa nova','bossanova'] },
    { tag: 'brega',                   display: 'Brega',                      terms: ['brega'] },

    // ----- Jazz / Blues / Soul -----
    { tag: 'jazz',        display: 'Jazz',        terms: ['jazz','jaz'] },
    { tag: 'blues',       display: 'Blues',       terms: ['blues','blu'] },
    { tag: 'soul',        display: 'Soul',        terms: ['soul'] },
    { tag: 'smooth jazz', display: 'Smooth Jazz', terms: ['smooth jazz'] },
    { tag: 'rnb',         display: 'R&B',         terms: ['rnb','r&b','rhythm and blues'] },

    // ----- Latino / Caribenho -----
    { tag: 'reggae',    display: 'Reggae',    terms: ['reggae','regga'] },
    { tag: 'reggaeton', display: 'Reggaeton', terms: ['reggaeton','regueton'] },
    { tag: 'salsa',     display: 'Salsa',     terms: ['salsa'] },
    { tag: 'bachata',   display: 'Bachata',   terms: ['bachata'] },
    { tag: 'latin',     display: 'Latina',    terms: ['latin','latina','latino'] },
    { tag: 'vallenato', display: 'Vallenato (Colômbia)', terms: ['vallenato'] },
    { tag: 'cumbia',    display: 'Cumbia',    terms: ['cumbia'] },

    // ----- Pop / Rock / Alternativo -----
    { tag: 'rock',        display: 'Rock',        terms: ['rock','roc'] },
    { tag: 'pop',         display: 'Pop',         terms: ['pop'] },
    { tag: 'indie',       display: 'Indie',       terms: ['indie','indi'] },
    { tag: 'alternative', display: 'Alternativo', terms: ['alternative','alternativo'] },
    { tag: 'punk',        display: 'Punk',        terms: ['punk'] },
    { tag: 'metal',       display: 'Metal',       terms: ['metal'] },
    { tag: 'hard rock',   display: 'Hard Rock',   terms: ['hard rock'] },
    { tag: 'top40',       display: 'Top 40 / Pop Charts', terms: ['top40','top 40','top'] },

    // ----- Eletrônica / Dance -----
    { tag: 'electronic', display: 'Música Eletrônica', terms: ['electronic','eletronica','eletrônica','electronica'] },
    { tag: 'dance',      display: 'Dance',      terms: ['dance','danc'] },
    { tag: 'house',      display: 'House',      terms: ['house'] },
    { tag: 'techno',     display: 'Techno',     terms: ['techno'] },
    { tag: 'trance',     display: 'Trance',     terms: ['trance'] },
    { tag: 'edm',        display: 'EDM',        terms: ['edm','electronic dance'] },
    { tag: 'dubstep',    display: 'Dubstep',    terms: ['dubstep'] },
    { tag: 'disco',      display: 'Disco',      terms: ['disco'] },

    // ----- Asiáticos -----
    { tag: 'kpop', display: 'K-Pop', terms: ['kpop','k-pop','k pop'] },
    { tag: 'jpop', display: 'J-Pop', terms: ['jpop','j-pop','j pop'] },
    { tag: 'anime', display: 'Anime / Trilhas', terms: ['anime','otaku'] },

    // ----- Clássico / Instrumental -----
    { tag: 'classical',    display: 'Música Clássica', terms: ['classical','classica','clássica'] },
    { tag: 'opera',        display: 'Ópera',           terms: ['opera','ópera'] },
    { tag: 'instrumental', display: 'Instrumental',    terms: ['instrumental'] },
    { tag: 'lounge',       display: 'Lounge',          terms: ['lounge'] },
    { tag: 'chillout',     display: 'Chillout',        terms: ['chillout','chill out','chill'] },
    { tag: 'ambient',      display: 'Ambient',         terms: ['ambient'] },

    // ----- Décadas / Nostalgia -----
    { tag: 'oldies',    display: 'Clássicos (Oldies)', terms: ['oldies','classicos','clássicos'] },
    { tag: 'flashback', display: 'Flashback',          terms: ['flashback'] },
    { tag: '60s', display: 'Anos 60', terms: ['60s','anos 60'] },
    { tag: '70s', display: 'Anos 70', terms: ['70s','anos 70'] },
    { tag: '80s', display: 'Anos 80', terms: ['80s','anos 80'] },
    { tag: '90s', display: 'Anos 90', terms: ['90s','anos 90'] },
    { tag: '2000s', display: 'Anos 2000', terms: ['2000s','anos 2000'] },

    // ----- Variedades / Outros -----
    { tag: 'country',   display: 'Country',           terms: ['country','countr'] },
    { tag: 'hip hop',   display: 'Hip Hop',           terms: ['hip hop','hip-hop','hiphop','hip'] },
    { tag: 'rap',       display: 'Rap',               terms: ['rap'] },
    { tag: 'romantic',  display: 'Romântica',         terms: ['romantic','romantica','romântica'] },
    { tag: 'kids',      display: 'Infantil',          terms: ['kids','infantil','criancas','crianças'] },
    { tag: 'news',      display: 'Notícias/Debate',   terms: ['news','noticias','notícias','talk'] },
    { tag: 'sports',    display: 'Esportes',          terms: ['sports','esportes','sport'] },
    { tag: 'varied',    display: 'Variedades',        terms: ['varied','variedades','variety'] },
];

// ============================
// THEME-COLOR DINÂMICO
// ============================
const THEME_COLORS = {
  dark:  { idle: '#0a0b0f', playing: '#00b4d8', paused: '#7b2fbe' },
  light: { idle: '#f2f6ff', playing: '#0077b6', paused: '#6a2b9e' }
};

function updateThemeColor(state = 'idle') {
  const meta = document.getElementById('themeColor');
  if (!meta) return;
  const theme = document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const color = (THEME_COLORS[theme] && THEME_COLORS[theme][state]) || THEME_COLORS[theme].idle;
  meta.setAttribute('content', color);
  meta.content = color;
}

// =====================
// UTILITÁRIOS
// =====================
function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function secureLocalStorageSet(key, value) {
    try {
        if (Array.isArray(value)) {
            const serializableValue = value.map(item => {
                const simple = {
                    name: item.name || '',
                    url: item.url || '',
                    favicon: item.favicon || '',
                    country: item.country || '',
                    tags: item.tags || ''
                };
                if (item.date) simple.date = item.date;
                return simple;
            });
            localStorage.setItem(key, JSON.stringify(serializableValue));
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
        try {
            localStorage.clear();
            if (Array.isArray(value)) {
                const trimmed = value.slice(0, 10).map(item => ({
                    name: item.name || '', url: item.url || '', favicon: item.favicon || '',
                    country: item.country || '', tags: item.tags || ''
                }));
                localStorage.setItem(key, JSON.stringify(trimmed));
            }
        } catch (e) { console.error('Falha ao limpar localStorage:', e); }
    }
}

function secureLocalStorageGet(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return defaultValue;
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
            return parsed.map(item => {
                if (typeof item !== 'object' || item === null) return null;
                const sanitized = sanitizeRadioData({
                    name: item.name || '', url: item.url || '', favicon: item.favicon || '',
                    country: item.country || '', tags: item.tags || ''
                });
                if (item.date) sanitized.date = item.date;
                return sanitized;
            }).filter(item => item !== null && item.url);
        }
        return parsed;
    } catch (error) {
        console.error('Erro ao recuperar do localStorage:', error);
        try { localStorage.removeItem(key); } catch (e) {}
        return defaultValue;
    }
}

function validateURL(url) {
    try {
        const urlObj = new URL(url);
        if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) return false;
        for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
            if (pattern.test(url)) return false;
        }
        const domain = urlObj.hostname.toLowerCase();
        for (const blocked of SECURITY_CONFIG.BLOCKED_DOMAINS) {
            if (domain.includes(blocked)) return false;
        }
        return true;
    } catch { return false; }
}

function isSafeAudioURL(url) {
    if (!validateURL(url)) return false;
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase();
        for (const allowed of SECURITY_CONFIG.ALLOWED_AUDIO_DOMAINS) {
            if (domain.includes(allowed)) return true;
        }
        if (domain === 'localhost' || domain === '127.0.0.1' || urlObj.protocol === 'data:') return true;
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
            const path = urlObj.pathname.toLowerCase();
            if (/\.(mp3|ogg|wav|aac|m3u|pls)$/.test(path) ||
                path.includes('/stream') || path.includes('/live') || path.includes('/radio')) {
                return true;
            }
        }
        return false;
    } catch { return false; }
}

function sanitizeRadioData(radio) {
    if (!radio || typeof radio !== 'object') {
        return { name: 'Rádio Desconhecida', url: '', favicon: DEFAULT_ICON, country: 'Desconhecido', tags: 'Sem Gênero' };
    }
    const name = sanitizeHTML(radio.name) || 'Rádio Desconhecida';
    const url = radio.url || '';
    let favicon = DEFAULT_ICON;

    if (radio.favicon && typeof radio.favicon === 'string') {
        const f = radio.favicon.trim();
        if (f.length > 5 && !f.includes('undefined') && !f.includes('null') &&
            f !== 'https://' && f !== 'http://' && f !== MUSIC_ICON_SVG) {
            if (f.startsWith('//')) favicon = 'https:' + f;
            else if (f.startsWith('http')) favicon = f;
            else if (f.startsWith('/')) {
                try {
                    if (radio.url) {
                        const u = new URL(radio.url);
                        favicon = u.protocol + '//' + u.hostname + f;
                    }
                } catch { favicon = DEFAULT_ICON; }
            }
        }
    }
    return {
        name,
        url,
        favicon,
        country: sanitizeHTML(radio.country) || 'Desconhecido',
        tags: sanitizeHTML(radio.tags) || 'Sem Gênero'
    };
}

function getRadioImageHTML(radioData, size = 'normal') {
    const sizes = {
        normal: { width: 90, height: 90, padding: '15px' },
        small:  { width: 50, height: 50, padding: '8px' },
        player: { width: 60, height: 60, padding: '0' }
    };
    const cfg = sizes[size] || sizes.normal;
    const isDefaultIcon = !radioData.favicon ||
        radioData.favicon === DEFAULT_ICON ||
        radioData.favicon === MUSIC_ICON_SVG ||
        radioData.favicon.includes('undefined') ||
        radioData.favicon.includes('null') ||
        radioData.favicon.includes('data:image/svg+xml');

    if (isDefaultIcon) {
        return `
            <img src="${MUSIC_ICON_SVG}"
                 alt="${radioData.name} logo"
                 class="radio-icon-default ${size === 'player' ? 'player-cover' : ''}"
                 width="${cfg.width}" height="${cfg.height}"
                 style="border-radius:50%;border:${size==='player'?'2px':'3px'} solid var(--accent-primary);
                        background:var(--accent-gradient);object-fit:cover;padding:0;
                        min-width:${cfg.width}px;min-height:${cfg.height}px;display:block;flex-shrink:0;"
                 onerror="this.onerror=null; this.src='${MUSIC_ICON_SVG}'; this.classList.add('radio-icon-default');">
        `;
    }
    return `
        <img src="${radioData.favicon}"
             alt="${radioData.name} logo"
             class="${size === 'player' ? 'player-cover' : ''}"
             width="${cfg.width}" height="${cfg.height}"
             style="border-radius:50%;border:${size==='player'?'2px':'3px'} solid var(--accent-primary);
                    object-fit:cover;padding:0;min-width:${cfg.width}px;min-height:${cfg.height}px;
                    display:block;flex-shrink:0;"
             onerror="this.onerror=null; this.src='${MUSIC_ICON_SVG}'; this.classList.add('radio-icon-default'); this.style.background='var(--accent-gradient)';">
    `;
}

function cleanGenreName(tagName) {
    if (!tagName) return '';
    const map = {
        // já existentes
        rockpop: 'Rock & Pop',
        electronic: 'Música Eletrônica',
        dancepop: 'Dance Pop',
        classical: 'Música Clássica',
        oldies: 'Clássicos (Oldies)',
        talk: 'Notícias/Debate',
        christian: 'Gospel / Cristã',
        top40: 'Top 40 / Pop Charts',
        '90s': 'Anos 90',
        '80s': 'Anos 80',
        '70s': 'Anos 70',
        '60s': 'Anos 60',
        '2000s': 'Anos 2000',
        vallenato: 'Vallenato (Colômbia)',

        // novos
        gospel: 'Gospel',
        worship: 'Worship / Adoração',
        sertanejo: 'Sertanejo',
        'sertanejo universitario': 'Sertanejo Universitário',
        forro: 'Forró',
        mpb: 'MPB',
        samba: 'Samba',
        pagode: 'Pagode',
        funk: 'Funk',
        axe: 'Axé',
        arrocha: 'Arrocha',
        pisadinha: 'Pisadinha',
        'bossa nova': 'Bossa Nova',
        brega: 'Brega',
        jazz: 'Jazz',
        blues: 'Blues',
        soul: 'Soul',
        'smooth jazz': 'Smooth Jazz',
        rnb: 'R&B',
        reggae: 'Reggae',
        reggaeton: 'Reggaeton',
        salsa: 'Salsa',
        bachata: 'Bachata',
        latin: 'Latina',
        cumbia: 'Cumbia',
        rock: 'Rock',
        pop: 'Pop',
        indie: 'Indie',
        alternative: 'Alternativo',
        punk: 'Punk',
        metal: 'Metal',
        'hard rock': 'Hard Rock',
        dance: 'Dance',
        house: 'House',
        techno: 'Techno',
        trance: 'Trance',
        edm: 'EDM',
        dubstep: 'Dubstep',
        disco: 'Disco',
        kpop: 'K-Pop',
        jpop: 'J-Pop',
        anime: 'Anime / Trilhas',
        opera: 'Ópera',
        instrumental: 'Instrumental',
        lounge: 'Lounge',
        chillout: 'Chillout',
        ambient: 'Ambient',
        flashback: 'Flashback',
        country: 'Country',
        'hip hop': 'Hip Hop',
        rap: 'Rap',
        romantic: 'Romântica',
        kids: 'Infantil',
        news: 'Notícias/Debate',
        sports: 'Esportes',
        varied: 'Variedades'
    };
    const norm = tagName.toLowerCase();
    if (map[norm]) return map[norm];
    return tagName.replace(/[-_]/g, ' ').toLowerCase()
        .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function updateButtonCounters() {
    try {
        const favCount = Array.isArray(favorites) ? favorites.length : 0;
        const histCount = Array.isArray(history) ? history.length : 0;

        const favBtn = document.getElementById('openFavorites');
        if (favBtn) {
            let badge = favBtn.querySelector('.badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge';
                badge.id = 'favoritesBadge';
                favBtn.appendChild(badge);
            }
            badge.textContent = favCount > 99 ? '99+' : favCount.toString();
            badge.setAttribute('data-count', favCount);
            badge.style.display = favCount > 0 ? 'flex' : 'none';
        }

        const histBtn = document.getElementById('openHistory');
        if (histBtn) {
            let badge = histBtn.querySelector('.badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge';
                badge.id = 'historyBadge';
                histBtn.appendChild(badge);
            }
            badge.textContent = histCount > 99 ? '99+' : histCount.toString();
            badge.setAttribute('data-count', histCount);
            badge.style.display = histCount > 0 ? 'flex' : 'none';
        }
    } catch (error) { console.error('Erro ao atualizar contadores:', error); }
}

// ==================
// CONTROLE DE ÁUDIO
// ==================

document.addEventListener('visibilitychange', () => {
    isPageHidden = document.hidden;
    if (!isPageHidden) {
        audioErrorCount = 0;
    }
});

function setupAudioEventListeners() {
    audioPlayer.onerror = null;
    audioPlayer.onended = null;
    audioPlayer.addEventListener('error', handleAudioError);
    audioPlayer.addEventListener('ended', handleAudioEnded);
    audioPlayer.addEventListener('canplay', handleAudioCanPlay);
    audioPlayer.addEventListener('stalled', handleAudioStalled);
    audioPlayer.addEventListener('waiting', handleAudioWaiting);
}

function startAudioHealthCheck() {
    stopAudioHealthCheck();
    let lastTimeUpdate = Date.now();
    let silenceDetected = false;

    audioPlayer.ontimeupdate = () => {
        lastTimeUpdate = Date.now();
        if (silenceDetected) {
            silenceDetected = false;
            showNotification("Conexão restaurada", "success");
        }
    };

    audioPlayer.healthCheckInterval = setInterval(() => {
        if (isPageHidden) {
            lastTimeUpdate = Date.now();
            return;
        }
        if (isPlaying) {
            const since = Date.now() - lastTimeUpdate;
            if (since > 10000 && !audioPlayer.ended && !silenceDetected) {
                silenceDetected = true;
                showNotification("Problema na conexão, tentando reconectar...", "warning");
                attemptAudioRecovery();
            }
        }
    }, 5000);
}

function stopAudioHealthCheck() {
    if (audioPlayer.healthCheckInterval) {
        clearInterval(audioPlayer.healthCheckInterval);
        audioPlayer.healthCheckInterval = null;
    }
    audioPlayer.ontimeupdate = null;
}

function attemptAudioRecovery() {
    if (!currentRadio || audioErrorCount >= MAX_AUDIO_ERRORS) {
        showNotification("Muitos erros na conexão. Tente outra rádio.", "error");
        pauseAudio();
        return;
    }
    audioErrorCount++;
    audioPlayer.pause();
    const newAudio = new Audio();
    newAudio.src = audioPlayer.src;
    newAudio.volume = audioPlayer.volume;
    audioPlayer.src = '';
    if (audioPlayer.parentNode) audioPlayer.parentNode.removeChild(audioPlayer);
    window.audioPlayer = newAudio;
    setupAudioEventListeners();
    setTimeout(() => { if (currentRadio) playAudio(); }, 1000);
}

function handleAudioError(error) {
    if (isClosingPlayer) return;
    
    if (isPageHidden) return;

    console.error("Erro no player de áudio:", error);
    audioErrorCount++;
    if (audioErrorCount >= MAX_AUDIO_ERRORS) {
        showNotification("Muitos erros na conexão. Tente outra rádio.", "error");
        pauseAudio();
    } else {
        showNotification("Problema na conexão, tentando novamente...", "warning");
        setTimeout(() => { if (currentRadio && isPlaying) attemptAudioRecovery(); }, 2000);
    }
}

function handleAudioEnded() {
    if (isClosingPlayer) return;
    if (isPlaying) {
        showNotification("Transmissão encerrada", "info");
        pauseAudio();
    }
}

function handleAudioCanPlay() { audioErrorCount = 0; }
function handleAudioStalled() {
    if (isClosingPlayer) return;
    if (isPageHidden) return;
    if (isPlaying) {
        showNotification("Conexão instável...", "warning");
        attemptAudioRecovery();
    }
}
function handleAudioWaiting() {}

function playAudio() {
    playerFixedEl.classList.remove('hidden');
    isUserInteraction = true;

    audioPlayer.play().then(() => {
        isPlaying = true;
        audioErrorCount = 0;
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playerFixedEl.classList.add('playing');
        updateThemeColor('playing');
        updateRadioCards();
        nowPlaying.textContent = currentRadio.name;

        if (!document.getElementById('closePlayerBtn')) addPlayerCloseButton();

        startAudioHealthCheck();
    }).catch(error => {
        if (isClosingPlayer) return;
        console.error("Erro ao tentar tocar a rádio:", error);
        if (error.name === "NotAllowedError") {
            showNotification("Clique no botão Play para iniciar a reprodução", "warning");
            isPlaying = false;
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            playerFixedEl.classList.remove('playing');
        } else {
            handleAudioError(error);
        }
    });
}

function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    playerFixedEl.classList.remove('playing');
    updateThemeColor('paused');
    stopAudioHealthCheck();
    updateRadioCards();

    if (retryTimeout) { clearTimeout(retryTimeout); retryTimeout = null; }
}

function togglePlayPause() {
    if (isPlaying) pauseAudio();
    else if (currentRadio) { isUserInteraction = true; playAudio(); }
    else showNotification("Selecione uma rádio para começar a ouvir.", "warning");
}

function playRadio(name, url, favicon, country, tags) {
    if (retryTimeout) { clearTimeout(retryTimeout); retryTimeout = null; }
    stopAudioHealthCheck();
    if (isPlaying) pauseAudio();

    const sanitizedRadio = sanitizeRadioData({ name, url, favicon, country, tags });
    audioErrorCount = 0;
    currentRadio = sanitizedRadio;
    audioPlayer.src = url;
    setupAudioEventListeners();

    const existingIndex = history.findIndex(item => item.url === url);
    if (existingIndex !== -1) history.splice(existingIndex, 1);

    const historyItem = { ...sanitizedRadio, url, date: new Date().toISOString() };
    history.unshift(historyItem);
    if (history.length > 100) history.pop();

    secureLocalStorageSet('history', history);
    updateHistoryUI();
    updateButtonCounters();

    nowPlaying.textContent = sanitizedRadio.name;
    playerSubtitle.textContent = `${sanitizedRadio.country} • ${cleanGenreName(sanitizedRadio.tags)}`;

    const playerInfo = document.querySelector('.player-info');
    if (playerInfo) {
        const oldCover = document.getElementById('playerCover');
        if (oldCover) oldCover.remove();

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = getRadioImageHTML(sanitizedRadio, 'player');
        const imgElement = tempDiv.firstElementChild;
        imgElement.id = 'playerCover';
        imgElement.classList.add('player-cover');

        playerInfo.insertBefore(imgElement, playerInfo.firstChild);
    }

    updateSecurityStatus(url);
    updateFavoriteButton();

    setTimeout(() => {
        try { playAudio(); }
        catch (error) {
            console.error('Erro ao configurar áudio:', error);
            showNotification("Erro ao configurar reprodução", "error");
        }
    }, 500);
}

// ===================
// FETCH DE RÁDIOS
// ===================
function renderRadiosFromCache(radios) {
    if (!radios || radios.length === 0) {
        radiosContainer.innerHTML = "<p style='text-align:center; padding: 20px;'> Nenhuma rádio encontrada.</p>";
        return;
    }
    const html = radios.map(r => {
        const sanitized = sanitizeRadioData({
            name: r.name, url: r.url_resolved || r.url,
            favicon: r.favicon, country: r.country, tags: r.tags
        });
        const isFavorite = favorites.some(fav => fav.url === sanitized.url);
        const isCurrent  = currentRadio && currentRadio.url === sanitized.url;

        return `
            <div class="radio-card ${isFavorite ? 'favorite' : ''} ${isCurrent ? 'playing' : ''}"
                 onclick="playRadio('${(r.name || 'Rádio').replace(/'/g, "\\'")}', '${(r.url_resolved || r.url || '').replace(/'/g, "\\'")}', '${(r.favicon || '').replace(/'/g, "\\'")}', '${(r.country || '').replace(/'/g, "\\'")}', '${(r.tags || '').replace(/'/g, "\\'")}')">
                ${getRadioImageHTML(sanitized, 'normal')}
                <h3>${sanitized.name}</h3>
                <small>${sanitized.country} - ${cleanGenreName(sanitized.tags)}</small>
                <div class="progress-container">
                    <div class="progress-bar" style="width:${isCurrent && isPlaying ? '50%' : '0%'}"></div>
                </div>
            </div>
        `;
    }).join("");

    radiosContainer.innerHTML = html;
    page = 2;
    hasMoreResults = radios.length === 100;
    updateLoadMoreButton();
}

async function fetchRadios(query = "", country = "", tag = "", append = false) {
    if (loading) return;
    loading = true;

    if (!append) {
        radiosContainer.innerHTML = "<div class='loading-text'><div class='loader'></div> Carregando rádios...</div>";
        page = 1;
        hasMoreResults = true;
        updateLoadMoreButton();
    } else {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<div class="loader"></div> Carregando...';
    }

    let endpoint = `${API_BASE}/stations/search?limit=100&offset=${(page - 1) * 100}&hidebroken=true`;
    if (query) endpoint += `&name=${encodeURIComponent(query)}`;
    if (country) endpoint += `&country=${encodeURIComponent(country)}`;
    if (tag) endpoint += `&tag=${encodeURIComponent(tag)}`;
    endpoint += `&order=votes&reverse=true`;

    try {
        const res = await fetch(endpoint);
        const radios = await res.json();

        if (!radios.length) {
            if (!append) radiosContainer.innerHTML = "<p style='text-align:center; padding: 20px;'> Nenhuma rádio encontrada.</p>";
            hasMoreResults = false;
            updateLoadMoreButton();
            loading = false;
            return;
        }

        hasMoreResults = radios.length === 100;

        if (!append && query === "" && country === "" && tag === "") {
            try { sessionStorage.setItem('cachedRadios', JSON.stringify(radios)); } catch {}
        }

        const html = radios.map(r => {
            const sanitized = sanitizeRadioData({
                name: r.name, url: r.url_resolved, favicon: r.favicon,
                country: r.country, tags: r.tags
            });
            const isFavorite = favorites.some(fav => fav.url === sanitized.url);
            const isCurrent  = currentRadio && currentRadio.url === sanitized.url;

            return `
                <div class="radio-card ${isFavorite ? 'favorite' : ''} ${isCurrent ? 'playing' : ''}"
                     onclick="playRadio('${(r.name || 'Rádio').replace(/'/g, "\\'")}', '${(r.url_resolved || '').replace(/'/g, "\\'")}', '${(r.favicon || '').replace(/'/g, "\\'")}', '${(r.country || '').replace(/'/g, "\\'")}', '${(r.tags || '').replace(/'/g, "\\'")}')">
                    ${getRadioImageHTML(sanitized, 'normal')}
                    <h3>${sanitized.name}</h3>
                    <small>${sanitized.country} - ${cleanGenreName(sanitized.tags)}</small>
                    <div class="progress-container">
                        <div class="progress-bar" style="width:${isCurrent && isPlaying ? '50%' : '0%'}"></div>
                    </div>
                </div>
            `;
        }).join("");

        if (append) radiosContainer.insertAdjacentHTML('beforeend', html);
        else radiosContainer.innerHTML = html;

        page++;
    } catch (err) {
        console.error("Erro ao buscar rádios:", err);
        if (!append) radiosContainer.innerHTML = "<p style='text-align:center; padding: 20px; color: var(--error-color);'> Erro ao carregar as rádios.</p>";
        else showNotification("Erro ao carregar mais rádios.", "error");
    } finally {
        loading = false;
        updateLoadMoreButton();
    }
}

function updateLoadMoreButton() {
    const isAllTabActive = document.querySelector('.tab[data-tab="all"]')?.classList.contains('active');
    if (loading) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<div class="loader"></div> Carregando...';
        loadMoreBtn.classList.remove('hidden');
    } else if (hasMoreResults && isAllTabActive && page > 1) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Ver mais rádios';
        loadMoreBtn.classList.remove('hidden');
    } else {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = 'Fim da lista';
        loadMoreBtn.classList.add('hidden');
    }
}

function updateSecurityStatus(url) {
    const isSafe = isSafeAudioURL(url);
    if (isSafe) {
        securityStatusEl.innerHTML = '<i class="fas fa-check-circle"></i> Link Seguro';
        securityStatusEl.className = 'security-status secure';
    } else {
        securityStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Stream não verificado';
        securityStatusEl.className = 'security-status warning';
    }
}

// ===========================
// FAVORITOS
// ===========================
function toggleFavoriteRadio() {
    if (!currentRadio) return;
    const index = favorites.findIndex(fav => fav.url === currentRadio.url);
    if (index === -1) {
        favorites.push(currentRadio);
        showNotification("Rádio adicionada aos favoritos", "success");
        toggleFavorite.innerHTML = '<i class="fas fa-star"></i>';
    } else {
        favorites.splice(index, 1);
        showNotification("Rádio removida dos favoritos", "success");
        toggleFavorite.innerHTML = '<i class="far fa-star"></i>';
    }
    secureLocalStorageSet('favorites', favorites);
    updateFavoritesUI();
    updateRadioCards();
    updateButtonCounters();
}

function updateFavoriteButton() {
    if (!currentRadio) return;
    const isFav = favorites.some(fav => fav.url === currentRadio.url);
    toggleFavorite.innerHTML = isFav ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
}

function updateFavoritesUI() {
    if (!favoritesList) return;

    if (favorites.length === 0) {
        favoritesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>Nenhuma rádio favorita ainda.</p>
                <small>Toque na estrela do player para adicionar.</small>
            </div>`;
        return;
    }

    const header = `
        <div class="list-header">
            <span class="list-count">
                <i class="fas fa-star"></i>
                ${favorites.length} rádio${favorites.length !== 1 ? 's' : ''}
            </span>
            <button class="btn-clear-all"
                    onclick="showConfirmationModal('clearFavorites')"
                    title="Remover todas as rádios favoritas">
                <i class="fas fa-trash"></i> Remover todas
            </button>
        </div>
    `;

    const html = favorites.map(radio => {
        const isCurrent = currentRadio && currentRadio.url === radio.url;
        const displayTags = cleanGenreName(radio.tags);
        const safeUrl = radio.url.replace(/'/g, "\\'");

        return `
            <div class="radio-card favorite ${isCurrent ? 'playing' : ''}"
                 onclick="playRadio('${radio.name.replace(/'/g, "\\'")}', '${safeUrl}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                ${getRadioImageHTML(radio, 'normal')}
                <h3>${radio.name}</h3>
                <small>${radio.country} - ${displayTags}</small>
                <button class="btn-remove"
                        onclick="event.stopPropagation(); showConfirmationModal('removeFavorite', '${safeUrl}')"
                        aria-label="Remover rádio dos favoritos">
                    <i class="fas fa-trash"></i> Remover
                </button>
                <div class="progress-container">
                    <div class="progress-bar" style="width:${isCurrent && isPlaying ? '50%' : '0%'}"></div>
                </div>
            </div>`;
    }).join("");

    favoritesList.innerHTML = header + html;
}

function removeFavorite(url) {
    favorites = favorites.filter(fav => fav.url !== url);
    secureLocalStorageSet('favorites', favorites);
    updateFavoritesUI();
    updateFavoriteButton();
    updateRadioCards();
    showNotification("Rádio removida dos favoritos", "success");
    updateButtonCounters();
}

function clearFavoritesAction() {
    favorites = [];
    secureLocalStorageSet('favorites', favorites);
    updateFavoritesUI();
    updateFavoriteButton();
    updateRadioCards();
    showNotification("Todos os favoritos removidos", "success");
    updateButtonCounters();
}

// ===========================
// HISTÓRICO
// ===========================
function updateHistoryUI() {
    if (!historyList) return;

    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>Nenhuma rádio no histórico ainda.</p>
                <small>As rádios que você ouvir aparecem aqui.</small>
            </div>`;
        return;
    }

    const header = `
        <div class="list-header">
            <span class="list-count">
                <i class="fas fa-history"></i>
                ${history.length} rádio${history.length !== 1 ? 's' : ''}
            </span>
            <button class="btn-clear-all"
                    onclick="showConfirmationModal('clearAllHistory')"
                    title="Limpar todo o histórico">
                <i class="fas fa-trash"></i> Limpar tudo
            </button>
        </div>
    `;

    const html = history.map(radio => {
        const isCurrent = currentRadio && currentRadio.url === radio.url;
        const displayTags = cleanGenreName(radio.tags);
        const timeAgo = formatTimeAgo(new Date(radio.date));
        const safeUrl = radio.url.replace(/'/g, "\\'");

        return `
            <div class="radio-card ${isCurrent ? 'playing' : ''}"
                 onclick="playRadio('${radio.name.replace(/'/g, "\\'")}', '${safeUrl}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                ${getRadioImageHTML(radio, 'normal')}
                <h3>${radio.name}</h3>
                <small>${radio.country} - ${displayTags}</small>
                <small class="time-ago">${timeAgo}</small>
                <button class="btn-remove"
                        onclick="event.stopPropagation(); showConfirmationModal('removeHistory', '${safeUrl}')"
                        aria-label="Remover rádio do histórico">
                    <i class="fas fa-trash"></i> Remover
                </button>
                <div class="progress-container">
                    <div class="progress-bar" style="width:${isCurrent && isPlaying ? '50%' : '0%'}"></div>
                </div>
            </div>`;
    }).join("");

    historyList.innerHTML = header + html;
}

function removeFromHistory(url) {
    history = history.filter(item => item.url !== url);
    secureLocalStorageSet('history', history);
    updateHistoryUI();
    updateRadioCards();
    showNotification("Rádio removida do histórico", "success");
    updateButtonCounters();
}

function clearAllHistoryAction() {
    history = [];
    secureLocalStorageSet('history', history);
    updateHistoryUI();
    updateRadioCards();
    showNotification("Histórico de reprodução limpo", "success");
    updateButtonCounters();
}

function updateRadioCards() {
    document.querySelectorAll('.radio-card').forEach(card => {
        const onclickAttr = card.getAttribute('onclick');
        if (!onclickAttr) return;
        const urlMatch = onclickAttr.match(/playRadio\('[^']*', '([^']*)'/);
        if (!urlMatch) return;
        const url = urlMatch[1];

        const isFavorite = favorites.some(fav => fav.url === url);
        const isCurrent = currentRadio && currentRadio.url === url;

        card.classList.toggle('favorite', isFavorite);
        card.classList.toggle('playing', isCurrent && isPlaying);

        const progressBar = card.querySelector('.progress-bar');
        if (progressBar) progressBar.style.width = (isCurrent && isPlaying) ? '50%' : '0%';
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('pt-BR');
}

// ====================================
// PLAYER — FECHAR (para áudio e fecha)
// ====================================
function addPlayerCloseButton() {
    if (!playerFixedEl) return;
    if (document.getElementById('closePlayerBtn')) return;

    const closeBtn = document.createElement('button');
    closeBtn.id = 'closePlayerBtn';
    closeBtn.className = 'player-close-btn';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.setAttribute('title', 'Parar e fechar player');
    closeBtn.setAttribute('aria-label', 'Parar e fechar player');

    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closePlayer();
    });

    playerFixedEl.appendChild(closeBtn);
}

function closePlayer() {
    // Ativa flag ANTES de mexer no áudio, para silenciar eventos de erro
    isClosingPlayer = true;

    // Remove listeners para evitar disparo de onerror/onstalled/onended
    audioPlayer.removeEventListener('error', handleAudioError);
    audioPlayer.removeEventListener('ended', handleAudioEnded);
    audioPlayer.removeEventListener('canplay', handleAudioCanPlay);
    audioPlayer.removeEventListener('stalled', handleAudioStalled);
    audioPlayer.removeEventListener('waiting', handleAudioWaiting);

    // Para e limpa o áudio
    try {
        audioPlayer.pause();
        audioPlayer.removeAttribute('src');
        audioPlayer.load(); // força reset interno
    } catch (e) { /* silencioso */ }

    stopAudioHealthCheck();

    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }

    isPlaying = false;
    audioErrorCount = 0;
    currentRadio = null;

    // Reseta UI do player
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    playerFixedEl.classList.remove('playing');
    nowPlaying.textContent = 'Selecione uma rádio...';
    playerSubtitle.textContent = 'Grid Rádio';

    // Restaura a capa padrão
    const oldCover = document.getElementById('playerCover');
    if (oldCover) {
        oldCover.src = DEFAULT_ICON;
        oldCover.classList.add('player-cover');
    }

    // Esconde o player
    playerFixedEl.classList.add('hidden');

    // Reseta status de segurança
    securityStatusEl.innerHTML = '';
    securityStatusEl.className = 'security-status';

    // Reseta botão de favorito
    toggleFavorite.innerHTML = '<i class="far fa-star"></i>';

    updateThemeColor('idle');
    updateRadioCards();

    showNotification('O player foi fechado', 'info');

    // Libera a flag no próximo tick
    setTimeout(() => { isClosingPlayer = false; }, 0);
}

// =========================
// TABS
// =========================
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');

        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');

        if (tabName === 'favorites') updateFavoritesUI();
        if (tabName === 'history')   updateHistoryUI();

        updateLoadMoreButton();
    });
});

// =========================
// MODAIS — ABRIR/FECHAR
// =========================
if (openFilters) openFilters.addEventListener('click', () => {
    filtersModal.style.display = "flex";
    setTimeout(() => {
        const modalInput = document.getElementById('searchInputModal');
        if (modalInput) modalInput.focus();
    }, 100);
});

if (closeFilters) closeFilters.addEventListener('click', () => filtersModal.style.display = "none");
if (openFavorites) openFavorites.addEventListener('click', () => showFavoritesModal());
if (closeFavorites) closeFavorites.addEventListener('click', () => favoritesModal.style.display = "none");
if (openHistory) openHistory.addEventListener('click', () => showHistoryModal());
if (closeHistory) closeHistory.addEventListener('click', () => historyModal.style.display = "none");
if (closePageModal) closePageModal.addEventListener('click', () => pageModal.style.display = "none");

// Fechar ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === favoritesModal) favoritesModal.style.display = "none";
    if (e.target === historyModal)   historyModal.style.display = "none";
    if (e.target === filtersModal) {
        filtersModal.style.display = "none";
        if (genreResultsList) genreResultsList.style.display = 'none';
    }
    if (e.target === pageModal) pageModal.style.display = "none";
});

// ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (filtersModal.style.display === 'flex') {
            filtersModal.style.display = "none";
            if (genreResultsList) genreResultsList.style.display = 'none';
        }
        if (favoritesModal.style.display === 'flex') favoritesModal.style.display = "none";
        if (historyModal.style.display   === 'flex') historyModal.style.display   = "none";
        if (pageModal.style.display      === 'flex') pageModal.style.display      = "none";

        if (!playerFixedEl.classList.contains('hidden')) closePlayer();
    }
});

// =========================
// MODAL FAVORITOS / HISTÓRICO
// =========================
function showFavoritesModal() {
    const list = document.getElementById('favoritesModalList');
    if (favorites.length === 0) {
        list.innerHTML = "<p class='modal-empty-message'><i class='fas fa-star'></i><br>Nenhuma rádio favorita ainda.</p>";
    } else {
        list.innerHTML = favorites.map(radio => {
            const isCurrent = currentRadio && currentRadio.url === radio.url;
            const displayTags = cleanGenreName(radio.tags);
            const imgHTML = getRadioImageHTML(radio, 'small');
            const safeUrl = radio.url.replace(/'/g, "\\'");

            return `
                <div class="modal-radio-item" onclick="playRadio('${radio.name.replace(/'/g, "\\'")}', '${safeUrl}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                    ${imgHTML}
                    <div class="modal-radio-info">
                        <h3>${radio.name}</h3>
                        <p>${radio.country} • ${displayTags}</p>
                    </div>
                    <button class="modal-play-btn" onclick="event.stopPropagation(); playRadio('${radio.name.replace(/'/g, "\\'")}', '${safeUrl}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                        <i class="fas fa-${isCurrent && isPlaying ? 'pause' : 'play'}"></i>
                    </button>
                </div>
            `;
        }).join("");
    }
    favoritesModal.style.display = "flex";
}

function showHistoryModal() {
    const list = document.getElementById('historyModalList');
    if (history.length === 0) {
        list.innerHTML = "<p class='modal-empty-message'><i class='fas fa-history'></i><br>Nenhuma rádio no histórico ainda.</p>";
    } else {
        list.innerHTML = history.map(radio => {
            const isCurrent = currentRadio && currentRadio.url === radio.url;
            const displayTags = cleanGenreName(radio.tags);
            const timeAgo = formatTimeAgo(new Date(radio.date));
            const imgHTML = getRadioImageHTML(radio, 'small');
            const safeUrl = radio.url.replace(/'/g, "\\'");

            return `
                <div class="modal-radio-item" onclick="playRadio('${radio.name.replace(/'/g, "\\'")}', '${safeUrl}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                    ${imgHTML}
                    <div class="modal-radio-info">
                        <h3>${radio.name}</h3>
                        <p>${radio.country} • ${displayTags}</p>
                        <small style="font-size: 0.7rem; opacity: 0.6;">${timeAgo}</small>
                    </div>
                    <button class="modal-play-btn" onclick="event.stopPropagation(); playRadio('${radio.name.replace(/'/g, "\\'")}', '${safeUrl}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                        <i class="fas fa-${isCurrent && isPlaying ? 'pause' : 'play'}"></i>
                    </button>
                </div>
            `;
        }).join("");
    }
    historyModal.style.display = "flex";
}

// =====================
// PÁGINAS ESTÁTICAS
// =====================
const pageContents = {
    privacy: `
        <div class="page-content">
            <h2><i class="fas fa-user-shield"></i> Política de Privacidade</h2>
            <h3>1. Dados Coletados</h3>
            <p>O Grid Rádio Online não coleta dados pessoais identificáveis. Utilizamos apenas o <strong>localStorage</strong> do seu navegador para salvar:</p>
            <ul>
                <li>Rádios Favoritas</li>
                <li>Histórico de Reprodução</li>
                <li>Tema (Claro/Escuro)</li>
                <li>Preferências de Volume</li>
            </ul>
            <p>Estes dados ficam armazenados exclusivamente no seu dispositivo e nunca são enviados para nossos servidores.</p>
            <h3>2. Fontes de Rádio</h3>
            <p>Usamos a API pública do <a href="http://www.radio-browser.info/" target="_blank" class="site-link gradient-link">radio-browser.info</a> para buscar listas de estações.</p>
            <h3>3. Segurança</h3>
            <p>Implementamos validações básicas de URL e sanitização de HTML para mitigar riscos de segurança, mas você é responsável por verificar a segurança das estações que decide ouvir.</p>
            <h3>4. Contato</h3>
            <p>Para questões sobre privacidade: <a href="mailto:juliogonzales.dev@proton.me" class="site-link gradient-link email-link">juliogonzales.dev@proton.me</a></p>
        </div>
    `,
    terms: `
        <div class="page-content">
            <h2><i class="fas fa-file-signature"></i> Termos de Uso</h2>
            <h3>1. Aceitação dos Termos</h3>
            <p>Ao usar o Grid Rádio Online, você concorda com estes termos de uso.</p>
            <h3>2. Serviço</h3>
            <p>O Grid Rádio Online é um agregador de estações de rádio online. Não hospedamos nenhum conteúdo de áudio.</p>
            <h3>3. Uso Aceitável</h3>
            <p>Você concorda em usar o serviço apenas para fins legais e de acordo com todas as leis aplicáveis.</p>
            <h3>4. Direitos Autorais</h3>
            <p>Todo o conteúdo de áudio transmitido pertence às respectivas estações de rádio.</p>
            <h3>5. Limitação de Responsabilidade</h3>
            <p>Não nos responsabilizamos por:</p>
            <ul>
                <li>Interrupções no serviço</li>
                <li>Conteúdo das estações de rádio</li>
                <li>Problemas técnicos nas transmissões</li>
            </ul>
            <h3>6. Modificações</h3>
            <p>Reservamo-nos o direito de modificar estes termos a qualquer momento.</p>
        </div>
    `,
    dmca: `
        <div class="page-content">
            <h2><i class="fas fa-gavel"></i> Política DMCA</h2>
            <div class="educational-notice">
                <p><strong><i class="fas fa-graduation-cap"></i> Nota:</strong>
                Este projeto tem caráter educacional e utiliza a API pública do Radio Browser.</p>
            </div>
            <h3>Notificação de Infração</h3>
            <p>Se você acredita que seu trabalho foi copiado de forma que constitui violação de direitos autorais, envie uma notificação para:</p>
            <p><strong>Email:</strong> <a href="mailto:juliogonzales.dev@proton.me" class="site-link gradient-link email-link">juliogonzales.dev@proton.me</a></p>
            <h3>Informações Requeridas</h3>
            <ul>
                <li>Assinatura do proprietário dos direitos autorais</li>
                <li>Identificação do trabalho protegido</li>
                <li>Identificação do material infringente</li>
                <li>Suas informações de contato</li>
                <li>Declaração de boa fé</li>
            </ul>
            <div class="footer-note">
                <p><strong>Projeto educacional</strong> • Desenvolvido para fins de aprendizado</p>
            </div>
        </div>
    `,
    about: `
        <div class="page-content">
            <h2><i class="fas fa-circle-info"></i> Sobre o Grid Rádio Online</h2>
            <p>O Grid Rádio Online é um projeto educacional de código aberto, criado para oferecer uma interface simples e moderna para acessar rádios de todo o mundo, usando a API pública do <a href="http://www.radio-browser.info/" target="_blank" class="site-link gradient-link">radio-browser.info</a>.</p>
            <p>Este projeto foca em:</p>
            <ul>
                <li><strong>Desempenho:</strong> Carregamento rápido e eficiente.</li>
                <li><strong>Design Moderno:</strong> Interface amigável e responsiva.</li>
                <li><strong>Privacidade:</strong> Não coleta dados pessoais.</li>
            </ul>
            <p>Código fonte disponível no <a href="https://github.com/Julioheyner" target="_blank" class="site-link gradient-link"><i class="fab fa-github"></i> GitHub</a>.</p>
            <div class="socials">
                <a href="https://github.com/Julioheyner" title="GitHub" rel="noopener noreferrer" target="_blank" class="social-icon"><i class="fab fa-github"></i></a>
                <a href="https://www.linkedin.com/in/julio-gonzales-31a723379" title="LinkedIn" rel="noopener noreferrer" target="_blank" class="social-icon"><i class="fab fa-linkedin"></i></a>
                <a href="mailto:juliogonzales.dev@proton.me" title="Email" class="social-icon"><i class="fas fa-envelope"></i></a>
            </div>
        </div>
    `
};

function showPage(pageName) {
    pageContent.innerHTML = pageContents[pageName] || '<p style="padding: 20px;">Página não encontrada.</p>';
    fixEmailLinksIn(pageContent);
    pageModal.style.display = "flex";
}

// ====================================================
// MODAL DE CONFIRMAÇÃO
// ====================================================
const confirmationModal = document.createElement('div');
confirmationModal.id = 'confirmationModal';
confirmationModal.className = 'modal';
confirmationModal.innerHTML = `
    <div class="modal-content" style="font-size:0.85rem;max-width:320px;">
        <h2 id="confirmTitle" style="display:flex;align-items:center;gap:10px;margin:0 0 16px;color:var(--accent-primary);font-size:1.15rem;">
            <i class="fas fa-question-circle"></i> Confirmar
        </h2>
        <p id="confirmMessage" style="margin:0 0 22px;color:var(--text-secondary);line-height:1.5;"></p>
        <div style="display:flex;flex-direction:column;gap:10px;">
            <button id="confirmYes" style="width:100%;padding:13px;background:linear-gradient(135deg,#ff3366,#ff2e63);color:#fff;border:none;border-radius:10px;font-weight:700;font-size:0.92rem;cursor:pointer;box-shadow:0 4px 15px rgba(255,46,99,0.3);transition:transform .2s,box-shadow .2s;font-family:var(--font-body);">
                <i class="fas fa-trash-alt" style="margin-right:8px;"></i>Sim, remover
            </button>
            <button id="confirmNo" style="width:100%;padding:13px;background:var(--player-color);color:var(--text-color);border:1.5px solid var(--glass-border);border-radius:10px;font-weight:700;font-size:0.92rem;cursor:pointer;transition:transform .2s,border-color .2s;font-family:var(--font-body);">
                <i class="fas fa-times" style="margin-right:8px;"></i>Cancelar
            </button>
        </div>
    </div>
`;
document.body.appendChild(confirmationModal);

const confirmTitle   = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYes     = document.getElementById('confirmYes');
const confirmNo      = document.getElementById('confirmNo');

confirmNo.onclick = () => confirmationModal.style.display = 'none';

confirmationModal.addEventListener('click', (e) => {
    if (e.target === confirmationModal) confirmationModal.style.display = 'none';
});

function showConfirmationModal(action, url = null) {
    confirmationModal.style.display = 'flex';

    if (action === 'clearFavorites') {
        confirmTitle.innerHTML   = '<i class="fas fa-star"></i> Remover Favoritos';
        confirmMessage.textContent = "Deseja remover TODAS as rádios favoritas?";
        confirmYes.onclick = () => { clearFavoritesAction(); confirmationModal.style.display = 'none'; };

    } else if (action === 'clearAllHistory') {
        confirmTitle.innerHTML   = '<i class="fas fa-history"></i> Limpar Histórico';
        confirmMessage.textContent = "Deseja remover TODO o histórico de reprodução?";
        confirmYes.onclick = () => { clearAllHistoryAction(); confirmationModal.style.display = 'none'; };

    } else if (action === 'removeFavorite' && url) {
        confirmTitle.innerHTML   = '<i class="fas fa-star"></i> Remover Rádio';
        confirmMessage.textContent = "Deseja remover esta rádio dos favoritos?";
        confirmYes.onclick = () => { removeFavorite(url); confirmationModal.style.display = 'none'; };

    } else if (action === 'removeHistory' && url) {
        confirmTitle.innerHTML   = '<i class="fas fa-history"></i> Remover Rádio';
        confirmMessage.textContent = "Deseja remover esta rádio do histórico?";
        confirmYes.onclick = () => { removeFromHistory(url); confirmationModal.style.display = 'none'; };
    }
}

// ====================================================
// CONTROLES DO PLAYER E BUSCA
// ====================================================
toggleFavorite.addEventListener('click', toggleFavoriteRadio);
playPauseBtn.addEventListener('click', togglePlayPause);
loadMoreBtn.addEventListener('click', () => fetchRadios(currentQuery, currentCountry, currentTag, true));

searchBtn.addEventListener('click', () => {
    currentQuery   = searchInput.value;
    currentCountry = countrySelect.value;
    currentTag     = genreSelect.value;

    fetchRadios(currentQuery, currentCountry, currentTag);
    filtersModal.style.display = "none";
    if (genreResultsList) genreResultsList.style.display = 'none';
});

// Enter na busca principal
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); searchBtn.click(); }
});

// Enter na busca por gênero
genreSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); searchBtn.click(); }
});

// ====================================================
// NOTIFICAÇÃO
// ====================================================
function showNotification(message, type = 'info') {
    const icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error:   'fa-times-circle',
        info:    'fa-info-circle'
    };
    const icon = icons[type] || 'fa-info-circle';
    notification.innerHTML = `<i class="fas ${icon}"></i> <span>${sanitizeHTML(message)}</span>`;
    notification.className = `notification ${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// ========================
// CARREGAMENTO DE FILTROS
// ========================
async function loadFilters() {
    try {
        const [countries, tags] = await Promise.all([
            fetch(`${API_BASE}/countries`).then(r => r.json()),
            // LIMITE ALTO: garante que tags como "gospel" e "christian" venham.
            fetch(`${API_BASE}/tags?limit=5000&hidebroken=true&order=stationcount&reverse=true`)
                .then(r => r.json())
        ]);

        // ----- Países -----
        countries
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(c => {
                const opt = document.createElement("option");
                opt.value = sanitizeHTML(c.name);
                opt.textContent = sanitizeHTML(c.name);
                countrySelect.appendChild(opt);
            });

        // ----- Gêneros (API + curados) -----
        // 1. Monta o array a partir da API, já com "terms" iniciais
        allGenreTags = tags.map(t => ({
            tag: t.name,
            display: cleanGenreName(t.name),
            terms: [t.name]
        }));

        // Índice por tag (minúscula) para mesclar com a lista curada
        const indexByTag = new Map(
            allGenreTags.map(g => [g.tag.toLowerCase(), g])
        );

        // 2. Insere / enriquece com os gêneros curados
        CURATED_GENRES.forEach(cg => {
            const key = cg.tag.toLowerCase();
            const existing = indexByTag.get(key);

            if (existing) {
                // Já existe — apenas mescla os sinônimos
                const merged = new Set([
                    ...(existing.terms || []),
                    ...cg.terms,
                    cg.display
                ]);
                existing.terms = [...merged];
            } else {
                // Não existe — adiciona à lista
                const entry = {
                    tag: cg.tag,
                    display: cg.display,
                    terms: [...new Set([...cg.terms, cg.display])]
                };
                allGenreTags.push(entry);
                indexByTag.set(key, entry);
            }
        });

        // 3. Ordena alfabeticamente pelo rótulo em pt-BR
        allGenreTags.sort((a, b) =>
            a.display.localeCompare(b.display, 'pt-BR', { sensitivity: 'base' })
        );

        // 4. Preenche o <select> de gêneros
        genreSelect.innerHTML = '<option value="">Todos os gêneros</option>';
        allGenreTags.forEach(g => {
            const opt = document.createElement("option");
            opt.textContent = g.display;
            opt.value = g.tag;
            genreSelect.appendChild(opt);
        });

        console.log(`[Grid Rádio] ${allGenreTags.length} gêneros carregados (incluindo curados).`);
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
        showNotification("Erro ao carregar filtros. Tente novamente mais tarde.", "error");
    }
}

// ============================
// BUSCA RÁPIDA DE GÊNEROS
// ============================
genreSearchInput.addEventListener('input', filterGenreResults);

function filterGenreResults() {
    const query = normalizeText(genreSearchInput.value).trim();
    genreResultsList.innerHTML = '';

    // Mínimo agora é 2 caracteres 
    if (query.length < 2) {
        genreResultsList.style.display = 'none';
        return;
    }

    const filtered = allGenreTags.filter(g => {
        if (normalizeText(g.display).includes(query)) return true;
        if (normalizeText(g.tag).includes(query)) return true;
        if (Array.isArray(g.terms)) {
            return g.terms.some(term => normalizeText(term).includes(query));
        }
        return false;
    });

    if (filtered.length > 0) {
        filtered.forEach(g => {
            const item = document.createElement('button');
            item.className = 'genre-item';
            item.textContent = g.display;
            item.setAttribute('data-tag', g.tag);
            item.addEventListener('click', () => selectGenre(item, g.tag, g.display));
            genreResultsList.appendChild(item);
        });
        genreResultsList.style.display = 'block';
    } else {
        genreResultsList.style.display = 'none';
    }
}

function selectGenre(item, tag, display) {
    genreSearchInput.value = display;
    genreSelect.value = tag;
    genreResultsList.style.display = 'none';
    document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
}

// ======================
// TEMA
// ======================
themeToggle.addEventListener("click", () => {
    const isLight = document.body.getAttribute("data-theme") === "light";
    const newTheme = isLight ? "dark" : "light";
    document.body.setAttribute("data-theme", newTheme);

    const icon = themeToggle.querySelector('i');
    icon.className = newTheme === "light" ? "fas fa-sun" : "fas fa-moon";

    secureLocalStorageSet("theme", newTheme);
    updateThemeColor(isPlaying ? 'playing' : (currentRadio ? 'paused' : 'idle'));
});

audioPlayer.addEventListener('volumechange', () => {
    secureLocalStorageSet('volume', audioPlayer.volume);
});

// =====================
// INICIALIZAÇÃO
// =====================
document.addEventListener("DOMContentLoaded", () => {
    function cleanCorruptedData() {
        ['favorites', 'history'].forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) JSON.parse(data);
            } catch { localStorage.removeItem(key); }
        });
    }
    cleanCorruptedData();

    favorites = secureLocalStorageGet('favorites', []);
    history   = secureLocalStorageGet('history', []);

    const savedTheme = secureLocalStorageGet("theme", "dark");
    document.body.setAttribute("data-theme", savedTheme);
    themeToggle.innerHTML = savedTheme === "light" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    updateThemeColor('idle');

    audioPlayer.volume = secureLocalStorageGet("volume", 0.1);
    setupAudioEventListeners();
    loadFilters();

    const cachedRadios = sessionStorage.getItem('cachedRadios');
    if (cachedRadios) {
        try {
            const parsed = JSON.parse(cachedRadios);
            if (parsed && parsed.length > 0) renderRadiosFromCache(parsed);
            else fetchRadios();
        } catch { fetchRadios(); }
    } else {
        fetchRadios();
    }

    updateFavoritesUI();
    updateHistoryUI();
    updateButtonCounters();

    setTimeout(() => updateButtonCounters(), 500);
    setTimeout(() => addPlayerCloseButton(), 1000);
});

// =====================
// PROTEÇÕES
// =====================
if (window.audioPlayerInstance) {
    window.audioPlayerInstance.pause();
    window.audioPlayerInstance.src = '';
}
window.audioPlayerInstance = audioPlayer;

window.addEventListener('beforeunload', () => {
    
    isClosingPlayer = true;
    stopAudioHealthCheck();
    if (retryTimeout) clearTimeout(retryTimeout);
    audioPlayer.pause();
    audioPlayer.src = '';
    
    setTimeout(() => { isClosingPlayer = false; }, 500);
});

setTimeout(() => {
    document.querySelectorAll('script').forEach(script => {
        if (!script.src && (script.innerHTML.includes('eval') || script.innerHTML.includes('Function'))) {
            script.remove();
        }
    });
}, 1000);

// ============================================
// MODAL DE COMPARTILHAMENTO
// ============================================
const shareModal = document.createElement('div');
shareModal.id = 'shareModal';
shareModal.innerHTML = `
  <div class="share-modal-content">
    <div class="share-modal-header">
      <h2><i class="fas fa-share-alt"></i> Compartilhar Grid Radio</h2>
      <button class="share-modal-close" id="closeShareModal">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="share-options">
      <div class="share-option whatsapp" data-share="whatsapp">
        <i class="fab fa-whatsapp"></i>
        <span>WhatsApp</span>
      </div>
      
      <div class="share-option facebook" data-share="facebook">
        <i class="fab fa-facebook"></i>
        <span>Facebook</span>
      </div>
      
       <div class="share-option x" data-share="x">
        <i class="fa-brands fa-x-twitter"></i>
        <span>Ex-twitter</span>
      </div>
      
      <div class="share-option telegram" data-share="telegram">
        <i class="fab fa-telegram"></i>
        <span>Telegram</span>
      </div>
      
      <div class="share-option link" data-share="link">
        <i class="fas fa-link"></i>
        <span>Copiar Link</span>
      </div>
    </div>
    
    <div class="share-url-container">
      <input type="text" id="shareUrl" readonly value="${window.location.href}">
      <button id="copyShareUrl" class="tooltip">
        Copiar
        <span class="tooltiptext">Link copiado!</span>
      </button>
    </div>
    
    <div class="share-note">
      <i class="fas fa-info-circle"></i> Ajude a espalhar o Grid Radio!
    </div>
  </div>
`;

document.body.appendChild(shareModal);

const shareBtn = document.getElementById('shareBtn');
const closeShareModal = document.getElementById('closeShareModal');
const copyShareUrlBtn = document.getElementById('copyShareUrl');
const shareUrlInput = document.getElementById('shareUrl');
const shareOptions = document.querySelectorAll('.share-option');

shareBtn.addEventListener('click', (e) => {
    e.preventDefault();
    shareModal.classList.add('active');
    shareUrlInput.value = window.location.href;
});

closeShareModal.addEventListener('click', () => {
    shareModal.classList.remove('active');
});

shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) {
        shareModal.classList.remove('active');
    }
});

copyShareUrlBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(shareUrlInput.value);
        
        const tooltip = copyShareUrlBtn.querySelector('.tooltiptext');
        tooltip.textContent = 'Link copiado!';
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
        
        setTimeout(() => {
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        }, 2000);
        
    } catch (err) {
        console.error('Erro ao copiar: ', err);
        
        shareUrlInput.select();
        document.execCommand('copy');
        
        const tooltip = copyShareUrlBtn.querySelector('.tooltiptext');
        tooltip.textContent = 'Copiado!';
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
        
        setTimeout(() => {
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        }, 2000);
    }
});

shareOptions.forEach(option => {
    option.addEventListener('click', () => {
        const platform = option.dataset.share;
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent('Grid Radio - Sua música sem limites🎧');
        const text = encodeURIComponent('Descubra milhares de rádios online gratuitamente no Grid Radio!');
        const hashtags = 'GridRadio,RadioOnline,Musica';
        
        let shareUrl;
        
        switch (platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${text}%20${url}`;
                break;
                
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
                
            case 'x':
                shareUrl = `https://x.com/intent/tweet?url=${url}&text=${text}&hashtags=${hashtags}`;
                break;
                
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
                break;
                
            case 'link':
                return;
        }
        
        window.open(shareUrl, '_blank', 'width=600,height=400');
        shareModal.classList.remove('active');
    });
});

if (navigator.share) {
    shareBtn.addEventListener('click', async (e) => {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            e.preventDefault();
            
            try {
                await navigator.share({
                    title: 'Grid Radio',
                    text: 'Descubra milhares de rádios online gratuitamente no Grid Radio!',
                    url: window.location.href,
                });
                
                console.log('Conteúdo compartilhado com sucesso');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Erro ao compartilhar:', err);
                    shareModal.classList.add('active');
                }
            }
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shareModal.classList.contains('active')) {
        shareModal.classList.remove('active');
    }
});

