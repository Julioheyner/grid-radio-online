// ====================================================
// GRID RÁDIO ONLINE - SCRIPT PRINCIPAL
// ====================================================
// Este script controla todas as funcionalidades do Grid Rádio Online:
// - Reprodução de rádios online
// - Gerenciamento de favoritos e histórico
// - Busca e filtragem de estações
// - Interface do usuário e controles de áudio
// ====================================================

// ====================================================
// EFEITO DA IMAGEM DO HERO
// ====================================================
document.addEventListener('DOMContentLoaded', function() {
    const heroSection = document.getElementById('hero-section');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        
        if (heroSection) {
            if (scrolled > 50) {
                heroSection.classList.add('scrolled');
            } else {
                heroSection.classList.remove('scrolled');
            }
        }
    });
});

// ====================================================
// CONFIGURAÇÕES DE SEGURANÇA E UTILS
// ====================================================
const SECURITY_CONFIG = {
    ALLOWED_PROTOCOLS: ['http:', 'https:'],
    ALLOWED_AUDIO_DOMAINS: ['cast.streamhosting.rs', 's2.voscast.com', 'streaming.radio.co', 
                             'stream.zeno.fm', 'live.hunter.fm', 'icecast-fan.musicradio.com', 
                             'live.stream', 'stream.host', 'stream.serv', 'stream.audio', 'stream.radio'],
    BLOCKED_DOMAINS: ['script', 'virus', 'malware', 'bad', 'evil', 'spam', 'ad', 'tracker', 'analytic', 'miner'],
    SUSPICIOUS_PATTERNS: [/(\.exe|\.js|\.php|\.cgi|\.pl)$/i, /eval\(|Function\(|document\.write/i]
};

// ====================================================
// VARIÁVEIS GLOBAIS
// ====================================================
const API_BASE = "https://de1.api.radio-browser.info/json";
const radiosContainer = document.getElementById("radios");
const favoritesList = document.getElementById("favoritesList");
const historyList = document.getElementById("historyList");
const nowPlaying = document.getElementById("nowPlaying");
const playerSubtitle = document.getElementById("playerSubtitle");
const playerCover = document.getElementById("playerCover");
const securityWarning = document.getElementById("securityWarning");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const countrySelect = document.getElementById("countrySelect");
const genreSelect = document.getElementById("genreSelect");
const genreSearchInput = document.getElementById("genreSearchInput");
const genreResultsList = document.getElementById("genreResultsList");
const filtersModal = document.getElementById("filtersModal");
const favoritesModal = document.getElementById("favoritesModal");
const historyModal = document.getElementById("historyModal");
const pageModal = document.getElementById("pageModal");
const pageContent = document.getElementById("pageContent");
const openFilters = document.getElementById("openFilters");
const openFavorites = document.getElementById("openFavorites");
const openHistory = document.getElementById("openHistory");
const closeFilters = document.getElementById("closeFilters");
const closeFavorites = document.getElementById("closeFavorites");
const closeHistory = document.getElementById("closeHistory");
const closePageModal = document.getElementById("closePageModal");
const themeToggle = document.getElementById("themeToggle");
const toggleFavorite = document.getElementById("toggleFavorite");
const playPauseBtn = document.getElementById("playPauseBtn");
const notification = document.getElementById("notification");
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const securityStatusEl = document.getElementById("securityStatus");
const playerFixedEl = document.querySelector('.player-fixed');

// ====================================================
// VARIÁVEIS DE ESTADO DO ÁUDIO
// ====================================================
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

// Criar elemento de áudio dinamicamente
const audioPlayer = new Audio();
audioPlayer.volume = 0.8;

// SVG de notas musicais brancas (fallback)
const MUSIC_ICON_SVG = 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'>
        <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'/>
    </svg>
`);

const DEFAULT_ICON = 'https://cdn-icons-png.flaticon.com/512/727/727245.png';

// ====================================================
// FUNÇÕES DE UTILIDADE
// ====================================================

/**
 * Sanitiza strings HTML para prevenir XSS
 * @param {string} str - String a ser sanitizada
 * @returns {string} String sanitizada
 */
function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Salva dados no localStorage com tratamento de erros
 * @param {string} key - Chave de armazenamento
 * @param {any} value - Valor a ser salvo
 */
function secureLocalStorageSet(key, value) {
    try {
        if (Array.isArray(value)) {
            const serializableValue = value.map(item => {
                const simpleItem = {
                    name: item.name || '',
                    url: item.url || '',
                    favicon: item.favicon || '',
                    country: item.country || '',
                    tags: item.tags || ''
                };
                
                if (item.date) {
                    simpleItem.date = item.date;
                }
                
                return simpleItem;
            });
            localStorage.setItem(key, JSON.stringify(serializableValue));
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        try {
            localStorage.clear();
            if (Array.isArray(value)) {
                const serializableValue = value.map(item => ({
                    name: item.name || '',
                    url: item.url || '',
                    favicon: item.favicon || '',
                    country: item.country || '',
                    tags: item.tags || ''
                }));
                localStorage.setItem(key, JSON.stringify(serializableValue.slice(0, 10)));
            }
        } catch (e) {
            console.error('Não foi possível limpar o localStorage:', e);
        }
    }
}

/**
 * Recupera dados do localStorage com tratamento de erros
 * @param {string} key - Chave de armazenamento
 * @param {any} defaultValue - Valor padrão caso falhe
 * @returns {any} Dados recuperados
 */
function secureLocalStorageGet(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        if (!data) {
            return defaultValue;
        }
        
        const parsed = JSON.parse(data);
        
        if (Array.isArray(parsed)) {
            const sanitizedArray = parsed.map(item => {
                if (typeof item !== 'object' || item === null) {
                    return null;
                }
                
                const sanitizedItem = sanitizeRadioData({
                    name: item.name || '',
                    url: item.url || '',
                    favicon: item.favicon || '',
                    country: item.country || '',
                    tags: item.tags || ''
                });
                
                if (item.date) {
                    sanitizedItem.date = item.date;
                }
                
                return sanitizedItem;
            }).filter(item => item !== null && item.url);
            
            return sanitizedArray;
        }
        
        return parsed;
    } catch (error) {
        console.error('❌ Erro ao recuperar do localStorage:', error);
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Não foi possível remover item corrompido:', e);
        }
        return defaultValue;
    }
}

/**
 * Valida se uma URL é segura
 * @param {string} url - URL a ser validada
 * @returns {boolean} True se a URL for válida e segura
 */
function validateURL(url) {
    try {
        const urlObj = new URL(url);
        if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
            return false;
        }
        for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
            if (pattern.test(url)) {
                return false;
            }
        }
        const domain = urlObj.hostname.toLowerCase();
        for (const blocked of SECURITY_CONFIG.BLOCKED_DOMAINS) {
            if (domain.includes(blocked)) {
                return false;
            }
        }
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Verifica se uma URL é segura para reprodução de áudio
 * @param {string} url - URL a ser verificada
 * @returns {boolean} True se for uma URL de áudio segura
 */
function isSafeAudioURL(url) {
    if (!validateURL(url)) return false;
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase();
        for (const allowed of SECURITY_CONFIG.ALLOWED_AUDIO_DOMAINS) {
            if (domain.includes(allowed)) {
                return true;
            }
        }
        if (domain === 'localhost' || domain === '127.0.0.1' || urlObj.protocol === 'data:') {
            return true;
        }
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
            const path = urlObj.pathname.toLowerCase();
            if (path.includes('.mp3') || path.includes('.ogg') || path.includes('.wav') || 
                path.includes('.aac') || path.includes('.m3u') || path.includes('.pls') || 
                path.includes('/stream') || path.includes('/live') || path.includes('/radio')) {
                return true;
            }
        }
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Sanitiza dados de uma rádio
 * @param {Object} radio - Dados da rádio
 * @returns {Object} Dados sanitizados
 */
function sanitizeRadioData(radio) {
    if (!radio || typeof radio !== 'object') {
        return {
            name: 'Rádio Desconhecida',
            url: '',
            favicon: DEFAULT_ICON,
            country: 'Desconhecido',
            tags: 'Sem Gênero'
        };
    }
    
    const name = sanitizeHTML(radio.name) || 'Rádio Desconhecida';
    const url = radio.url || '';
    
    let favicon = DEFAULT_ICON;
    
    if (radio.favicon && typeof radio.favicon === 'string') {
        const faviconStr = radio.favicon.trim();
        
        if (faviconStr.length > 5 && 
            !faviconStr.includes('undefined') && 
            !faviconStr.includes('null') &&
            faviconStr !== 'https://' &&
            faviconStr !== 'http://' &&
            faviconStr !== MUSIC_ICON_SVG) {
            
            if (faviconStr.startsWith('//')) {
                favicon = 'https:' + faviconStr;
            } else if (faviconStr.startsWith('http')) {
                favicon = faviconStr;
            } else if (faviconStr.startsWith('/')) {
                try {
                    if (radio.url) {
                        const urlObj = new URL(radio.url);
                        const domain = urlObj.protocol + '//' + urlObj.hostname;
                        favicon = domain + faviconStr;
                    }
                } catch (e) {
                    favicon = DEFAULT_ICON;
                }
            }
        }
    }
    
    return {
        name: name,
        url: url,
        favicon: favicon,
        country: sanitizeHTML(radio.country) || 'Desconhecido',
        tags: sanitizeHTML(radio.tags) || 'Sem Gênero'
    };
}

/**
 * Gera HTML para a imagem da rádio com fallback
 * @param {Object} radioData - Dados da rádio
 * @param {string} size - Tamanho da imagem (normal, small, player)
 * @returns {string} HTML da imagem
 */
function getRadioImageHTML(radioData, size = 'normal') {
    const sizes = {
        'normal': { width: 90, height: 90, padding: '15px' },
        'small': { width: 50, height: 50, padding: '8px' },
        'player': { width: 60, height: 60, padding: '0' }
    };
    
    const sizeConfig = sizes[size] || sizes.normal;
    const isDefaultIcon = !radioData.favicon || 
                          radioData.favicon === DEFAULT_ICON || 
                          radioData.favicon === MUSIC_ICON_SVG ||
                          radioData.favicon.includes('undefined') ||
                          radioData.favicon.includes('null') ||
                          radioData.favicon.includes('data:image/svg+xml');
    
    if (isDefaultIcon && size !== 'player') {
        return `
            <img src="${MUSIC_ICON_SVG}" 
                 alt="${radioData.name} logo"
                 class="radio-icon-default"
                 width="${sizeConfig.width}"
                 height="${sizeConfig.height}"
                 style="
                    border-radius: 50%;
                    border: 3px solid var(--accent-primary);
                    box-shadow: 0 0 20px color-mix(in srgb, var(--accent-primary) 35%, transparent);
                    background: var(--accent-gradient);
                    object-fit: contain;
                    padding: ${sizeConfig.padding};
                    min-width: ${sizeConfig.width}px;
                    min-height: ${sizeConfig.height}px;
                    display: block;
                    flex-shrink: 0;
                 "
                 onerror="this.onerror=null; this.src='${MUSIC_ICON_SVG}'; this.style.background='var(--accent-gradient)'; this.style.objectFit='contain'; this.style.padding='${sizeConfig.padding}';">
        `;
    } else if (isDefaultIcon && size === 'player') {
        return `
            <img src="${MUSIC_ICON_SVG}" 
                 alt="${radioData.name} logo"
                 class="player-cover radio-icon-default"
                 width="${sizeConfig.width}"
                 height="${sizeConfig.height}"
                 style="
                    border-radius: 50%;
                    border: 2px solid var(--accent-primary);
                    box-shadow: 0 0 15px color-mix(in srgb, var(--accent-primary) 25%, transparent);
                    background: var(--accent-gradient) !important;
                    object-fit: cover !important;
                    padding: 0 !important;
                    min-width: ${sizeConfig.width}px !important;
                    min-height: ${sizeConfig.height}px !important;
                    display: block;
                    flex-shrink: 0;
                 "
                 onerror="this.onerror=null; this.src='${MUSIC_ICON_SVG}'; this.classList.add('radio-icon-default'); this.style.background='var(--accent-gradient)'; this.style.objectFit='cover'; this.style.padding='0';">
        `;
    } else {
        return `
            <img src="${radioData.favicon}" 
                 alt="${radioData.name} logo"
                 class="${size === 'player' ? 'player-cover' : ''}"
                 width="${sizeConfig.width}"
                 height="${sizeConfig.height}"
                 style="
                    border-radius: 50%;
                    border: ${size === 'player' ? '2px' : '3px'} solid var(--accent-primary);
                    box-shadow: 0 0 ${size === 'player' ? '15px' : '20px'} color-mix(in srgb, var(--accent-primary) ${size === 'player' ? '25%' : '35%'}, transparent);
                    background: transparent;
                    object-fit: cover;
                    padding: 0;
                    min-width: ${sizeConfig.width}px;
                    min-height: ${sizeConfig.height}px;
                    display: block;
                    flex-shrink: 0;
                 "
                 onerror="this.onerror=null; this.src='${MUSIC_ICON_SVG}'; this.classList.add('radio-icon-default'); this.style.background='var(--accent-gradient)'; this.style.objectFit='${size === 'player' ? 'cover' : 'contain'}'; this.style.padding='${size === 'player' ? '0' : sizeConfig.padding}';">
        `;
    }
}

/**
 * Limpa o nome do gênero para exibição
 * @param {string} tagName - Nome original da tag
 * @returns {string} Nome formatado do gênero
 */
function cleanGenreName(tagName) {
    if (!tagName) return '';
    const specialMapping = {
        'rockpop': 'Rock & Pop',
        'electronic': 'Música Eletrônica',
        'dancepop': 'Dance Pop',
        'classical': 'Música Clássica',
        'oldies': 'Clássicos (Oldies)',
        'talk': 'Notícias/Debate',
        'christian': 'Gospel/Cristã',
        'top40': 'Top 40/Pop Charts',
        '90s': 'Anos 90',
        '80s': 'Anos 80',
        '70s': 'Anos 70',
        'vallenato': 'Vallenato (Colômbia)'
    };
    
    const normalizedTagName = tagName.toLowerCase();
    if (specialMapping[normalizedTagName]) {
        return specialMapping[normalizedTagName];
    }
    
    let cleaned = tagName.replace(/[-_]/g, ' ');
    cleaned = cleaned.toLowerCase().split(' ').map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
    
    return cleaned;
}

/**
 * Normaliza texto removendo acentos
 * @param {string} text - Texto a ser normalizado
 * @returns {string} Texto normalizado
 */
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Atualiza contadores dos botões de favoritos e histórico
 */
function updateButtonCounters() {
    try {
        const favCount = Array.isArray(favorites) ? favorites.length : 0;
        const histCount = Array.isArray(history) ? history.length : 0;
        
        // Atualizar botão de favoritos
        const favBtn = document.getElementById('openFavorites');
        if (favBtn) {
            let favBadge = favBtn.querySelector('.badge');
            
            if (!favBadge) {
                favBadge = document.createElement('span');
                favBadge.className = 'badge';
                favBadge.id = 'favoritesBadge';
                favBtn.appendChild(favBadge);
            }
            
            favBadge.textContent = favCount > 99 ? '99+' : favCount.toString();
            favBadge.setAttribute('data-count', favCount);
            
            if (favCount > 0) {
                favBadge.style.display = 'flex';
                favBadge.style.visibility = 'visible';
                favBadge.style.opacity = '1';
            } else {
                favBadge.style.display = 'none';
                favBadge.style.visibility = 'hidden';
                favBadge.style.opacity = '0';
            }
            
            favBadge.setAttribute('title', `${favCount} rádio${favCount !== 1 ? 's' : ''} favorita${favCount !== 1 ? 's' : ''}`);
        }
        
        // Atualizar botão de histórico
        const histBtn = document.getElementById('openHistory');
        if (histBtn) {
            let histBadge = histBtn.querySelector('.badge');
            
            if (!histBadge) {
                histBadge = document.createElement('span');
                histBadge.className = 'badge';
                histBadge.id = 'historyBadge';
                histBtn.appendChild(histBadge);
            }
            
            histBadge.textContent = histCount > 99 ? '99+' : histCount.toString();
            histBadge.setAttribute('data-count', histCount);
            
            if (histCount > 0) {
                histBadge.style.display = 'flex';
                histBadge.style.visibility = 'visible';
                histBadge.style.opacity = '1';
            } else {
                histBadge.style.display = 'none';
                histBadge.style.visibility = 'hidden';
                histBadge.style.opacity = '0';
            }
            
            histBadge.setAttribute('title', `${histCount} rádio${histCount !== 1 ? 's' : ''} no histórico`);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar contadores:', error);
    }
}

// ====================================================
// CONTROLE DE ÁUDIO
// ====================================================

/**
 * Configura event listeners do áudio
 */
function setupAudioEventListeners() {
    audioPlayer.onerror = null;
    audioPlayer.onended = null;
    
    audioPlayer.addEventListener('error', handleAudioError);
    audioPlayer.addEventListener('ended', handleAudioEnded);
    audioPlayer.addEventListener('canplay', handleAudioCanPlay);
    audioPlayer.addEventListener('stalled', handleAudioStalled);
    audioPlayer.addEventListener('waiting', handleAudioWaiting);
}

/**
 * Inicia monitoramento de saúde do áudio
 */
function startAudioHealthCheck() {
    stopAudioHealthCheck();
    
    let lastTimeUpdate = Date.now();
    let silenceDetected = false;
    
    audioPlayer.ontimeupdate = () => {
        lastTimeUpdate = Date.now();
        
        if (silenceDetected) {
            silenceDetected = false;
            console.log("Áudio retomado após silêncio");
            showNotification("🔊 Conexão restaurada", "success");
        }
    };
    
    const healthCheckInterval = setInterval(() => {
        if (isPlaying) {
            const timeSinceLastUpdate = Date.now() - lastTimeUpdate;
            
            if (timeSinceLastUpdate > 10000 && !audioPlayer.ended) {
                if (!silenceDetected) {
                    silenceDetected = true;
                    console.log("Silêncio detectado no stream");
                    showNotification("🔇 Problema na conexão, tentando reconectar...", "warning");
                    attemptAudioRecovery();
                }
            }
        }
    }, 5000);
    
    audioPlayer.healthCheckInterval = healthCheckInterval;
}

/**
 * Para monitoramento de saúde do áudio
 */
function stopAudioHealthCheck() {
    if (audioPlayer.healthCheckInterval) {
        clearInterval(audioPlayer.healthCheckInterval);
        audioPlayer.healthCheckInterval = null;
    }
    audioPlayer.ontimeupdate = null;
}

/**
 * Tenta recuperar o áudio em caso de falha
 */
function attemptAudioRecovery() {
    if (!currentRadio || audioErrorCount >= MAX_AUDIO_ERRORS) {
        showNotification("❌ Muitos erros na conexão. Tente outra rádio.", "error");
        pauseAudio();
        return;
    }
    
    console.log("Tentando recuperar áudio...");
    audioErrorCount++;
    
    audioPlayer.pause();
    
    const newAudio = new Audio();
    newAudio.src = audioPlayer.src;
    newAudio.volume = audioPlayer.volume;
    
    audioPlayer.src = '';
    if (audioPlayer.parentNode) {
        audioPlayer.parentNode.removeChild(audioPlayer);
    }
    
    window.audioPlayer = newAudio;
    setupAudioEventListeners();
    
    setTimeout(() => {
        if (currentRadio) {
            playAudio();
        }
    }, 1000);
}

/**
 * Manipula erro de áudio
 * @param {Event} error - Evento de erro
 */
function handleAudioError(error) {
    console.error("Erro no player de áudio:", error);
    audioErrorCount++;
    
    if (audioErrorCount >= MAX_AUDIO_ERRORS) {
        showNotification("❌ Muitos erros na conexão. Tente outra rádio.", "error");
        pauseAudio();
    } else {
        showNotification("🔇 Problema na conexão, tentando novamente...", "warning");
        setTimeout(() => {
            if (currentRadio && isPlaying) {
                attemptAudioRecovery();
            }
        }, 2000);
    }
}

/**
 * Manipula fim natural do áudio
 */
function handleAudioEnded() {
    console.log("Áudio terminou naturalmente");
    if (isPlaying) {
        showNotification("📻 Transmissão encerrada", "info");
        pauseAudio();
    }
}

/**
 * Manipula evento canplay do áudio
 */
function handleAudioCanPlay() {
    console.log("Áudio pronto para reprodução");
    audioErrorCount = 0;
}

/**
 * Manipula evento stalled do áudio
 */
function handleAudioStalled() {
    console.log("Áudio travado, tentando recuperar...");
    if (isPlaying) {
        showNotification("🔇 Conexão instável...", "warning");
        attemptAudioRecovery();
    }
}

/**
 * Manipula evento waiting do áudio
 */
function handleAudioWaiting() {
    console.log("Áudio aguardando dados...");
}

/**
 * Inicia reprodução do áudio
 */
function playAudio() {
    playerFixedEl.classList.remove('hidden');
    isUserInteraction = true;

    audioPlayer.play().then(() => {
        isPlaying = true;
        audioErrorCount = 0;
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playerFixedEl.classList.add('playing');
        updateRadioCards();
        nowPlaying.textContent = currentRadio.name;
        
        // Adicionar botão de fechar se não existir
        if (!document.getElementById('closePlayerBtn')) {
            addPlayerCloseButton();
        }
        
        // Esconder botão flutuante quando o player está visível
        const reopenBtn = document.getElementById('reopenPlayerBtn');
        if (reopenBtn) {
            reopenBtn.style.display = 'none';
        }
        
        startAudioHealthCheck();
    }).catch(error => {
        console.error("Erro ao tentar tocar a rádio:", error);
        
        if (error.name === "NotAllowedError") {
            showNotification("🔇 Clique no botão Play para iniciar a reprodução", "warning");
            isPlaying = false;
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            playerFixedEl.classList.remove('playing');
        } else {
            handleAudioError(error);
        }
    });
}

/**
 * Pausa reprodução do áudio
 */
function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    playerFixedEl.classList.remove('playing');
    stopAudioHealthCheck();
    updateRadioCards();
    
    // Atualizar botão flutuante se estiver visível
    updateReopenPlayerButton();
    
    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }
}

/**
 * Alterna entre play e pause
 */
function togglePlayPause() {
    if (isPlaying) {
        pauseAudio();
    } else {
        if (currentRadio) {
            isUserInteraction = true;
            playAudio();
        } else {
            showNotification("Selecione uma rádio para começar a ouvir.", "warning");
        }
    }
}

/**
 * Toca uma rádio com verificação de segurança
 * @param {string} name - Nome da rádio
 * @param {string} url - URL da rádio
 * @param {string} favicon - URL do ícone
 * @param {string} country - País da rádio
 * @param {string} tags - Tags/gêneros da rádio
 */
function playRadio(name, url, favicon, country, tags) {
    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }
    stopAudioHealthCheck();
    
    if (isPlaying) {
        pauseAudio();
    }

    const radio = {
        name: name,
        url: url,
        favicon: favicon,
        country: country,
        tags: tags
    };

    const sanitizedRadio = sanitizeRadioData(radio);
    audioErrorCount = 0;
    currentRadio = sanitizedRadio;
    audioPlayer.src = url;

    setupAudioEventListeners();

    // Remover duplicados do histórico mantendo apenas o mais recente
    const existingIndex = history.findIndex(item => item.url === url);
    if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
    }
    
    // Adicionar ao histórico
    const historyItem = {
        ...sanitizedRadio,
        url: url,
        date: new Date().toISOString()
    };
    history.unshift(historyItem);
    
    // Limitar histórico a 100 itens
    if (history.length > 100) {
        history.pop();
    }
    
    // Salvar no localStorage
    secureLocalStorageSet('history', history);
    
    // Atualizar UI do histórico
    updateHistoryUI();
    
    // Atualizar contador de histórico
    updateButtonCounters();

    nowPlaying.textContent = `Carregando: ${sanitizedRadio.name}`;
    playerSubtitle.textContent = `${sanitizedRadio.country} • ${cleanGenreName(sanitizedRadio.tags)}`;
    
    // Forçar a atualização da imagem no player
    const playerInfo = document.querySelector('.player-info');
    if (playerInfo) {
        const oldCover = document.getElementById('playerCover');
        if (oldCover) {
            oldCover.remove();
        }
        
        // Criar novo elemento com a imagem correta
        const newCover = getRadioImageHTML(sanitizedRadio, 'player');
        
        // Extrair apenas o elemento img do HTML gerado
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newCover;
        const imgElement = tempDiv.firstElementChild;
        
        // Adicionar ID e classe para referência
        imgElement.id = 'playerCover';
        imgElement.classList.add('player-cover');
        
        // Adicionar ao DOM
        playerInfo.prepend(imgElement);
    }
    
    updateSecurityStatus(url);
    updateFavoriteButton();

    setTimeout(() => {
        try {
            playAudio();
        } catch (error) {
            console.error('Erro ao configurar áudio:', error);
            showNotification("❌ Erro ao configurar reprodução", "error");
        }
    }, 500);
}

// ====================================================
// FUNÇÕES PRINCIPAIS
// ====================================================

/**
 * Busca rádios da API
 * @param {string} query - Termo de busca
 * @param {string} country - País para filtrar
 * @param {string} tag - Tag/gênero para filtrar
 * @param {boolean} append - Se deve adicionar aos resultados existentes
 */
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
            if (!append) {
                radiosContainer.innerHTML = "<p style='text-align:center; padding: 20px;'>😕 Nenhuma rádio encontrada.</p>";
            }
            hasMoreResults = false;
            return;
        }

        hasMoreResults = radios.length === 100;
       
        const html = radios.map(r => {
            const sanitizedRadio = sanitizeRadioData({
                name: r.name,
                url: r.url_resolved,
                favicon: r.favicon,
                country: r.country,
                tags: r.tags
            });
           
            const isFavorite = favorites.some(fav => fav.url === sanitizedRadio.url);
            const isCurrent = currentRadio && currentRadio.url === sanitizedRadio.url;

            return `
                <div class="radio-card ${isFavorite ? 'favorite' : ''} ${isCurrent ? 'playing' : ''}"
                     onclick="playRadio('${r.name.replace(/'/g, "\\'")}', '${r.url_resolved.replace(/'/g, "\\'")}', '${r.favicon ? r.favicon.replace(/'/g, "\\'") : ''}', '${r.country ? r.country.replace(/'/g, "\\'") : ''}', '${r.tags ? r.tags.replace(/'/g, "\\'") : ''}')">
                    ${getRadioImageHTML(sanitizedRadio, 'normal')}
                    <h3>${sanitizedRadio.name}</h3>
                    <small>${sanitizedRadio.country} - ${cleanGenreName(sanitizedRadio.tags)}</small>
                    <div class="progress-container">
                        <div class="progress-bar" style="width:${isCurrent && isPlaying ? '50%' : '0%'}"></div>
                    </div>
                </div>
            `;
        }).join("");

        if (append) {
            radiosContainer.insertAdjacentHTML('beforeend', html);
        } else {
            radiosContainer.innerHTML = html;
        }

        page++;
    } catch (err) {
        console.error("Erro ao buscar rádios:", err);
        if (!append) {
            radiosContainer.innerHTML = "<p style='text-align:center; padding: 20px; color: var(--error-color);'>⚠️ Erro ao carregar as rádios.</p>";
        } else {
            showNotification("⚠️ Erro ao carregar mais rádios.", "error");
        }
    } finally {
        loading = false;
        updateLoadMoreButton();
    }
}

/**
 * Atualiza botão "Ver mais"
 */
function updateLoadMoreButton() {
    const isAllTabActive = document.querySelector('.tab[data-tab="all"]').classList.contains('active');

    if (loading) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<div class="loader"></div> Carregando...';
        loadMoreBtn.classList.remove('hidden');
    } else if (hasMoreResults && isAllTabActive) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Ver mais rádios';
        loadMoreBtn.classList.remove('hidden');
    } else {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = 'Fim da lista';
        loadMoreBtn.classList.add('hidden');
    }
}

/**
 * Atualiza o status de segurança no player
 * @param {string} url - URL a ser verificada
 */
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

// ====================================================
// GERENCIAMENTO DE FAVORITOS
// ====================================================

/**
 * Alterna rádio atual nos favoritos
 */
function toggleFavoriteRadio() {
    if (!currentRadio) return;
    const index = favorites.findIndex(fav => fav.url === currentRadio.url);
    if (index === -1) {
        favorites.push(currentRadio);
        showNotification("⭐ Rádio adicionada aos favoritos", "success");
        toggleFavorite.innerHTML = '<i class="fas fa-star"></i>';
    } else {
        favorites.splice(index, 1);
        showNotification("⭐ Rádio removida dos favoritos", "success");
        toggleFavorite.innerHTML = '<i class="far fa-star"></i>';
    }
    secureLocalStorageSet('favorites', favorites);
    updateFavoritesUI();
    updateRadioCards();
    
    // Atualizar contador
    updateButtonCounters();
}

/**
 * Atualiza botão de favoritos baseado no estado atual
 */
function updateFavoriteButton() {
    if (!currentRadio) return;
    const isFavorite = favorites.some(fav => fav.url === currentRadio.url);
    toggleFavorite.innerHTML = isFavorite ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
}

/**
 * Atualiza interface de favoritos
 */
function updateFavoritesUI() {
    if (favorites.length === 0) {
        favoritesList.innerHTML = "<p style='text-align:center; padding: 20px;'>⭐ Nenhuma rádio favorita ainda.</p>";
        return;
    }
    const header = `
        <div style="text-align:right; margin:5px 15px;">
            <button onclick="showConfirmationModal('clearFavorites')" style="background:var(--error-color);color:#fff;border:none;padding:6px 12px;border-radius:8px;cursor:pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                <i class='fas fa-trash'></i> Remover todas
            </button>
        </div>
    `;
    const html = favorites.map(radio => {
        const isCurrent = currentRadio && currentRadio.url === radio.url;
        const displayTags = cleanGenreName(radio.tags);

        return `
            <div class="radio-card favorite ${isCurrent ? 'playing' : ''}"
                 onclick="playRadio('${radio.name.replace(/'/g, "\\'")}', '${radio.url.replace(/'/g, "\\'")}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                ${getRadioImageHTML(radio, 'normal')}
                <h3>${radio.name}</h3>
                <small>${radio.country} - ${displayTags}</small>
                <button onclick="event.stopPropagation(); removeFavorite('${radio.url}')" style="background:var(--error-color); color:#fff; border:none; padding:4px 8px; border-radius:6px; margin-top:6px; font-size:0.85rem; cursor:pointer; font-weight: 500;">
                    <i class='fas fa-trash'></i> Remover
                </button>
                <div class="progress-container">
                    <div class="progress-bar" style="width:${isCurrent && isPlaying ? '50%' : '0%'}"></div>
                </div>
            </div>`;
    }).join("");

    favoritesList.innerHTML = header + html;
}

/**
 * Remove rádio dos favoritos
 * @param {string} url - URL da rádio a remover
 */
function removeFavorite(url) {
    favorites = favorites.filter(fav => fav.url !== url);
    secureLocalStorageSet('favorites', favorites);
    updateFavoritesUI();
    updateFavoriteButton();
    updateRadioCards();
    showNotification("⭐ Rádio removida dos favoritos", "success");
    
    // Atualizar contador
    updateButtonCounters();
}

/**
 * Limpa todos os favoritos
 */
function clearFavoritesAction() {
    favorites = [];
    secureLocalStorageSet('favorites', favorites);
    updateFavoritesUI();
    updateFavoriteButton();
    updateRadioCards();
    showNotification("⭐ Todos os favoritos removidos", "success");
    
    // Atualizar contador
    updateButtonCounters();
}

// ====================================================
// GERENCIAMENTO DE HISTÓRICO
// ====================================================

/**
 * Atualiza interface de histórico
 */
function updateHistoryUI() {
    if (history.length === 0) {
        historyList.innerHTML = "<p style='text-align:center; padding: 20px;'> Nenhuma rádio no histórico ainda.</p>";
        return;
    }
    const header = `
        <div style="text-align:right; margin:5px 15px;">
            <button onclick="showConfirmationModal('clearAllHistory')" style="background:var(--error-color);color:#fff;border:none;padding:6px 12px;border-radius:8px;cursor:pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                <i class='fas fa-trash'></i> Limpar tudo
            </button>
        </div>
    `;
    const html = history.map(radio => {
        const isCurrent = currentRadio && currentRadio.url === radio.url;
        const displayTags = cleanGenreName(radio.tags);

        return `
            <div class="radio-card ${isCurrent ? 'playing' : ''}"
                 onclick="playRadio('${radio.name.replace(/'/g, "\\'")}', '${radio.url.replace(/'/g, "\\'")}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                ${getRadioImageHTML(radio, 'normal')}
                <h3>${radio.name}</h3>
                <small>${radio.country} - ${displayTags}</small>
                <button onclick="event.stopPropagation(); removeFromHistory('${radio.url}')" style="background:var(--error-color); color:#fff; border:none; padding:4px 8px; border-radius:6px; margin-top:6px; font-size:0.85rem; cursor:pointer; font-weight: 500;">
                    <i class='fas fa-trash'></i> Remover
                </button>
                <div class="progress-container">
                    <div class="progress-bar" style="width:${isCurrent && isPlaying ? '50%' : '0%'}"></div>
                </div>
            </div>`;
    }).join("");
    historyList.innerHTML = header + html;
}

/**
 * Remove rádio do histórico
 * @param {string} url - URL da rádio a remover
 */
function removeFromHistory(url) {
    history = history.filter(item => item.url !== url);
    secureLocalStorageSet('history', history);
    updateHistoryUI();
    updateRadioCards();
    showNotification(" Rádio removida do histórico", "success");
    
    // Atualizar contador
    updateButtonCounters();
}

/**
 * Limpa todo o histórico
 */
function clearAllHistoryAction() {
    history = [];
    secureLocalStorageSet('history', history);
    updateHistoryUI();
    updateRadioCards();
    showNotification(" Histórico de reprodução limpo", "success");
    
    // Atualizar contador
    updateButtonCounters();
}

/**
 * Atualiza estado visual de todos os cards de rádio
 */
function updateRadioCards() {
    const radioCards = document.querySelectorAll('.radio-card');
    radioCards.forEach(card => {
        const onclickAttr = card.getAttribute('onclick');
        if (!onclickAttr) return;

        const urlMatch = onclickAttr.match(/playRadio\('[^']*', '([^']*)'/);
        if (!urlMatch) return;
        const url = urlMatch[1];
       
        const isFavorite = favorites.some(fav => fav.url === url);
        const isCurrent = currentRadio && currentRadio.url === url;
       
        if (isFavorite) {
            card.classList.add('favorite');
        } else {
            card.classList.remove('favorite');
        }

        if (isCurrent && isPlaying) {
            card.classList.add('playing');
        } else {
            card.classList.remove('playing');
        }
       
        const progressBar = card.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = isCurrent && isPlaying ? '50%' : '0%';
        }
    });
}

// ====================================================
// FUNCIONALIDADE PARA FECHAR O PLAYER
// ====================================================

/**
 * Adiciona botão para fechar o player
 */
function addPlayerCloseButton() {
    if (!playerFixedEl) {
        return;
    }
    
    if (document.getElementById('closePlayerBtn')) {
        return;
    }
    
    const closeBtn = document.createElement('button');
    closeBtn.id = 'closePlayerBtn';
    closeBtn.className = 'player-close-btn';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.setAttribute('title', 'Fechar player (o áudio continuará tocando)');
    closeBtn.setAttribute('aria-label', 'Fechar player');
    
    if (!document.getElementById('playerCloseStyles')) {
        const style = document.createElement('style');
        style.id = 'playerCloseStyles';
        style.textContent = `
            .player-close-btn {
                position: absolute;
                top: -12px;
                right: -12px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: var(--error-color);
                color: white;
                border: 3px solid var(--player-color);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 1000;
                font-size: 14px;
                opacity: 0.9;
                transition: all 0.3s ease;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
            
            .player-close-btn:hover {
                opacity: 1;
                transform: scale(1.1);
                background: #ff4757;
                box-shadow: 0 3px 15px rgba(255, 71, 87, 0.4);
            }
            
            .player-close-btn:active {
                transform: scale(0.95);
            }
            
            .player-fixed.hidden .player-close-btn {
                display: none;
            }
            
            @media (max-width: 768px) {
                .player-close-btn {
                    top: -8px;
                    right: -8px;
                    width: 28px;
                    height: 28px;
                    font-size: 12px;
                }
            }
            
            .player-fixed.playing .player-close-btn {
                animation: pulse-border 2s infinite;
            }
            
            @keyframes pulse-border {
                0% {
                    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
                }
                70% {
                    box-shadow: 0 0 0 6px rgba(255, 71, 87, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closePlayer();
    });
    
    playerFixedEl.appendChild(closeBtn);
}

/**
 * Adiciona botão flutuante para reabrir o player
 */
function addReopenPlayerButton() {
    const existingBtn = document.getElementById('reopenPlayerBtn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    if (!document.getElementById('reopenPlayerStyles')) {
        const style = document.createElement('style');
        style.id = 'reopenPlayerStyles';
        style.textContent = `
            .reopen-player-btn {
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: var(--accent-gradient);
                color: white;
                border: 3px solid var(--player-color);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 9999;
                font-size: 24px;
                opacity: 0.95;
                transition: all 0.3s ease;
                box-shadow: 0 6px 25px color-mix(in srgb, var(--accent-primary) 50%, transparent);
                animation: float 3s ease-in-out infinite;
            }
            
            .reopen-player-btn:hover {
                opacity: 1;
                transform: translateX(-50%) scale(1.05);
                box-shadow: 0 8px 30px color-mix(in srgb, var(--accent-primary) 70%, transparent);
            }
            
            .reopen-player-btn:active {
                transform: translateX(-50%) scale(0.95);
            }
            
            .reopen-player-btn.pulse {
                animation: pulse 1.5s infinite;
            }
            
            .reopen-player-btn.playing::after {
                content: '';
                position: absolute;
                top: -4px;
                right: -4px;
                width: 16px;
                height: 16px;
                background: #2bde73;
                border-radius: 50%;
                border: 2px solid var(--player-color);
                animation: blink 1.5s infinite;
                box-shadow: 0 0 10px #2bde73, 0 0 20px #2bde73 inset;
                z-index: 9999;
            }
            
            .reopen-player-btn.paused::after {
                content: '';
                position: absolute;
                top: -4px;
                right: -4px;
                width: 16px;
                height: 16px;
                background: #ffa500;
                border-radius: 50%;
                border: 2px solid var(--player-color);
                animation: none;
                box-shadow: 0 0 10px #ffa500, 0 0 20px #ffa500 inset;
                z-index: 9999;
            }
            
            @keyframes float {
                0%, 100% {
                    transform: translateX(-50%) translateY(0);
                }
                50% {
                    transform: translateX(-50%) translateY(-8px);
                }
            }
            
            @keyframes pulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(0, 216, 255, 0.7);
                }
                70% {
                    box-shadow: 0 0 0 15px rgba(0, 216, 255, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(0, 216, 255, 0);
                }
            }
            
            @keyframes blink {
                0%, 50% {
                    opacity: 1;
                }
                51%, 100% {
                    opacity: 0.3;
                }
            }
            
            @media (max-width: 768px) {
                .reopen-player-btn {
                    width: 65px;
                    height: 65px;
                    font-size: 22px;
                    bottom: 90px;
                }
            }
            
            @media (orientation: landscape) and (max-height: 600px) {
                .reopen-player-btn {
                    width: 60px;
                    height: 60px;
                    font-size: 20px;
                    bottom: 70px;
                }
            }
            
            .player-fixed:not(.hidden) ~ .reopen-player-btn,
            body:has(.player-fixed:not(.hidden)) .reopen-player-btn,
            .player-fixed:not(.hidden) + .reopen-player-btn {
                display: none !important;
            }
            
            .player-fixed {
                z-index: 10000;
            }
            
            .reopen-player-btn {
                z-index: 9999;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    const reopenBtn = document.createElement('button');
    reopenBtn.id = 'reopenPlayerBtn';
    reopenBtn.className = 'reopen-player-btn';
    reopenBtn.innerHTML = '<i class="fas fa-music"></i>';
    
    // Adicionar classe baseada no estado de reprodução
    if (isPlaying) {
        reopenBtn.classList.add('playing');
        reopenBtn.classList.remove('paused');
        reopenBtn.classList.add('pulse');
        reopenBtn.setAttribute('title', 'Rádio tocando - Clique para mostrar player');
    } else {
        reopenBtn.classList.add('paused');
        reopenBtn.classList.remove('playing');
        reopenBtn.classList.remove('pulse');
        reopenBtn.setAttribute('title', 'Rádio pausada - Clique para mostrar player');
    }
    
    reopenBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        reopenPlayer();
    });
    
    document.body.appendChild(reopenBtn);
    adjustReopenButtonPosition();
}

/**
 * Atualiza o estado visual do botão flutuante
 */
function updateReopenPlayerButton() {
    const reopenBtn = document.getElementById('reopenPlayerBtn');
    if (!reopenBtn) return;
    
    if (isPlaying) {
        reopenBtn.classList.add('playing');
        reopenBtn.classList.remove('paused');
        reopenBtn.classList.add('pulse');
        reopenBtn.setAttribute('title', 'Rádio tocando - Clique para mostrar player');
    } else {
        reopenBtn.classList.add('paused');
        reopenBtn.classList.remove('playing');
        reopenBtn.classList.remove('pulse');
        reopenBtn.setAttribute('title', 'Rádio pausada - Clique para mostrar player');
    }
}

/**
 * Ajusta a posição do botão flutuante baseado na orientação
 */
function adjustReopenButtonPosition() {
    const reopenBtn = document.getElementById('reopenPlayerBtn');
    if (!reopenBtn) return;
    
    const isLandscape = window.innerWidth > window.innerHeight;
    const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 600;
    
    if (isLandscape && isSmallScreen) {
        reopenBtn.style.bottom = '60px';
        reopenBtn.style.width = '60px';
        reopenBtn.style.height = '60px';
        reopenBtn.style.fontSize = '20px';
    } else if (isSmallScreen) {
        reopenBtn.style.bottom = '80px';
        reopenBtn.style.width = '65px';
        reopenBtn.style.height = '65px';
        reopenBtn.style.fontSize = '22px';
    } else {
        reopenBtn.style.bottom = '100px';
        reopenBtn.style.width = '70px';
        reopenBtn.style.height = '70px';
        reopenBtn.style.fontSize = '24px';
    }
    
    reopenBtn.style.left = '50%';
    reopenBtn.style.transform = 'translateX(-50%)';
}

/**
 * Fecha o player (apenas visualmente)
 */
function closePlayer() {
    playerFixedEl.classList.add('hidden');
    showNotification('🎧 Player minimizado. O áudio continua tocando em segundo plano.', 'info');
    
    // Adicionar botão flutuante com estado correto
    addReopenPlayerButton();
}

/**
 * Reabre o player
 */
function reopenPlayer() {
    playerFixedEl.classList.remove('hidden');
    
    const reopenBtn = document.getElementById('reopenPlayerBtn');
    if (reopenBtn) {
        reopenBtn.remove();
    }
    
    showNotification('🎧 Player restaurado', 'success');
}

// ====================================================
// CONTROLES DE UI E MODAIS
// ====================================================

// Gerenciador de Tabs
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
       
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
       
        tab.classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
       
        if (tabName === 'favorites') updateFavoritesUI();
        if (tabName === 'history') updateHistoryUI();

        updateLoadMoreButton();
    });
});

// Event listeners para modais
openFilters.addEventListener('click', () => {
    filtersModal.style.display = "flex";
    setTimeout(() => {
        searchInput.focus();
    }, 100);
});

closeFilters.addEventListener('click', () => filtersModal.style.display = "none");
openFavorites.addEventListener('click', () => showFavoritesModal());
closeFavorites.addEventListener('click', () => favoritesModal.style.display = "none");
openHistory.addEventListener('click', () => showHistoryModal());
closeHistory.addEventListener('click', () => historyModal.style.display = "none");
closePageModal.addEventListener('click', () => pageModal.style.display = "none");

// Fechar modais ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === favoritesModal) {
        favoritesModal.style.display = "none";
    }
    if (e.target === historyModal) {
        historyModal.style.display = "none";
    }
    if (e.target === filtersModal) {
        filtersModal.style.display = "none";
        genreResultsList.style.display = 'none';
    }
    if (e.target === pageModal) {
        pageModal.style.display = "none";
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (filtersModal.style.display === 'flex') {
            filtersModal.style.display = "none";
            genreResultsList.style.display = 'none';
        }
        if (favoritesModal.style.display === 'flex') {
            favoritesModal.style.display = "none";
        }
        if (historyModal.style.display === 'flex') {
            historyModal.style.display = "none";
        }
        if (pageModal.style.display === 'flex') {
            pageModal.style.display = "none";
        }
        
        if (!playerFixedEl.classList.contains('hidden')) {
            closePlayer();
        }
    }
});

/**
 * Exibe modal de favoritos
 */
function showFavoritesModal() {
    if (favorites.length === 0) {
        document.getElementById('favoritesModalList').innerHTML = "<p class='modal-empty-message'><i class='fas fa-star'></i><br>Nenhuma rádio favorita ainda.</p>";
    } else {
        const html = favorites.map(radio => {
            const isCurrent = currentRadio && currentRadio.url === radio.url;
            const displayTags = cleanGenreName(radio.tags);

            const imgHTML = getRadioImageHTML(radio, 'small');

            return `
                <div class="modal-radio-item" onclick="playRadio('${radio.name.replace(/'/g, "\\'")}', '${radio.url.replace(/'/g, "\\'")}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                    ${imgHTML}
                    <div class="modal-radio-info">
                        <h3>${radio.name}</h3>
                        <p>${radio.country} • ${displayTags}</p>
                    </div>
                    <button class="modal-play-btn" onclick="event.stopPropagation(); playRadio('${radio.name.replace(/'/g, "\\'")}', '${radio.url.replace(/'/g, "\\'")}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                        <i class="fas fa-${isCurrent && isPlaying ? 'pause' : 'play'}"></i>
                    </button>
                </div>
            `}).join("");
        document.getElementById('favoritesModalList').innerHTML = html;
    }
    favoritesModal.style.display = "flex";
}

/**
 * Exibe modal de histórico
 */
function showHistoryModal() {
    if (history.length === 0) {
        document.getElementById('historyModalList').innerHTML = "<p class='modal-empty-message'><i class='fas fa-history'></i><br>Nenhuma rádio no histórico ainda.</p>";
    } else {
        const html = history.map(radio => {
            const isCurrent = currentRadio && currentRadio.url === radio.url;
            const displayTags = cleanGenreName(radio.tags);
            const date = new Date(radio.date);
            const timeAgo = formatTimeAgo(date);

            const imgHTML = getRadioImageHTML(radio, 'small');

            return `
                <div class="modal-radio-item" onclick="playRadio('${radio.name.replace(/'/g, "\\'")}', '${radio.url.replace(/'/g, "\\'")}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                    ${imgHTML}
                    <div class="modal-radio-info">
                        <h3>${radio.name}</h3>
                        <p>${radio.country} • ${displayTags}</p>
                        <small style="font-size: 0.7rem; opacity: 0.6;">${timeAgo}</small>
                    </div>
                    <button class="modal-play-btn" onclick="event.stopPropagation(); playRadio('${radio.name.replace(/'/g, "\\'")}', '${radio.url.replace(/'/g, "\\'")}', '${radio.favicon ? radio.favicon.replace(/'/g, "\\'") : ''}', '${radio.country ? radio.country.replace(/'/g, "\\'") : ''}', '${radio.tags ? radio.tags.replace(/'/g, "\\'") : ''}')">
                        <i class="fas fa-${isCurrent && isPlaying ? 'pause' : 'play'}"></i>
                    </button>
                </div>
            `}).join("");
        document.getElementById('historyModalList').innerHTML = html;
    }
    historyModal.style.display = "flex";
}

/**
 * Formata tempo relativo para exibição
 * @param {Date} date - Data a ser formatada
 * @returns {string} Tempo relativo formatado
 */
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

// ====================================================
// CONTEÚDO DAS PÁGINAS
// ====================================================
const pageContents = {
    privacy: `
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
        <p>Implementamos validações básicas de URL e sanitização de HTML para mitigar riscos de segurança, mas você é responsável por verificar a segurança das estações que decide ouvir. Usamos HTTPS e validamos fontes externas para proteger suas informações contra acesso não autorizado.</p>
        <h3>6. Contato</h3>
        <p>Para questões sobre privacidade, entre em contato: <a href="mailto:juliogonzales.dev@proton.me" class="site-link gradient-link email-link">juliogonzales.dev@proton.me</a></p>
    `,
    terms: `
        <h2><i class="fas fa-file-signature"></i> Termos de Uso</h2>
        <h3>1. Aceitação dos Termos</h3>
        <p>Ao usar o Grid Rádio Online, você concorda com estes termos de uso.</p>
        <h3>2. Serviço</h3>
        <p>O Grid Rádio Online é um agregador de estações de rádio online. Não hospedamos nenhum conteúdo de áudio.</p>
        <h3>3. Uso Aceitável</h3>
        <p>Você concorda em usar o serviço apenas para fins legais e de acordo com todas as leis aplicáveis.</p>
        <h3>4. Direitos Autorais</h3>
        <p>Todo o conteúdo de áudio transmitido pertence às respectivas estações de rádio. Respeite os direitos autorais.</p>
        <h3>5. Limitação de Responsabilidade</h3>
        <p>Não nos responsabilizamos por:</p>
        <ul>
            <li>Interrupções no serviço</li>
            <li>Conteúdo das estações de rádio</li>
            <li>Problemas técnicos nas transmissões</li>
        </ul>
        <h3>6. Modificações</h3>
        <p>Reservamo-nos o direito de modificar estes termos a qualquer momento.</p>
    `,
    dmca: `
        <h2><i class="fas fa-gavel"></i> Política DMCA</h2>
        
        <div class="educational-notice" style="background: var(--player-color); padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 3px solid var(--accent-primary);">
            <p style="margin: 0; font-size: 0.9rem;">
                <strong><i class="fas fa-graduation-cap"></i> Nota:</strong> Este projeto tem caráter educacional e utiliza a API pública do Radio Browser para fins de aprendizado em desenvolvimento web.
            </p>
        </div>
        
        <h3>Notificação de Infração de Direitos Autorais</h3>
        <p>O Grid Rádio Online respeita os direitos de propriedade intelectual. Se você acredita que seu trabalho foi copiado de forma que constituis violação de direitos autorais, envie uma notificação para:</p>
        
        <p><strong>Email:</strong> <a href="mailto:juliogonzales.dev@proton.me" class="site-link gradient-link">juliogonzales.dev@proton.me</a></p>
        
        <h3>Informações Requeridas</h3>
        <p>Sua notificação deve incluir:</p>
        <ul>
            <li>Assinatura do proprietário dos direitos autorais</li>
            <li>Identificação do trabalho protegido</li>
            <li>Identificação do material alegadamente infringente</li>
            <li>Suas informações de contato</li>
            <li>Declaração de boa fé</li>
        </ul>
        
        <h3>Ação</h3>
        <p>Upon receipt of a valid DMCA notice, we will promptly remove or disable access to the allegedly infringing content.</p>
        
        <div style="font-size: 0.8rem; color: color-mix(in srgb, var(--text-color) 60%, transparent); text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid color-mix(in srgb, var(--text-color) 20%, transparent);">
            <p><strong>Projeto educacional</strong> • Desenvolvido para fins de aprendizado</p>
        </div>
    `,
    about: `
        <h2><i class="fas fa-circle-info"></i> Sobre o Grid Rádio Online</h2>
        <p>O Grid Rádio Online é um projeto de caráter educacional de código aberto, criado com o objetivo de oferecer uma interface simples e moderna para acessar rádios de todo o mundo, utilizando a API pública do <a href="http://www.radio-browser.info/" target="_blank" class="site-link gradient-link">radio-browser.info</a>.</p>
        <p>Este projeto foca em:</p>
        <ul>
            <li><strong>Desempenho:</strong> Carregamento rápido e eficiente.</li>
            <li><strong>Design Moderno:</strong> Interface amigável e responsiva.</li>
            <li><strong>Privacidade:</strong> Não coleta dados pessoais.</li>
        </ul>
        <p>Código fonte disponível no <a href="https://github.com/Julioheyner" target="_blank" class="site-link gradient-link"><i class="fab fa-github"></i> GitHub</a>.</p>
        <div class="socials">
            <a href="https://github.com/Julioheyner" title="GitHub" rel="noopener noreferrer" target="_blank" class="social-icon">
                <i class="fab fa-github"></i>
            </a>
            <a href="https://www.linkedin.com/in/julio-gonzales-31a723379" title="LinkedIn" rel="noopener noreferrer" target="_blank" class="social-icon">
                <i class="fab fa-linkedin"></i>
            </a>
            <a href="mailto:juliogonzales.dev@proton.me" title="Email" class="social-icon">
                <i class="fas fa-envelope"></i>
            </a>
        </div>
    `
};

// ====================================================
// FUNÇÕES DE REMOÇÃO (COM MODAL)
// ====================================================
const confirmationModal = document.createElement('div');
confirmationModal.id = 'confirmationModal';
confirmationModal.className = 'modal';
confirmationModal.innerHTML = `
    <div class="modal-content" style="font-size: 0.85rem;max-width: 300px;">
        <h2 id="confirmTitle"><i class="fas fa-question-circle"></i> Confirmar</h2>
        <p id="confirmMessage" style="margin: 20px 0;"></p>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <button id="confirmYes" style="
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #ff3366 0%, #ff2e63 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-weight: 600;
                font-size: 0.95rem;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(255, 46, 99, 0.3);
                position: relative;
                overflow: hidden;
                letter-spacing: 0.5px;
            ">
                <span style="position: relative; z-index: 2">
                    <i class="fas fa-trash-alt" style="margin-right: 8px;"></i>Sim, Remover
                </span>
                <div style="
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, 
                        transparent, 
                        rgba(255, 255, 255, 0.3), 
                        transparent);
                    transition: left 0.6s ease;
                "></div>
            </button>
            
            <button id="confirmNo" style="
                width: 100%;
                padding: 14px;
                background: var(--player-color);
                color: var(--text-color);
                border: 2px solid rgba(0, 216, 255, 0.4);
                border-radius: 10px;
                font-weight: 600;
                font-size: 0.95rem;
                cursor: pointer;
                transition: all 0.3s ease;
                letter-spacing: 0.5px;
                backdrop-filter: blur(5px);
            ">
                <i class="fas fa-times" style="margin-right: 8px;"></i>Não, Cancelar
            </button>
        </div>
    </div>
`;

// Adicionar estilos de hover via JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');
    
    if (confirmYes) {
        confirmYes.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(255, 46, 99, 0.4)';
        });
        
        confirmYes.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(255, 46, 99, 0.3)';
        });
        
        confirmYes.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(1px)';
            this.style.boxShadow = '0 2px 10px rgba(255, 46, 99, 0.2)';
        });
        
        confirmYes.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(255, 46, 99, 0.4)';
        });
        
        // Efeito de brilho ao passar o mouse
        confirmYes.addEventListener('mouseenter', function() {
            const shine = this.querySelector('div');
            shine.style.left = '100%';
        });
        
        confirmYes.addEventListener('mouseleave', function() {
            const shine = this.querySelector('div');
            shine.style.left = '-100%';
        });
    }
    
    if (confirmNo) {
        confirmNo.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.background = 'rgba(26, 39, 70, 0.9)';
            this.style.borderColor = 'rgba(0, 216, 255, 0.7)';
            this.style.boxShadow = '0 4px 15px rgba(0, 216, 255, 0.2)';
        });
        
        confirmNo.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.background = 'var(--player-color)';
            this.style.borderColor = 'rgba(0, 216, 255, 0.4)';
            this.style.boxShadow = 'none';
        });
        
        confirmNo.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(1px)';
        });
        
        confirmNo.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-2px)';
        });
    }
});
document.body.appendChild(confirmationModal);

const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');
confirmNo.onclick = () => confirmationModal.style.display = 'none';

/**
 * Exibe modal de confirmação para ações destrutivas
 * @param {string} action - Ação a ser confirmada
 */
function showConfirmationModal(action) {
    confirmationModal.style.display = 'flex';

    if (action === 'clearFavorites') {
        confirmTitle.innerHTML = '<i class="fas fa-star" style="font-size: 1.1rem;"></i> <span style="font-size: 1.1rem; font-weight: 800">Remover Favoritos</span>';
        confirmMessage.textContent = "Deseja remover todas as rádios favoritas?";
        confirmYes.onclick = () => {
            clearFavoritesAction();
            confirmationModal.style.display = 'none';
        };
        confirmYes.style.backgroundColor = 'var(--error-color)';
    } else if (action === 'clearAllHistory') {
        confirmTitle.innerHTML = '<i class="fas fa-history"></i> Limpar Histórico';
        confirmMessage.textContent = "Deseja remover todo o histórico de reprodução?";
        confirmYes.onclick = () => {
            clearAllHistoryAction();
            confirmationModal.style.display = 'none';
        };
        confirmYes.style.backgroundColor = 'var(--error-color)';
    }
}

// ====================================================
// CONTROLES DO PLAYER E EVENT LISTENERS
// ====================================================
toggleFavorite.addEventListener('click', toggleFavoriteRadio);
playPauseBtn.addEventListener('click', togglePlayPause);
loadMoreBtn.addEventListener('click', () => fetchRadios(currentQuery, currentCountry, currentTag, true));

// Pesquisa
searchBtn.addEventListener('click', () => {
    currentQuery = searchInput.value;
    currentCountry = countrySelect.value;
    currentTag = genreSelect.value;
   
    fetchRadios(currentQuery, currentCountry, currentTag);
    filtersModal.style.display = "none";
    genreResultsList.style.display = 'none';
});

// Função para buscar com Enter
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchBtn.click();
    }
});

genreSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchBtn.click();
    }
});

/**
 * Exibe página de conteúdo no modal
 * @param {string} pageName - Nome da página a ser exibida
 */
function showPage(pageName) {
    pageContent.innerHTML = pageContents[pageName] || '<p style="padding: 20px;">Página não encontrada.</p>';
    pageModal.style.display = "flex";
}

/**
 * Mostra notificação na tela
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da notificação (success, warning, error, info)
 */
function showNotification(message, type) {
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'}"></i> ${sanitizeHTML(message)}`;
    notification.className = `notification ${type} show`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ====================================================
// CARREGAMENTO DE FILTROS
// ====================================================

/**
 * Carrega países e gêneros para os filtros
 */
async function loadFilters() {
    try {
        const [countries, tags] = await Promise.all([
            fetch(`${API_BASE}/countries`).then(r => r.json()),
            fetch(`${API_BASE}/tags`).then(r => r.json())
        ]);

        // Carregar países
        countries.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
            const opt = document.createElement("option");
            opt.value = sanitizeHTML(c.name);
            opt.textContent = sanitizeHTML(c.name);
            countrySelect.appendChild(opt);
        });

        // Armazenar tags para busca rápida
        allGenreTags = tags.map(t => ({
            tag: t.name,
            display: cleanGenreName(t.name)
        }));
       
        // Adicionar Vallenato se não estiver na lista
        const vallenatoTag = 'vallenato';
        if (!allGenreTags.some(t => t.tag.toLowerCase() === vallenatoTag)) {
            allGenreTags.push({ tag: vallenatoTag, display: 'Vallenato (Colômbia)' });
        }
       
        allGenreTags.sort((a, b) => a.display.localeCompare(b.display));

        genreSelect.innerHTML = '<option value="">🎶 Todos os gêneros</option>';
       
        allGenreTags.forEach(g => {
            const opt = document.createElement("option");
            opt.textContent = g.display;
            opt.value = g.tag;
            genreSelect.appendChild(opt);
        });
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
        showNotification("Erro ao carregar filtros. Tente novamente mais tarde.", "error");
    }
}

// ====================================================
// LÓGICA DE BUSCA RÁPIDA DE GÊNEROS
// ====================================================
const genreSearchContainer = document.querySelector('#genreSearchContainer');

genreSearchInput.addEventListener('input', filterGenreResults);

/**
 * Filtra resultados de gêneros baseado na busca
 */
function filterGenreResults() {
    const query = normalizeText(genreSearchInput.value).trim();
    genreResultsList.innerHTML = '';
   
    if (query.length < 3) {
        genreResultsList.style.display = 'none';
        return;
    }
   
    const filtered = allGenreTags.filter(genre => {
        return normalizeText(genre.display).includes(query) || normalizeText(genre.tag).includes(query);
    });

    if (filtered.length > 0) {
        filtered.forEach(genre => {
            const item = document.createElement('button');
            item.className = 'genre-item';
            item.textContent = genre.display;
            item.setAttribute('data-tag', genre.tag);
           
            item.addEventListener('click', () => selectGenre(item, genre.tag, genre.display));
           
            genreResultsList.appendChild(item);
        });
        genreResultsList.style.display = 'block';
    } else {
        genreResultsList.style.display = 'none';
    }
}

/**
 * Seleciona um gênero da lista de resultados
 * @param {HTMLElement} item - Elemento HTML do gênero
 * @param {string} tag - Tag do gênero
 * @param {string} display - Nome de exibição do gênero
 */
function selectGenre(item, tag, display) {
    genreSearchInput.value = display;
    genreSelect.value = tag;
    genreResultsList.style.display = 'none';
    document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
}

// ====================================================
// GERENCIAMENTO DE TEMA
// ====================================================
themeToggle.addEventListener("click", () => {
    const isLight = document.body.getAttribute("data-theme") === "light";
    const newTheme = isLight ? "dark" : "light";
    
    document.body.setAttribute("data-theme", newTheme);
    
    const icon = themeToggle.querySelector('i');
    if (newTheme === "light") {
        icon.className = "fas fa-sun";
    } else {
        icon.className = "fas fa-moon";
    }
    
    secureLocalStorageSet("theme", newTheme);
});

// Volume do áudio
audioPlayer.addEventListener('volumechange', () => {
    secureLocalStorageSet('volume', audioPlayer.volume);
});

// ====================================================
// INICIALIZAÇÃO SEGURA
// ====================================================
document.addEventListener("DOMContentLoaded", () => {
    /**
     * Limpa dados corrompidos do localStorage
     */
    function cleanCorruptedData() {
        const keys = ['favorites', 'history'];
        keys.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    JSON.parse(data);
                }
            } catch (error) {
                localStorage.removeItem(key);
            }
        });
    }
    
    cleanCorruptedData();
    
    // Carregar dados
    favorites = secureLocalStorageGet('favorites', []);
    history = secureLocalStorageGet('history', []);
    
    console.log('📊 Dados carregados:', {
        favoritesCount: favorites.length,
        historyCount: history.length
    });
    
    const savedTheme = secureLocalStorageGet("theme", "dark");
    document.body.setAttribute("data-theme", savedTheme);
    themeToggle.innerHTML = savedTheme === "light" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
   
    audioPlayer.volume = secureLocalStorageGet("volume", 0.8);
    
    setupAudioEventListeners();

    loadFilters();
    fetchRadios();
    updateFavoritesUI();
    updateHistoryUI();
    
    // Atualizar contadores no carregamento
    updateButtonCounters();
    
    // Verificar novamente após um pequeno delay para garantir
    setTimeout(() => {
        updateButtonCounters();
        console.log('✅ Contadores atualizados após inicialização');
    }, 500);
    
    setTimeout(() => {
        addPlayerCloseButton();
    }, 1000);
    
    // Atalho de teclado Ctrl+Alt+P para alternar player
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.altKey && e.key === 'p') {
            e.preventDefault();
            
            if (playerFixedEl.classList.contains('hidden')) {
                reopenPlayer();
            } else {
                closePlayer();
            }
        }
    });
    
    window.addEventListener('resize', function() {
        adjustReopenButtonPosition();
    });
    
    window.addEventListener('orientationchange', function() {
        setTimeout(adjustReopenButtonPosition, 100);
    });
});

// ====================================================
// PROTEÇÕES ADICIONAIS
// ====================================================
if (window.audioPlayerInstance) {
    window.audioPlayerInstance.pause();
    window.audioPlayerInstance.src = '';
}
window.audioPlayerInstance = audioPlayer;

window.addEventListener('beforeunload', () => {
    stopAudioHealthCheck();
    if (retryTimeout) {
        clearTimeout(retryTimeout);
    }
    audioPlayer.pause();
    audioPlayer.src = '';
    
    const reopenBtn = document.getElementById('reopenPlayerBtn');
    if (reopenBtn) {
        reopenBtn.remove();
    }
});

setTimeout(() => {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        if (!script.src && (script.innerHTML.includes('eval') || script.innerHTML.includes('Function'))) {
            script.remove();
        }
    });
}, 1000);

// ====================================================
// FUNÇÕES DE DEBUG (para uso no console)
// ====================================================

/**
 * Função para debug dos contadores (para testar no console)
 */
window.debugCounters = function() {
    console.log('🔍 Debug contadores:', {
        favorites: favorites,
        history: history,
        favCount: favorites.length,
        histCount: history.length,
        localStorageFavorites: localStorage.getItem('favorites'),
        localStorageHistory: localStorage.getItem('history')
    });
    updateButtonCounters();
};

/**
 * Força atualização dos contadores
 */
function forceUpdateCounters() {
    console.log('🔄 Forçando atualização dos contadores...');
    updateButtonCounters();
}