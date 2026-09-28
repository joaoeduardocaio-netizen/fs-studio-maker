const cfg=window.FS_SUPABASE;
const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
const copy={it:{back:"← Torna al sito",kicker:"Le nostre creazioni",title:"Idee diventate realtà.",intro:"Scopri alcuni progetti realizzati e contattaci per crearne uno tutto tuo.",all:"Tutte",loading:"Caricamento delle creazioni…",empty:"Il catalogo sarà aggiornato presto. Scrivici per raccontarci la tua idea!",error:"Non è stato possibile caricare il catalogo. Riprova tra poco.",quote:"Richiedi un preventivo",whatsapp:"Scrivici su WhatsApp",wa:"Ciao! Ho visto una creazione nel catalogo e vorrei maggiori informazioni su: "},pt:{back:"← Voltar ao site",kicker:"Nossas criações",title:"Ideias que viraram realidade.",intro:"Conheça alguns projetos realizados e fale conosco para criar o seu.",all:"Todos",loading:"Carregando as criações…",empty:"O catálogo será atualizado em breve. Conte sua ideia para a gente!",error:"Não foi possível carregar o catálogo. Tente novamente em instantes.",quote:"Pedir orçamento",whatsapp:"Chame no WhatsApp",wa:"Olá! Vi uma criação no catálogo e gostaria de mais informações sobre: "},en:{back:"← Back to website",kicker:"Our creations",title:"Ideas brought to life.",intro:"Explore some finished projects and contact us to create your own.",all:"All",loading:"Loading creations…",empty:"The catalogue will be updated soon. Tell us about your idea!",error:"The catalogue could not be loaded. Please try again shortly.",quote:"Request a quote",whatsapp:"Message us on WhatsApp",wa:"Hello! I saw a creation in the catalogue and would like more information about: "},es:{back:"← Volver al sitio",kicker:"Nuestras creaciones",title:"Ideas hechas realidad.",intro:"Descubre proyectos realizados y contáctanos para crear el tuyo.",all:"Todas",loading:"Cargando las creaciones…",empty:"El catálogo se actualizará pronto. ¡Cuéntanos tu idea!",error:"No se pudo cargar el catálogo. Inténtalo de nuevo pronto.",quote:"Pedir presupuesto",whatsapp:"Escríbenos por WhatsApp",wa:"¡Hola! Vi una creación en el catálogo y quisiera más información sobre: "},de:{back:"← Zurück zur Website",kicker:"Unsere Kreationen",title:"Ideen werden Wirklichkeit.",intro:"Entdecke fertige Projekte und kontaktiere uns für deine eigene Kreation.",all:"Alle",loading:"Kreationen werden geladen…",empty:"Der Katalog wird bald aktualisiert. Erzähl uns von deiner Idee!",error:"Der Katalog konnte nicht geladen werden. Bitte versuche es später erneut.",quote:"Angebot anfragen",whatsapp:"WhatsApp-Nachricht",wa:"Hallo! Ich habe eine Kreation im Katalog gesehen und möchte mehr Informationen zu: "}};
let creations=[],lang=localStorage.getItem("fs-language")||"it";const grid=document.querySelector("#catalog-grid"),select=document.querySelector("#language-select");
function safe(value){const node=document.createElement("span");node.textContent=value||"";return node.innerHTML}
function attr(value){return safe(value).replaceAll('"','&quot;').replaceAll("'",'&#39;')}
function applyLanguage(){const t=copy[lang]||copy.it;document.documentElement.lang=lang;document.querySelectorAll("[data-i18n]").forEach(el=>{if(t[el.dataset.i18n])el.textContent=t[el.dataset.i18n]});select.value=lang;localStorage.setItem("fs-language",lang);document.querySelector("#footer-wa").href=`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(t.wa)}`;render()}
function isVideo(path){return /\.(mp4|webm)$/i.test(path||"")}
function render(){
  if(!creations.length)return;
  const t=copy[lang]||copy.it;
  grid.innerHTML=creations.map(item=>{
    const media=(item.creation_images||[]).sort((a,b)=>Number(isVideo(a.storage_path))-Number(isVideo(b.storage_path))||a.sort_order-b.sort_order);
    const slides=media.length?media.map(entry=>{
      const url=attr(db.storage.from("creations").getPublicUrl(entry.storage_path).data.publicUrl);
      return `<div class="media-slide">${isVideo(entry.storage_path)?`<video src="${url}" controls playsinline preload="metadata" aria-label="Vídeo: ${attr(item.title)}"></video>`:`<img src="${url}" alt="${attr(entry.alt_text||item.title)}" loading="lazy">`}</div>`;
    }).join(""):`<div class="media-slide"><img src="assets/colecionaveis.jpg" alt="${attr(item.title)}" loading="lazy"></div>`;
    const price=item.show_price&&item.price!=null?new Intl.NumberFormat(lang,{style:"currency",currency:"EUR"}).format(item.price):t.quote;
    const wa=`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(t.wa+item.title)}`;
    return `<article class="creation-card"><div class="card-image"><div class="media-track" tabindex="0" aria-label="${attr(item.title)}">${slides}</div>${media.length>1?`<button type="button" class="media-arrow media-prev" aria-label="Anterior">‹</button><button type="button" class="media-arrow media-next" aria-label="Próximo">›</button><span class="image-count">1/${media.length}</span>`:""}</div><div class="card-content">${item.category?`<span class="category">${safe(item.category)}</span>`:""}<h2>${safe(item.title)}</h2><p>${safe(item.description||"")}</p><div class="card-bottom"><strong class="price">${safe(price)}</strong><a class="card-cta" href="${attr(wa)}" target="_blank" rel="noopener">WhatsApp ↗</a></div></div></article>`;
  }).join("");
  grid.querySelectorAll(".card-image").forEach(card=>{
    const track=card.querySelector(".media-track"),count=card.querySelector(".image-count");
    if(!count)return;
    const update=()=>{const index=Math.round(track.scrollLeft/track.clientWidth);count.textContent=`${index+1}/${track.children.length}`;track.querySelectorAll("video").forEach((video,i)=>{if(i!==index)video.pause()})};
    card.querySelector(".media-prev").addEventListener("click",()=>track.scrollBy({left:-track.clientWidth,behavior:"smooth"}));
    card.querySelector(".media-next").addEventListener("click",()=>track.scrollBy({left:track.clientWidth,behavior:"smooth"}));
    track.addEventListener("scroll",update,{passive:true});
  });
}
async function load(){
  const {data,error}=await db.from("creations").select("id,title,description,category,price,show_price,featured,sort_order,created_at,creation_images(storage_path,alt_text,sort_order)").eq("published",true).order("featured",{ascending:false}).order("sort_order").order("created_at",{ascending:false});
  if(error){grid.innerHTML=`<div class="state"><p>${(copy[lang]||copy.it).error}</p></div>`;return}
  creations=data||[];
  if(!creations.length){grid.innerHTML=`<div class="state"><p>${(copy[lang]||copy.it).empty}</p></div>`;return}
  render();
}
select.addEventListener("change",e=>{lang=e.target.value;applyLanguage()});document.querySelector("#year").textContent=new Date().getFullYear();applyLanguage();load();
