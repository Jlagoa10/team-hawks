# Direção cinematográfica

As implementações são próprias, com GSAP 3.14.2 e ScrollTrigger. As buscas pelos 12 nomes no 21st.dev e a consulta a santionispirits.com foram bloqueadas pelo proxy (HTTP 403, domínio proibido). Não foi possível inspecionar demos, código ou dependências das referências. Nenhum componente é apresentado como cópia ou componente oficial dessas fontes. As buscas individuais estão registradas em [reference-research.json](reference-research.json).

| Conceito aprovado | Implementação |
| --- | --- |
| 01 Scroll Media Expansion Hero | Uma mídia enquadrada cresce até ocupar a tela; tipografia, cantos e profundidade acompanham a expansão. |
| 02 Scroll Morph Hero | A mesma timeline transforma a tela em composição circular sobre fundo claro, preparando o manifesto. |
| 03 Scroll Locked Video Hero | Palco técnico fixo com três cenas de texto e zoom preservados; dois quadros de vídeo com títulos acima ficam abaixo do palco. Clipes futuros usam reprodução manual com controles, sem substituir o hero. |
| 04 Immersive Scroll Gallery | Peças editoriais de Fábio e mosaico com movimentos de profundidade, rotação e deslocamento. |
| 05 Zoom Parallax | Composição do manifesto, sequência técnica e fotografias em escalas e velocidades diferentes. |
| 06 Text Scroll Animation | Palavras do manifesto mudam de posição, escala e rotação com a rolagem. A declaração do time é estática por solicitação do kit. |
| 07 Spotlight Card | Superfícies de serviços e consultoria acompanham o ponteiro com um foco luminoso monocromático. |
| 08 Image Stack Carousel | Pilha física com reposicionamento, rotação, profundidade e seleção por botões, teclado e gesto de toque. |
| 09 Hover Image Gallery | Fotografias e espaços editoriais ampliam por hover/foco; Enter, Espaço e toque alternam a mesma apresentação. |
| 10 Sticky Scroll | Painel do método acompanha cinco capítulos, trocando imagem, traçado e rótulo; consultoria tem composição fixa coordenada com cinco etapas. |
| 11 Marquee | Nomes dos quatro parceiros e mensagens institucionais em movimento horizontal, com pausa e suspensão fora da tela. |
| 12 Interactive Hover Button | A superfície sobe, a forma se arredonda e o conteúdo responde ao ponteiro, mantendo a área de clique estável. |

## Mídia do kit

O kit fornece 14 imagens, já integradas às seções, aos pôsteres e à galeria existentes. Fotografias documentais e imagens conceituais são identificadas nas legendas. Os cinco vídeos reais ainda não foram fornecidos: os cinco quadros permanecem visíveis com títulos acima e a mensagem VÍDEO EM BREVE. A disponibilidade é centralizada em `src/video-manifest.json`; não há players vazios ou reprodução fictícia. O contato permanece no Instagram.

## Movimento e acessibilidade

Uma única arquitetura controla as sequências. As timelines e os ScrollTriggers são revertidos ao mudar o modo de movimento; o contexto é limpo no descarte do módulo. Não há interceptação de roda, gesto ou navegação, nem scroll snapping. Imagens e vídeos reservam dimensões antes do carregamento para evitar mudanças de layout. A rolagem nativa permanece disponível durante os trechos fixos.

No celular, os trechos do hero e do treino são mais curtos, os deslocamentos são menores e o painel do método ocupa uma parte da tela. A largura das composições é contida sem criar uma área de rolagem horizontal.

`prefers-reduced-motion` elimina as sequências fixas e as animações; uma transcrição mantém os três conceitos técnicos disponíveis. O botão de pausa global oferece a mesma alternativa a qualquer visitante. A galeria usa estado compartilhado entre teclado, toque e botões; o menu móvel inclui retorno de foco, Escape e contenção de foco. O site preserva conteúdo e links essenciais sem JavaScript.
