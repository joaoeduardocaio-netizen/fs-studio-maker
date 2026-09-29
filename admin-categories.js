(()=>{
  const table="catalog_categories";
  const langs=["it","en","es","de"];
  let rows=[];

  function safe(value){const node=document.createElement("span");node.textContent=value||"";return node.innerHTML}
  function msg(el,text,type=""){if(!el)return;el.textContent=text;el.className=`message ${type}`}
  function setBusy(button,on,label){if(!button)return;if(!button.dataset.original)button.dataset.original=button.textContent;button.disabled=on;button.textContent=on?label:button.dataset.original}
  function slugify(value){return (value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"categoria"}
  function uniqueSlug(name,id){const base=slugify(name);let slug=base,n=2;const used=new Set(rows.filter(r=>r.id!==id).map(r=>r.slug));while(used.has(slug))slug=`${base}-${n++}`;return slug}

  function replaceCategoryField(){
    const input=document.querySelector("#category");
    if(!input||input.tagName==="SELECT")return;
    const select=document.createElement("select");
    select.id="category";select.required=true;
    select.innerHTML='<option value="">Selecione uma categoria</option>';
    input.replaceWith(select);
    document.querySelector("#collection-categories")?.remove();
    const help=select.closest(".row")?.nextElementSibling;
    if(help?.classList.contains("media-help"))help.textContent="Escolha uma categoria cadastrada abaixo. Para criar outra, use a área “Categorias do catálogo”.";
  }

  function injectManager(){
    if(document.querySelector("#category-manager"))return;
    const media=document.querySelector(".media-manager");
    if(!media)return;
    const section=document.createElement("section");
    section.id="category-manager";
    section.className="category-manager";
    section.innerHTML=`
      <div class="panel-heading media-heading"><div><span class="eyebrow">Catálogo</span><h2>Categorias do catálogo</h2><p>Crie novas categorias sem precisar mexer no código. Elas aparecem automaticamente nos filtros do catálogo.</p></div></div>
      <div class="admin-layout">
        <form id="category-form" class="panel"><input id="category-id" type="hidden"><input id="category-original-name" type="hidden">
          <div class="panel-heading"><div><h2 id="category-form-title">Nova categoria</h2><p>Ex.: Mascotes de times, Chaveiros, Decoração.</p></div><button id="cancel-category-edit" type="button" class="text-button" hidden>Cancelar edição</button></div>
          <label>Nome da categoria *<input id="category-name" required maxlength="60" placeholder="Ex.: Mascotes de times"></label>
          <div class="row"><label>Ordem de exibição<input id="category-order" type="number" value="0" step="1"></label><div><span style="font-size:12px;font-weight:800;color:#333e5b">Visibilidade</span><div class="category-check"><label><input id="category-published" type="checkbox" checked> Mostrar como filtro no catálogo</label></div></div></div>
          <p class="category-note">Ao renomear uma categoria, os produtos vinculados a ela também serão atualizados. Uma categoria que ainda tenha produtos não pode ser excluída.</p>
          <button id="save-category-button" class="primary" type="submit">Salvar categoria</button><p id="category-message" class="message" role="status"></p>
        </form>
        <section class="panel"><div class="panel-heading"><div><h2>Categorias cadastradas</h2><p>Edite, oculte ou exclua categorias sem produtos.</p></div><button id="refresh-categories" type="button" class="text-button">Atualizar</button></div><div id="category-list" class="creation-list"><p>Carregando…</p></div></section>
      </div>`;
    media.parentNode.insertBefore(section,media);
    document.querySelector("#category-form").addEventListener("submit",saveCategory);
    document.querySelector("#cancel-category-edit").addEventListener("click",resetCategoryForm);
    document.querySelector("#refresh-categories").addEventListener("click",loadCategories);
  }

  function populateProductSelect(){
    const select=document.querySelector("#category");
    if(!select||select.tagName!=="SELECT")return;
    const current=select.value;
    select.innerHTML='<option value="">Selecione uma categoria</option>'+rows.map(r=>`<option value="${safe(r.name)}">${safe(r.name)}${r.published?"":" (oculta)"}</option>`).join("");
    if(current&&rows.some(r=>r.name===current))select.value=current;
  }

  function renderList(){
    const list=document.querySelector("#category-list");if(!list)return;
    if(!rows.length){list.innerHTML="<p>Nenhuma categoria cadastrada.</p>";return}
    list.innerHTML=rows.map(r=>`<article class="list-item category-list-item"><div><h3>${safe(r.name)}</h3><p>Ordem: ${Number(r.sort_order)||0}</p><span class="status ${r.published?"":"draft"}">${r.published?"Visível":"Oculta"}</span></div><div class="item-actions"><button type="button" data-category-edit="${r.id}">Editar</button><button type="button" class="delete" data-category-delete="${r.id}">Excluir</button></div></article>`).join("");
    list.querySelectorAll("[data-category-edit]").forEach(b=>b.addEventListener("click",()=>editCategory(b.dataset.categoryEdit)));
    list.querySelectorAll("[data-category-delete]").forEach(b=>b.addEventListener("click",()=>deleteCategory(b.dataset.categoryDelete)));
  }

  async function loadCategories(){
    const list=document.querySelector("#category-list");if(list)list.innerHTML="<p>Carregando…</p>";
    const {data,error}=await db.from(table).select("id,name,slug,translations,sort_order,published,created_at").order("sort_order").order("name");
    if(error){if(list)list.innerHTML=`<p>Erro ao carregar: ${safe(error.message)}</p>`;return}
    rows=data||[];populateProductSelect();renderList();
  }

  async function translateName(name){
    const {data,error}=await db.functions.invoke("translate-creation",{body:{title:name,description:"",category:name}});
    if(error||!data?.translations){let detail=data?.error||error?.message||"Serviço de tradução indisponível.";if(error?.context?.json){try{detail=(await error.context.json()).error||detail}catch{}}throw new Error(detail)}
    const out={};for(const code of langs){const value=data.translations?.[code]?.category?.trim();if(value)out[code]={category:value}}return out;
  }

  function resetCategoryForm(){
    const form=document.querySelector("#category-form");if(!form)return;form.reset();
    document.querySelector("#category-id").value="";document.querySelector("#category-original-name").value="";document.querySelector("#category-order").value=0;document.querySelector("#category-published").checked=true;document.querySelector("#category-form-title").textContent="Nova categoria";document.querySelector("#cancel-category-edit").hidden=true;msg(document.querySelector("#category-message"),"");
  }

  function editCategory(id){
    const item=rows.find(r=>r.id===id);if(!item)return;
    document.querySelector("#category-id").value=item.id;document.querySelector("#category-original-name").value=item.name;document.querySelector("#category-name").value=item.name;document.querySelector("#category-order").value=item.sort_order||0;document.querySelector("#category-published").checked=item.published;document.querySelector("#category-form-title").textContent="Editar categoria";document.querySelector("#cancel-category-edit").hidden=false;document.querySelector("#category-form").scrollIntoView({behavior:"smooth"});
  }

  async function updateLinkedProducts(oldName,newName,translations){
    if(oldName===newName)return;
    const {data,error}=await db.from("creations").select("id,translations").eq("category",oldName);
    if(error)throw error;
    for(const item of data||[]){
      const next={...(item.translations||{})};
      for(const code of langs){next[code]={...(next[code]||{}),category:translations?.[code]?.category||newName}}
      const result=await db.from("creations").update({category:newName,translations:next,updated_at:new Date().toISOString()}).eq("id",item.id);
      if(result.error)throw result.error;
    }
  }

  async function saveCategory(event){
    event.preventDefault();
    const button=document.querySelector("#save-category-button"),messageEl=document.querySelector("#category-message");
    const id=document.querySelector("#category-id").value,oldName=document.querySelector("#category-original-name").value;
    const name=document.querySelector("#category-name").value.trim(),sort_order=Number(document.querySelector("#category-order").value)||0,published=document.querySelector("#category-published").checked;
    if(!name)return msg(messageEl,"Digite o nome da categoria.","error");
    if(rows.some(r=>r.id!==id&&r.name.toLowerCase()===name.toLowerCase()))return msg(messageEl,"Já existe uma categoria com esse nome.","error");
    setBusy(button,true,"Traduzindo…");msg(messageEl,"");
    try{
      const existing=rows.find(r=>r.id===id);const translations=(existing&&existing.name===name&&existing.translations&&Object.keys(existing.translations).length)?existing.translations:await translateName(name);
      const payload={name,slug:uniqueSlug(name,id),translations,sort_order,published,updated_at:new Date().toISOString()};
      setBusy(button,true,"Salvando…");
      if(id){const result=await db.from(table).update(payload).eq("id",id);if(result.error)throw result.error;await updateLinkedProducts(oldName,name,translations)}
      else{const result=await db.from(table).insert(payload);if(result.error)throw result.error}
      resetCategoryForm();await loadCategories();if(typeof loadCreations==="function")await loadCreations();msg(messageEl,"Categoria salva com sucesso!","success");
    }catch(error){msg(messageEl,"Não foi possível salvar: "+error.message,"error")}
    finally{setBusy(button,false)}
  }

  async function deleteCategory(id){
    const item=rows.find(r=>r.id===id);if(!item)return;
    const {count,error}=await db.from("creations").select("id",{count:"exact",head:true}).eq("category",item.name);
    if(error)return alert("Não foi possível verificar os produtos: "+error.message);
    if(count>0)return alert(`A categoria “${item.name}” tem ${count} produto(s). Mova esses produtos para outra categoria antes de excluir.`);
    if(!confirm(`Excluir a categoria “${item.name}”?`))return;
    const result=await db.from(table).delete().eq("id",id);if(result.error)return alert("Não foi possível excluir: "+result.error.message);
    await loadCategories();
  }

  replaceCategoryField();injectManager();loadCategories();
  db.auth.onAuthStateChange(()=>setTimeout(loadCategories,0));
})();
