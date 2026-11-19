/* VELORA LIVING — shared storefront logic (vanilla JS).
   Requires window.VL_DATA (product catalog) defined before this script. */
(function(){
"use strict";
var root=document.querySelector(".vl");if(!root||!window.VL_DATA)return;
root.classList.remove("no-js");
var D=window.VL_DATA,P=D.products,BY={};P.forEach(function(p){BY[p.id]=p});
var MODE=root.getAttribute("data-vl-mode")||"static";
var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
var $=function(s,c){return(c||root).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||root).querySelectorAll(s))};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
var link=function(slug,q){var b=MODE==="ghl"?(slug==="index"?"/":"/"+slug):slug+".html";return b+(q?"?"+q:"")};
var img=function(p,w,h){return "https://images.unsplash.com/photo-"+p.img+"?auto=format&fit=crop&q=72&w="+w+"&h="+(h||w)};
var money=function(n){return "$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:2})};
var cost=function(p){return p.sale||p.price};
var ICON={heart:'<svg class="vl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  arrow:'<svg class="vl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  x:'<svg class="vl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  bag:'<svg class="vl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>',
  search:'<svg class="vl-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  check:'<svg class="vl-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.8 10A10 10 0 1 1 17 3.33"/><path d="m9 11 3 3L22 4"/></svg>'};

/* ---------- Storage with in-memory fallback ---------- */
var mem={};
var store={get:function(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return mem[k]||d}},
  set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){mem[k]=v}}};
var cart=store.get("velora_cart",[]).filter(function(l){return BY[l.id]});
var wish=store.get("velora_wish",[]).filter(function(id){return BY[id]});
var saveCart=function(){store.set("velora_cart",cart);syncCounts(true);renderCartPage();renderCheckoutSummary()};
var saveWish=function(){store.set("velora_wish",wish);syncCounts();syncHearts();renderWishPage()};
var cartQty=function(){return cart.reduce(function(a,l){return a+l.qty},0)};
var subtotal=function(){return cart.reduce(function(a,l){return a+cost(BY[l.id])*l.qty},0)};
function syncCounts(bump){
  $$("[data-vl-count=cart]").forEach(function(el){var n=cartQty();el.textContent=n;el.classList.toggle("is-on",n>0);if(bump&&n){el.classList.remove("bump");void el.offsetWidth;el.classList.add("bump")}});
  $$("[data-vl-count=wish]").forEach(function(el){el.textContent=wish.length;el.classList.toggle("is-on",wish.length>0)});
  $$("[data-vl-cart-label]").forEach(function(el){el.setAttribute("aria-label","Cart, "+cartQty()+" items")});
}
function syncHearts(){$$("[data-vl-wish]").forEach(function(b){var on=wish.indexOf(b.getAttribute("data-vl-wish"))>-1;b.setAttribute("aria-pressed",on?"true":"false");var p=BY[b.getAttribute("data-vl-wish")];if(p)b.setAttribute("aria-label",(on?"Remove ":"Save ")+p.name+(on?" from":" to")+" wishlist")})}
function addToCart(id,qty,color){
  var p=BY[id];if(!p)return;color=color||p.colors[0].n;qty=Math.max(1,Math.min(10,qty||1));
  var l=cart.filter(function(x){return x.id===id&&x.color===color})[0];
  if(l)l.qty=Math.min(10,l.qty+qty);else cart.push({id:id,color:color,qty:qty});
  saveCart();toast(p,"Added to cart",link("cart"),"View cart");
}
function toggleWish(id,btn){
  var i=wish.indexOf(id),p=BY[id];
  if(i>-1){wish.splice(i,1);toast(p,"Removed from wishlist")}else{wish.push(id);toast(p,"Saved to wishlist",link("wishlist"),"View wishlist")}
  saveWish();if(btn){btn.classList.remove("pop");void btn.offsetWidth;btn.classList.add("pop")}
}
var toastEl,toastT;
function toast(p,msg,href,cta){
  if(!toastEl){toastEl=document.createElement("div");toastEl.className="vl-toast";toastEl.setAttribute("role","status");toastEl.setAttribute("aria-live","polite");root.appendChild(toastEl)}
  toastEl.innerHTML=(p?'<img src="'+img(p,100)+'" alt="">':"")+'<span><b style="font-weight:600">'+esc(msg)+'</b>'+(p?'<br><span style="opacity:.8">'+esc(p.name)+'</span>':"")+'</span>'+(href?'<a href="'+href+'">'+esc(cta)+'</a>':"");
  toastEl.classList.add("is-on");clearTimeout(toastT);toastT=setTimeout(function(){toastEl.classList.remove("is-on")},3200);
}

/* ---------- Card template (mirrors the server-rendered markup) ---------- */
function priceHTML(p){return p.sale?'<span class="vl-price"><span class="is-sale">'+money(p.sale)+'</span><s>'+money(p.price)+'</s></span>':'<span class="vl-price">'+money(p.price)+'</span>'}
function card(p){
  var sw=p.colors.map(function(c){return '<i style="background:'+c.h+'" title="'+esc(c.n)+'"></i>'}).join("");
  var badges=(p.sale?'<span class="vl-badge vl-badge-sale">Sale</span>':"")+(p.stock!=="In stock"?'<span class="vl-badge">'+esc(p.stock)+'</span>':"");
  return '<article class="vl-card" data-id="'+p.id+'"><div class="vl-card-media"><div class="vl-badges">'+badges+'</div>'+
  '<img src="'+img(p,600)+'" srcset="'+img(p,400)+' 400w, '+img(p,600)+' 600w, '+img(p,900)+' 900w" sizes="(max-width:600px) 50vw, (max-width:960px) 45vw, 300px" width="600" height="600" loading="lazy" decoding="async" alt="'+esc(p.alt)+'">'+
  ''+
  '<button type="button" class="vl-heart" data-vl-wish="'+p.id+'" aria-pressed="false" aria-label="Save '+esc(p.name)+' to wishlist">'+ICON.heart+'</button>'+
  '<div class="vl-card-actions"><button type="button" class="vl-btn vl-btn-teal" data-vl-add="'+p.id+'">Add to Cart</button><button type="button" class="vl-btn vl-btn-qv" data-vl-qv="'+p.id+'">Quick View</button></div></div>'+
  '<div class="vl-card-body"><span class="vl-card-cat">'+esc(p.catLabel)+'</span><h3 class="vl-card-name"><a href="'+link("product","id="+p.id)+'">'+esc(p.name)+'</a></h3>'+
  '<span class="vl-card-meta">'+esc(p.colors[0].n)+(p.colors.length>1?" · "+p.colors.length+" finishes":"")+'</span>'+
  '<div class="vl-card-row">'+priceHTML(p)+'<span class="vl-swatches" aria-hidden="true">'+sw+'</span></div>'+
  '<div class="vl-card-mob"><button type="button" class="vl-btn vl-btn-teal" data-vl-add="'+p.id+'">Add to Cart</button><button type="button" class="vl-btn vl-btn-line vl-btn-qv" data-vl-qv="'+p.id+'">Quick View</button></div></div></article>';
}
function fillGrids(scope){$$("[data-vl-products]",scope).forEach(function(g){var ids=g.getAttribute("data-vl-products").split(",");g.innerHTML=ids.filter(function(i){return BY[i]}).map(function(i){return card(BY[i])}).join("")});syncHearts()}

/* ---------- Global click delegation ---------- */
root.addEventListener("click",function(e){
  var t=e.target.closest("[data-vl-add],[data-vl-wish],[data-vl-qv],[data-vl-close-modal]");if(!t)return;
  if(t.hasAttribute("data-vl-add")){e.preventDefault();addToCart(t.getAttribute("data-vl-add"),1)}
  else if(t.hasAttribute("data-vl-wish")){e.preventDefault();toggleWish(t.getAttribute("data-vl-wish"),t)}
  else if(t.hasAttribute("data-vl-qv")){e.preventDefault();quickView(t.getAttribute("data-vl-qv"),t)}
  else closeModal();
});

/* ---------- Quick view ---------- */
var modal,lastFocus;
function quickView(id,opener){
  var p=BY[id];if(!p)return;lastFocus=opener;
  if(!modal){modal=document.createElement("div");modal.className="vl-modal";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-labelledby","vl-qv-title");root.appendChild(modal);
    modal.addEventListener("keydown",function(e){if(e.key==="Escape")closeModal();trap(e,modal)})}
  modal.innerHTML='<div class="vl-shade" data-vl-close-modal style="opacity:1"></div><div class="vl-modal-box"><button type="button" class="vl-modal-close" data-vl-close-modal aria-label="Close quick view">'+ICON.x+'</button>'+
   '<div class="vl-modal-media"><img src="'+img(p,900)+'" alt="'+esc(p.alt)+'"></div>'+
   '<div class="vl-modal-body"><span class="vl-card-cat">'+esc(p.catLabel)+'</span><h2 id="vl-qv-title">'+esc(p.name)+'</h2><div class="vl-pdp-price">'+priceHTML(p)+'</div>'+
   '<span class="vl-stock '+stockCls(p)+'">'+esc(p.stock)+'</span><p style="margin:18px 0;color:var(--gray)">'+esc(p.desc)+'</p>'+
   '<p style="font-size:.88rem"><b>Materials:</b> '+esc(p.materials)+'<br><b>Dimensions:</b> '+esc(p.dims)+'</p>'+
   '<div class="vl-btns" style="margin-top:auto"><button type="button" class="vl-btn vl-btn-teal" data-vl-add="'+p.id+'">Add to Cart</button><a class="vl-btn vl-btn-line" href="'+link("product","id="+p.id)+'">View Details</a></div></div></div>';
  modal.classList.add("is-open");document.body.style.overflow="hidden";setTimeout(function(){$(".vl-modal-close",modal).focus()},50);
}
function closeModal(){if(!modal)return;modal.classList.remove("is-open");document.body.style.overflow="";if(lastFocus)lastFocus.focus()}
function stockCls(p){return p.stock==="Low stock"?"low":p.stock==="Made to order"?"mto":""}
function trap(e,box){if(e.key!=="Tab")return;var f=$$("a[href],button,input,select,textarea",box).filter(function(x){return x.offsetParent!==null});if(!f.length)return;var a=f[0],z=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}

/* ---------- Header: sticky, drawer, search ---------- */
var hdr=$(".vl-header");if(hdr){var s=function(){hdr.classList.toggle("is-stuck",scrollY>30)};addEventListener("scroll",s,{passive:true});s()}
function panel(el,openers){if(!el)return;var last;
  var open=function(){last=document.activeElement;el.classList.add("is-open");el.removeAttribute("aria-hidden");document.body.style.overflow="hidden";var f=$("input,button,a",el);setTimeout(function(){f&&f.focus()},60);openers.forEach(function(o){o.setAttribute("aria-expanded","true")})};
  var close=function(){el.classList.remove("is-open");el.setAttribute("aria-hidden","true");document.body.style.overflow="";openers.forEach(function(o){o.setAttribute("aria-expanded","false")});last&&last.focus()};
  openers.forEach(function(o){o.addEventListener("click",open)});$$("[data-vl-close]",el).forEach(function(c){c.addEventListener("click",close)});
  el.addEventListener("keydown",function(e){if(e.key==="Escape")close();trap(e,el)});return{open:open,close:close}}
panel($(".vl-drawer"),$$("[data-vl-open=menu]"));
var sBox=$(".vl-search");panel(sBox,$$("[data-vl-open=search]"));
if(sBox){var sIn=$("input",sBox),sRes=$(".vl-search-res",sBox);
  sIn.addEventListener("input",function(){var q=sIn.value.trim().toLowerCase();if(q.length<2){sRes.innerHTML="";return}
    var r=P.filter(function(p){return (p.name+" "+p.catLabel+" "+p.materials+" "+p.colors.map(function(c){return c.n}).join(" ")).toLowerCase().indexOf(q)>-1}).slice(0,6);
    sRes.innerHTML=r.length?r.map(function(p){return '<a href="'+link("product","id="+p.id)+'"><img src="'+img(p,120)+'" alt=""><span><b>'+esc(p.name)+'</b><span>'+esc(p.catLabel)+' · '+money(cost(p))+'</span></span></a>'}).join(""):'<p style="color:var(--gray)">No pieces match “'+esc(sIn.value)+'”. Try “oak”, “linen” or “lamp”.</p>'});
  $("form",sBox).addEventListener("submit",function(e){e.preventDefault();location.href=link("shop","q="+encodeURIComponent(sIn.value.trim()))});}

/* ---------- Reveal ---------- */
var rv=$$(".vl-rv,.vl-rv-img");
if(!("IntersectionObserver" in window)||reduce)rv.forEach(function(e){e.classList.add("is-in")});
else{var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add("is-in");io.unobserve(en.target)}})},{rootMargin:"0px 0px -8% 0px",threshold:.06});rv.forEach(function(e){io.observe(e)})}

/* ---------- Room gallery tabs ---------- */
$$("[data-vl-rooms]").forEach(function(wrap){var tabs=$$("[data-vl-room-tab]",wrap),items=$$("[data-vl-room]",wrap);
  tabs.forEach(function(t){t.addEventListener("click",function(){var v=t.getAttribute("data-vl-room-tab");tabs.forEach(function(x){x.setAttribute("aria-selected",x===t?"true":"false")});
    items.forEach(function(i){i.classList.toggle("is-dim",v!=="all"&&i.getAttribute("data-vl-room")!==v)})})})});

/* ---------- Shop ---------- */
var shop=$("[data-vl-shop]");
if(shop){
  var qs=new URLSearchParams(location.search),st={cat:qs.get("cat")||"all",q:qs.get("q")||"",max:5000,sort:"featured",shown:12};
  var grid=$("[data-vl-grid]",shop),count=$("[data-vl-result-count]",shop),more=$("[data-vl-more]",shop),qIn=$("#vl-q",shop),rng=$("#vl-price",shop),out=$("#vl-price-out",shop),sortS=$("#vl-sort",shop),chips=$("[data-vl-chips]",shop),fl=$(".vl-filters",shop);
  var maxP=Math.max.apply(null,P.map(cost));rng.max=Math.ceil(maxP/100)*100;rng.value=rng.max;st.max=+rng.max;qIn.value=st.q;
  var cats=$$("[data-vl-cat]",shop);
  var catCount=function(c){return P.filter(function(p){return c==="all"||p.cat===c}).length};
  cats.forEach(function(b){var c=b.getAttribute("data-vl-cat");$("small",b).textContent=catCount(c);b.addEventListener("click",function(){st.cat=c;st.shown=12;run(true)})});
  qIn.addEventListener("input",function(){st.q=qIn.value;st.shown=12;run(true)});
  rng.addEventListener("input",function(){st.max=+rng.value;out.textContent="Up to "+money(st.max);st.shown=12;run(true)});
  sortS.addEventListener("change",function(){st.sort=sortS.value;run(true)});
  more.addEventListener("click",function(){st.shown+=12;run(false)});
  $$("[data-vl-filters-open]",root).forEach(function(b){b.addEventListener("click",function(){fl.classList.add("is-open");b.setAttribute("aria-expanded","true");$("button",fl).focus()})});
  $$("[data-vl-filters-close]",root).forEach(function(b){b.addEventListener("click",function(){fl.classList.remove("is-open");$$("[data-vl-filters-open]",root).forEach(function(o){o.setAttribute("aria-expanded","false")})})});
  chips.addEventListener("click",function(e){var b=e.target.closest("[data-clear]");if(!b)return;var k=b.getAttribute("data-clear");if(k==="cat")st.cat="all";if(k==="q"){st.q="";qIn.value=""}if(k==="max"){st.max=+rng.max;rng.value=rng.max;out.textContent="Any price"}if(k==="all"){st.cat="all";st.q="";qIn.value="";st.max=+rng.max;rng.value=rng.max;out.textContent="Any price"}run(true)});
  var heading=$("[data-vl-shop-title]",root);
  function run(fade){
    var q=st.q.trim().toLowerCase();
    var list=P.filter(function(p){return(st.cat==="all"||p.cat===st.cat)&&cost(p)<=st.max&&(!q||(p.name+" "+p.catLabel+" "+p.materials+" "+p.short+" "+p.colors.map(function(c){return c.n}).join(" ")).toLowerCase().indexOf(q)>-1)});
    if(st.sort==="price-asc")list.sort(function(a,b){return cost(a)-cost(b)});
    if(st.sort==="price-desc")list.sort(function(a,b){return cost(b)-cost(a)});
    if(st.sort==="name")list.sort(function(a,b){return a.name.localeCompare(b.name)});
    cats.forEach(function(b){b.setAttribute("aria-pressed",b.getAttribute("data-vl-cat")===st.cat?"true":"false")});
    var label=st.cat==="all"?"All Furniture":(P.filter(function(p){return p.cat===st.cat})[0]||{}).catLabel;
    if(heading)heading.textContent=label;
    count.textContent=list.length+(list.length===1?" piece":" pieces");
    var c="";if(st.cat!=="all")c+='<span class="vl-chip">'+esc(label)+' <button type="button" data-clear="cat" aria-label="Remove category filter">×</button></span>';
    if(q)c+='<span class="vl-chip">“'+esc(st.q)+'” <button type="button" data-clear="q" aria-label="Clear search">×</button></span>';
    if(st.max<+rng.max)c+='<span class="vl-chip">Up to '+money(st.max)+' <button type="button" data-clear="max" aria-label="Remove price filter">×</button></span>';
    if(c)c+='<button type="button" class="vl-txt-btn" data-clear="all">Clear all</button>';chips.innerHTML=c;
    var draw=function(){
      grid.innerHTML=list.length?list.slice(0,st.shown).map(card).join(""):'<div class="vl-empty" style="grid-column:1/-1">'+ICON.search+'<h3>No pieces match those filters</h3><p style="color:var(--gray)">Try a different search term, a wider price range or another category.</p><button type="button" class="vl-btn vl-btn-line" data-clear="all">Clear filters</button></div>';
      var e=$("[data-clear=all]",grid);if(e)e.addEventListener("click",function(){st.cat="all";st.q="";qIn.value="";st.max=+rng.max;rng.value=rng.max;out.textContent="Any price";run(true)});
      more.parentNode.style.display=list.length>st.shown?"":"none";$("p",more.parentNode).textContent="Showing "+Math.min(st.shown,list.length)+" of "+list.length;
      syncHearts();grid.classList.remove("is-fading");
    };
    if(fade&&!reduce){grid.classList.add("is-fading");setTimeout(draw,180)}else draw();
    var u=new URLSearchParams();if(st.cat!=="all")u.set("cat",st.cat);if(st.q)u.set("q",st.q);try{history.replaceState(null,"",location.pathname+(u.toString()?"?"+u:""))}catch(e){}
  }
  out.textContent="Any price";run(false);
}

/* ---------- Product detail ---------- */
var pdp=$("[data-vl-pdp]");
if(pdp){
  var id=new URLSearchParams(location.search).get("id")||P[0].id,p=BY[id];
  if(!p){pdp.innerHTML='<div class="vl-empty"><h2>We couldn’t find that piece</h2><p style="color:var(--gray)">It may have been renamed. Browse the full collection instead.</p><a class="vl-btn vl-btn-teal" href="'+link("shop")+'">Shop All Furniture</a></div>';}
  else{
    document.title=p.name+" — "+p.catLabel+" | Velora Living";
    var md=document.querySelector('meta[name="description"]');if(md)md.setAttribute("content",p.short+" Shop it at Velora Living.");
    var ld=document.createElement("script");ld.type="application/ld+json";
    /* Product schema without offers/ratings until live store data is connected */
    ld.textContent=JSON.stringify({"@context":"https://schema.org","@type":"Product","name":p.name,"sku":p.sku,"description":p.desc,"image":img(p,1200),"category":p.catLabel,"material":p.materials,"brand":{"@type":"Brand","name":"Velora Living"}});
    document.head.appendChild(ld);
    var cr=$("[data-vl-crumb-cat]");if(cr){cr.textContent=p.catLabel;cr.href=link("shop","cat="+p.cat)}var cn=$("[data-vl-crumb-name]");if(cn)cn.textContent=p.name;
    var col=p.colors[0].n;
    var diagram='<svg viewBox="0 0 400 300" role="img" aria-label="Dimension diagram"><rect x="60" y="80" width="280" height="140" fill="none" stroke="#064F4B" stroke-width="1.5"/><path d="M60 250h280M60 244v12M340 244v12M30 80v140M24 80h12M24 220h12" stroke="#C59B62" stroke-width="1.2"/><text x="200" y="275" text-anchor="middle" font-family="Inter" font-size="13" fill="#171C1B">Width</text><text x="18" y="155" text-anchor="middle" font-family="Inter" font-size="13" fill="#171C1B" transform="rotate(-90 18 155)">Height</text><text x="200" y="145" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="22" fill="#064F4B">'+esc(p.name)+'</text><text x="200" y="172" text-anchor="middle" font-family="Inter" font-size="12" fill="#777C7A">'+esc(p.dims.split(";")[0])+'</text></svg>';
    var board='<div class="vl-swatchboard" style="grid-template-rows:repeat('+Math.ceil(p.colors.length/2)+',1fr)">'+p.colors.map(function(c){return '<div style="background:'+c.h+'"><span>'+esc(c.n)+'</span></div>'}).join("")+(p.colors.length%2?'<div style="background:#EFECE6;color:#171C1B;text-shadow:none"><span>Finish swatches</span></div>':"")+'</div>';
    pdp.innerHTML='<div class="vl-gallery"><div class="vl-thumbs" role="group" aria-label="Product views">'+
      '<button type="button" aria-pressed="true" data-v="0" aria-label="Photo"><img src="'+img(p,200)+'" alt=""></button>'+
      '<button type="button" aria-pressed="false" data-v="1" aria-label="Dimension diagram" style="background:#F7F5F0;display:grid;place-items:center"><svg viewBox="0 0 24 24" class="vl-ico" style="width:28px;height:28px;color:#064F4B"><rect x="4" y="7" width="16" height="10"/><path d="M4 20h16M2 7v10"/></svg></button>'+
      '<button type="button" aria-pressed="false" data-v="2" aria-label="Finish swatches" style="background:linear-gradient(135deg,'+p.colors.map(function(c){return c.h}).join(",")+(p.colors.length===1?","+p.colors[0].h:"")+')"></button></div>'+
      '<div class="vl-stage"><div class="is-on"><img src="'+img(p,1400)+'" alt="'+esc(p.alt)+'" fetchpriority="high"></div><div class="vl-diagram">'+diagram+'</div>'+board+'</div></div>'+
      '<div class="vl-pdp-info"><span class="vl-card-cat">'+esc(p.catLabel)+' · '+esc(p.sku)+'</span><h1>'+esc(p.name)+'</h1><p style="color:var(--gray);font-size:1.05rem">'+esc(p.short)+'</p>'+
      '<div class="vl-pdp-price">'+priceHTML(p)+(p.sale?' <span class="vl-badge vl-badge-sale" style="vertical-align:middle">Sale</span>':"")+'</div><span class="vl-stock '+stockCls(p)+'">'+esc(p.stock)+'</span>'+
      '<div class="vl-opt"><div class="vl-opt-label">Finish <span data-vl-colname>'+esc(col)+'</span></div><div class="vl-colors" role="radiogroup" aria-label="Finish">'+p.colors.map(function(c,i){return '<button type="button" role="radio" aria-checked="'+(i?"false":"true")+'" aria-pressed="'+(i?"false":"true")+'" data-c="'+esc(c.n)+'" style="background:'+c.h+'" aria-label="'+esc(c.n)+'"></button>'}).join("")+'</div>'+
      (p.colors.length>1?'<p class="vl-color-note">Photo shows one finish. Your selected color is saved with your order.</p>':"")+'</div>'+
      '<div class="vl-buy"><div class="vl-qty"><button type="button" data-q="-1" aria-label="Decrease quantity">−</button><input type="number" min="1" max="10" value="1" aria-label="Quantity" inputmode="numeric"><button type="button" data-q="1" aria-label="Increase quantity">+</button></div>'+
      '<button type="button" class="vl-btn vl-btn-teal" data-vl-pdp-add>'+ICON.bag+' Add to Cart</button><button type="button" class="vl-heart" data-vl-wish="'+p.id+'" aria-pressed="false" aria-label="Save to wishlist">'+ICON.heart+'</button></div>'+
      '<div class="vl-assure"><span>'+ICON.check+'Secure checkout</span><span>'+ICON.check+'Styling help available</span></div>'+
      '<div class="vl-specs"><details open><summary>Description</summary><div class="vl-spec-body"><p>'+esc(p.desc)+'</p></div></details>'+
      '<details><summary>Materials &amp; Dimensions</summary><div class="vl-spec-body"><table class="vl-spec-table"><tr><th>Materials</th><td>'+esc(p.materials)+'</td></tr><tr><th>Dimensions</th><td>'+esc(p.dims)+'</td></tr><tr><th>Finishes</th><td>'+p.colors.map(function(c){return esc(c.n)}).join(", ")+'</td></tr><tr><th>Collection</th><td><a style="color:var(--teal)" href="'+link("collections")+'#'+p.coll+'">'+esc(D.collections[p.coll])+'</a></td></tr></table></div></details>'+
      '<details><summary>Care</summary><div class="vl-spec-body"><p>'+esc(p.care)+'</p></div></details>'+
      '<details><summary>Delivery</summary><div class="vl-spec-body"><p>Delivery is a flat rate within the continental US. Delivery timing is confirmed after your order is placed.</p></div></details></div></div>';
    var qIn2=$(".vl-qty input",pdp);
    $$(".vl-qty button",pdp).forEach(function(b){b.addEventListener("click",function(){qIn2.value=Math.max(1,Math.min(10,(+qIn2.value||1)+(+b.getAttribute("data-q"))))})});
    qIn2.addEventListener("change",function(){qIn2.value=Math.max(1,Math.min(10,Math.round(+qIn2.value)||1))});
    $$(".vl-colors button",pdp).forEach(function(b){b.addEventListener("click",function(){col=b.getAttribute("data-c");$$(".vl-colors button",pdp).forEach(function(x){var on=x===b;x.setAttribute("aria-pressed",on?"true":"false");x.setAttribute("aria-checked",on?"true":"false")});$("[data-vl-colname]",pdp).textContent=col})});
    $("[data-vl-pdp-add]",pdp).addEventListener("click",function(){addToCart(p.id,+qIn2.value,col)});
    var views=$$(".vl-stage > *",pdp),tb=$$(".vl-thumbs button",pdp);
    tb.forEach(function(b){b.addEventListener("click",function(){var v=+b.getAttribute("data-v");tb.forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});views.forEach(function(x,i){x.classList.toggle("is-on",i===v)})})});
    var rel=$("[data-vl-related]");if(rel){rel.setAttribute("data-vl-products",p.related.join(","))}
    syncHearts();
  }
}

/* ---------- Cart page ---------- */
function lineHTML(l,i){var p=BY[l.id];return '<li class="vl-line"><a href="'+link("product","id="+p.id)+'" tabindex="-1" aria-hidden="true"><img src="'+img(p,240)+'" alt=""></a><div><h3><a href="'+link("product","id="+p.id)+'">'+esc(p.name)+'</a></h3><div class="vl-line-meta">'+esc(p.catLabel)+' · '+esc(l.color)+' · '+money(cost(p))+' each</div>'+
  '<div class="vl-line-ctl"><div class="vl-qty"><button type="button" data-line="'+i+'" data-d="-1" aria-label="Decrease quantity of '+esc(p.name)+'">−</button><input type="number" min="1" max="10" value="'+l.qty+'" data-line-in="'+i+'" aria-label="Quantity of '+esc(p.name)+'"><button type="button" data-line="'+i+'" data-d="1" aria-label="Increase quantity of '+esc(p.name)+'">+</button></div>'+
  '<button type="button" class="vl-txt-btn" data-rm="'+i+'">Remove</button><button type="button" class="vl-txt-btn" data-move="'+i+'">Move to wishlist</button></div></div><div class="vl-line-total">'+money(cost(p)*l.qty)+'</div></li>'}
var SHIP=149;
function totalsHTML(){var s=subtotal(),sh=s>0?SHIP:0;return '<div class="vl-sum-row"><span>Subtotal ('+cartQty()+' items)</span><span>'+money(s)+'</span></div><div class="vl-sum-row"><span>Shipping <small>(flat rate)</small></span><span>'+money(sh)+'</span></div><div class="vl-sum-row"><span>Tax</span><span>Not calculated</span></div><div class="vl-sum-row vl-sum-total"><span>Total</span><span>'+money(s+sh)+'</span></div>'}
function renderCartPage(){var cp=$("[data-vl-cart-page]");if(!cp)return;
  if(!cart.length){cp.innerHTML='<div class="vl-empty">'+ICON.bag+'<h2>Your cart is empty</h2><p style="color:var(--gray);max-width:420px;margin:0 auto 22px">Browse the collection and add a few pieces — your cart is saved in this browser.</p><div class="vl-btns" style="justify-content:center"><a class="vl-btn vl-btn-teal" href="'+link("shop")+'">Continue Shopping</a>'+(wish.length?'<a class="vl-btn vl-btn-line" href="'+link("wishlist")+'">View Wishlist ('+wish.length+')</a>':"")+'</div></div>';return}
  cp.innerHTML='<div class="vl-cart"><div><ul class="vl-lines">'+cart.map(lineHTML).join("")+'</ul><p style="margin-top:22px"><a class="vl-link" href="'+link("shop")+'">Continue Shopping '+ICON.arrow+'</a></p></div>'+
  '<aside class="vl-summary" aria-label="Order summary"><h2>Summary</h2>'+totalsHTML()+'<a class="vl-btn vl-btn-teal vl-btn-block" style="margin-top:20px" href="'+link("checkout")+'">Proceed to Checkout</a><p class="vl-fine">Tax is calculated at payment.</p></aside></div>'}
root.addEventListener("click",function(e){var b=e.target.closest("[data-line],[data-rm],[data-move],[data-w-add],[data-w-rm]");if(!b||!b.closest("[data-vl-cart-page],[data-vl-wish-page]"))return;
  if(b.hasAttribute("data-line")){var l=cart[+b.getAttribute("data-line")];l.qty=Math.max(1,Math.min(10,l.qty+(+b.getAttribute("data-d"))));saveCart()}
  if(b.hasAttribute("data-rm")){var r=cart.splice(+b.getAttribute("data-rm"),1)[0];saveCart();toast(BY[r.id],"Removed from cart")}
  if(b.hasAttribute("data-move")){var m=cart.splice(+b.getAttribute("data-move"),1)[0];if(wish.indexOf(m.id)<0)wish.push(m.id);saveCart();saveWish();toast(BY[m.id],"Moved to wishlist")}
  if(b.hasAttribute("data-w-add")){var id=b.getAttribute("data-w-add");wish.splice(wish.indexOf(id),1);saveWish();addToCart(id,1)}
  if(b.hasAttribute("data-w-rm")){var id2=b.getAttribute("data-w-rm");wish.splice(wish.indexOf(id2),1);saveWish();toast(BY[id2],"Removed from wishlist")}
});
root.addEventListener("change",function(e){var i=e.target.getAttribute&&e.target.getAttribute("data-line-in");if(i===null||i===undefined)return;cart[+i].qty=Math.max(1,Math.min(10,Math.round(+e.target.value)||1));saveCart()});

/* ---------- Wishlist page ---------- */
function renderWishPage(){var wp=$("[data-vl-wish-page]");if(!wp)return;
  if(!wish.length){wp.innerHTML='<div class="vl-empty">'+ICON.heart+'<h2>Nothing saved yet</h2><p style="color:var(--gray);max-width:420px;margin:0 auto 22px">Tap the heart on any piece to keep it here while you decide.</p><a class="vl-btn vl-btn-teal" href="'+link("shop")+'">Explore the Collection</a></div>';return}
  wp.innerHTML='<p style="color:var(--gray);margin-bottom:28px">'+wish.length+' saved '+(wish.length===1?"piece":"pieces")+' · stored in this browser</p><div class="vl-grid">'+wish.map(function(id){var p=BY[id];return '<article class="vl-card"><div class="vl-card-media"><img src="'+img(p,600)+'" alt="'+esc(p.alt)+'" loading="lazy" width="600" height="600"></div><div class="vl-card-body"><span class="vl-card-cat">'+esc(p.catLabel)+'</span><h3 class="vl-card-name"><a href="'+link("product","id="+p.id)+'">'+esc(p.name)+'</a></h3><div class="vl-card-row">'+priceHTML(p)+'</div><div class="vl-card-mob" style="display:grid;grid-template-columns:1fr auto"><button type="button" class="vl-btn vl-btn-teal" data-w-add="'+id+'">Move to Cart</button><button type="button" class="vl-btn vl-btn-line" data-w-rm="'+id+'" aria-label="Remove '+esc(p.name)+' from wishlist">Remove</button></div></div></article>'}).join("")+'</div>'}

/* ---------- Checkout ---------- */
function renderCheckoutSummary(){var cs=$("[data-vl-co-summary]");if(!cs)return;
  if(!cart.length){cs.innerHTML='<h2>Your order</h2><p style="color:var(--gray)">Your cart is empty.</p><a class="vl-btn vl-btn-line vl-btn-block" href="'+link("shop")+'">Shop the Collection</a>';var f=$("[data-vl-co-form]");if(f&&!f.hidden)f.querySelector("button[type=submit]").disabled=true;return}
  cs.innerHTML='<h2>Your order</h2><ul class="vl-mini-lines">'+cart.map(function(l){var p=BY[l.id];return '<li><img src="'+img(p,124)+'" alt=""><span><b>'+esc(p.name)+'</b><small>'+esc(l.color)+' · Qty '+l.qty+'</small></span><span>'+money(cost(p)*l.qty)+'</span></li>'}).join("")+'</ul>'+totalsHTML()+'<p class="vl-fine"><a style="color:var(--teal)" href="'+link("cart")+'">Edit cart</a></p>'}

/* ---------- Form validation (checkout, contact, styling inquiry) ---------- */
function msgFor(el){var v=el.type==="checkbox"?el.checked:el.value.trim(),lab=el.getAttribute("data-label")||"This field";
  if(el.required&&!v)return el.type==="checkbox"?"Please confirm to continue.":lab+" is required.";if(!v)return "";
  if(el.type==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))return "Enter a valid email address.";
  if(el.type==="tel"&&!/^[+()\d\s.-]{7,20}$/.test(v))return "Enter a valid phone number.";
  if(el.getAttribute("data-zip")&&!/^\d{5}(-\d{4})?$/.test(v))return "Enter a 5-digit ZIP code.";
  if(el.minLength>0&&v.length<el.minLength)return lab+" should be at least "+el.minLength+" characters.";return ""}
function check(el){var f=el.closest(".vl-f");if(!f)return !msgFor(el);var m=msgFor(el),e=$(".vl-err",f);f.classList.toggle("bad",!!m);f.classList.toggle("ok",!m&&(el.type==="checkbox"?el.checked:!!el.value.trim()));el.setAttribute("aria-invalid",m?"true":"false");if(e)e.textContent=m;return !m}
$$("form[data-vl-form]").forEach(function(form){var els=$$("input,select,textarea",form);
  els.forEach(function(el){el.addEventListener("blur",function(){check(el)});el.addEventListener("input",function(){if(el.closest(".vl-f.bad"))check(el)});el.addEventListener("change",function(){if(el.tagName==="SELECT"||el.type==="checkbox")check(el)})});
  form.addEventListener("submit",function(e){e.preventDefault();var ok=true,first=null;els.forEach(function(el){if(!check(el)){ok=false;first=first||el}});if(!ok){first.focus();return}
    var done=$(form.getAttribute("data-done")),dl=done&&$("dl",done);
    if(dl){dl.innerHTML="";$$("[data-sum]",form).forEach(function(el){var v=el.tagName==="SELECT"?el.options[el.selectedIndex].text:el.value.trim();if(!v)return;dl.insertAdjacentHTML("beforeend","<dt>"+esc(el.getAttribute("data-label"))+"</dt><dd>"+esc(v)+"</dd>")})}
    if(form.hasAttribute("data-vl-co-form")){var ref="VL-"+Math.random().toString(36).slice(2,8).toUpperCase();dl.insertAdjacentHTML("afterbegin","<dt>Reference</dt><dd>"+ref+"</dd><dt>Items</dt><dd>"+cartQty()+" ("+esc(money(subtotal()+SHIP))+" total)</dd>");cart=[];saveCart();$$("[data-vl-co-hide]").forEach(function(x){x.hidden=true})}
    form.hidden=true;if(done){done.classList.add("is-on");done.setAttribute("tabindex","-1");done.focus();done.scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"})}
    /* GHL HOOK: connect to a native GHL form, order form or workflow here. Until connected, submissions are not transmitted. */
  })});

/* ---------- Newsletter ---------- */
$$("form[data-vl-news]").forEach(function(f){var i=$("input",f),m=f.parentNode.querySelector(".vl-news-msg");f.addEventListener("submit",function(e){e.preventDefault();var v=i.value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)){m.textContent="Please enter a valid email address.";m.className="vl-news-msg err";i.focus();return}
  m.textContent="Thank you for signing up.";m.className="vl-news-msg";f.reset()})});

$$("[data-vl-year]").forEach(function(e){e.textContent=new Date().getFullYear()});
fillGrids();renderCartPage();renderWishPage();renderCheckoutSummary();syncCounts();syncHearts();
})();
