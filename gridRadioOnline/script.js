//Efeito da Imagem do HERO 
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

// ===============================
// CONFIGURAÇÕES DE SEGURANÇA E UTILS
// ===============================
const SECURITY_CONFIG = {
    ALLOWED_PROTOCOLS: ['http:', 'https:'],
    ALLOWED_AUDIO_DOMAINS: ['cast.streamhosting.rs', 's2.voscast.com', 'streaming.radio.co', 'stream.zeno.fm', 'live.hunter.fm', 'icecast-fan.musicradio.com', 'live.stream', 'stream.host', 'stream.serv', 'stream.audio', 'stream.radio'],
    BLOCKED_DOMAINS: ['script', 'virus', 'malware', 'bad', 'evil', 'spam', 'ad', 'tracker', 'analytic', 'miner'],
    SUSPICIOUS_PATTERNS: [/(\.exe|\.js|\.php|\.cgi|\.pl)$/i, /eval\(|Function\(|document\.write/i]
};

// ==================
// VARIÁVEIS GLOBAIS
// ==================
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

// Variáveis de estado do áudio
let allGenreTags = [];
let page = 1;
let loading = false;
let currentQuery = "", currentCountry = "", currentTag = "";
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

// =====================
// CONTEÚDO DAS PÁGINAS
// =====================
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
    // No arquivo script.js, atualize apenas o conteúdo dmca:

dmca: `
    <h2><i class="fas fa-gavel"></i> Política DMCA</h2>
    
    <div class="educational-notice" style="background: var(--player-color); padding: 12px; border-radius: 8px; margin: 15px 0; border-left: 3px solid var(--accent-primary);">
        <p style="margin: 0; font-size: 0.9rem;">
            <strong><i class="fas fa-graduation-cap"></i> Nota:</strong> Este projeto tem caráter educacional e utiliza a API pública do Radio Browser para fins de aprendizado em desenvolvimento web.
        </p>
    </div>
    
    <h3>Notificação de Infração de Direitos Autorais</h3>
    <p>O Grid Rádio Online respeita os direitos de propriedade intelectual. Se você acredita que seu trabalho foi copiado de forma que constitui violação de direitos autorais, envie uma notificação para:</p>
    
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

// ======================
// FUNÇÕES DE UTILIDADE
// ======================

/**
 * Função para sanitizar HTML
 */
function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Funções de localStorage seguras - VERSÃO CORRIGIDA
 */
function secureLocalStorageSet(key, value) {
    try {
        // 🔧 CORREÇÃO: Converter arrays para objetos simples antes de salvar
        if (Array.isArray(value)) {
            // Para cada item do array, garantir que seja um objeto serializável
            const serializableValue = value.map(item => {
                // Criar um objeto simples com apenas os dados necessários
                const simpleItem = {
                    name: item.name || '',
                    url: item.url || '',
                    favicon: item.favicon || '',
                    country: item.country || '',
                    tags: item.tags || ''
                };
                
                // Incluir a data apenas para histórico
                if (item.date) {
                    simpleItem.date = item.date;
                }
                
                return simpleItem;
            });
            localStorage.setItem(key, JSON.stringify(serializableValue));
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
        console.log(`✅ Dados salvos em localStorage (${key}):`, value.length || value);
    } catch (error) {
        console.error('❌ Erro ao salvar no localStorage:', error);
        // Tentar limpar o localStorage se estiver cheio
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
                localStorage.setItem(key, JSON.stringify(serializableValue.slice(0, 10))); // Salvar apenas os 10 primeiros
            }
        } catch (e) {
            console.error('Não foi possível limpar o localStorage:', e);
        }
    }
}

function secureLocalStorageGet(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        if (!data) {
            console.log(`📭 Nenhum dado encontrado para ${key}, usando valor padrão`);
            return defaultValue;
        }
        
        const parsed = JSON.parse(data);
        
        if (Array.isArray(parsed)) {
            // 🔧 CORREÇÃO: Aplicar sanitização em cada item do array
            const sanitizedArray = parsed.map(item => {
                // Verificar se o item tem a estrutura esperada
                if (typeof item !== 'object' || item === null) {
                    return null;
                }
                
                // Garantir que todos os campos necessários existam
                const sanitizedItem = sanitizeRadioData({
                    name: item.name || '',
                    url: item.url || '',
                    favicon: item.favicon || '',
                    country: item.country || '',
                    tags: item.tags || ''
                });
                
                // Preservar a data para histórico
                if (item.date) {
                    sanitizedItem.date = item.date;
                }
                
                return sanitizedItem;
            }).filter(item => item !== null && item.url); // Remover itens inválidos
            
            console.log(`✅ Dados recuperados de localStorage (${key}):`, sanitizedArray.length, 'itens');
            return sanitizedArray;
        }
        
        console.log(`✅ Dado recuperado de localStorage (${key}):`, parsed);
        return parsed;
    } catch (error) {
        console.error('❌ Erro ao recuperar do localStorage:', error);
        // Tentar limpar dados corrompidos
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Não foi possível remover item corrompido:', e);
        }
        return defaultValue;
    }
}

/**
 * Validação de URL
 */
function validateURL(url) {
    try {
        const urlObj = new URL(url);
        if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
            console.warn('Protocolo não permitido:', urlObj.protocol);
            return false;
        }
        for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
            if (pattern.test(url)) {
                console.warn('URL contém padrão suspeito:', pattern);
                return false;
            }
        }
        const domain = urlObj.hostname.toLowerCase();
        for (const blocked of SECURITY_CONFIG.BLOCKED_DOMAINS) {
            if (domain.includes(blocked)) {
                console.warn('Domínio bloqueado:', domain);
                return false;
            }
        }
        return true;
    } catch (error) {
        console.warn('URL inválida:', error);
        return false;
    }
}

/**
 * Verifica se URL é segura para áudio
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
            if (path.includes('.mp3') || path.includes('.ogg') || path.includes('.wav') || path.includes('.aac') || path.includes('.m3u') || path.includes('.pls') || path.includes('/stream') || path.includes('/live') || path.includes('/radio')) {
                return true;
            }
        }
        console.warn('Domínio de áudio não verificado:', domain);
        return false;
    } catch (error) {
        console.warn('Erro ao verificar URL de áudio:', error);
        return false;
    }
}

/**
 * Sanitiza dados da rádio - VERSÃO CORRIGIDA
 */
function sanitizeRadioData(radio) {
    const DEFAULT_ICON = 'https://cdn-icons-png.flaticon.com/512/727/727245.png';
    
    if (!radio || typeof radio !== 'object') {
        return {
            name: 'Rádio Desconhecida',
            url: '',
            favicon: DEFAULT_ICON,
            country: 'Desconhecido',
            tags: 'Sem Gênero'
        };
    }
    
    // Validar e limpar o nome da rádio
    const name = sanitizeHTML(radio.name) || 'Rádio Desconhecida';
    
    // Validar URL de áudio
    const url = radio.url || '';
    
    // 🔧 CORREÇÃO: Processar favicon de forma mais robusta
    let favicon = DEFAULT_ICON;
    
    if (radio.favicon && typeof radio.favicon === 'string') {
        const faviconStr = radio.favicon.trim();
        
        // Verificar se é uma URL válida
        if (faviconStr.length > 5 && 
            !faviconStr.includes('undefined') && 
            !faviconStr.includes('null') &&
            faviconStr !== 'https://' &&
            faviconStr !== 'http://' &&
            faviconStr !== MUSIC_ICON_SVG) {
            
            // Se começa com //, converter para https:
            if (faviconStr.startsWith('//')) {
                favicon = 'https:' + faviconStr;
            }
            // Se já é uma URL completa
            else if (faviconStr.startsWith('http')) {
                favicon = faviconStr;
            }
            // Se é um caminho relativo, tentar criar URL completa
            else if (faviconStr.startsWith('/')) {
                try {
                    // Tentar obter o domínio da URL de áudio
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
 * SVG de notas musicais brancas (fallback) - definido como constante global
 */
const MUSIC_ICON_SVG = 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'>
        <path d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'/>
    </svg>
`);

const DEFAULT_ICON = 'https://cdn-icons-png.flaticon.com/512/727/727245.png';

/**
 * Gera HTML para a imagem da rádio com fallback
 */
function getRadioImageHTML(radioData, size = 'normal') {
    const sizes = {
        'normal': { width: 90, height: 90, padding: '15px' },
        'small': { width: 50, height: 50, padding: '8px' },
        'player': { width: 60, height: 60, padding: '12px' }
    };
    
    const sizeConfig = sizes[size] || sizes.normal;
    const isDefaultIcon = !radioData.favicon || 
                          radioData.favicon === DEFAULT_ICON || 
                          radioData.favicon === MUSIC_ICON_SVG ||
                          radioData.favicon.includes('undefined') ||
                          radioData.favicon.includes('null') ||
                          radioData.favicon.includes('data:image/svg+xml');
    
    if (isDefaultIcon) {
        // Usar ícone musical SVG com fundo gradiente
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
    } else {
        // Usar favicon real
        return `
            <img src="${radioData.favicon}" 
                 alt="${radioData.name} logo"
                 width="${sizeConfig.width}"
                 height="${sizeConfig.height}"
                 style="
                    border-radius: 50%;
                    border: 3px solid var(--accent-primary);
                    box-shadow: 0 0 20px color-mix(in srgb, var(--accent-primary) 35%, transparent);
                    background: transparent;
                    object-fit: cover;
                    padding: 0;
                    min-width: ${sizeConfig.width}px;
                    min-height: ${sizeConfig.height}px;
                    display: block;
                    flex-shrink: 0;
                 "
                 onerror="this.onerror=null; this.src='${MUSIC_ICON_SVG}'; this.classList.add('radio-icon-default'); this.style.background='var(--accent-gradient)'; this.style.objectFit='contain'; this.style.padding='${sizeConfig.padding}';">
        `;
    }
}

/**
 * Limpa o nome do gênero para exibição
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
 * Normaliza o texto removendo acentos
 */
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Função para atualizar contadores dos botões
 */
function updateButtonCounters() {
  try {
    // Usar as variáveis globais já existentes
    const favCount = Array.isArray(favorites) ? favorites.length : 0;
    const histCount = Array.isArray(history) ? history.length : 0;
    
    console.log('Atualizando contadores:', { favoritos: favCount, histórico: histCount });
    
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
      favBadge.style.display = favCount > 0 ? 'flex' : 'none';
      
      // Adicionar título para acessibilidade
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
      histBadge.style.display = histCount > 0 ? 'flex' : 'none';
      
      // Adicionar título para acessibilidade
      histBadge.setAttribute('title', `${histCount} rádio${histCount !== 1 ? 's' : ''} no histórico`);
    }
    
  } catch (error) {
    console.error('Erro ao atualizar contadores:', error);
  }
}

/**
 * Função para debug das imagens
 */
function debugRadioImages() {
    console.log('=== DEBUG RADIO IMAGES ===');
    const radios = document.querySelectorAll('.radio-card img');
    
    radios.forEach((img, index) => {
        console.log(`Imagem ${index + 1}:`);
        console.log('- Source:', img.src);
        console.log('- Current Source:', img.currentSrc);
        console.log('- Class:', img.className);
        console.log('- Complete:', img.complete);
        console.log('- Natural width:', img.naturalWidth);
        console.log('- Natural height:', img.naturalHeight);
        console.log('---');
    });
}

// ===================
// CONTROLE DE ÁUDIO 
// ===================

/**
 * Configurar event listeners do áudio
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
 * Iniciar monitoramento de saúde do áudio
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
 * Parar monitoramento de saúde
 */
function stopAudioHealthCheck() {
    if (audioPlayer.healthCheckInterval) {
        clearInterval(audioPlayer.healthCheckInterval);
        audioPlayer.healthCheckInterval = null;
    }
    audioPlayer.ontimeupdate = null;
}

/**
 * Tentar recuperar o áudio
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
 * Manipular erro de áudio
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

function handleAudioEnded() {
    console.log("Áudio terminou naturalmente");
    if (isPlaying) {
        showNotification("📻 Transmissão encerrada", "info");
        pauseAudio();
    }
}

function handleAudioCanPlay() {
    console.log("Áudio pronto para reprodução");
    audioErrorCount = 0;
}

function handleAudioStalled() {
    console.log("Áudio travado, tentando recuperar...");
    if (isPlaying) {
        showNotification("🔇 Conexão instável...", "warning");
        attemptAudioRecovery();
    }
}

function handleAudioWaiting() {
    console.log("Áudio aguardando dados...");
}

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

function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    playerFixedEl.classList.remove('playing');
    stopAudioHealthCheck();
    updateRadioCards();
    
    if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
    }
}

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

// Tocar rádio com verificação de segurança
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

    const existingIndex = history.findIndex(item => item.url === url);
    if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
    }
    
    const historyItem = {
        ...sanitizedRadio,
        url: url,
        date: new Date().toISOString()
    };
    history.unshift(historyItem);
    if (history.length > 20) history.pop();
    secureLocalStorageSet('history', history);
    updateHistoryUI();
    
    // ATUALIZAR CONTADOR DE HISTÓRICO
    updateButtonCounters();

    nowPlaying.textContent = `Carregando: ${sanitizedRadio.name}`;
    playerSubtitle.textContent = `${sanitizedRadio.country} • ${cleanGenreName(sanitizedRadio.tags)}`;
    
    // Forçar a atualização da imagem no player
    // Remover o elemento existente primeiro
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

// ===================
// FUNÇÕES PRINCIPAIS
// ===================

// 🎧 Buscar rádios
async function fetchRadios(query="", country="", tag="", append=false) {
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
 * Atualizar botão "Ver mais"
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

// Função para atualizar o status de segurança no player
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

// ⭐ Gerenciar favoritos
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
    
    // ATUALIZAR CONTADOR
    updateButtonCounters();
}

function updateFavoriteButton() {
    if (!currentRadio) return;
    const isFavorite = favorites.some(fav => fav.url === currentRadio.url);
    toggleFavorite.innerHTML = isFavorite ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
}

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

function removeFavorite(url) {
    favorites = favorites.filter(fav => fav.url !== url);
    secureLocalStorageSet('favorites', favorites);
    updateFavoritesUI();
    updateFavoriteButton();
    updateRadioCards();
    showNotification("⭐ Rádio removida dos favoritos", "success");
    
    // ATUALIZAR CONTADOR
    updateButtonCounters();
}

function clearFavoritesAction() {
    favorites = [];
    secureLocalStorageSet('favorites', favorites);
    updateFavoritesUI();
    updateFavoriteButton();
    updateRadioCards();
    showNotification("⭐ Todos os favoritos removidos", "success");
    
    // ATUALIZAR CONTADOR
    updateButtonCounters();
}

//  Histórico
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

function removeFromHistory(url) {
    history = history.filter(item => item.url !== url);
    secureLocalStorageSet('history', history);
    updateHistoryUI();
    updateRadioCards();
    showNotification(" Rádio removida do histórico", "success");
    
    // ATUALIZAR CONTADOR
    updateButtonCounters();
}

function clearAllHistoryAction() {
    history = [];
    secureLocalStorageSet('history', history);
    updateHistoryUI();
    updateRadioCards();
    showNotification(" Histórico de reprodução limpo", "success");
    
    // ATUALIZAR CONTADOR
    updateButtonCounters();
}

//  Atualizar estado visual de todos os cards
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

// ===============================
// CONTROLES DE UI E MODAIS
// ===============================

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

// MODAIS
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
    }
});

// Funções de exibição de modais de lista
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

// Função auxiliar para formatar tempo relativo
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

// ===============================
// FUNÇÕES DE REMOÇÃO (COM MODAL)
// ===============================
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

// Controles do player
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

// Funções utilitárias
function showPage(pageName) {
    pageContent.innerHTML = pageContents[pageName] || '<p style="padding: 20px;">Página não encontrada.</p>';
    pageModal.style.display = "flex";
}

// 🔔 Mostrar notificação
function showNotification(message, type) {
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'}"></i> ${sanitizeHTML(message)}`;
    notification.className = `notification ${type} show`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 🔽 Carregar filtros
async function loadFilters() {
  try {
    const [countries, tags] = await Promise.all([
      fetch(`${API_BASE}/countries`).then(r=>r.json()),
      fetch(`${API_BASE}/tags`).then(r=>r.json())
    ]);

    // Carregar países
    countries.sort((a,b)=>a.name.localeCompare(b.name)).forEach(c=>{
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

// ===============================
// LÓGICA DE BUSCA RÁPIDA DE GÊNEROS
// ===============================
const genreSearchContainer = document.querySelector('#genreSearchContainer');

genreSearchInput.addEventListener('input', filterGenreResults);

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

function selectGenre(item, tag, display) {
    genreSearchInput.value = display;
    genreSelect.value = tag;
    genreResultsList.style.display = 'none';
    document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');
}

// 🌓 Tema - Versão corrigida
themeToggle.addEventListener("click", () => {
    const isLight = document.body.getAttribute("data-theme") === "light";
    const newTheme = isLight ? "dark" : "light";
    
    document.body.setAttribute("data-theme", newTheme);
    
    // Mantém a estrutura do botão, apenas troca o ícone
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

// ===============================
// INICIALIZAÇÃO SEGURA
// ===============================

document.addEventListener("DOMContentLoaded", ()=>{
    // 🔧 CORREÇÃO: Verificar e limpar dados corrompidos no localStorage
    function cleanCorruptedData() {
        const keys = ['favorites', 'history'];
        keys.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    JSON.parse(data); // Testar se é JSON válido
                }
            } catch (error) {
                console.warn(`Removendo dados corrompidos de ${key}`);
                localStorage.removeItem(key);
            }
        });
    }
    
    cleanCorruptedData();
    
    // 🔧 CORREÇÃO: Carregar dados do localStorage APÓS limpeza
    favorites = secureLocalStorageGet('favorites', []);
    history = secureLocalStorageGet('history', []);
    
    console.log('Dados iniciais carregados:', {
        favorites: favorites.length,
        history: history.length
    });
    
    // Configurar tema
    const savedTheme = secureLocalStorageGet("theme", "dark");
    document.body.setAttribute("data-theme", savedTheme);
    themeToggle.innerHTML = savedTheme === "light" ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
   
    // Configurar volume
    audioPlayer.volume = secureLocalStorageGet("volume", 0.8);
    
    // Configurar event listeners do áudio
    setupAudioEventListeners();

    // Carregar dados iniciais
    loadFilters();
    fetchRadios();
    updateFavoritesUI();
    updateHistoryUI();
    
    // INICIALIZAR CONTADORES
    updateButtonCounters();
    
    // Debug após carregar as rádios
    setTimeout(() => {
        debugRadioImages();
    }, 2000);
});

// ===============================
// PROTEÇÕES ADICIONAIS
// ===============================

// Prevenir múltiplas instâncias de áudio
if (window.audioPlayerInstance) {
    window.audioPlayerInstance.pause();
    window.audioPlayerInstance.src = '';
}
window.audioPlayerInstance = audioPlayer;

// Limpar recursos quando a página for descarregada
window.addEventListener('beforeunload', () => {
    stopAudioHealthCheck();
    if (retryTimeout) {
        clearTimeout(retryTimeout);
    }
    audioPlayer.pause();
    audioPlayer.src = '';
});

// Proteger contra ataques de timing
setTimeout(() => {
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        if (!script.src && script.innerHTML.includes('eval') || script.innerHTML.includes('Function')) {
            script.remove();
        }
    });
}, 1000);