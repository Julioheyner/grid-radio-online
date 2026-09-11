🎧 Grid Rádio Online Sua música, sem limites.

Um agregador de rádios online moderno, gratuito e sem anúncios — construído com HTML, CSS e JavaScript puro. Demonstração · Funcionalidades · Como Usar · Contribuir · Licença Demonstração Ou rode localmente seguindo as instruções na seção Como Usar.

Funcionalidades

Reprodução • Controle Unificado: Play e Pause com 1 clique em qualquer rádio. • Player Fixo: Interface flutuante com efeito glassmorphism. • Segurança de Stream: Verificação automática indicando links seguros ou não verificados. • Resiliência: Reconexão automática em caso de instabilidades na rede. • Equalizador Animado: Indicador visual do estado da transmissão. • Segundo Plano: Mantém a reprodução de áudio ativada mesmo com o player minimizado.

Descoberta • Acervo Global: Acesso a milhares de rádios de todo o mundo. • Busca Direta: Pesquisa por nome de rádio. • Filtros Personalizados: Filtragem por país e gênero musical. • Paginação: Navegação contínua via botão "Ver mais rádios".

Personalização • Favoritos: Salve suas estações preferidas localmente. • Histórico: Acesso rápido às últimas rádios ouvidas com registro de data e hora. • Temas: Alternância entre modo claro e escuro. • Ajuste de Volume: Nível de volume salvo automaticamente. Experiência do Usuário • Design Responsivo: Adaptado para desktop, tablet e smartphone. • Interface Moderna: Estilo glassmorphism limpo e fluido. • Desempenho: Carregamento acelerado por cache local. • Privacidade Total: Zero anúncios, zero rastreadores e sem coleta de dados externos.

Compartilhamento • Suporte direto para envio via WhatsApp, Facebook, X (Twitter) e Telegram. • Copiar link direto da estação. • Integração com a API nativa Web Share em dispositivos móveis.

Como Usar Opção 1 — Usar Online Acesse o link da demonstração e comece a ouvir diretamente pelo navegador. Sem necessidade de instalação.

Opção 2 — Rodar Localmente

Clone o repositório: Bash git clone https://github.com/Julioheyner/grid-radio-online.git

Acesse a pasta do projeto: Bash cd grid-radio-online

Inicie um servidor HTTP local: Bash

Exemplo utilizando Python
python3 -m http.server 8000 Acesse no navegador: http://localhost:8000 Estrutura do Projeto Plaintext gridRadioOnline/ ├── index.html # Página principal (SPA) ├── style.css # Estilos (glassmorphism + responsividade) ├── script.js # Lógica da aplicação ├── README.md # Documentação geral do projeto ├── DOCUMENTACAO.md # Documentação técnica ├── LICENSE # Licença de uso └── img/ └── conceito-de-coracao-partido.jpg

Tecnologias Utilizadas Categoria Tecnologia Estrutura HTML5 semântico Estilo CSS3 (Variáveis, Grid, Flexbox, Glassmorphism) Lógica JavaScript ES6+ (Vanilla JS) Fontes Google Fonts — Poppins Ícones Font Awesome 6.5.1 Áudio Web Audio API / HTML5 Audio Dados Radio Browser API Persistência localStorage + sessionStorage Sem necessidade de ferramentas de build, npm ou dependências externas.

Fonte dos Dados Este projeto utiliza a API pública do Radio Browser, um diretório comunitário e aberto mantido por voluntários ao redor do mundo. • Endpoint Base: https://de1.api.radio-browser.info/json (https://de1.api.radio-browser.info/json) • Documentação Oficial: api.radio-browser.info

Privacidade Este projeto opera estritamente no modelo client-side. Nenhum dado pessoal ou estatística de uso é enviado para servidores próprios.

Dado Armazenamento Finalidade Favoritos localStorage Preservar a lista de rádios salvas Histórico localStorage Registrar transmissões ouvidas recentemente Tema localStorage Salvar a preferência do tema (claro/escuro) Volume localStorage Manter o ajuste de volume selecionado Cache sessionStorage Otimizar a velocidade de carregamento

Acessibilidade • Navegação por teclado totalmente suportada (Tab, Enter, Esc). • Atributos aria-label e seletores semânticos aplicados aos elementos interativos. • Suporte à média query prefers-reduced-motion. • Contraste de cores ajustado para os modos claro e escuro. • Áreas de clique otimizadas para telas sensíveis ao toque (mínimo de 40px).

Contribuir Contribuições são bem-vindas. Siga o fluxo abaixo para colaborar:

Faça um fork do repositório.
Crie uma branch para sua funcionalidade: Bash git checkout -b feature/minha-feature
Registre suas alterações: Bash git commit -m 'feat: adiciona minha funcionalidade'
Envie as alterações para o seu repositório: Bash git push origin feature/minha-feature
Abra um Pull Request.
Padronização de Commits • feat: Adição de nova funcionalidade • fix: Correção de bug • docs: Alterações na documentação • style: Formatação e ajustes visuais de código

Reportar Bugs Caso encontre algum problema durante o uso, abra uma issue informando: • Descrição detalhada do problema. • Passos para reproduzir o comportamento. • Navegador e versão utilizada. • Sistema operacional ou dispositivo (se aplicável).

Roadmap Versão 1.0 (Atual) • Reprodução contínua de rádios online. • Gerenciamento de favoritos e histórico local. • Filtros por nome, país e gênero. • Suporte a temas claro e escuro. • Player flutuante responsivo.

Versão 1.1 (Planejada) • Compartilhamento direto de estações individuais. • Filtros avançados por bitrate e tipo de codec. Para maiores informações técnicas, consulte o arquivo DOCUMENTACAO.md. Perguntas Frequentes P: É necessário instalar alguma dependência? R: Não. O projeto roda nativamente no navegador, bastando acessar a demonstração ou servir os arquivos localmente. P: O serviço contém anúncios? R: Não. A aplicação é inteiramente livre de anúncios. P: Há monitoramento do que é ouvido? R: Não. Todos os dados permanecem salvos exclusivamente no armazenamento local do seu navegador. P: O que fazer se uma rádio não reproduzir? R: Algumas transmissões podem ficar temporariamente offline por instabilidade do servidor de origem. Tente selecionar outra estação.

Licença Este projeto está sob a licença MIT. Consulte o arquivo LICENSE para obter a íntegra do texto legal. Plaintext MIT License

Copyright (c) 2025 Julio Gonzales

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Aviso Legal O Grid Rádio Online é um agregador de transmissões públicas. Este projeto: • Não hospeda nenhum arquivo ou transmissão de áudio. • Não retransmite sinais de rádio diretamente de servidores próprios. • Funciona exclusivamente acessando dados públicos fornecidos pela API do Radio Browser. Todos os direitos autorais do conteúdo de áudio pertencem às suas respectivas emissoras. Para solicitações e dúvidas de direitos autorais, entre em contato através do e-mail: juliogonzales.dev@proton.me. Agradecimentos • Radio Browser — Pela disponibilização da API pública de rádios. • Font Awesome — Pelo conjunto de ícones. • Google Fonts — Pela disponibilização da tipografia Poppins. • Freepik / Magnific — Pelos recursos visuais utilizados na interface.

⭐ Gostou do projeto? Deixe uma estrela no repositório — ajuda muito a divulgar e motiva a continuar desenvolvendo! Feito com ❤️ e ☕ por Julio Gonzales © 2025 — Brasil
