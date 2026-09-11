Documentação Técnica — Grid Rádio
Versão: 1.0.0
Última Atualização: 11 de setembro de 2026
Autor: Julio Gonzales
Contato: juliogonzales.dev@proton.me

Índice
1.	Visão Geral
2.	Arquitetura
3.	Estrutura do Código
4.	API e Dados
5.	Sistema de Áudio
6.	Gerenciamento de Estado
7.	Segurança
8.	UI/UX
9.	Player Fixo
10.	Performance
11.	Troubleshooting
12.	Roadmap e Desenvolvimento
    
1. Visão Geral
O Grid Rádio é uma aplicação web single-page (SPA) construída com HTML5, CSS3 e JavaScript Vanilla. A aplicação consome a API pública do Radio Browser para disponibilizar milhares de estações de rádio online em tempo real, integrando uma interface em glassmorphism, player flutuante fixo e alternância de temas (claro/escuro).

Principais Objetivos
•	Navegação Intuitiva: Interface responsiva para descoberta e escuta contínua de rádios.
•	Persistência Local: Manutenção de favoritos, histórico, tema e volume direto no navegador.
•	Responsividade: Experiência consistente adaptada para desktops, tablets e smartphones.
•	Segurança Integrada: Sanitização rigorosa de dados de entrada/saída e validação de URLs de mídia.

Stack Tecnológica
Camada	Tecnologia / Ferramenta
Estrutura	HTML5 semântico
Estilos	CSS3 (Variáveis, Grid, Flexbox, Glassmorphism)
Lógica	JavaScript ES6+ (Vanilla JS)
Tipografia	Google Fonts — Poppins
Iconografia	Font Awesome 6.5.1 (CDN)
Áudio	Web Audio API / HTML5 Audio()
Persistência	localStorage + sessionStorage
Fonte de Dados	Radio Browser API

3. Arquitetura
Diagrama de Componentes
Plaintext
┌─────────────────────────────────────────────────────────────┐
│                    Interface do Usuário                     │
├──────────────────────────────┬──────────────────────────────┤
│            Header            │         Main Content         │
│     (Busca, Temas, Tabs)     │    (Hero, Grid de Rádios)    │
├──────────────────────────────┴──────────────────────────────┤
│                   Player Fixed (Flutuante)                  │
├─────────────────────────────────────────────────────────────┤
│                 Controladores JS (script.js)                │
├─────────────────────────────────────────────────────────────┤
│                   Gerenciamento de Estado                   │
│   ┌──────────────┐      ┌──────────────┐    ┌───────────┐   │
│   │  Favoritos   │      │  Histórico   │    │  Volume   │   │
│   └──────────────┘      └──────────────┘    └───────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Integração com a API                     │
│               Radio Browser (de1.api.radio-browser)         │
└─────────────────────────────────────────────────────────────┘
Fluxo de Dados
1.	Interação do Usuário: Ações de clique em rádios, alteração de volume, busca ou alternância de temas iniciam o fluxo.
2.	Captura de Eventos: Event Listeners direcionam as chamadas para os métodos do script.js.
3.	Atualização de Estado Global: Atualizam-se os estados em memória (favorites, history, currentRadio, isPlaying).
4.	Persistência Segura: Armazenamento via secureLocalStorageSet().
5.	Re-renderização: A interface gráfica é reativa às mudanças do estado.
6.	Consumo de API: Chamadas assíncronas via fetchRadios() ou loadFilters() apenas sob demanda.
   
3. Estrutura do Código
Estrutura de Arquivos
Plaintext
gridRadioOnline/
├── index.html          # Layout principal (SPA)
├── style.css           # Estilização completa (Glassmorphism & Responsivo)
├── script.js           # Lógica principal da aplicação
├── README.md           # Guia rápido para o usuário
├── DOCUMENTACAO.md     # Documentação técnica detalhada
└── img/
    └── conceito-de-coracao-partido.jpg
   
Mapeamento do script.js
1.	Efeito Parallax / Scroll: Animações do Hero e botão "Voltar ao Topo".
2.	Segurança (SECURITY_CONFIG): Validações de segurança, whitelist de protocolos e domínios.
3.	Variáveis Globais: Endpoints da API, referências DOM e estados de áudio.
4.	Funções Utilitárias: sanitizeHTML, secureLocalStorageSet/Get, cleanGenreName, etc.
5.	Controle de Áudio: Manipuladores de eventos (handleAudioError, attemptAudioRecovery, playAudio, pauseAudio).
6.	Funções Principais: Fetch de rádios, paginação e atualização da interface.
7.	Favoritos & Histórico: Funções de inserção, remoção, leitura e limpeza local.
8.	Controles do Player Fixo: Minimização, reabertura e sincronização de estado.
9.	Gerenciamento de Modais: Controle de modais de Filtros, Favoritos, Histórico, Páginas de Termos e Compartilhamento.
10.	Gerenciamento de Temas: Alternância e salvamento do modo claro/escuro.
11.	Inicialização (DOMContentLoaded): Restauração do estado salvo e bootstrap da aplicação.
    
4. API e Dados
Endpoints da Radio Browser API
•	Base URL: [https://de1.api.radio-browser.info/json](https://de1.api.radio-browser.info/json)
•	Busca de Rádios: /stations/search?limit=100&offset=0&hidebroken=true&order=votes&reverse=true
•	Países Disponíveis: /countries
•	Gêneros/Tags: /tags

Parâmetros de Busca
Parâmetro	Tipo	Descrição
name	string	Filtra pelo nome da rádio
country	string	Filtra pelo país de origem
tag	string	Filtra pelo gênero musical
limit	number	Quantidade de itens por página (padrão: 100)
offset	number	Deslocamento do ponteiro para paginação
hidebroken	boolean	Quando true, oculta rádios inativas
order	string	Campo base para ordenação (ex: votes)

Sanitização de Dados de Rádios
JavaScript
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
    const f = radio.favicon.trim();
    if (f.length > 5 && !f.includes('undefined') && !f.includes('null') && f !== 'https://' && f !== 'http://') {
      if (f.startsWith('//')) favicon = 'https:' + f;
      else if (f.startsWith('http')) favicon = f;
      else if (f.startsWith('/') && radio.url) {
        try {
          const u = new URL(radio.url);
          favicon = u.protocol + '//' + u.hostname + f;
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

5. Sistema de Áudio
Instanciação e Eventos
O áudio é controlado pela instância da classe nativa Audio() do navegador:
JavaScript
const audioPlayer = new Audio();
audioPlayer.volume = 0.8;

// Event Listeners para integridade da conexão
audioPlayer.addEventListener('error', handleAudioError);
audioPlayer.addEventListener('ended', handleAudioEnded);
audioPlayer.addEventListener('canplay', handleAudioCanPlay);
audioPlayer.addEventListener('stalled', handleAudioStalled);
audioPlayer.addEventListener('waiting', handleAudioWaiting);
audioPlayer.addEventListener('volumechange', () => {
  secureLocalStorageSet('volume', audioPlayer.volume);
});

Fluxo de Recuperação Automática
Em caso de instabilidade na transmissão, a aplicação executa até 3 tentativas de reconexão re-instanciando o elemento de áudio:
JavaScript
const MAX_AUDIO_ERRORS = 3;

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
  window.audioPlayer = newAudio;
  setupAudioEventListeners();

  setTimeout(() => { if (currentRadio) playAudio(); }, 1000);
}

6. Gerenciamento de Estado
Estrutura do LocalStorage & SessionStorage
Chave	Escopo	Conteúdo
theme	localStorage	Prefixo do tema ("dark" ou "light")
favorites	localStorage	Array de rádios favoritadas
history	localStorage	Array contendo o histórico recente com data
volume	localStorage	Valor numérico da reprodução (0.0 a 1.0)
cachedRadios	sessionStorage	Cache dos resultados da primeira página
Persistência Segura
JavaScript
function secureLocalStorageSet(key, value) {
  try {
    if (Array.isArray(value)) {
      const serializable = value.map(item => {
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
      localStorage.setItem(key, JSON.stringify(serializable));
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    try { localStorage.clear(); } catch {}
  }
}

7. Segurança
   
A aplicação implementa diretrizes de segurança no lado do cliente para prevencao contra ataques de Cross-Site Scripting (XSS) e links maliciosos.
Configurações Globais de Segurança
JavaScript
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

Validações Implementadas
1.	Validação de URL: Impede chamadas para URLs contendo scripts ou extensões executáveis.
2.	Sanitização de HTML: Converte strings dinâmicas usando o nó DOM textContent para neutralizar injeções de tags.
3.	Checagem de Protocolo / Domínio: Avalia a integridade do link de streaming e atualiza a badge no player (Link Seguro vs Stream não verificado).
   
8. UI/UX
   
Sistema de Temas e Paleta de Cores
As variáveis CSS controlam as mudanças de tema dinamicamente no elemento <body> via atributo data-theme.
Tema Escuro (Padrão)
CSS
:root {
  --bg-color: #0d1117;
  --glass-bg: rgba(255, 255, 255, 0.04);
  --glass-border: rgba(255, 255, 255, 0.06);
  --glass-blur: blur(16px);
  --text-color: #e6edf3;
  --text-secondary: #9198a1;
  --accent-primary: #00d9e0;
  --accent-secondary: #6b52e0;
  --accent-gradient: linear-gradient(135deg, #00f7ff 0%, #7b61ff 50%, #ff2e92 100%);
  --success-color: #00d9b3;
  --error-color: #e63946;
}

Tema Claro
CSS
[data-theme="light"] {
  --bg-color: #f1f5f9;
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(0, 0, 0, 0.08);
  --text-color: #0f172a;
  --text-secondary: #475569;
  --accent-primary: #2563eb;
  --accent-secondary: #7c3aed;
  --success-color: #059669;
  --error-color: #dc2626;
}

09. Player Fixo
O player de áudio flutuante foi otimizado para manter o controle contínuo durante a navegação do usuário.
Plaintext
┌────────────────────────────────────────────────────────────────────────┐
│                        Player Fixo Flutuante                           │
├─────────────────┬───────────────────────────────┬──────────────────────┤
│ [ Capa / Live ] │  Título da Rádio              │ [ Play/Pause ]       │
│  Indicador      │  Gênero • Localização         │ [ Favoritar  ]       │
│  Pulsante       │  Status: Link Seguro          │ [ Minimizar  ]       │
└─────────────────┴───────────────────────────────┴──────────────────────┘
Controles de Minimização e Reabertura
•	Atalho de Teclado: O atalho Ctrl + Alt + P permite alternar o estado do player rapidamente.
•	Segundo Plano: Fechar o player oculta a interface flutuante sem interromper a execução do fluxo de áudio. Um botão flutuante discreto permite reabrir o controle a qualquer momento.

10. Performance
•	Lazy Loading: Imagens de capa utilizam o atributo nativo loading="lazy" integrado com fallback automático em SVG.
•	Debouncing: Pesquisas de texto e buscas por tags utilizam um tempo limite de 300ms antes da execução das requisições.
•	Paginação Eficiente: Carregamento controlado em blocos de 100 estações de rádio.
•	Gerenciamento de Recursos: Limpeza de intervalos (clearInterval) e encerramento de conexões no evento beforeunload.

11. Troubleshooting
Problema	Causa Provável	Solução Recomendada
Áudio não toca	Bloqueio de autoplay do navegador ou stream offline	Solicitar interação direta do usuário (clique no Play) ou tentar reconectar.
Favoritos não salvam	Cota do localStorage excedida	O sistema executa limpeza automática do cache antigo ou aciona alerta de espaço.
Imagens quebradas	URLs inválidas no retorno da API	Truncamento tratado automaticamente com SVG embutido de substituição.
Player oculto em dispositivos móveis	Incompatibilidade do seletor CSS :has() em navegadores antigos	A reabertura via JS adiciona classes fallback ao elemento body.

12. Roadmap e Desenvolvimento
Próximos Recursos (v1.1.0)
•	Criador de playlists personalizadas armazenadas localmente.
•	Opção para compartilhamento de links diretos de estações específicas.
•	Filtros avançados baseados em bitrate e codec de áudio.

Execução Local
Para iniciar um servidor Web simples para testes locais:
Bash
# Clonar o repositório
git clone https://github.com/Julioheyner/grid-radio-online.git
cd grid-radio-online

# Abrir no navegador: http://localhost:8000


