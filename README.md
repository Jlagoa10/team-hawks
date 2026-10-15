# Team Hawks Futevôlei

Site institucional em pt-BR, com a identidade monocromática, conteúdo e navegação do projeto original. A arquitetura existente foi preservada: HTML/CSS, módulos JavaScript, Vite e GSAP/ScrollTrigger. Um único contexto coordena os movimentos; a rolagem permanece nativa. Fontes e imagens são locais, sem CDN obrigatória.

## Instalar, abrir e compilar

Requisitos: Node.js 20.19+ ou 22.12+ e npm. Validado com Node.js 24.19.0.

```sh
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite no seu navegador. Para verificar a versão de produção:

```sh
npm run build
npm run preview
```

Publique **todo o conteúdo de `dist/`**, incluindo `index.html` e `assets/`, em uma hospedagem estática. A base relativa permite hospedar na raiz ou em uma subpasta, inclusive `/team-hawks/`. Não abra o `index.html` de desenvolvimento com dois cliques: ele depende do Vite.

Para gerar uma cópia independente que abre com dois cliques, sem instalar ferramentas no computador de destino:

```sh
npm run export
```

O arquivo fica em `exports/team-hawks.html`, com as imagens, fontes, estilos e animações embutidos. A versão atual abre sem servidor e sem internet; links externos precisam de conexão. Vídeos futuros não são embutidos automaticamente nesse arquivo: para clipes locais, use a versão publicada/servida com a pasta de mídia. `dist/`, `exports/`, dependências e resultados de testes não são versionados.

## Cinco vídeos — ainda não fornecidos

**Os cinco clipes reais ainda não foram enviados.** Já existem cinco quadros visíveis, cada um com título em português acima da mídia, pôster e a mensagem “VÍDEO EM BREVE”. Enquanto o arquivo estiver ausente, não há player, botão de reprodução ou requisição ao MP4 inexistente.

A única fonte de configuração é [src/video-manifest.json](src/video-manifest.json):

| Arquivo em `public/assets/videos/` | Título visível acima do quadro | Local |
| --- | --- | --- |
| `video-01.mp4` | TREINAMENTO TÉCNICO | `#treino` |
| `video-02.mp4` | MOVIMENTAÇÃO E FUNDAMENTOS | `#treino` |
| `video-03.mp4` | TEAM HAWKS EM AÇÃO | `#em-acao` |
| `video-04.mp4` | EVOLUÇÃO NA AREIA | `#em-acao` |
| `video-05.mp4` | EVENTOS E BASTIDORES | Galeria de encontros, em `#em-acao` |

Para disponibilizar um vídeo:

1. Coloque o MP4 real no caminho correspondente. Não crie um arquivo vazio ou substitua por filmagem não autorizada.
2. Edite `title` no manifesto para mudar o **título acima do quadro**; `poster` troca a imagem e `description` acrescenta uma descrição opcional. Os nomes iniciais representam categorias, sem afirmar o conteúdo de uma filmagem ainda não vista.
3. Use `ratio: "16 / 9"` para paisagem ou `ratio: "9 / 16"` para reels verticais. O vídeo usa `object-fit: contain`, sem esticar a imagem.
4. Reinicie o servidor ou execute `npm run build`. O Vite detecta os arquivos locais existentes; eles substituem automaticamente os pôsteres por players ao carregar. Para publicar um clipe novo, envie a nova compilação completa. Adicionar somente um MP4 a uma compilação antiga não atualiza a lista de disponibilidade.
5. Para hospedagem externa, informe uma URL HTTPS em `src` e `status: "ready"` depois de confirmar que o arquivo existe. Mantenha `status: "pending"` para conteúdo externo não disponível. Arquivos locais são conferidos pela existência real, sem depender do rótulo `status`.
6. Quando houver transcrição verdadeira, adicione arquivos WebVTT em `tracks`, por exemplo `[{"src":"assets/videos/video-01.pt-BR.vtt","lang":"pt-BR","label":"Português","default":true}]`. Subtítulos de acessibilidade são separados do título acima do vídeo. Não foram inventadas transcrições.

Os players têm controles nativos, `playsinline`, carregamento de metadados próximo à tela e **nenhum autoplay**. Ao iniciar um vídeo, os outros pausam. Eles também pausam fora da tela e quando a aba perde visibilidade; erro de mídia restaura o pôster. O hero permanece com a águia selecionada e nunca é substituído por esses cinco clipes.

## Imagens do kit e contato

Os 14 arquivos foram otimizados para WebP, sem reconstruir pessoas ou alterar o conteúdo das fotos. O total passou de 11,63 MB para 3,64 MB. As dimensões, nomes originais e tamanhos estão em [docs/image-assets.json](docs/image-assets.json).

| Arquivo original do kit | Uso da versão `.webp` em `public/assets/images/` |
| --- | --- |
| `hero-eagle.png` | Hero de abertura |
| `hero-alternate.jpg` | Alternativa do hero em caso de falha, sem duplicar a cena |
| `method-court.jpg` | Fundo das cinco etapas do método |
| `fabio-editorial.jpeg` | Editorial principal de Fábio |
| `fabio-training-01.jpeg` | Foto de apoio de Fábio e pôster do vídeo 01 |
| `fabio-training-02.jpeg` | Galeria, carrossel e pôster do vídeo 02 |
| `team-action.jpg` | Primeiro quadro da dupla de imagens |
| `team-group.png` | Segundo quadro da dupla e carrossel |
| `contact-eagle.jpg` | Fundo da seção de contato |
| `eagle-closeup.png` | Galeria editorial da marca |
| `footvolley-action.jpg` | Galeria, palco técnico e pôster do vídeo 03 |
| `footvolley-ball.jpg` | Galeria e pôster do vídeo 04 |
| `team-event-01.jpeg` | Carrossel de encontros |
| `team-event-02.jpeg` | Carrossel de encontros e pôster do vídeo 05 |

As composições conceituais estão identificadas separadamente dos registros do time. A galeria e o carrossel permitem abrir as imagens completas em um diálogo acessível, sem recortar pessoas. Não foram inventados nomes, datas ou resultados de eventos.

[Configure fotos e contato em `src/content.js`](src/content.js). O contato continua no Direct oficial do Instagram; WhatsApp permanece vazio até haver um número oficial. Os parceiros LJ Cruz, Emme e Lauton foram preservados. JLK Web & Digital Services oferece 5% de desconto para clientes indicados por Fábio, com o cupom **Hawks05**; o cupom Lauton **TEAMHAWKS** continua independente.

## Verificação

```sh
npx playwright install chromium
npm test
```

Na nuvem, use o Chromium já instalado:

```sh
CHROMIUM_PATH=/usr/bin/chromium npm test
```

A suíte cobre hero/morph, cinco etapas, desenho sequencial da quadra, frase estática, galeria/teclado/toque, cinco quadros e títulos acima, reprodução manual com mídia de teste, pausa de vídeos, falha de mídia, legendas reais de teste, cupons independentes, links, carregamento de imagens, layouts de 320/390/768/1024/1440 px, pausa global, movimento reduzido, conteúdo sem JavaScript e auditoria automática WCAG A/AA. A auditoria automática complementa a inspeção visual.

A mídia sintética em `tests/fixtures/` serve exclusivamente aos testes e não é publicada em `dist/`; não representa nenhum dos cinco vídeos futuros.

Veja [o checklist das 11 alterações](docs/update-kit-changelog.md) e [o mapa de movimento](docs/motion.md).
