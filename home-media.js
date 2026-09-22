(async function(){
  const cfg=window.FS_SUPABASE;
  function safe(value){const node=document.createElement("span");node.textContent=value||"";return node.innerHTML}
  function publicUrl(path){return window.supabase.createClient(cfg.url,cfg.publishableKey).storage.from("site-media").getPublicUrl(path).data.publicUrl}
  try{
    const client=window.supabase.createClient(cfg.url,cfg.publishableKey);
    const {data,error}=await client.from("site_media").select("*").eq("published",true).order("sort_order").order("created_at");
    if(error)throw error;
    const items=data||[];
    if(items.length){
      const url=item=>item.storage_path?publicUrl(item.storage_path):item.fallback_media_url;
      const poster=item=>item.poster_path?publicUrl(item.poster_path):item.fallback_poster_url;
      const track=document.querySelector(".carousel-track");
      track.innerHTML=items.map((item,index)=>{
        const media=item.media_type==="video"?`<video ${index===0?"autoplay":""} muted loop playsinline preload="metadata" ${poster(item)?`poster="${safe(poster(item))}"`:""}><source src="${safe(url(item))}"></video>`:`<img src="${safe(url(item))}" alt="${safe(item.alt_text||item.title)}" loading="lazy">`;
        const play=item.media_type==="video"&&index!==0?'<button class="video-control" type="button" aria-label="Riproduci video">▶</button>':"";
        const badge=index===0?'<div class="video-badge"><i></i><span data-i18n="made">Creato da FS Studio Maker</span></div>':"";
        return `<article class="media-slide ${index===0?"is-active":""}">${media}${play}<button class="fullscreen-control" type="button" aria-label="Apri a schermo intero">⛶</button>${badge}</article>`;
      }).join("");
      const cards=[...document.querySelectorAll(".creation-carousel .category-card")];
      items.slice(0,cards.length).forEach((item,index)=>{
        const card=cards[index],old=card.querySelector(":scope > img, :scope > video"),oldButton=card.querySelector(":scope > .video-control"),media=document.createElement(item.media_type==="video"?"video":"img");
        let newButton=null;
        if(item.media_type==="video"){media.muted=true;media.loop=true;media.playsInline=true;media.preload="metadata";if(poster(item))media.poster=poster(item);const source=document.createElement("source");source.src=url(item);media.appendChild(source);card.classList.add("video-card");if(!oldButton){newButton=document.createElement("button");newButton.className="video-control";newButton.type="button";newButton.setAttribute("aria-label","Riproduci video");newButton.textContent="▶"}}
        else{media.src=url(item);media.alt=item.alt_text||item.title;media.loading="lazy";card.classList.remove("video-card");if(oldButton)oldButton.remove()}
        if(old)old.replaceWith(media);else card.prepend(media);if(newButton)media.after(newButton);
      });
    }
  }catch(error){console.warn("Não foi possível carregar as mídias administráveis.",error)}
  const mainScript=document.createElement("script");mainScript.src="script.js?v=14";document.body.appendChild(mainScript);
})();
