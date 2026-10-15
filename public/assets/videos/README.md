# Vídeos do site

Os cinco vídeos estão disponíveis como `video-01.mp4` a `video-05.mp4`.
Mantenha apenas uma extensão `.mp4` nos nomes dos arquivos.
Os cinco vídeos são verticais, incluindo a rotação dos metadados de 01 e 02.

Os títulos acima dos quadros, os pôsteres, a proporção e os arquivos de legendas
são configurados em `src/video-manifest.json`. Ao reiniciar o servidor ou executar
`npm run build`, os arquivos locais existentes são detectados automaticamente.
Não crie arquivos vazios com extensão MP4.

Para um MP4 externo, use uma URL HTTPS válida em `src` e `status: "ready"`.
Consulte o README principal para instruções de publicação e subtítulos WebVTT.
