(()=>{
 const view=document.querySelector('#admin-view'),status=document.querySelector('#visits-status'),content=document.querySelector('#visits-content'),button=document.querySelector('#visits-refresh');
 let busy=false,loaded=false;
 const number=n=>Number(n||0).toLocaleString('pt-BR');
 const cell=(row,value)=>{const td=document.createElement('td');td.textContent=value;row.append(td)};
 async function refresh(){if(busy||view.hidden)return;busy=true;button.disabled=true;status.textContent='Carregando visitas…';try{
  const r=await fetch('/api/visits/stats',{credentials:'same-origin',cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error?.message||'Não foi possível carregar as visitas.');
  document.querySelector('#visits-today').textContent=number(d.summary.today);document.querySelector('#visits-month').textContent=number(d.summary.month);document.querySelector('#visits-30').textContent=number(d.summary.last30);
  const counts=new Map(d.daily.map(x=>[x.day,Number(x.views)])),days=[];const end=new Date(d.today+'T12:00:00Z');
  for(let i=29;i>=0;i--){const date=new Date(end);date.setUTCDate(date.getUTCDate()-i);const day=date.toISOString().slice(0,10);days.push({day,views:counts.get(day)||0})}
  const bars=document.querySelector('#visits-bars'),table=document.querySelector('#visits-days');bars.replaceChildren();table.replaceChildren();const max=Math.max(1,...days.map(x=>x.views));
  for(const {day,views} of days){const label=day.slice(8)+'/'+day.slice(5,7),bar=document.createElement('div'),fill=document.createElement('span');bar.className='visits-bar';bar.title=label+': '+number(views);fill.style.height=(views/max*100)+'%';bar.append(fill);bars.append(bar);const row=document.createElement('tr');cell(row,label);cell(row,number(views));table.append(row)}
  const pages=document.querySelector('#visits-pages');pages.replaceChildren();for(const path of ['/','/catalogo.html']){const row=document.createElement('tr');cell(row,path==='/'?'Página inicial':'Catálogo');cell(row,number(d.pages.find(x=>x.page===path)?.views));pages.append(row)}
  status.textContent=d.summary.last30?'Atualizado agora.':'Ainda não há visitas registradas. Abra o site público para testar.';content.hidden=false;loaded=true;
 }catch(e){status.textContent=e.message||'Não foi possível carregar as visitas.'}finally{busy=false;button.disabled=false}}
 button.addEventListener('click',refresh);new MutationObserver(()=>{if(!view.hidden&&!loaded)refresh()}).observe(view,{attributes:true,attributeFilter:['hidden']});if(!view.hidden)refresh();
})();
