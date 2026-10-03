(() => {
  const cfg=window.FS_SUPABASE;
  const grid=document.querySelector('#catalog-grid');
  if(!cfg||!window.supabase||!grid)return;
  const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
  const label={it:'recensioni',pt:'avaliações',en:'reviews',es:'reseñas',de:'Bewertungen'};
  const lang=()=>localStorage.getItem('fs-language')||'it';
  let byTitle={};
  const norm=v=>(v||'').trim().toLocaleLowerCase();

  const observer=new MutationObserver(decorate);
  const observerOptions={childList:true,subtree:true};

  function decorate(){
    // Ignore mutations caused by our own rating updates.
    observer.disconnect();
    try {
    grid.querySelectorAll('.creation-card').forEach(card=>{
      const h=card.querySelector('.card-content h2');
      if(!h)return;
      const s=byTitle[norm(h.textContent)], old=card.querySelector('.product-rating');
      if(!s){old?.remove();return;}
      const el=old||document.createElement('div');
      el.className='product-rating';
      const html='<span>★ '+s.avg.toFixed(1)+'</span><small>('+s.count+' '+(label[lang()]||label.it)+')</small>';
      if(el.innerHTML!==html)el.innerHTML=html;
      if(!old)h.before(el);
    });
    } finally {
      observer.observe(grid,observerOptions);
    }
  }

  async function load(){
    const {data,error}=await db.from('reviews').select('creation_id,rating,creations(id,title,translations)').eq('approved',true).not('creation_id','is',null);
    if(error)return;
    const groups={};
    (data||[]).forEach(r=>{
      if(!r.creation_id||!r.creations)return;
      const g=groups[r.creation_id]||(groups[r.creation_id]={sum:0,count:0,creation:r.creations});
      g.sum+=Number(r.rating||0); g.count++;
    });
    byTitle={};
    Object.values(groups).forEach(g=>{
      const s={count:g.count,avg:g.sum/g.count};
      const titles=[g.creation.title,...Object.values(g.creation.translations||{}).map(v=>v?.title)].filter(Boolean);
      titles.forEach(t=>{byTitle[norm(t)]=s;});
    });
    decorate();
  }

  observer.observe(grid,observerOptions);
  document.querySelector('#language-select')?.addEventListener('change',()=>setTimeout(decorate,0));
  load().catch(error=>console.warn('Avaliações indisponíveis:',error));
})();
