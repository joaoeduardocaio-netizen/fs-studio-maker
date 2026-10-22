// Small adapter for the existing admin UI. All privileged operations run on Cloudflare.
(()=>{
  const base='https://fs-studio-maker.pages.dev';
  const listeners=[];
  const publicUrl=path=>!path?'':/^https:\/\//.test(path)?path:path.startsWith('uploads/')?`${base}/api/files/${path}`:new URL(path,base+'/').href;
  async function api(path,body,raw=false){
    try{
      const response=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':raw?body.type:'application/json'},body:body===undefined?undefined:raw?body:JSON.stringify(body)});
      const data=await response.json();if(!response.ok)return {data:null,error:{message:data.error?.message||'Não foi possível concluir.'}};return data;
    }catch{return {data:null,error:{message:'Não foi possível conectar ao painel. Abra https://fs-studio-maker.pages.dev/admin.html'}}}
  }
  function emit(event,session){listeners.forEach(fn=>fn(event,session))}
  class Query{
    constructor(table){this.input={table,action:'select',filters:[],order:[]}}
    select(fields,options={}){this.input.fields=fields;this.input.head=!!options.head;return this}
    insert(row){this.input.action='insert';this.input.row=row;return this}
    update(row){this.input.action='update';this.input.row=row;return this}
    delete(){this.input.action='delete';return this}
    eq(key,value){this.input.filters.push({key,value});return this}
    order(key,options={}){this.input.order.push({key,ascending:options.ascending!==false});return this}
    single(){this.input.single=true;return this}
    then(resolve,reject){return api('query',this.input).then(resolve,reject)}
  }
  const client={
    from:table=>new Query(table),
    auth:{
      async signInWithPassword(credentials){const result=await api('login',credentials);if(!result.error)emit('SIGNED_IN',result.data.session);return result},
      async getSession(){const result=await api('session');return result.error?{data:{session:null},error:result.error}:result},
      async signOut(){const result=await api('logout',{});emit('SIGNED_OUT',null);return result},
      onAuthStateChange(fn){listeners.push(fn);return {data:{subscription:{unsubscribe(){const index=listeners.indexOf(fn);if(index>=0)listeners.splice(index,1)}}}}},
      async signUp(){return {data:null,error:{message:'O acesso é configurado pelo responsável no Cloudflare.'}}}
    },
    storage:{from:()=>({getPublicUrl:path=>({data:{publicUrl:publicUrl(path)}}),async upload(path,file){const result=await api('upload',file,true);if(!result.error)uploadedPaths.set(path,result.data.path);return result},remove:paths=>api('remove-files',{paths})})},
    functions:{invoke:async()=>({data:null,error:{message:'A tradução automática ainda não foi configurada. Os novos textos serão exibidos no idioma original.'}})}
  };
  const uploadedPaths=new Map();
  // The existing forms choose a filename before upload. Replace it with the server-assigned key.
  const originalInsert=Query.prototype.insert;
  Query.prototype.insert=function(row){row={...row};for(const key of ['storage_path','poster_path'])if(uploadedPaths.has(row[key]))row[key]=uploadedPaths.get(row[key]);return originalInsert.call(this,row)};
  const originalUpdate=Query.prototype.update;
  Query.prototype.update=function(row){row={...row};for(const key of ['storage_path','poster_path'])if(uploadedPaths.has(row[key]))row[key]=uploadedPaths.get(row[key]);return originalUpdate.call(this,row)};
  window.supabase={createClient:()=>client};
  window.FS_SUPABASE=Object.freeze({url:base,publishableKey:'',adminEmail:'fs.studiomaker@gmail.com',whatsapp:'393287036017'});
})();
