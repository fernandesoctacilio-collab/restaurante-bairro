// MVP Restaurante de Bairro
const state = {
  menu: [],
  cart: [],
  reviews: [],
  cupomAtivo: null,
  user: { nome:'', tel:'', end:'', km:2, saldo:0 },
  pontos: 0,
  pedidos: [],
  assinatura: null,
  notify: false,
};

// --------- Utils
const R = (sel) => document.querySelector(sel);
const RS = (sel) => Array.from(document.querySelectorAll(sel));
const money = (v) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });

function save() { localStorage.setItem('rb_state', JSON.stringify(state)); }
function load() {
  const s = localStorage.getItem('rb_state');
  if (s) {
    const parsed = JSON.parse(s);
    Object.assign(state, parsed);
  }
}

function toast(msg, ok=true) {
  const el = document.createElement('div');
  el.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 glass px-4 py-2 rounded-xl shadow-smooth ' + (ok ? 'text-green-300' : 'text-amber-300');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// --------- Nav

// --------- Robust Hash Router
function navigate(key) {
  showView(key);
  const newHash = '#' + key;
  if (location.hash !== newHash) history.replaceState(null, '', newHash);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.addEventListener('hashchange', () => {
  const key = (location.hash || '#home').replace('#','');
  showView(key);
});
RS('.nav-btn').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.nav)));
document.querySelector('a[data-nav="conta"]')?.addEventListener('click', (e) => { e.preventDefault(); navigate('conta'); });

function showView(key) {
  RS('section[id^="view-"]').forEach(sec => sec.classList.add('hidden'));
  R('#view-' + key).classList.remove('hidden');
  RS('.nav-btn').forEach(btn => btn.setAttribute('aria-selected','false'));
  RS(`.nav-btn[data-nav="${key}"]`).forEach(btn => btn.setAttribute('aria-selected','true'));
  if (key === 'carrinho') updateTotals();
  if (key === 'fidelidade') updatePontos();
  if (key === 'avaliacoes') renderReviews();
  if (key === 'conta') renderConta();
  if (key === 'promocoes') R('#notifyToggle').checked = state.notify;
}
document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { e.preventDefault(); showView(nav.getAttribute('data-nav')); }
});

// --------- Install PWA

// --------- iOS Add-to-Home-Screen helper
function isIos() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isInStandaloneMode() { return ('standalone' in window.navigator) && window.navigator.standalone; }
function isSafari() { return /^((?!chrome|android).)*safari/i.test(navigator.userAgent); }

(function a2hsHelper(){
  const installBtn = R('#installBtn');
  if (!('BeforeInstallPromptEvent' in window) && isIos() && isSafari() && !isInStandaloneMode()) {
    // Show helper modal when user taps Install
    installBtn?.classList.remove('hidden');
    installBtn?.addEventListener('click', () => {
      R('#a2hsModal').classList.remove('hidden');
      R('#a2hsModal').classList.add('flex');
    });
    R('#closeA2HS')?.addEventListener('click', () => R('#a2hsModal').classList.add('hidden'));
  }
})();

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  R('#installBtn').classList.remove('hidden');
});
R('#installBtn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') toast('App instalado!');
  deferredPrompt = null;
  R('#installBtn').classList.add('hidden');
});

// --------- Data (Cardápio)
function seedMenu() {
  state.menu = [
    {
      id:'picanha', cat:'executivo', nome:'Picanha na Chapa', preco:49.90,
      desc:'Picanha suculenta na chapa com arroz, feijão, farofa e vinagrete.',
      tags:['sem_gluten'], img:'https://images.unsplash.com/photo-1604908553917-cccc7f27f647?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id:'parmegiana', cat:'executivo', nome:'Parmegiana de Frango', preco:39.90,
      desc:'Filé de frango à parmegiana com purê de batatas e arroz.',
      tags:[], img:'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id:'pastelcarne', cat:'pastel', nome:'Pastel de Carne', preco:9.90,
      desc:'Pastel crocante de carne moída temperada.', tags:[], 
      img:'https://images.unsplash.com/photo-1625944525765-6796c7478687?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id:'pastelqueijo', cat:'pastel', nome:'Pastel de Queijo', preco:9.90,
      desc:'Clássico pastel de queijo derretido.', tags:['vegetariano'], 
      img:'https://images.unsplash.com/photo-1560300851-f86c6a57aa9b?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id:'burger', cat:'lanches', nome:'Cheeseburger da Casa', preco:29.90,
      desc:'Blend artesanal, queijo, alface, tomate e molho especial.',
      tags:[], img:'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id:'pizza4q', cat:'pizzas', nome:'Pizza Quatro Queijos', preco:59.90,
      desc:'Mussarela, parmesão, gorgonzola e provolone.', tags:['vegetariano'],
      img:'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id:'salada', cat:'saladas', nome:'Salada Mediterrânea', preco:27.90,
      desc:'Folhas, tomate-cereja, azeitonas, grão-de-bico e azeite.',
      tags:['vegano','sem_gluten'], img:'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id:'brownie', cat:'sobremesas', nome:'Brownie com Sorvete', preco:19.90,
      desc:'Brownie de chocolate com bola de sorvete de creme.', tags:[],
      img:'https://images.unsplash.com/photo-1551024709-8f23befc6cf7?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id:'suco', cat:'bebidas', nome:'Suco Natural de Laranja (500ml)', preco:9.50,
      desc:'Feito na hora, sem açúcar.', tags:['vegano','sem_gluten'],
      img:'https://images.unsplash.com/photo-1542444459-db63c3c3583b?q=80&w=1200&auto=format&fit=crop'
    }
  ];
}

// --------- Render Menu
function renderMenu(list = state.menu) {
  const grid = R('#menuGrid');
  grid.innerHTML = '';
  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <img src="${item.img}" alt="${item.nome}"/>
      <div class="p-3">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h3 class="font-bold text-lg">${item.nome}</h3>
            <p class="text-sm text-gray-300">${item.desc}</p>
            <div class="flex gap-2 mt-1">
              ${item.tags.map(t => `<span class="tag">${t.replace('_',' ')}</span>`).join('')}
            </div>
          </div>
          <div class="text-amber-300 font-extrabold">${money(item.preco)}</div>
        </div>
        <div class="mt-2 flex items-center gap-2 flex-wrap">
          <label class="chip">Tamanho
            <select class="bg-transparent ml-2">
              <option>P</option><option>M</option><option>G</option>
            </select>
          </label>
          <input placeholder="Observações (ex.: sem cebola)" class="bg-gray-800 rounded p-2 flex-1"/>
          <button class="btn addBtn" data-id="${item.id}">Adicionar</button>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });
  RS('.addBtn').forEach(btn => btn.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    const size = card.querySelector('select').value;
    const obs = card.querySelector('input').value;
    addToCart(e.target.dataset.id, { size, obs });
  }));
}
function filterMenu(type) {
  if (type === 'all') return renderMenu();
  const filtered = state.menu.filter(m => m.tags.includes(type));
  renderMenu(filtered);
}

// --------- Cart
function addToCart(id, opt = {}) {
  const item = state.menu.find(m => m.id === id);
  if (!item) return;
  state.cart.push({ ...item, qtd:1, ...opt });
  save();
  updateCartCount();
  toast('Adicionado ao carrinho!');
}
function addPratoDoDia() {
  addToCart('picanha', { size:'M', obs:'' });
}
function addMarmita(tipo) {
  const basePrice = tipo === 'Tradicional' ? 29.90 : (tipo === 'Fit' ? 32.90 : 31.90);
  state.cart.push({
    id:'marmita-'+tipo.toLowerCase(),
    nome:'Marmita '+tipo, preco: basePrice, desc:'Plano de marmita', img:'https://images.unsplash.com/photo-1565299543923-37dd378f02c3?q=80&w=1200&auto=format&fit=crop',
    tags:['sem_gluten'], qtd:1, size: R('#marmitaTamanho').value, obs: 'Troca: ' + R('#marmitaTrocas').value
  });
  save(); updateCartCount(); toast('Marmita adicionada!');
}
function removeFromCart(idx) {
  state.cart.splice(idx,1);
  save(); renderCart(); updateTotals(); updateCartCount();
}
function updateCartCount() {
  R('#cartCount').textContent = state.cart.length;
}
function renderCart() {
  const area = R('#cartList');
  area.innerHTML = '';
  state.cart.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'glass p-3 rounded-xl flex items-start gap-3';
    row.innerHTML = `
      <img src="${c.img}" class="w-20 h-20 object-cover rounded-lg">
      <div class="flex-1">
        <div class="flex items-center justify-between">
          <h4 class="font-bold">${c.nome} <span class="text-xs pill ml-2">${c.size||''}</span></h4>
          <button class="chip" onclick="removeFromCart(${i})">Remover</button>
        </div>
        <p class="text-sm text-gray-300">${c.desc}</p>
        <div class="flex items-center gap-2 mt-1">
          <label class="chip">Qtd
            <input type="number" min="1" value="${c.qtd}" class="bg-transparent ml-2 w-16" onchange="changeQtd(${i}, this.value)">
          </label>
          <span class="font-bold text-amber-300">${money(c.preco)}</span>
        </div>
        <div class="text-sm text-gray-400">Obs: ${c.obs||'—'}</div>
      </div>
    `;
    area.appendChild(row);
  });
}
function changeQtd(i, val) {
  state.cart[i].qtd = Math.max(1, parseInt(val||1));
  save(); updateTotals(); renderCart();
}

// --------- Totals & Delivery
function getSubtotal() {
  return state.cart.reduce((s, c) => s + c.preco * c.qtd, 0);
}
function calcTaxaEntrega() {
  const tipo = R('#tipoPedido').value;
  if (tipo === 'retirada') return 0;
  const km = Number(state.user.km || 2);
  const taxa = Math.max(6, 6 + 2 * (km - 1));
  return Math.round(taxa * 100) / 100;
}
function updateTotals() {
  renderCart();
  const sub = getSubtotal();
  let desconto = 0;
  if (state.cupomAtivo) {
    if (state.cupomAtivo.type === 'percent') desconto = sub * state.cupomAtivo.value;
    if (state.cupomAtivo.type === 'fixed') desconto = state.cupomAtivo.value;
  }
  const taxa = calcTaxaEntrega();
  const total = Math.max(0, sub - desconto) + taxa;
  R('#subtotal').textContent = money(sub);
  R('#cupomLabel').textContent = state.cupomAtivo ? state.cupomAtivo.code : '—';
  R('#taxaEntrega').textContent = money(taxa);
  R('#total').textContent = money(total);
  return total;
}
R('#tipoPedido')?.addEventListener('change', updateTotals);

// --------- Cupons
const COUPONS = {
  'PASTELTERCA': { code:'PASTELTERCA', type:'percent', value:0.10 },
  'QUARTAPRATO': { code:'QUARTAPRATO', type:'percent', value:0.15 },
  'BEMVINDO':    { code:'BEMVINDO', type:'percent', value:0.20, once:true },
  'MARMITA10':   { code:'MARMITA10', type:'fixed', value:10.00 }
};
function aplicarCupom() {
  const code = R('#cupomInput').value.trim().toUpperCase();
  const c = COUPONS[code];
  if (!c) { R('#cupomStatus').textContent = 'Cupom inválido.'; return; }
  if (c.once && state.pedidos.some(p => p.cupom === 'BEMVINDO')) {
    R('#cupomStatus').textContent = 'Cupom BEMVINDO já utilizado.'; return;
  }
  state.cupomAtivo = c;
  save();
  updateTotals();
  R('#cupomStatus').textContent = 'Cupom aplicado!';
}

// --------- Pagamento
function pagar(tipo) {
  const total = updateTotals();
  const area = R('#pagamentoArea');
  area.innerHTML = '';
  if (total <= 0 || state.cart.length === 0) { toast('Carrinho vazio.'); return; }
  if (tipo === 'pix') {
    const div = document.createElement('div');
    div.innerHTML = `<div id="qrcode"></div><p class="text-sm text-gray-300 mt-2">Chave PIX: restaurante@bairro.com</p>`;
    area.appendChild(div);
    const qrcode = new QRCode(div.querySelector('#qrcode'), {
      text: `000201PIX:${total}||CHAVE:restaurante@bairro.com||DESC:Pedido Restaurante de Bairro`,
      width: 180, height: 180
    });
    const btn = document.createElement('button');
    btn.className = 'btn mt-2';
    btn.textContent = 'Confirmar pagamento (simulado)';
    btn.onclick = () => finalizarPedido('PIX', total);
    area.appendChild(btn);
  }
  if (tipo === 'cartao') {
    const form = document.createElement('div');
    form.innerHTML = `
      <input class="bg-gray-800 rounded p-2 w-full mb-2" placeholder="Número do cartão (simulado)">
      <div class="flex gap-2">
        <input class="bg-gray-800 rounded p-2 w-1/2" placeholder="Validade (MM/AA)">
        <input class="bg-gray-800 rounded p-2 w-1/2" placeholder="CVV">
      </div>
      <button class="btn mt-2">Pagar R$ ${total.toFixed(2)}</button>`;
    form.querySelector('button').onclick = () => finalizarPedido('Cartão', total);
    area.appendChild(form);
  }
  if (tipo === 'dinheiro') {
    area.innerHTML = `<p class="text-green-300">Pagamento em dinheiro selecionado. Leve o valor exato ou troco será combinado na entrega.</p><button class="btn mt-2">Confirmar pedido em dinheiro</button>`;
    area.querySelector('button').onclick = () => finalizarPedido('Dinheiro', total);
  }
  if (tipo === 'carteira') {
    if (state.user.saldo >= total) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Confirmar com carteira';
      btn.onclick = () => { state.user.saldo -= total; save(); renderConta(); finalizarPedido('Carteira', total); };
      area.appendChild(btn);
    } else {
      area.innerHTML = `<p class="text-amber-300">Saldo insuficiente. Faça uma recarga na aba Conta.</p>`;
    }
  }
}

function finalizarPedido(metodo, total) {
  const id = 'RB-' + Math.random().toString(36).slice(2,8).toUpperCase();
  const pedido = {
    id,
    data: new Date().toLocaleString('pt-BR'),
    itens: state.cart.map(({id,nome,qtd,preco}) => ({id,nome,qtd,preco})),
    total,
    cupom: state.cupomAtivo?.code || null,
    status: 'Preparando',
    metodo
  };
  state.pedidos.unshift(pedido);
  const earned = Math.floor((total)/10);
  state.pontos += earned;
  // Resgate automático
  let resgate = '';
  if (state.pontos >= 200) { resgate = 'Prato executivo grátis'; state.pontos -= 200; }
  else if (state.pontos >= 100) { resgate = 'R$ 20 de desconto'; state.pontos -= 100; }
  else if (state.pontos >= 50) { resgate = 'Sobremesa grátis'; state.pontos -= 50; }
  if (resgate) R('#resgates').textContent = 'Resgatado: ' + resgate;
  state.cart = [];
  state.cupomAtivo = null;
  save();
  updateCartCount(); updateTotals(); renderCart(); renderConta(); updatePontos();
  toast(`Pedido ${id} confirmado!`);
  // Simular progresso de status
  setTimeout(() => { pedido.status = 'Pronto'; save(); renderConta(); }, 2500);
  setTimeout(() => { pedido.status = 'Entregue'; save(); renderConta(); }, 5000);
}

// --------- Conta
function renderConta() {
  R('#userNome').value = state.user.nome || '';
  R('#userTel').value = state.user.tel || '';
  R('#userEnd').value = state.user.end || '';
  R('#userKm').value = state.user.km || 2;
  R('#saldo').textContent = money(state.user.saldo||0);
  const list = R('#ordersList');
  list.innerHTML = state.pedidos.map(p => \`
    <div class="glass p-2 rounded-lg">
      <div class="flex items-center justify-between">
        <b>\${p.id}</b> <span>\${p.status}</span>
      </div>
      <div>\${p.data} — Total: <b>\${money(p.total)}</b> — via \${p.metodo}</div>
      <button class="chip mt-1" onclick="marcarEntregue('\${p.id}')">Marcar como entregue</button>
    </div>\`).join('');
}
function salvarConta() {
  state.user.nome = R('#userNome').value.trim();
  state.user.tel = R('#userTel').value.trim();
  state.user.end = R('#userEnd').value.trim();
  state.user.km = Number(R('#userKm').value) || 2;
  state.notify = R('#notifyToggle')?.checked || state.notify;
  save();
  toast('Conta salva.');
}
function recarga(tipo) {
  const v = Number(R('#recargaValor').value || 0);
  if (v <= 0) { toast('Valor inválido', false); return; }
  state.user.saldo += v;
  save(); renderConta();
  R('#recargaStatus').textContent = 'Recarga via ' + (tipo==='pix'?'PIX':'Cartão') + ' efetuada (simulada).';
  toast('Recarga adicionada!');
}
function marcarEntregue(id) {
  const p = state.pedidos.find(x => x.id === id);
  if (p) { p.status = 'Entregue'; save(); renderConta(); }
}

// --------- Fidelidade
function updatePontos() {
  R('#pts').textContent = state.pontos;
}

// --------- Avaliações
function renderReviews() {
  const area = R('#reviewsList');
  area.innerHTML = '';
  if (state.reviews.length === 0) {
    area.innerHTML = '<p class="text-gray-400">Ainda não há avaliações. Seja o primeiro!</p>';
    R('#mediaAvaliacao').textContent = '—';
    return;
  }
  let sum = 0;
  state.reviews.forEach(r => {
    sum += r.stars;
    const el = document.createElement('div');
    el.className = 'glass p-2 rounded-lg';
    el.innerHTML = \`<b>\${'★'.repeat(r.stars)}\${'☆'.repeat(5-r.stars)}</b> — \${r.text} <span class="text-xs text-gray-400">(\${r.date})</span>\`;
    area.appendChild(el);
  });
  const avg = (sum / state.reviews.length).toFixed(1);
  R('#mediaAvaliacao').textContent = avg + ' ★';
}
function enviarReview() {
  const stars = Math.min(5, Math.max(1, parseInt(R('#reviewStars').value || 5)));
  const text = R('#reviewText').value.trim();
  state.reviews.unshift({ stars, text, date: new Date().toLocaleDateString('pt-BR') });
  save(); renderReviews();
  R('#reviewText').value = '';
  toast('Obrigado pelo feedback!');
}

// --------- Marmita assinatura
function assinarMarmita() {
  state.assinatura = {
    plano: R('#marmitaPlano').value,
    tamanho: R('#marmitaTamanho').value,
    trocas: R('#marmitaTrocas').value,
    dias: R('#marmitaDias').value
  };
  save();
  R('#assinaturaStatus').textContent = 'Assinatura ativa: ' + state.assinatura.plano.toUpperCase() + ' (' + state.assinatura.dias + ' dias/semana)';
  toast('Assinatura ativada!');
}

// --------- Search & Filters
R('#search')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  const list = state.menu.filter(m => (m.nome + m.desc).toLowerCase().includes(q));
  renderMenu(list);
});
RS('[data-filter]').forEach(btn => btn.addEventListener('click', () => filterMenu(btn.dataset.filter)));

// --------- Promo notify toggle
R('#notifyToggle')?.addEventListener('change', (e) => {
  state.notify = e.target.checked; save();
  if (state.notify) toast('Você receberá promoções (simulado).');
});

// --------- Init
(function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  load();
  if (!state.menu || state.menu.length === 0) seedMenu();
  renderMenu();
  updateCartCount();

  const initial = (location.hash || '#home').replace('#','');
  showView(initial);
  RS('.nav-btn').forEach(btn => btn.setAttribute('aria-selected', btn.dataset.nav === initial ? 'true' : 'false'));

})();
