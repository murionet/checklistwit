# Checklist WIT — Núcleo de Tecnologia

[![Offline-First PWA](https://img.shields.io/badge/Offline--First-PWA-green)](./manifest.json)
[![Vanilla JS ES6+](https://img.shields.io/badge/Vanilla%20JS-ES6+-blue)](./app.js)
[![Zero Dependencies](https://img.shields.io/badge/Zero%20Dependencies-yes-success)](./app.js)
[![Security Hardened](https://img.shields.io/badge/Security-Hardened-important)](./app.js)

Aplicativo web offline-first (PWA) para conferência diária de equipamentos de sala de aula — tablets, celulares, carregadores, smartwatches, VR Box e óculos metaverso — desenvolvido para o Núcleo de Tecnologia (Barueri/SP). Sem frameworks e sem build.

---

## Contexto e Problema Resolvido

Escolas precisam conferir diariamente o parque de equipamentos pedagógicos antes das aulas. O processo em papel gera perda de informações, dificulta o rastreamento de divergências (faltas ou excessos) e não produz histórico consolidado. O Checklist WIT digitaliza essa rotina, permitindo que instrutores registrem quantidades encontradas por equipamento, identifiquem divergências automaticamente e emitam um laudo técnico (Termo de Conferência Diária) compartilhável por WhatsApp, PDF ou impressão.

---

## Principais Funcionalidades

- **Checklist tátil com contagem:** stepper de +/-, confirmação de quantidade prevista e marcação rápida por checkbox.
- **Marcar todos / Limpar:** seleção em lote com confirmação visual imediata.
- **Lista integrada das EMEFs de Barueri:** dropdown com as unidades da rede municipal.
- **Cálculo automático de carregadores:** esperado de carregadores = Tablets + Celulares, atualizado em tempo real, com opção de ajuste manual.
- **Divergência visual:** cartões vermelhos (faltando) e âmbar (excedente), com selo de status atualizado em tempo real.
- **Histórico com filtros:** por data e por status (com/sem divergência).
- **Laudo técnico:** número sequencial (`WIT-AAAAMMDD-XXXX`), snapshot imutável dos itens, assinaturas e rodapé.
- **Emissão de PDF real** via jsPDF com quebra de página automática.
- **Compartilhamento por WhatsApp:** texto formatado copiado para a área de transferência.
- **Impressão:** folha A4 limpa com campos de assinatura (`@media print`).
- **Backup JSON validado:** exportação/importação com proteção contra Prototype Pollution, limite de 2 MB e validação de estrutura.
- **Firebase (opcional):** sincronização de histórico na nuvem com fallback para `localStorage` offline.
- **PWA instalável:** ícones, manifest e service worker (rede primeiro, cache offline).

---

## Arquitetura e Decisões Técnicas

- **Vanilla JavaScript ES6+** — sem dependências externas além do Firebase SDK e jsPDF (carregados via CDN).
- **Armazenamento local via `localStorage`** — funciona abrindo `index.html` diretamente (`file://`) e offline.
- **Padrão Snapshot nos relatórios:** cada laudo guarda uma cópia dos itens no momento da emissão; alterar a lista depois não modifica laudos antigos.
- **Service Worker `checklist-wit-v5`:** estratégia rede primeiro com cache como reserva offline. Não intercepta requisições do Firebase/Firestore.
- **Sanitização anti-XSS:** toda entrada do usuário, `localStorage` e JSON importado passa por `esc()` antes de ser injetado no DOM.
- **Proteção contra Prototype Pollution:** `JSON.parse` com reviver que descarta chaves perigosas (`__proto__`, `constructor`, `prototype`).
- **Content Security Policy (CSP):** restringe scripts, estilos, imagens, fontes e conexões a origens próprias.
- **Números tabulares:** alinhamento monetário/quantitativo em tabelas e selos via `font-variant-numeric: tabular-nums`.

---

## Segurança e Privacidade

- Armazenamento 100% local, sem telemetria, sem analytics e sem coleta de dados além do preenchido pelo usuário.
- Sanitização anti-XSS em `innerHTML` e atributos dinâmicos (`data-id`, `value`, `aria-label`).
- Validação estrita de backup JSON: tamanho máximo 2 MB, comprimento máximo de strings, tipos estritos e rejeição de chaves de poluição de protótipo.
- CSP com `object-src 'none'`, `base-uri 'self'` e `form-action 'self'`.
- Referrer policy: `no-referrer`.

> **Nota:** as credenciais do Firebase em `firebase-config.js` estão em modo de teste (acesso sem autenticação, expira em 30 dias). Para produção, configure regras de acesso no Firestore e não exponha chaves sensíveis em repositórios públicos.

---

## Estrutura de Arquivos

```text
├── index.html          # Estrutura semântica, CSP, metadados PWA
├── style.css           # Design tokens, layout responsivo e folha de impressão A4
├── app.js              # Lógica de estado, segurança, CRUD e geração de laudos
├── sw.js               # Service Worker (rede primeiro, cache offline)
├── manifest.json       # Manifesto de instalação PWA
├── .gitignore          # Exclusão de arquivos temporários e de sistema
├── assets/             # Ícones do aplicativo (icon.svg, icon-192.png, icon-512.png)
│   ├── icon.svg
│   ├── icon-192.png
│   └── icon-512.png
├── firebase-config.js  # Credenciais do Firebase (preencher com seu projeto)
└── README.md           # Documentação técnica completa
```

---

## Como Executar

### Execução local

1. Baixe ou clone todos os arquivos na mesma pasta.
2. Dê duplo clique em `index.html`. Tudo funciona via `file://` (o Service Worker só é registrado em `http:`/`https:`).
3. Os dados ficam no `localStorage` do navegador usado.

### Configurar Firebase (opcional)

1. Crie um projeto em [Firebase Console](https://console.firebase.google.com/).
2. Registre um app Web e copie o objeto `firebaseConfig`.
3. Cole os valores em `firebase-config.js`.
4. No Firestore, escolha "Iniciar em modo de teste".
5. O Firebase só é usado se as credenciais estiverem preenchidas; caso contrário, o app funciona exclusivamente com `localStorage`.

### Publicar (GitHub Pages)

1. Crie um repositório e envie todos os arquivos para a raiz (branch `main`).
2. Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Acesse `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
4. Abra pelo celular e adicione à tela inicial (PWA).

### Instalar como app nativo

- **Android (Chrome):** menu ⋮ → *Instalar aplicativo*.
- **Windows (Chrome/Edge):** ícone de instalação na barra de endereço.
- **iPhone (Safari):** Compartilhar → *Adicionar à Tela de Início*.
- **.apk via PWABuilder:** publique no GitHub Pages (HTTPS), acesse https://www.pwabuilder.com e gere o pacote Android.

---

## Atualizando o App

Ao alterar qualquer arquivo, incremente `CACHE_VERSION` em `sw.js` para que os aparelhos recebam a nova versão. A versão atual é `checklist-wit-v5`.

---

## Licença

Uso interno — Núcleo de Tecnologia, Barueri/SP.
