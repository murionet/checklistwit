# Checklist Diário de Equipamentos

Aplicativo web offline-first (PWA) em HTML, CSS e JavaScript puro para conferir diariamente os equipamentos de uma sala de aula: tablets, celulares, carregadores, smartwatches, VR Box e óculos metaverso. Sem frameworks e sem build.

## Arquivos
`index.html` · `style.css` · `app.js` · `manifest.json` · `sw.js` · `icon.svg` · `icon-192.png` · `icon-512.png`

## Uso local
Dê duplo clique em `index.html`. Tudo funciona via `file://` (o Service Worker só é registrado em `http:`/`https:`).
Os dados ficam no `localStorage` **do navegador usado**. Use *Dados e Backup* para levá-los a outro aparelho.

## Publicar no GitHub Pages
1. Crie um repositório e envie todos os arquivos para a raiz (branch `main`).
2. Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Acesse `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Instalar como PWA
- **Android (Chrome):** menu ⋮ → *Instalar aplicativo* / *Adicionar à tela inicial*.
- **Windows (Chrome/Edge):** ícone de instalação na barra de endereço, ou menu → *Aplicativos → Instalar este site como um aplicativo*.
- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*.

## Gerar .apk com o PWABuilder
1. Publique no GitHub Pages (HTTPS é obrigatório).
2. Acesse https://www.pwabuilder.com, cole a URL e clique em **Start**.
3. Em **Package for stores**, escolha **Android** e gere o pacote (gera `.apk` e `.aab`).
4. Para uso interno, instale o `.apk` direto no aparelho (permita fontes desconhecidas). O Android pode exigir assinatura; o PWABuilder oferece uma chave nova.

## Regras do sistema
- **Carregadores** = esperado de Tablets + esperado de Celulares, atualizado em tempo real. Editar o valor manualmente desativa o cálculo automático (reative na tela *Gerenciar equipamentos*).
- Divergência = encontrado ≠ esperado, com badge `-N faltando` ou `+N excedente`.
- Itens não conferidos aparecem como "Não conferido" e, ao finalizar, são registrados como 0 após confirmação.

## Atualizando o app
Ao alterar qualquer arquivo, aumente `CACHE_VERSION` em `sw.js` para que os aparelhos recebam a nova versão.
