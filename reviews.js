(() => {
  const cfg = window.FS_SUPABASE;
  if (!cfg || !window.supabase) return;
  const db = window.supabase.createClient(cfg.url, cfg.publishableKey);

  const copy = {
    it: { kicker:'RECENSIONI', title:'Cosa dicono i nostri clienti', intro:'Hai già ricevuto una creazione FS Studio Maker? Raccontaci la tua esperienza.', button:'Lascia il tuo feedback', empty:'Sii il primo a lasciare una recensione.', average:'Valutazione media', based:'recensioni', modalTitle:'Lascia il tuo feedback', name:'Il tuo nome', type:'Cosa vuoi valutare?', product:'Prodotto', purchase:'Acquisto', service:'Assistenza', site:'Sito', chooseProduct:'Quale prodotto? (opzionale)', selectProduct:'Seleziona un prodotto', rating:'La tua valutazione', comment:'Raccontaci la tua esperienza', photo:'Invia una foto del tuo prodotto (opzionale)', photoHelp:'JPG, PNG o WebP, massimo 8 MB.', send:'Invia recensione', sending:'Invio…', thanks:'Grazie! La tua recensione è stata inviata e sarà pubblicata dopo l’approvazione.', error:'Non è stato possibile inviare la recensione. Riprova tra poco.', verified:'Acquisto verificato', close:'Chiudi', chars:'caratteri' },
    pt: { kicker:'AVALIAÇÕES', title:'O que nossos clientes dizem', intro:'Já recebeu uma criação da FS Studio Maker? Conte como foi sua experiência.', button:'Deixe seu feedback', empty:'Seja o primeiro a deixar uma avaliação.', average:'Nota média', based:'avaliações', modalTitle:'Deixe seu feedback', name:'Seu nome', type:'O que você quer avaliar?', product:'Produto', purchase:'Compra', service:'Atendimento', site:'Site', chooseProduct:'Qual produto? (opcional)', selectProduct:'Selecione um produto', rating:'Sua avaliação', comment:'Conte como foi sua experiência', photo:'Envie uma foto do seu produto (opcional)', photoHelp:'JPG, PNG ou WebP, máximo 8 MB.', send:'Enviar avaliação', sending:'Enviando…', thanks:'Obrigado! Sua avaliação foi enviada e aparecerá no site depois da aprovação.', error:'Não foi possível enviar sua avaliação. Tente novamente em instantes.', verified:'Compra verificada', close:'Fechar', chars:'caracteres' },
    en: { kicker:'REVIEWS', title:'What our customers say', intro:'Already received an FS Studio Maker creation? Tell us about your experience.', button:'Leave feedback', empty:'Be the first to leave a review.', average:'Average rating', based:'reviews', modalTitle:'Leave your feedback', name:'Your name', type:'What would you like to review?', product:'Product', purchase:'Purchase', service:'Service', site:'Website', chooseProduct:'Which product? (optional)', selectProduct:'Select a product', rating:'Your rating', comment:'Tell us about your experience', photo:'Upload a photo of your product (optional)', photoHelp:'JPG, PNG or WebP, maximum 8 MB.', send:'Send review', sending:'Sending…', thanks:'Thank you! Your review was sent and will appear after approval.', error:'We could not send your review. Please try again shortly.', verified:'Verified purchase', close:'Close', chars:'characters' },
    es: { kicker:'RESEÑAS', title:'Lo que dicen nuestros clientes', intro:'¿Ya recibiste una creación de FS Studio Maker? Cuéntanos tu experiencia.', button:'Deja tu opinión', empty:'Sé el primero en dejar una reseña.', average:'Valoración media', based:'reseñas', modalTitle:'Deja tu opinión', name:'Tu nombre', type:'¿Qué quieres valorar?', product:'Producto', purchase:'Compra', service:'Atención', site:'Sitio web', chooseProduct:'¿Qué producto? (opcional)', selectProduct:'Selecciona un producto', rating:'Tu valoración', comment:'Cuéntanos tu experiencia', photo:'Sube una foto de tu producto (opcional)', photoHelp:'JPG, PNG o WebP, máximo 8 MB.', send:'Enviar reseña', sending:'Enviando…', thanks:'¡Gracias! Tu reseña fue enviada y aparecerá después de la aprobación.', error:'No pudimos enviar tu reseña. Inténtalo de nuevo en unos instantes.', verified:'Compra verificada', close:'Cerrar', chars:'caracteres' },
    de: { kicker:'BEWERTUNGEN', title:'Was unsere Kunden sagen', intro:'Du hast bereits eine Kreation von FS Studio Maker erhalten? Teile deine Erfahrung.', button:'Feedback geben', empty:'Sei der Erste, der eine Bewertung abgibt.', average:'Durchschnittliche Bewertung', based:'Bewertungen', modalTitle:'Feedback geben', name:'Dein Name', type:'Was möchtest du bewerten?', product:'Produkt', purchase:'Kauf', service:'Service', site:'Website', chooseProduct:'Welches Produkt? (optional)', selectProduct:'Produkt auswählen', rating:'Deine Bewertung', comment:'Erzähl uns von deiner Erfahrung', photo:'Foto deines Produkts hochladen (optional)', photoHelp:'JPG, PNG oder WebP, maximal 8 MB.', send:'Bewertung senden', sending:'Wird gesendet…', thanks:'Danke! Deine Bewertung wurde gesendet und erscheint nach der Freigabe.', error:'Deine Bewertung konnte nicht gesendet werden. Bitte versuche es gleich noch einmal.', verified:'Verifizierter Kauf', close:'Schließen', chars:'Zeichen' }
  };

  const safe = value => { const n=document.createElement('span'); n.textContent=value || ''; return n.innerHTML; };
  const currentLang = () => localStorage.getItem('fs-language') || document.documentElement.lang || 'it';
  const localized = (item, field, lang) => item?.translations?.[lang]?.[field]?.trim() || item?.[field] || '';
  const stars = n => '★'.repeat(Math.max(0, Math.min(5, Number(n)||0))) + '☆'.repeat(Math.max(0, 5-(Number(n)||0)));

  const section = document.createElement('section');
  section.id = 'reviews';
  section.className = 'reviews-section section-shell';
  section.innerHTML = `
    <div class="reviews-head reveal visible">
      <div><span class="kicker" data-review-i18n="kicker"></span><h2 data-review-i18n="title"></h2><p data-review-i18n="intro"></p></div>
      <button type="button" class="button reviews-open" data-review-i18n="button"></button>
    </div>
    <div class="reviews-summary" id="reviews-summary" hidden></div>
    <div class="reviews-grid" id="reviews-grid"><div class="reviews-loading">•••</div></div>
  `;
  const contact = document.querySelector('#contact');
  if (contact) contact.before(section); else document.querySelector('main')?.appendChild(section);

  const modal = document.createElement('div');
  modal.className = 'review-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="review-modal-backdrop" data-review-close></div>
    <div class="review-dialog" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
      <button type="button" class="review-close" data-review-close aria-label="Close">×</button>
      <span class="kicker" data-review-i18n="kicker"></span>
      <h2 id="review-modal-title" data-review-i18n="modalTitle"></h2>
      <form id="review-form">
        <input type="text" id="review-company" name="company" tabindex="-1" autocomplete="off" class="review-honeypot" aria-hidden="true">
        <label><span data-review-i18n="name"></span><input id="review-name" maxlength="80" minlength="2" required autocomplete="name"></label>
        <label><span data-review-i18n="type"></span><select id="review-type" required><option value="product"></option><option value="purchase"></option><option value="service"></option><option value="site"></option></select></label>
        <label id="review-product-wrap"><span data-review-i18n="chooseProduct"></span><select id="review-product"><option value="" data-review-i18n="selectProduct"></option></select></label>
        <fieldset class="review-stars"><legend data-review-i18n="rating"></legend><div class="star-picker" role="radiogroup" aria-label="Rating">${[1,2,3,4,5].map(n=>`<button type="button" data-rating="${n}" aria-label="${n} stars">★</button>`).join('')}</div><input id="review-rating" type="hidden" required></fieldset>
        <label><span data-review-i18n="comment"></span><textarea id="review-comment" rows="5" minlength="5" maxlength="1200" required></textarea><small><span id="review-count">0</span>/1200 <span data-review-i18n="chars"></span></small></label>
        <label><span data-review-i18n="photo"></span><input id="review-photo" type="file" accept="image/jpeg,image/png,image/webp"><small data-review-i18n="photoHelp"></small></label>
        <button class="button" id="review-submit" type="submit" data-review-i18n="send"></button>
        <p id="review-message" class="review-message" role="status"></p>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  let products = [];
  let reviews = [];
  let selectedRating = 0;

  function applyLanguage() {
    const lang = currentLang();
    const t = copy[lang] || copy.it;
    document.querySelectorAll('[data-review-i18n]').forEach(el => { const key=el.dataset.reviewI18n; if (t[key] != null) el.textContent=t[key]; });
    const type = document.querySelector('#review-type');
    if (type) {
      type.options[0].textContent=t.product; type.options[1].textContent=t.purchase; type.options[2].textContent=t.service; type.options[3].textContent=t.site;
    }
    const select = document.querySelector('#review-product');
    if (select) {
      const chosen=select.value; select.innerHTML=`<option value="">${safe(t.selectProduct)}</option>` + products.map(p=>`<option value="${p.id}">${safe(localized(p,'title',lang))}</option>`).join(''); select.value=chosen;
    }
    renderReviews();
  }

  function reviewTypeLabel(type, t){ return ({product:t.product,purchase:t.purchase,service:t.service,site:t.site})[type] || type; }

  function renderReviews() {
    const grid = document.querySelector('#reviews-grid');
    if (!grid) return;
    const lang=currentLang(), t=copy[lang]||copy.it;
    if (!reviews.length) { grid.innerHTML=`<p class="reviews-empty">${safe(t.empty)}</p>`; document.querySelector('#reviews-summary').hidden=true; return; }
    const avg=reviews.reduce((s,r)=>s+Number(r.rating||0),0)/reviews.length;
    const summary=document.querySelector('#reviews-summary');
    summary.hidden=false;
    summary.innerHTML=`<strong>${avg.toFixed(1)} <span>★</span></strong><small>${safe(t.average)} · ${reviews.length} ${safe(t.based)}</small>`;
    grid.innerHTML=reviews.map(r=>{
      const photo=r.photo_path ? db.storage.from('creations').getPublicUrl(r.photo_path).data.publicUrl : '';
      const productName = r.creations ? localized(r.creations,'title',lang) : '';
      return `<article class="review-card">${photo?`<img src="${safe(photo)}" alt="${safe(productName || 'FS Studio Maker')}" loading="lazy">`:''}<div class="review-card-body"><div class="review-card-top"><span class="review-stars-text" aria-label="${r.rating}/5">${stars(r.rating)}</span><span class="review-type">${safe(reviewTypeLabel(r.review_type,t))}</span></div><p class="review-comment">“${safe(r.comment)}”</p>${productName?`<small class="review-product-name">${safe(productName)}</small>`:''}<div class="review-author"><strong>${safe(r.customer_name)}</strong>${r.verified_purchase?`<span>✓ ${safe(t.verified)}</span>`:''}</div></div></article>`;
    }).join('');
  }

  async function loadProducts(){
    const {data}=await db.from('creations').select('id,title,translations').eq('published',true).order('title');
    products=data||[]; applyLanguage();
  }
  async function loadReviews(){
    const {data,error}=await db.from('reviews').select('id,customer_name,rating,review_type,comment,creation_id,photo_path,verified_purchase,featured,created_at,creations(title,translations)').eq('approved',true).order('featured',{ascending:false}).order('created_at',{ascending:false}).limit(8);
    reviews=error?[]:(data||[]); renderReviews();
  }

  function openModal(){ modal.hidden=false; document.body.classList.add('review-modal-open'); setTimeout(()=>document.querySelector('#review-name')?.focus(),20); }
  function closeModal(){ modal.hidden=true; document.body.classList.remove('review-modal-open'); }
  document.querySelector('.reviews-open')?.addEventListener('click',openModal);
  modal.querySelectorAll('[data-review-close]').forEach(el=>el.addEventListener('click',closeModal));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&!modal.hidden) closeModal(); });

  const typeSelect=document.querySelector('#review-type');
  const productWrap=document.querySelector('#review-product-wrap');
  const syncProduct=()=>{ productWrap.hidden=!['product','purchase'].includes(typeSelect.value); };
  typeSelect.addEventListener('change',syncProduct); syncProduct();

  const starButtons=[...modal.querySelectorAll('[data-rating]')];
  starButtons.forEach(btn=>btn.addEventListener('click',()=>{ selectedRating=Number(btn.dataset.rating); document.querySelector('#review-rating').value=String(selectedRating); starButtons.forEach(b=>b.classList.toggle('selected',Number(b.dataset.rating)<=selectedRating)); }));
  const comment=document.querySelector('#review-comment');
  comment.addEventListener('input',()=>document.querySelector('#review-count').textContent=comment.value.length);

  document.querySelector('#review-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const lang=currentLang(), t=copy[lang]||copy.it, message=document.querySelector('#review-message'), submit=document.querySelector('#review-submit');
    if (document.querySelector('#review-company').value) return;
    if (!selectedRating) { message.textContent='★'; return; }
    const file=document.querySelector('#review-photo').files[0];
    if (file && file.size > 8*1024*1024) { message.textContent=t.photoHelp; return; }
    if (file && !['image/jpeg','image/png','image/webp'].includes(file.type)) { message.textContent=t.photoHelp; return; }
    submit.disabled=true; submit.textContent=t.sending; message.textContent='';
    const id=crypto.randomUUID();
    let photoPath=null;
    try {
      if (file) {
        const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
        photoPath=`reviews/${id}/${crypto.randomUUID()}.${ext}`;
        const up=await db.storage.from('creations').upload(photoPath,file,{cacheControl:'3600',upsert:false,contentType:file.type});
        if (up.error) throw up.error;
      }
      const payload={id,customer_name:document.querySelector('#review-name').value.trim(),rating:selectedRating,review_type:typeSelect.value,comment:comment.value.trim(),creation_id:document.querySelector('#review-product').value||null,photo_path:photoPath};
      const {error}=await db.from('reviews').insert(payload);
      if (error) throw error;
      message.textContent=t.thanks; message.classList.add('success');
      e.target.reset(); selectedRating=0; starButtons.forEach(b=>b.classList.remove('selected')); document.querySelector('#review-count').textContent='0'; syncProduct();
      setTimeout(closeModal,2600);
    } catch (err) {
      console.error('Review submit failed',err);
      if(photoPath) await db.storage.from('creations').remove([photoPath]);
      message.textContent=t.error; message.classList.remove('success');
    } finally { submit.disabled=false; submit.textContent=t.send; }
  });

  document.querySelector('#language-select')?.addEventListener('change',()=>setTimeout(applyLanguage,0));
  applyLanguage(); loadProducts(); loadReviews();
})();
