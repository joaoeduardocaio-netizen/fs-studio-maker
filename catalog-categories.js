(()=>{
  let dynamicCategories=[];
  const baseLocalized=localized;

  function normalize(value){return (value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
  function categoryName(row){return row?.translations?.[lang]?.category?.trim()||row?.name||""}
  function findByProductCategory(value){const key=normalize(value);return dynamicCategories.find(r=>normalize(r.name)===key)||null}
  function findBySlug(slug){return dynamicCategories.find(r=>r.slug===slug)||null}

  categoryCollection=function(value){return findByProductCategory(value)?.slug||null};
  localized=function(item,field){
    if(field==="category"){
      const row=findByProductCategory(item.category);if(row)return categoryName(row);
    }
    return baseLocalized(item,field);
  };

  function rebuildFilters(){
    const nav=document.querySelector(".filters");if(!nav)return;
    const t=copy[lang]||copy.it;
    nav.innerHTML=`<button type="button" data-collection="todos">${safe(t.all)}</button>`+dynamicCategories.map(row=>`<button type="button" data-collection="${attr(row.slug)}">${safe(categoryName(row))}</button>`).join("");
    nav.querySelectorAll("[data-collection]").forEach(button=>button.addEventListener("click",()=>{
      collection=button.dataset.collection;
      const url=new URL(location.href);if(collection==="todos")url.searchParams.delete("colecao");else url.searchParams.set("colecao",collection);history.replaceState(null,"",url);applyLanguage();
    }));
  }

  applyLanguage=function(){
    const t=copy[lang]||copy.it;document.documentElement.lang=lang;
    document.querySelectorAll("[data-i18n]").forEach(el=>{if(t[el.dataset.i18n])el.textContent=t[el.dataset.i18n]});
    const title=document.querySelector('[data-i18n="title"]'),intro=document.querySelector('[data-i18n="intro"]');
    if(collection!=="todos"){
      const row=findBySlug(collection);title.textContent=row?categoryName(row):t.title;intro.textContent=t.selectedIntro;
    }else{title.textContent=t.title;intro.textContent=t.intro}
    rebuildFilters();
    document.querySelectorAll("[data-collection]").forEach(button=>button.classList.toggle("active",button.dataset.collection===collection));
    select.value=lang;localStorage.setItem("fs-language",lang);document.querySelector("#footer-wa").href=`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(t.wa)}`;document.querySelector("#cart-close").setAttribute("aria-label",t.close);render();renderCart();
  };

  async function loadDynamicCategories(){
    const {data,error}=await db.from("catalog_categories").select("name,slug,translations,sort_order,published").eq("published",true).order("sort_order").order("name");
    if(error){console.warn("Categorias dinâmicas indisponíveis:",error.message);return}
    dynamicCategories=data||[];
    const requested=new URLSearchParams(location.search).get("colecao");
    collection=requested&&findBySlug(requested)?requested:"todos";
    applyLanguage();
  }

  select.addEventListener("change",()=>setTimeout(()=>{rebuildFilters();document.querySelectorAll("[data-collection]").forEach(button=>button.classList.toggle("active",button.dataset.collection===collection))},0));
  loadDynamicCategories();
})();
