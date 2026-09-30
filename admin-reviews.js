(() => {
  const cfg=window.FS_SUPABASE;
  if(!cfg||!window.supabase)return;
  const db=window.supabase.createClient(cfg.url,cfg.publishableKey);

  const host=document.querySelector('#admin-view');
  if(!host)return;
  const section=document.createElement('section');
  section.className='reviews-admin';
  section.innerHTML=`
    <div class="panel-heading reviews-admin-heading"><div><span class="eyebrow">Avaliações</span><h2>Feedback dos clientes</h2><p>Aprove, oculte e gerencie as avaliações antes de aparecerem no site.</p></div><button id="reviews-refresh" class="text-button" type="button">Atualizar</button></div>
    <div class="reviews-admin-stats" id="reviews-admin-stats"></div>
    <div class="reviews-admin-filters"><button type="button" class="active" data-review-filter="all">Todas</button><button type="button" data-review-filter="pending">Pendentes</button><button type="button" data-review-filter="approved">Aprovadas</button></div>
    <div id="reviews-admin-list" class="reviews-admin-list"><p>Entre no painel para carregar as avaliações.</p></div>
  `;
  host.appendChild(section);

  const safe=v=>{const n=document.createElement('span');n.textContent=v||'';return n.innerHTML};
  const stars=n=>'★'.repeat(Number(n)||0)+'☆'.repeat(5-(Number(n)||0));
  let rows=[]; let filter='all'; let loading=false;

  function isAdmin(session){return !!session?.user?.email && session.user.email.toLowerCase()===String(cfg.adminEmail||'').toLowerCase();}
  function typeLabel(v){return ({product:'Produto',purchase:'Compra',service:'Atendimento',site:'Site'})[v]||v;}
  function visibleRows(){if(filter==='pending')return rows.filter(r=>!r.approved);if(filter==='approved')return rows.filter(r=>r.approved);return rows;}

  function renderStats(){
    const pending=rows.filter(r=>!r.approved).length, approved=rows.filter(r=>r.approved).length;
    const approvedRows=rows.filter(r=>r.approved), avg=approvedRows.length?approvedRows.reduce((s,r)=>s+Number(r.rating||0),0)/approvedRows.length:0;
    document.querySelector('#reviews-admin-stats').innerHTML=`<div><strong>${pending}</strong><span>Pendentes</span></div><div><strong>${approved}</strong><span>Aprovadas</span></div><div><strong>${avg?avg.toFixed(1):'—'}</strong><span>Nota média</span></div>`;
  }

  function render(){
    renderStats();
    const list=document.querySelector('#reviews-admin-list'), data=visibleRows();
    if(!data.length){list.innerHTML='<p class="reviews-admin-empty">Nenhuma avaliação nesta categoria.</p>';return;}
    list.innerHTML=data.map(r=>{
      const photo=r.photo_path?db.storage.from('creations').getPublicUrl(r.photo_path).data.publicUrl:'';
      const product=r.creations?.title||'';
      return `<article class="review-admin-card" data-review-id="${r.id}">
        ${photo?`<img src="${safe(photo)}" alt="Foto enviada pelo cliente" loading="lazy">`:''}
        <div class="review-admin-body">
          <div class="review-admin-top"><div><span class="review-admin-stars">${stars(r.rating)}</span><span class="review-admin-type">${safe(typeLabel(r.review_type))}</span>${r.approved?'<span class="review-admin-status approved">Aprovada</span>':'<span class="review-admin-status pending">Pendente</span>'}</div><small>${new Date(r.created_at).toLocaleString('pt-BR')}</small></div>
          <h3>${safe(r.customer_name)}</h3><p>“${safe(r.comment)}”</p>${product?`<small class="review-admin-product">Produto: ${safe(product)}</small>`:''}
          <div class="review-admin-badges">${r.verified_purchase?'<span>✓ Compra verificada</span>':''}${r.featured?'<span>★ Destaque</span>':''}</div>
          <div class="review-admin-actions">
            ${r.approved?'<button type="button" data-action="hide">Ocultar</button>':'<button type="button" class="primary-mini" data-action="approve">Aprovar</button>'}
            <button type="button" data-action="verify">${r.verified_purchase?'Remover verificação':'Marcar compra verificada'}</button>
            <button type="button" data-action="feature">${r.featured?'Remover destaque':'Destacar'}</button>
            <button type="button" class="danger-mini" data-action="delete">Excluir</button>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  async function load(){
    if(loading)return; loading=true;
    const list=document.querySelector('#reviews-admin-list'); list.innerHTML='<p>Carregando avaliações…</p>';
    const {data,error}=await db.from('reviews').select('id,customer_name,rating,review_type,comment,creation_id,photo_path,approved,verified_purchase,featured,created_at,approved_at,creations(title)').order('created_at',{ascending:false});
    loading=false;
    if(error){list.innerHTML=`<p class="reviews-admin-error">Não foi possível carregar: ${safe(error.message)}</p>`;return;}
    rows=data||[];render();
  }

  async function sync(){const {data:{session}}=await db.auth.getSession();if(isAdmin(session))load();}
  document.querySelector('#reviews-refresh').addEventListener('click',load);
  section.querySelector('.reviews-admin-filters').addEventListener('click',e=>{const b=e.target.closest('[data-review-filter]');if(!b)return;filter=b.dataset.reviewFilter;section.querySelectorAll('[data-review-filter]').forEach(x=>x.classList.toggle('active',x===b));render();});
  document.querySelector('#reviews-admin-list').addEventListener('click',async e=>{
    const btn=e.target.closest('[data-action]');if(!btn)return;
    const card=btn.closest('[data-review-id]'), id=card?.dataset.reviewId, row=rows.find(x=>x.id===id);if(!row)return;
    btn.disabled=true;
    try{
      let error=null;
      if(btn.dataset.action==='approve')({error}=await db.from('reviews').update({approved:true,approved_at:new Date().toISOString()}).eq('id',id));
      if(btn.dataset.action==='hide')({error}=await db.from('reviews').update({approved:false,approved_at:null,featured:false}).eq('id',id));
      if(btn.dataset.action==='verify')({error}=await db.from('reviews').update({verified_purchase:!row.verified_purchase}).eq('id',id));
      if(btn.dataset.action==='feature')({error}=await db.from('reviews').update({featured:!row.featured}).eq('id',id));
      if(btn.dataset.action==='delete'){
        if(!confirm(`Excluir definitivamente a avaliação de ${row.customer_name}?`)){btn.disabled=false;return;}
        if(row.photo_path)await db.storage.from('creations').remove([row.photo_path]);
        ({error}=await db.from('reviews').delete().eq('id',id));
      }
      if(error)throw error;
      await load();
    }catch(err){alert(`Não foi possível concluir: ${err.message||err}`);btn.disabled=false;}
  });
  db.auth.onAuthStateChange((_event,session)=>{if(isAdmin(session))setTimeout(load,0);else rows=[];});
  sync();
})();
