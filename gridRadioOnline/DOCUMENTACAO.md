## 📖 DOCUMENTACAO.md

```markdown
# 📚 Documentação Técnica - Grid Rádio

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Código](#estrutura-de-código)
4. [API e Dados](#api-e-dados)
5. [Sistema de Áudio](#sistema-de-áudio)
6. [Gerenciamento de Estado](#gerenciamento-de-estado)
7. [Segurança](#segurança)
8. [UI/UX](#uiux)
9. [Performance](#performance)
10. [Troubleshooting](#troubleshooting)
11. [Roadmap](#roadmap)

## Visão Geral

Grid Rádio é uma aplicação web single-page (SPA) construída com HTML, CSS e JavaScript vanilla. A aplicação consome a API pública do Radio Browser para fornecer acesso a milhares de estações de rádio online.

### Principais Objetivos
- Fornecer interface intuitiva para descobrir rádios
- Manter dados localmente (favoritos/histórico)
- Garantir experiência de usuário responsiva
- Manter altos padrões de segurança

## Arquitetura

### Diagrama de Componentes
```

┌─────────────────────────────────────────┐
│Interface do Usuário                     │
├─────────────────────────────────────────┤
│Header │ Main Content │ Player Fixed     │
├─────────────────────────────────────────┤
│Controladores JS                         │
├─────────────────────────────────────────┤
│Gerenciamento de Estado                  │          
│┌─────────┐  ┌─────────┐                 │ 
││Favoritos│  │Histórico│                 │  
│└─────────┘  └─────────┘                 │   
├─────────────────────────────────────────┤
│API Integration                          │
│Radio Browser                            │
└─────────────────────────────────────────┘

```

### Fluxo de Dados
1. Usuário (visitante) interage com a interface
2. Eventos são capturados pelos listeners
3. Estado é atualizado (LocalStorage)
4. UI é renderizada com base no estado
5. Chamadas à API quando necessário

## Estrutura de Código

### Estrutura de Arquivos
```javascript
// script.js - Organização Principal

// 1. CONSTANTES E CONFIGURAÇÕES
const SECURITY_CONFIG = { /* ... */ };
const API_BASE = "https://de1.api.radio-browser.info/json";

// 2. VARIÁVEIS GLOBAIS DE ESTADO
let favorites = [];
let history = [];
let currentRadio = null;
let isPlaying = false;

// 3. FUNÇÕES UTILITÁRIAS
function sanitizeHTML() { /* ... */ }
function validateURL() { /* ... */ }

// 4. FUNÇÕES DE DADOS
async function fetchRadios() { /* ... */ }
function updateFavoritesUI() { /* ... */ }

// 5. CONTROLE DE ÁUDIO
function playAudio() { /* ... */ }
function pauseAudio() { /* ... */ }

// 6. GERENCIAMENTO DE UI
function showNotification() { /* ... */ }
function updateButtonCounters() { /* ... */ }

// 7. EVENT LISTENERS E INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => { /* ... */ });
```

Componentes Principais

1. Header (<header>)

· Controles de navegação (Filtros, Favoritos, Histórico)
· Título com gradiente animado
· Alternador de tema

2. Hero Section (#hero-section)

· Imagem com efeito parallax
· Texto de introdução
· Créditos da imagem

3. Grades de Rádio (.radios-grid)

· Layout grid responsivo
· Cards com informações da rádio
· Estados: favorito, tocando, hover

4. Player Fixo (.player-fixed)

· Informações da rádio atual
· Controles de reprodução
· Status de segurança
· Animação de ondas de áudio

5. Modais

· Filtros: busca avançada
· Favoritos: lista gerenciável
· Histórico: reproduções recentes
· Informações: termos, privacidade, etc.

API e Dados

Radio Browser API

Endpoint Base: https://de1.api.radio-browser.info/json

Endpoints Utilizados:

```javascript
// Buscar rádios
/stations/search?limit=100&offset=0&hidebroken=true

// Países disponíveis
/countries

// Gêneros/tags disponíveis
/tags
```

Parâmetros de Busca:

· name: Nome da rádio
· country: País da rádio
· tag: Gênero musical
· order=votes&reverse=true: Ordenar por popularidade

Estrutura de Dados da Rádio:

```javascript
{
  "name": "Nome da Rádio",
  "url_resolved": "https://stream.url",
  "favicon": "https://logo.url",
  "country": "País",
  "tags": "rock,pop,80s",
  "votes": 1234
}
```

Sanitização de Dados

```javascript
function sanitizeRadioData(radio) {
  return {
    name: sanitizeHTML(radio.name) || 'Rádio Desconhecida',
    url: radio.url || '',
    favicon: processFavicon(radio.favicon),
    country: sanitizeHTML(radio.country) || 'Desconhecido',
    tags: sanitizeHTML(radio.tags) || 'Sem Gênero'
  };
}
```

Sistema de Áudio

Controle do Player

```javascript
const audioPlayer = new Audio();

// Eventos monitorados
audioPlayer.addEventListener('error', handleAudioError);
audioPlayer.addEventListener('ended', handleAudioEnded);
audioPlayer.addEventListener('canplay', handleAudioCanPlay);
audioPlayer.addEventListener('stalled', handleAudioStalled);
```

Recuperação de Conexão

```javascript
function attemptAudioRecovery() {
  if (audioErrorCount >= MAX_AUDIO_ERRORS) {
    showNotification("❌ Muitos erros na conexão", "error");
    pauseAudio();
    return;
  }
  
  // Reconfigurar player
  const newAudio = new Audio();
  newAudio.src = audioPlayer.src;
  // ... reconectar
}
```

Health Check

Monitora silêncio prolongado (>10s) para detectar streams travados.

Gerenciamento de Estado

LocalStorage Keys

```javascript
const STORAGE_KEYS = {
  THEME: 'theme',
  FAVORITES: 'favorites',
  HISTORY: 'history',
  VOLUME: 'volume'
};
```

Funções de Armazenamento

```javascript
function secureLocalStorageSet(key, value) {
  try {
    // Serialização segura
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Fallback e limpeza
    handleStorageError(error, key);
  }
}
```

Estados da Aplicação

```javascript
// Estado global
const appState = {
  currentView: 'all', // 'all', 'favorites', 'history'
  filters: {
    query: '',
    country: '',
    tag: ''
  },
  audio: {
    isPlaying: false,
    currentRadio: null,
    volume: 0.8
  }
};
```

Segurança

Configurações de Segurança

```javascript
const SECURITY_CONFIG = {
  ALLOWED_PROTOCOLS: ['http:', 'https:'],
  ALLOWED_AUDIO_DOMAINS: ['streamhosting.rs', 'radio.co', 'zeno.fm'],
  BLOCKED_DOMAINS: ['script', 'virus', 'malware'],
  SUSPICIOUS_PATTERNS: [
    /(\.exe|\.js|\.php|\.cgi|\.pl)$/i,
    /eval\(|Function\(|document\.write/i
  ]
};
```

Validações Implementadas

1. Validação de URL

```javascript
function validateURL(url) {
  try {
    const urlObj = new URL(url);
    
    // Protocolos permitidos
    if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      return false;
    }
    
    // Padrões suspeitos
    for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
      if (pattern.test(url)) return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
```

2. Sanitização de HTML

```javascript
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

3. Verificação de Stream de Áudio

```javascript
function isSafeAudioURL(url) {
  if (!validateURL(url)) return false;
  
  // Domínios conhecidos de streaming
  const domain = new URL(url).hostname.toLowerCase();
  return SECURITY_CONFIG.ALLOWED_AUDIO_DOMAINS.some(
    allowed => domain.includes(allowed)
  );
}
```

UI/UX

Sistema de Temas

Variáveis CSS

```css
:root {
  /* Dark Mode */
  --bg-color: #0d1117;
  --card-color: rgba(22, 27, 34, 0.85);
  --player-color: rgba(16, 20, 28, 0.9);
  --text-color: #f0f6fc;
  --accent-primary: #00f7ff;
  --accent-secondary: #7b61ff;
  --accent-hover: #2effff;
  --accent-gradient: linear-gradient(135deg, #00f7ff 0%, #7b61ff 50%, #ff2e92 100%);
  --success-color: #00ffc3;
  --error-color: #ff2e63;
  --warning-color: #ffd166;
  --icon-color: #00f7ff;
  --deep-ocean: #0a0d14;
  --midnight-blue: #161b22;
  --electric-cyan: #00ffea;
  --bg-gradient: linear-gradient(135deg,
      #0d1117 0%,
      #161b22 40%,
      #1a1f2e 100%);
  --card-gradient: linear-gradient(145deg,
      rgba(22, 27, 34, 0.85) 0%,
      rgba(28, 33, 43, 0.9) 100%);
  --neon-glow: 0 0 20px rgba(0, 247, 255, 0.4),
    0 0 40px rgba(123, 97, 255, 0.2);
  --header-bg: linear-gradient(90deg,
      rgba(13, 17, 23, 0.95) 0%,
      rgba(22, 27, 34, 0.9) 100%);
  --header-border: rgba(0, 247, 255, 0.3);
  --header-text: #f0f6fc;
  --header-accent: #00f7ff;
  --accent-color: var(--accent-primary);
  --dark-gradient: var(--bg-gradient);
  --light-gradient: linear-gradient(135deg,
      #f8fafc 0%,
      #ffffff 30%,
      #f1f5f9 100%);
  --player-height: 90px;
  --footer-height: auto;
}

/* MODO LIGHT - Aprimorado com mais contraste e personalidade */
[data-theme="light"] {
  --bg-color: #ffffff;
  --card-color: rgba(255, 255, 255, 0.98);
  --player-color: rgba(255, 255, 255, 0.98);
  --text-color: #111827;
  --accent-primary: #2563eb;
  --accent-secondary: #7c3aed;
  --accent-hover: #1d4ed8;
  --accent-gradient: linear-gradient(135deg,
      #2563eb 0%,
      #7c3aed 50%,
      #0891b2 100%);
  --success-color: #059669;
  --error-color: #dc2626;
  --warning-color: #d97706;
  --icon-color: #2563eb;
  
  /* Gradientes mais marcantes */
  --bg-gradient: linear-gradient(135deg,
      #ffffff 0%,
      #f8fafc 25%,
      #f1f5f9 100%);
  --card-gradient: linear-gradient(145deg,
      rgba(255, 255, 255, 0.98) 0%,
      rgba(248, 250, 252, 0.95) 100%);
  
  /* Sombra mais pronunciada para destaque */
  --neon-glow: 0 0 25px rgba(37, 99, 235, 0.2),
    0 8px 30px rgba(37, 99, 235, 0.15),
    0 0 0 1px rgba(37, 99, 235, 0.05);
  
  /* Header com mais contraste */
  --header-bg: linear-gradient(90deg,
      rgba(255, 255, 255, 0.98) 0%,
      rgba(248, 250, 252, 0.95) 100%);
  --header-border: rgba(37, 99, 235, 0.3);
  --header-text: #111827;
  --header-accent: #2563eb;
  
  /* Novas variáveis para melhor contraste */
  --text-secondary: #374151;
  --border-color: rgba(37, 99, 235, 0.15);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);
  
  /* Efeitos hover mais visíveis */
  --hover-overlay: rgba(37, 99, 235, 0.05);
  --active-overlay: rgba(37, 99, 235, 0.1);
}

/* Se quiser uma versão alternativa mais ousada e vibrante: */
[data-theme="light"].vibrant {
  --bg-color: #fdf2f8;
  --text-color: #1f2937;
  --accent-primary: #db2777;
  --accent-secondary: #7c3aed;
  --accent-hover: #be185d;
  --accent-gradient: linear-gradient(135deg,
      #db2777 0%,
      #7c3aed 50%,
      #ec4899 100%);
  --icon-color: #db2777;
  --header-border: rgba(219, 39, 119, 0.3);
  --neon-glow: 0 0 30px rgba(219, 39, 119, 0.2),
    0 10px 40px rgba(219, 39, 119, 0.15);
}
```

Alternância de Tema

```javascript
themeToggle.addEventListener("click", () => {
  const isLight = document.body.getAttribute("data-theme") === "light";
  const newTheme = isLight ? "dark" : "light";
  
  document.body.setAttribute("data-theme", newTheme);
  secureLocalStorageSet("theme", newTheme);
});
```

Animações e Transições

Keyframes Principais

```css
@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0px); }
  50% { transform: translateX(-50%) translateY(-6px); }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 247, 255, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 247, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 247, 255, 0); }
}

@keyframes equalize {
  0% { transform: scaleY(0.7); opacity: 0.7; }
  100% { transform: scaleY(1.3); opacity: 1; }
}
```

Classes de Transição

```css
.radio-card {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.modal-content {
  animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

Responsividade

Breakpoints

```css
/* Desktop: > 768px */
@media (min-width: 769px) { /* ... */ }

/* Tablet: 481px - 768px */
@media (max-width: 768px) { /* ... */ }

/* Mobile: <= 480px */
@media (max-width: 480px) { /* ... */ }

/* Landscape Mobile */
@media (orientation: landscape) and (max-height: 500px) { /* ... */ }
```

Grid Responsivo

```css
.radios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .radios-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }
}
```

Performance

Otimizações Implementadas

1. Lazy Loading de Imagens

```javascript
function getRadioImageHTML(radioData) {
  // Fallback para ícone padrão
  const isDefaultIcon = !radioData.favicon || 
                       radioData.favicon.includes('undefined');
  
  if (isDefaultIcon) {
    return `<div class="radio-icon-default">🎵</div>`;
  }
  
  return `<img src="${radioData.favicon}" 
               loading="lazy"
               onerror="this.onerror=null; this.classList.add('radio-icon-default')">`;
}
```

2. Debounce para Busca

```javascript
let searchTimeout;
genreSearchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(filterGenreResults, 300);
});
```

3. Paginação

```javascript
let page = 1;
const LIMIT = 100;

async function fetchRadios(append = false) {
  if (!append) page = 1;
  
  const endpoint = `${API_BASE}/stations/search?limit=${LIMIT}&offset=${(page - 1) * LIMIT}`;
  // ...
  
  page++;
}
```

4. Cleanup de Event Listeners

```javascript
window.addEventListener('beforeunload', () => {
  stopAudioHealthCheck();
  audioPlayer.pause();
  audioPlayer.src = '';
});
```

Métricas de Performance

· Tempo de Carregamento Inicial: < 2s
· Tamanho Total: ~50KB (sem imagens)
· Requests Concorrentes: 3-5
· Uso de Memória: < 50MB

Troubleshooting

Problemas Comuns e Soluções

1. Áudio Não Reproduz

Sintoma: Player mostra "Carregando..." mas não toca.

Causas Possíveis:

· Bloqueio de autoplay do navegador
· URL de stream inválida
· Restrições CORS

Soluções:

```javascript
// Verificar erro de autoplay
audioPlayer.play().catch(error => {
  if (error.name === "NotAllowedError") {
    showNotification("🔇 Clique no botão Play para iniciar", "warning");
  }
});

// Tentar streams alternativas
function tryAlternateStreams(radio) {
  const backupUrls = [
    radio.url_resolved,
    radio.url,
    `https://proxy.stream?url=${encodeURIComponent(radio.url)}`
  ];
  // Tentar cada URL até uma funcionar
}
```

2. Favoritos Não Salvam

Solução:

```javascript
// Verificar limite do localStorage
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  // Limpar dados antigos
  localStorage.clear();
  showNotification("⚠️ Dados locais limpos por falta de espaço", "warning");
}
```

3. Imagens Não Carregam

Solução:

```javascript
// Usar fallback robusto
function getSafeFavicon(favicon) {
  const DEFAULT = 'data:image/svg+xml;base64,...';
  
  if (!favicon || favicon.includes('undefined')) {
    return DEFAULT;
  }
  
  // Forçar HTTPS
  return favicon.replace('http://', 'https://');
}
```

4. API Fora do Ar

Fallback:

```javascript
async function fetchRadiosWithFallback() {
  try {
    return await fetch(API_BASE);
  } catch (error) {
    // Usar cache local
    const cached = localStorage.getItem('cachedRadios');
    if (cached) return JSON.parse(cached);
    
    // Usar endpoint de backup
    return await fetch('https://backup.api.radio-browser.info/json');
  }
}
```

Logging e Debug

```javascript
// Modo debug
const DEBUG = localStorage.getItem('debug') === 'true';

function debugLog(message, data) {
  if (DEBUG) {
    console.log(`[GridRadio] ${message}:`, data);
  }
}

// Ativar no console
localStorage.setItem('debug', 'true');
location.reload();
```

Roadmap

Versão 1.1 (Próxima)

· Cache de rádios offline
· Playlists personalizadas
· Compartilhamento de rádios
· Mais opções de filtro (bitrate, codec)

Versão 1.2

· Login social (opcional)
· Sincronização entre dispositivos
· Recomendações baseadas em histórico
· Equalizador básico

Versão 2.0

· Aplicativo PWA
· Notificações de rádio favorita ao vivo
· Modo rádio (descoberta automática)
· API pública para desenvolvedores

Desenvolvimento

Setup de Desenvolvimento

```bash
# 1. Clone o repositório
git clone https://github.com/Julioheyner/grid-radio-online.git

# 2. Instale uma extensão Live Server (VS Code)
# ou use Python para servir localmente:
python3 -m http.server 8000

# 3. Acesse http://localhost:8000
```

Convenções de Código

JavaScript

· Usar const para valores fixos
· Usar let para variáveis mutáveis
· Prefixar funções utilitárias com _ (opcional)
· Comentar funções complexas

CSS

· Usar variáveis CSS para cores
· Prefixar classes com propósito
· Organizar por componente
· Manter media queries próximas dos estilos originais

HTML

· Usar atributos aria- para acessibilidade
· Semântica apropriada
· Atributos data- para estado

Testes

```javascript
// Testes manuais recomendados
const testSuite = {
  audio: ['play', 'pause', 'volume', 'stream recovery'],
  ui: ['themes', 'responsive', 'modals', 'notifications'],
  data: ['favorites', 'history', 'search', 'filters'],
  security: ['url validation', 'xss prevention', 'localStorage']
};
```

Recursos Adicionais

Links Úteis

· Radio Browser API Documentation
· Web Audio API MDN
· LocalStorage Best Practices

Ferramentas Recomendadas

· Debugging: Chrome DevTools
· Performance: Lighthouse
· Acessibilidade: axe DevTools
· Design: Figma (para mockups)

---

Documentação atualizada em: Janeiro 2025
Última revisão: v1.0.0
Próxima atualização: v1.1.0 (Março 2025)

Para questões técnicas: juliogonzales.dev@proton.me

```

## 📁 Estrutura de Arquivos Sugerida

```

gridRadioOnline/
├──index.html              # Página principal
├──style.css              # Estilos principais
├──script.js              # Lógica JavaScript
├──README.md              # Documentação do usuário
├──DOCUMENTACAO.md        # Documentação técnica
├──img/                   # Imagem
│├── conceito-de-coracao-partido.jpg
│──

```
