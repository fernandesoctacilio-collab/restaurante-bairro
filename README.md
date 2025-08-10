# Restaurante de Bairro — MVP (PWA)

MVP completo e instalável (PWA) para um app de restaurante: cardápio digital, pedidos, marmitas, cupons, fidelidade, pagamentos simulados (PIX, cartão, carteira), avaliações e conta do cliente.

## Como rodar
1. Publique esta pasta em um servidor estático (ex.: GitHub Pages).
2. Acesse a URL e aceite a instalação do app (botão **Instalar App** no topo).
3. Use os cupons de exemplo em **Promoções**.

## GitHub Pages
- Crie um repositório e faça upload dos arquivos.
- Em **Settings > Pages**, selecione a branch `main` e a raiz `/`.
- Acesse a URL gerada. O service worker fará o cache básico para uso offline.

## Estrutura
- `index.html` — interface principal
- `app.js` — lógica de dados e interação
- `manifest.webmanifest` — manifest PWA
- `service-worker.js` — cache básico
- `assets/icons/*` — ícones do PWA

## Notas
- As imagens dos pratos são servidas via Unsplash (CDN pública) apenas para demonstração.
- Pagamentos são **simulados**. Para produção, integrar com provedores (ex.: Mercado Pago, Stripe, Pagar.me) e PIX dinâmico via PSP.
- Push notifications reais exigem backend + Web Push (VAPID). Aqui, usamos um "toggle" de simulação.
