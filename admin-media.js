const mediaForm=document.querySelector("#media-form");
const mediaList=document.querySelector("#media-list");
const mediaMessage=document.querySelector("#media-message");
let siteMedia=[];

function mediaNotice(text,type=""){mediaMessage.textContent=text;mediaMessage.className=`message ${type}`}
function mediaUrl(item,poster=false){
  const path=poster?item.poster_path:item.storage_path;
  const fallback=poster?item.fallback_poster_url:item.fallback_media_url;
  return path?db.storage.from("site-media").getPublicUrl(path).data.publicUrl:fallback||"";
}
function mediaPreview(item){
  const url=mediaUrl(item),poster=mediaUrl(item,true);
  if(!url)return "";
  return item.media_type==="video"
    ? `<video src="${escapeHtml(url)}" ${poster?`poster="${escapeHtml(poster)}"`:""} muted playsinline controls></video>`
    : `<img src="${escapeHtml(url)}" alt="${escapeHtml(item.alt_text||item.title)}">`;
}
function updateMediaTypeFields(){
  const video=document.querySelector("#media-type").value==="video";
  document.querySelector("#poster-label").hidden=!video;
  document.querySelector("#media-file").accept=video?"video/mp4,video/webm,video/quicktime":"image/jpeg,image/png,image/webp";
  document.querySelector("#media-file-help").textContent=video?"MP4, WebM ou MOV, até 100 MB":"JPG, PNG ou WebP, até 15 MB";
}
function resetMediaForm(){
  mediaForm.reset();document.querySelector("#media-id").value="";document.querySelector("#media-order").value=0;document.querySelector("#media-published").checked=true;document.querySelector("#media-form-title").textContent="Nova mídia";document.querySelector("#cancel-media-edit").hidden=true;document.querySelector("#current-media").innerHTML="";mediaNotice("");updateMediaTypeFields();
}
async function loadSiteMedia(){
  mediaList.innerHTML="<p>Carregando…</p>";
  const {data,error}=await db.from("site_media").select("*").order("sort_order").order("created_at");
  if(error){mediaList.innerHTML=`<p>Erro ao carregar: ${escapeHtml(error.message)}</p>`;return}
  siteMedia=data||[];
  if(!siteMedia.length){mediaList.innerHTML="<p>Nenhuma mídia cadastrada.</p>";return}
  mediaList.innerHTML=siteMedia.map(item=>{
    const url=mediaUrl(item),poster=mediaUrl(item,true);
    const thumb=item.media_type==="video"?`<video src="${escapeHtml(url)}" ${poster?`poster="${escapeHtml(poster)}"`:""} muted playsinline></video>`:`<img src="${escapeHtml(url)}" alt="">`;
    return `<article class="list-item">${thumb}<div><h3>${escapeHtml(item.title)}</h3><p>Ordem ${item.sort_order}</p><span class="media-type">${item.media_type==="video"?"VÍDEO":"FOTO"}</span> <span class="status ${item.published?"":"draft"}">${item.published?"Publicado":"Oculto"}</span></div><div class="item-actions"><button data-edit-media="${item.id}">Editar</button><button class="delete" data-delete-media="${item.id}">Excluir</button></div></article>`;
  }).join("");
  mediaList.querySelectorAll("[data-edit-media]").forEach(button=>button.addEventListener("click",()=>editSiteMedia(button.dataset.editMedia)));
  mediaList.querySelectorAll("[data-delete-media]").forEach(button=>button.addEventListener("click",()=>deleteSiteMedia(button.dataset.deleteMedia)));
}
function editSiteMedia(id){
  const item=siteMedia.find(entry=>entry.id===id);if(!item)return;
  document.querySelector("#media-id").value=item.id;document.querySelector("#media-title").value=item.title;document.querySelector("#media-type").value=item.media_type;document.querySelector("#media-order").value=item.sort_order;document.querySelector("#media-alt").value=item.alt_text||"";document.querySelector("#media-published").checked=item.published;document.querySelector("#media-form-title").textContent="Editar mídia";document.querySelector("#cancel-media-edit").hidden=false;document.querySelector("#current-media").innerHTML=mediaPreview(item);updateMediaTypeFields();mediaForm.scrollIntoView({behavior:"smooth"});
}
function validateMediaFile(file,type,poster=false){
  if(!file)return null;
  const imageTypes=["image/jpeg","image/png","image/webp"],videoTypes=["video/mp4","video/webm","video/quicktime"];
  const allowed=poster||type==="image"?imageTypes:videoTypes;
  const limit=poster||type==="image"?15*1024*1024:100*1024*1024;
  if(!allowed.includes(file.type))return "Formato de arquivo não permitido.";
  if(file.size>limit)return `O arquivo ultrapassa ${limit/(1024*1024)} MB.`;
  return null;
}
async function uploadSiteMedia(file,folder){
  const ext=(file.name.split(".").pop()||"bin").toLowerCase();
  const path=`${folder}/${crypto.randomUUID()}.${ext}`;
  const {error}=await db.storage.from("site-media").upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
  if(error)throw error;return path;
}
mediaForm.addEventListener("submit",async event=>{
  event.preventDefault();
  const button=document.querySelector("#save-media-button"),id=document.querySelector("#media-id").value,type=document.querySelector("#media-type").value,file=document.querySelector("#media-file").files[0],poster=document.querySelector("#media-poster").files[0],current=siteMedia.find(item=>item.id===id);
  if(!id&&!file)return mediaNotice("Escolha uma foto ou um vídeo.","error");
  if(current&&current.media_type!==type&&!file)return mediaNotice("Ao trocar o tipo, escolha também o novo arquivo.","error");
  const fileError=validateMediaFile(file,type),posterError=validateMediaFile(poster,type,true);
  if(fileError||posterError)return mediaNotice(fileError||posterError,"error");
  busy(button,true,"Enviando…");mediaNotice("");
  const uploaded=[];
  try{
    const storagePath=file?await uploadSiteMedia(file,"media"):current?.storage_path||null;if(file)uploaded.push(storagePath);
    const posterPath=type==="video"?(poster?await uploadSiteMedia(poster,"posters"):current?.poster_path||null):null;if(poster)uploaded.push(posterPath);
    const payload={title:document.querySelector("#media-title").value.trim(),media_type:type,storage_path:storagePath,poster_path:posterPath,alt_text:document.querySelector("#media-alt").value.trim(),sort_order:Number(document.querySelector("#media-order").value)||0,published:document.querySelector("#media-published").checked,updated_at:new Date().toISOString()};
    if(file)payload.fallback_media_url=null;if(poster)payload.fallback_poster_url=null;
    const result=id?await db.from("site_media").update(payload).eq("id",id):await db.from("site_media").insert(payload);
    if(result.error)throw result.error;
    const oldPaths=[];if(file&&current?.storage_path)oldPaths.push(current.storage_path);if((poster||type!=="video")&&current?.poster_path)oldPaths.push(current.poster_path);if(oldPaths.length)await db.storage.from("site-media").remove(oldPaths);
    resetMediaForm();await loadSiteMedia();mediaNotice("Mídia salva com sucesso!","success");
  }catch(error){if(uploaded.length)await db.storage.from("site-media").remove(uploaded);mediaNotice("Não foi possível salvar: "+error.message,"error")}
  finally{busy(button,false)}
});
async function deleteSiteMedia(id){
  const item=siteMedia.find(entry=>entry.id===id);if(!item||!confirm(`Excluir “${item.title}”?`))return;
  const {error}=await db.from("site_media").delete().eq("id",id);if(error)return alert("Não foi possível excluir: "+error.message);
  const paths=[item.storage_path,item.poster_path].filter(Boolean);if(paths.length)await db.storage.from("site-media").remove(paths);
  if(document.querySelector("#media-id").value===id)resetMediaForm();await loadSiteMedia();
}
document.querySelector("#media-type").addEventListener("change",updateMediaTypeFields);
document.querySelector("#cancel-media-edit").addEventListener("click",resetMediaForm);
document.querySelector("#refresh-media").addEventListener("click",loadSiteMedia);
db.auth.onAuthStateChange((_event,session)=>{if(session&&authorized(session.user))setTimeout(loadSiteMedia,0)});
db.auth.getSession().then(({data})=>{if(data.session&&authorized(data.session.user))loadSiteMedia()});
updateMediaTypeFields();
