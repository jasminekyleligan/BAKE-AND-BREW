/* Bake & Brew — menu data, cart (saved in the browser), and small helpers */
/* ===== MENU — edit products here =====
   cat: category heading | img: photo in /images | options: choices shown in a dropdown (omit if none) */
const HOT_ICED = ['Hot','Iced'];
const PRODUCTS = [
  { id:'americano', cat:'Espresso & Coffee', name:'Americano', price:160, img:'images/americano.jpg', options:HOT_ICED, desc:'Bold espresso with water. Simple and smooth.' },
  { id:'brown-sugar-espresso', cat:'Espresso & Coffee', name:'Brown Sugar Espresso', price:220, img:'images/brown-sugar-espresso.jpg', options:HOT_ICED, desc:'Espresso and milk sweetened with brown sugar.' },
  { id:'cafe-latte', cat:'Espresso & Coffee', name:'Cafe Latte', price:220, img:'images/cafe-latte.jpg', options:HOT_ICED, desc:'Espresso with silky steamed milk.' },
  { id:'cappuccino', cat:'Espresso & Coffee', name:'Cappuccino', price:200, img:'images/cappuccino.jpg', options:HOT_ICED, desc:'Espresso topped with thick, velvety milk foam.' },
  { id:'spanish-latte', cat:'Espresso & Coffee', name:'Spanish Latte', price:225, img:'images/spanish-latte.jpg', options:HOT_ICED, desc:'Sweet and creamy latte made with condensed milk.' },
  { id:'vanilla-sweet-brew', cat:'Espresso & Coffee', name:'Vanilla Sweet Brew', price:220, img:'images/vanilla-sweet-brew.jpg', options:HOT_ICED, desc:'Espresso with milk and a touch of vanilla sweetness.' }
  // Next categories to add: Frappuccino (Coffee-Based), Frappuccino (Cream-Based), Teas & Refreshers, Cakes, Breads
];
const money = n => '₱' + n.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const byId = id => PRODUCTS.find(p => p.id === id);

/* Cart items are stored as "id|option" (e.g. "latte|Iced"), or just "id" when there is no option */
const split = key => { const [id,opt] = key.split('|'); return { id, opt }; };
const Cart = {
  get(){ try { return JSON.parse(localStorage.getItem('bb-cart2')) || {}; } catch { return {}; } },
  save(c){ try { localStorage.setItem('bb-cart2', JSON.stringify(c)); } catch {} updateBadge(); },
  add(key){ const c=this.get(); c[key]=(c[key]||0)+1; this.save(c); },
  set(key,q){ const c=this.get(); if(q<=0) delete c[key]; else c[key]=q; this.save(c); },
  clear(){ this.save({}); },
  count(){ return Object.values(this.get()).reduce((a,b)=>a+b,0); },
  total(){ return Object.entries(this.get()).reduce((s,[k,q])=>s+(byId(split(k).id)?.price||0)*q,0); }
};

function updateBadge(){
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = Cart.count(); });
}
function toast(msg){
  let t=document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; t.setAttribute('role','status'); document.body.appendChild(t); }
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),1800);
}

/* Menu (product page = grouped by category; home page = first few items) */
function cardHTML(p){
  const opts = p.options ? `<label class="opt"><span class="sr">Choose type for ${p.name}</span>
      <select data-opt="${p.id}">${p.options.map(o=>`<option>${o}</option>`).join('')}</select></label>` : '';
  return `
    <article class="product-card">
      <img class="thumb" src="${p.img}" alt="${p.name}" loading="lazy">
      <div class="body">
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        <p class="price">${money(p.price)}</p>
        ${opts}
        <button type="button" data-add="${p.id}" aria-label="Add ${p.name} to cart">Add to Cart</button>
      </div>
    </article>`;
}
function renderMenu(){
  const el=document.getElementById('menu-grid'); if(!el) return;
  const featured=parseInt(el.dataset.featured||'0',10);
  if(featured){
    el.innerHTML=PRODUCTS.slice(0,featured).map(cardHTML).join('');
  } else {
    const cats=[...new Set(PRODUCTS.map(p=>p.cat))];
    el.classList.remove('grid');
    el.innerHTML=cats.map(c=>`
      <section class="cat" aria-labelledby="cat-${c.replace(/\W+/g,'')}">
        <h3 class="cat-title" id="cat-${c.replace(/\W+/g,'')}">${c}</h3>
        ${c==='Espresso & Coffee'?'<p class="cat-note">Available hot or iced</p>':''}
        <div class="grid">${PRODUCTS.filter(p=>p.cat===c).map(cardHTML).join('')}</div>
      </section>`).join('');
  }
  el.addEventListener('click',e=>{
    const b=e.target.closest('[data-add]'); if(!b) return;
    const id=b.dataset.add, sel=b.closest('.body').querySelector('select');
    Cart.add(sel ? `${id}|${sel.value}` : id);
    toast(`${byId(id).name}${sel?' ('+sel.value+')':''} added to cart`);
  });
}

/* Cart page */
function renderCart(){
  const list=document.getElementById('cart-items'); if(!list) return;
  const c=Cart.get(), keys=Object.keys(c).filter(k=>byId(split(k).id));
  const totalEl=document.getElementById('total');
  const form=document.getElementById('order-form');
  if(!keys.length){
    list.innerHTML='<div class="empty"><p>Your cart is empty.</p><a class="btn" href="product.html">Browse the menu</a></div>';
    totalEl.textContent=money(0); form.querySelector('button').disabled=true; return;
  }
  form.querySelector('button').disabled=false;
  list.innerHTML=keys.map(k=>{const {id,opt}=split(k),p=byId(id),q=c[k];return `
    <div class="cart-row">
      <img class="cart-img" src="${p.img}" alt="">
      <div><strong>${p.name}</strong>${opt?` <span class="tag">${opt}</span>`:''}<br><small>${money(p.price)} each</small></div>
      <div class="qty">
        <button type="button" data-dec="${k}" aria-label="Decrease ${p.name}">−</button>
        <span aria-live="polite">${q}</span>
        <button type="button" data-inc="${k}" aria-label="Increase ${p.name}">+</button>
      </div>
      <div class="line-total"><strong>${money(p.price*q)}</strong><br>
        <button type="button" class="link-btn" data-del="${k}">Remove</button></div>
    </div>`}).join('');
  totalEl.textContent=money(Cart.total());
}
function initCartPage(){
  const list=document.getElementById('cart-items'); if(!list) return;
  list.addEventListener('click',e=>{
    const t=e.target.closest('button'); if(!t) return; const c=Cart.get();
    if(t.dataset.inc) Cart.set(t.dataset.inc,(c[t.dataset.inc]||0)+1);
    if(t.dataset.dec) Cart.set(t.dataset.dec,(c[t.dataset.dec]||0)-1);
    if(t.dataset.del) Cart.set(t.dataset.del,0);
    renderCart();
  });
  document.getElementById('order-form').addEventListener('submit',e=>{
    e.preventDefault();
    const name=e.target.name.value.trim();
    const total=money(Cart.total());
    Cart.clear(); renderCart();
    const msg=document.getElementById('order-msg');
    msg.hidden=false; msg.textContent=`Thank you, ${name}! Your pickup order (${total}) has been received. We'll message you when it's ready.`;
    e.target.reset();
  });
  renderCart();
}

document.addEventListener('DOMContentLoaded',()=>{ updateBadge(); renderMenu(); initCartPage(); });
