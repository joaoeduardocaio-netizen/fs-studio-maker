// Aggregate page views only. No visitor identifiers, cookies, URLs or referrers are transmitted.
(()=>{
  const allowed=['fsstudiomaker.com.br','www.fsstudiomaker.com.br','fs-studio-maker.pages.dev'];
  if(!allowed.includes(location.hostname)||navigator.globalPrivacyControl||navigator.doNotTrack==='1'||document.visibilityState!=='visible')return;
  const page=location.pathname==='/'||location.pathname==='/index.html'?'/':location.pathname==='/catalogo.html'?'/catalogo.html':null;
  if(!page)return;
  const record=async()=>{
    const key='fs-view-v1:'+page;let last=0;
    try{last=Number(sessionStorage.getItem(key)||0)}catch{}
    if(Date.now()-last<60000)return;
    try{
      const response=await fetch('https://fs-studio-maker.pages.dev/api/visits/track',{method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'text/plain'},body:JSON.stringify({page}),keepalive:true});
      if(response.ok)try{sessionStorage.setItem(key,String(Date.now()))}catch{}
    }catch{}
  };
  if(document.prerendering)document.addEventListener('prerenderingchange',record,{once:true});else record();
})();
