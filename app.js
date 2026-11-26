// ===== DATOS EDITABLES: profesionales (días: 0=dom ... 6=sáb) =====
const PROS=[
 {id:1,n:"Lic. Ana Pérez",e:"Psicología",d:[1,3],h:["09:00","10:00","11:00","15:00","16:00"]},
 {id:2,n:"Lic. Lucía Fernández",e:"Psicología",d:[2,4],h:["14:00","15:00","16:00","17:00"]},
 {id:3,n:"Lic. Martín Rodríguez",e:"Psicomotricidad",d:[1,2,5],h:["09:00","10:00","11:00","12:00"]},
 {id:4,n:"Lic. Sofía Gómez",e:"Psicomotricidad",d:[3,4],h:["13:00","14:00","15:00","16:00"]},
 {id:5,n:"Lic. Valeria Silva",e:"Psicopedagogía",d:[2,3,5],h:["10:00","11:00","14:00","15:00"]},
 {id:6,n:"Lic. Camila Techera",e:"Psicopedagogía",d:[1,4],h:["16:00","17:00","18:00"]}];
const DN=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DOCS=["Cédula de identidad","Constancia del BPS","Informe médico"];
// ===== CONFIGURACIÓN DE RESERVAS (editá estos valores) =====
const WSP={mostrar:"091234567",intl:"59891234567"}; // WhatsApp para el comprobante (intl = sin el 0 inicial y con 598)
const PRECIO={"Psicología":1500,"Psicomotricidad":1400,"Psicopedagogía":1400}; // EJEMPLO: poné el valor real de la consulta por especialidad
const PAGO={ // ⚠ DATOS DE EJEMPLO: reemplazar por los reales de la clínica antes de publicar (y poner ejemplo:false)
 ejemplo:true,
 mp:"https://www.mercadopago.com.uy/", // link de pago de Mercado Pago
 banco:"BROU",tipo:"Caja de ahorros en pesos",cuenta:"000-0000000-00",alias:"jacaranda.clinica",titular:"Clínica Jacarandá"};
const DIR="Vilardebó 1323, Montevideo, Uruguay";
const MAPS="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(DIR);
const VIDEO_URL=""; // pegá acá el enlace de embed del video (YouTube, Vimeo...)


// ===== Utilidades =====
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),3400)};
const open=id=>$(id).classList.add("open"),close=()=>$$(".overlay").forEach(o=>o.classList.remove("open"));
$$("[data-close]").forEach(b=>b.onclick=close);
$$(".overlay").forEach(o=>o.onclick=e=>{if(e.target===o)close()});
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const fechas=p=>{const r=[],t=new Date();for(let i=1;i<=28&&r.length<8;i++){const d=new Date(t);d.setDate(t.getDate()+i);if(p.d.includes(d.getDay()))r.push(d)}return r};
const lbl=s=>{const d=new Date(s+"T12:00");return DN[d.getDay()]+" "+d.getDate()+"/"+(d.getMonth()+1)};
const money=n=>"$ "+Math.round(n).toLocaleString("es-UY");
const same=(a,b)=>a.p===b.p&&a.f===b.f&&a.h===b.h;
const ciValida=v=>{
  let d=String(v).replace(/\D/g,"");
  if(d.length<7||d.length>8)return false;
  d=d.padStart(8,"0");
  if(/^(\d)\1+$/.test(d))return false;
  const w=[2,9,8,7,6,3,4];let suma=0;
  for(let i=0;i<7;i++)suma+=Number(d[i])*w[i];
  return (10-(suma%10))%10===Number(d[7]);
};
const ciN=v=>String(v).replace(/\D/g,"").padStart(8,"0"); // cédula normalizada: 8 dígitos
const fmtCi=v=>{const d=ciN(v);return String(+d.slice(0,7)).replace(/\B(?=(\d{3})+(?!\d))/g,".")+"-"+d[7]};
const telOk=v=>String(v).replace(/\D/g,"").length>=8;
const waTel=t=>{const d=String(t).replace(/\D/g,"");return "https://wa.me/"+(d.startsWith("598")?d:"598"+d.replace(/^0/,""))};
const iniciales=n=>String(n||"").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("")||"?";
const tempPass=()=>{const c="abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789",r=crypto.getRandomValues(new Uint8Array(10));return [...r].map(x=>c[x%c.length]).join("")};
const rd=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(new Error("No se pudo leer el archivo"));r.readAsDataURL(f)});

// ===== Archivos: los documentos se guardan dentro de Firestore, por eso se comprimen =====
const MAXB=650*1024;
async function prepararArchivo(f){
 if(f.type==="application/pdf"){if(f.size>MAXB)throw new Error("El PDF pesa más de 650 KB. Sacale una foto al documento o comprimí el PDF.");return rd(f)}
 if(!/^image\/(jpeg|png|webp)$/.test(f.type))throw new Error("Subí un archivo JPG, PNG o PDF.");
 const img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error("No se pudo leer la imagen."));i.src=URL.createObjectURL(f)});
 let sc=Math.min(1,1600/Math.max(img.width,img.height)),q=.82;
 for(let k=0;k<8;k++){
  const c=document.createElement("canvas");c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
  const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
  const out=c.toDataURL("image/jpeg",q);if(out.length*.75<MAXB)return out;q=Math.max(.4,q-.08);sc*=.85;
 }
 throw new Error("La imagen es demasiado pesada. Probá con otra foto.");
}

// ===== Errores =====
const ERR={"auth/email-already-in-use":"Ya existe una cuenta con esa cédula.","auth/invalid-credential":"Cédula o contraseña incorrectas.","auth/wrong-password":"Cédula o contraseña incorrectas.","auth/user-not-found":"Cédula o contraseña incorrectas.","auth/invalid-email":"La cédula no es válida.","auth/weak-password":"La contraseña es muy débil (mínimo 8 caracteres).","auth/network-request-failed":"Sin conexión. Revisá tu internet e intentá de nuevo.","auth/too-many-requests":"Demasiados intentos. Esperá unos minutos.","auth/requires-recent-login":"Por seguridad, cerrá sesión, volvé a ingresar y repetí el cambio.","auth/operation-not-allowed":"Falta activar «Correo electrónico/contraseña» en Firebase (Authentication → Método de acceso).","auth/configuration-not-found":"Falta activar Authentication en Firebase.","auth/invalid-api-key":"La apiKey de firebase-config.js no es válida.","auth/api-key-not-valid":"La apiKey de firebase-config.js no es válida.","unavailable":"Firebase no responde. Revisá tu internet y que la base Firestore esté creada.","failed-precondition":"Falta crear la base de datos Firestore en Firebase.","not-found":"Falta crear la base de datos Firestore en Firebase.","permission-denied":"Sin permiso. Revisá que las reglas de Firestore estén publicadas (ver README)."};
const errMsg=e=>ERR[e&&e.code]||(e&&e.message&&!/^Firebase/.test(e.message)?e.message:"Ocurrió un error"+(e&&e.code?" ("+e.code+")":"")+". Intentá de nuevo.");

// ===== Respaldo local (demo y pruebas sin Firebase) =====
// El demo usa sessionStorage y se borra al salir. El modo de pruebas (sin Firebase) usa localStorage.
function mkLocal(st,pre,auth){
 const g=(k,d)=>{try{return JSON.parse(st.getItem(pre+k))??d}catch(e){return d}};
 const s=(k,v)=>{try{st.setItem(pre+k,JSON.stringify(v))}catch(e){throw new Error("No hay espacio para guardar el archivo en este navegador.")}};
 const b64=u=>btoa(String.fromCharCode(...u)),rs=()=>b64(crypto.getRandomValues(new Uint8Array(16)));
 const pub=u=>({uid:u.uid,n:u.n,ci:u.ci,tel:u.tel||"",role:u.role,mustChange:!!u.mustChange,at:u.at||0});
 return {
  mode:auth?"local":"demo",
  async hash(pass,salt){ // la contraseña no se guarda: solo un hash con sal (PBKDF2)
   const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(pass),"PBKDF2",false,["deriveBits"]);
   const b=await crypto.subtle.deriveBits({name:"PBKDF2",salt:Uint8Array.from(atob(salt),c=>c.charCodeAt(0)),iterations:100000,hash:"SHA-256"},k,256);
   return b64(new Uint8Array(b));
  },
  async init(cb){
   if(auth&&!Object.keys(g("users",{})).length){const salt=rs();const s2=rs();s("users",{adm:{uid:"adm",n:"Administración (prueba)",ci:"12345672",tel:"",role:"admin",mustChange:false,salt,hash:await this.hash("admin1234",salt)},fun:{uid:"fun",n:"Funcionario (prueba)",ci:"41234563",tel:"099111222",role:"funcionario",mustChange:false,salt:s2,hash:await this.hash("func1234",s2)}})}
   const m=g("session",null),u=m&&g("users",{})[m];cb(u?pub(u):null);
  },
  async login(ci,pass){const u=Object.values(g("users",{})).find(x=>x.ci===ci);
   if(!u||await this.hash(pass,u.salt)!==u.hash)throw new Error("Cédula o contraseña incorrectas.");s("session",u.uid);return pub(u)},
  async logout(){s("session",null)},
  async changePassword(uid,pass){const us=g("users",{}),u=us[uid];u.salt=rs();u.hash=await this.hash(pass,u.salt);u.mustChange=false;s("users",us);return pub(u)},
  async createUser(d){const us=g("users",{});if(Object.values(us).some(x=>x.ci===d.ci))throw new Error("Ya existe una cuenta con esa cédula.");
   const uid="u"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),salt=rs();
   us[uid]={uid,n:d.n,ci:d.ci,tel:d.tel,role:d.role,mustChange:true,salt,hash:await this.hash(d.pass,salt),at:Date.now()};s("users",us);return pub(us[uid])},
  async listUsers(){return Object.values(g("users",{})).map(pub)},
  async saveProfile(uid,d){const us=g("users",{});if(us[uid]){us[uid].tel=d.tel;s("users",us)}},
  async listAppts(){return g("appts",[])},
  async putAppt(a){const l=g("appts",[]).filter(x=>!same(x,a));l.push(a);s("appts",l)},
  async delAppt(a){s("appts",g("appts",[]).filter(x=>!same(x,a)))},
  async listDocs(uid){return g("docs",[]).filter(d=>!uid||d.u===uid)},
  async putDoc(uid,i,meta,data){const id=uid+"_"+i,l=g("docs",[]).filter(d=>d.id!==id),f=g("files",{});f[id]=data;s("files",f);
   l.push({id,u:uid,i,name:meta.name,date:meta.date,ts:Date.now(),estado:"revision",motivo:""});s("docs",l)},
  async getFile(id){return g("files",{})[id]||null},
  async setEstado(id,estado,motivo,by){const l=g("docs",[]),d=l.find(x=>x.id===id);if(d){d.estado=estado;d.motivo=motivo||"";d.by=by||"";s("docs",l)}}
 };
}

// ===== Firebase: Authentication (correo/contraseña interno por cédula) + Firestore =====
async function fbBackend(cfg){
 const base="https://www.gstatic.com/firebasejs/10.12.2/";
 const [A,Au,F]=await Promise.all([import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]);
 const app=A.initializeApp(cfg),auth=Au.getAuth(app),db=F.getFirestore(app);
 auth.languageCode="es";
 const mailOf=ci=>"ci"+ci+"@ci.jacaranda.uy"; // la persona usa su cédula; Firebase necesita un correo interno
 const uref=uid=>F.doc(db,"users",uid),aid=a=>a.p+"_"+a.f+"_"+a.h.replace(":","");
 const mapU=(id,d)=>({uid:id,n:d.n||"",ci:d.ci||"",tel:d.tel||"",role:d.role||"",mustChange:!!d.mustChange,at:d.at||0});
 const prof=async u=>{const s=await F.getDoc(uref(u.uid));return s.exists()?mapU(u.uid,s.data()):null};
 return {
  mode:"firebase",
  init(cb){Au.onAuthStateChanged(auth,async u=>{let p=null;if(u){try{p=await prof(u)}catch(e){}if(!p){try{await Au.signOut(auth)}catch(e){}}}cb(p)})},
  async login(ci,pass){const c=await Au.signInWithEmailAndPassword(auth,mailOf(ci),pass),p=await prof(c.user);
   if(!p){await Au.signOut(auth);throw new Error("Tu cuenta todavía no está habilitada. Consultá en la clínica.")}return p},
  logout:()=>Au.signOut(auth),
  async changePassword(uid,pass){await Au.updatePassword(auth.currentUser,pass);await F.updateDoc(uref(uid),{mustChange:false});return prof(auth.currentUser)},
  async createUser(d){ // se crea con una segunda instancia para no cerrar la sesión del funcionario
   const A2=A.initializeApp(cfg,"sec"+Date.now()),a2=Au.getAuth(A2),bye=async()=>{try{await A.deleteApp(A2)}catch(x){}};let c;
   try{c=await Au.createUserWithEmailAndPassword(a2,mailOf(d.ci),d.pass)}catch(e){await bye();throw e}
   try{await F.setDoc(uref(c.user.uid),{n:d.n,ci:d.ci,tel:d.tel,role:d.role,mustChange:true,by:auth.currentUser.uid,at:Date.now()})}
   catch(e){try{await Au.deleteUser(c.user)}catch(x){}await bye();throw e}
   try{await Au.signOut(a2)}catch(x){}await bye();return {uid:c.user.uid,n:d.n,ci:d.ci,tel:d.tel,role:d.role};
  },
  async listUsers(){const s=await F.getDocs(F.collection(db,"users"));return s.docs.map(x=>mapU(x.id,x.data()))},
  saveProfile:(uid,d)=>F.updateDoc(uref(uid),{tel:d.tel}),
  async listAppts(){const s=await F.getDocs(F.collection(db,"turnos"));return s.docs.map(d=>d.data())},
  putAppt:a=>F.setDoc(F.doc(db,"turnos",aid(a)),a),
  delAppt:a=>F.deleteDoc(F.doc(db,"turnos",aid(a))),
  async listDocs(uid){const q=uid?F.query(F.collection(db,"documentos"),F.where("u","==",uid)):F.collection(db,"documentos");const s=await F.getDocs(q);return s.docs.map(d=>({id:d.id,...d.data()}))},
  async putDoc(uid,i,meta,data){const id=uid+"_"+i;
   await F.setDoc(F.doc(db,"archivos",id),{u:uid,data});
   await F.setDoc(F.doc(db,"documentos",id),{u:uid,i,name:meta.name,date:meta.date,ts:Date.now(),estado:"revision",motivo:""})},
  async getFile(id){const s=await F.getDoc(F.doc(db,"archivos",id));return s.exists()?s.data().data:null},
  setEstado:(id,estado,motivo,by)=>F.updateDoc(F.doc(db,"documentos",id),{estado,motivo:motivo||"",by:by||""})
 };
}

// ===== Estado global =====
const HASFB=!!(window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.apiKey);
const DEMO=mkLocal(sessionStorage,"jd_",false);
const DEMO_USER={uid:"demo",n:"Invitado (demo)",ci:"12345672",tel:"091234567",role:"paciente",mustChange:false,demo:true};
let REAL=null,B=null,BERR="",me=null,APPTS=[],MYDOCS=[],USERS=[],ALLDOCS=[],cur="inicio",filt="Todas";
const tomado=(p,f,h)=>APPTS.some(a=>a.p===p.id&&a.f===f&&a.h===h);
const libres=p=>fechas(p).reduce((n,d)=>n+p.h.filter(h=>!tomado(p,iso(d),h)).length,0);
const ini=p=>p.n.split(" ").slice(1).map(w=>w[0]).join("");
const home=()=>!me?"ingresar":me.mustChange&&!me.demo?"cambiar":{paciente:"cuenta",funcionario:"panel",admin:"admin"}[me.role]||"inicio";
const EST={revision:["En revisión","y"],aprobado:["Aprobado","g"],rechazado:["Rechazado","r"]};
const pill=e=>e&&EST[e]?`<span class="st ${EST[e][1]}">${EST[e][0]}</span>`:'<span class="st n">Pendiente</span>';
const uname=uid=>{const u=USERS.find(x=>x.uid===uid);return u?u.n:"—"};
async function refresh(){
 APPTS=[];MYDOCS=[];USERS=[];ALLDOCS=[];
 if(me&&!(me.mustChange&&!me.demo)){
  try{APPTS=await B.listAppts()}catch(e){}
  if(me.role==="paciente"){try{MYDOCS=await B.listDocs(me.uid)}catch(e){}}
  else{try{USERS=await B.listUsers()}catch(e){}if(me.role==="funcionario"){try{ALLDOCS=await B.listDocs()}catch(e){}}}
 }
 chrome();paint();
}

// ===== Fondo animado y apariciones =====
for(let i=0;i<16;i++){const p=document.createElement("span");p.className="petal";p.style.cssText=`left:${Math.random()*100}%;--dx:${Math.random()*160-80}px;animation-duration:${9+Math.random()*10}s;animation-delay:${-Math.random()*15}s;opacity:${.25+Math.random()*.5}`;$(".hero").appendChild(p)}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add("in");const n=$("[data-n]",e.target);if(n&&!n._d){n._d=1;const T=+n.dataset.n;let c=0;const id=setInterval(()=>{c+=Math.max(1,T/40);if(c>=T){c=T;clearInterval(id)}n.textContent=Math.round(c)+(n.dataset.s||"")},30)}io.unobserve(e.target)}),{threshold:.15});
const watch=()=>$$(".rv:not(.in)").forEach(e=>io.observe(e));

// ===== Profesionales =====
function pintaPros(){
 const esp=["Todas",...new Set(PROS.map(p=>p.e))];
 $("#filtros").innerHTML=esp.map(e=>`<button class="${e===filt?"on":""}">${e}</button>`).join("");
 $$("#filtros button").forEach(b=>b.onclick=()=>{filt=b.textContent;pintaPros()});
 $("#pros").innerHTML=PROS.filter(p=>filt==="Todas"||p.e===filt).map(p=>`<div class="card rv"><div class="avatar">${ini(p)}</div><h3>${p.n}</h3><p>${p.e}</p><div class="chips">${p.d.map(d=>`<span class="chip">${DN[d]}</span>`).join("")}</div><p class="note">${p.h[0]} a ${p.h[p.h.length-1]} h</p><button class="btn sm" data-b="${p.id}">Ver horarios</button></div>`).join("");
 $$("[data-b]").forEach(b=>b.onclick=()=>reserva(+b.dataset.b));watch();
}

// ===== Navegación por páginas =====
const ROUTES=["inicio","nosotros","reservar","profesionales","contacto","ingresar","cambiar","cuenta","panel","admin"],PROT=["cuenta","panel","admin","cambiar"];
const OFF={mode:"off",async login(){throw new Error("No se pudo conectar con Firebase ("+BERR+"). Recargá la página.")},async logout(){}};
let BOOTED=false,LMSG="";
const go=h=>{if(location.hash==="#"+h)route();else location.hash="#"+h};
const nav=$("#nav"),bg=$("#burger"),menu=v=>{nav.classList.toggle("open",v);bg.setAttribute("aria-expanded",v)};
function route(){
 let r=location.hash.replace("#","")||"inicio";if(!ROUTES.includes(r))r="inicio";
 if(!BOOTED&&PROT.includes(r)){$$(".page").forEach(p=>p.hidden=true);return}
 if(me&&me.mustChange&&!me.demo)r="cambiar";
 else if(r==="cambiar")r=me?home():"ingresar";
 else if(r==="ingresar"&&me)r=home();
 else if(["cuenta","panel","admin"].includes(r)){const need={cuenta:"paciente",panel:"funcionario",admin:"admin"}[r];if(!me)r="ingresar";else if(me.role!==need)r=home()}
 if(location.hash!=="#"+r)history.replaceState(null,"","#"+r);
 cur=r;$$(".page").forEach(p=>p.hidden=p.id!=="pg-"+r);
 $$("#menu a[data-r]").forEach(a=>a.classList.toggle("on",a.dataset.r===r));
 if(r==="ingresar"){$("#lMsg").textContent=LMSG||"Ingresá con tu cédula y la contraseña que te dio la clínica. Las cuentas las crea la clínica cuando aceptás el tratamiento.";LMSG=""}
 scrollTo(0,0);menu(false);paint();watch();
}
addEventListener("hashchange",route);
bg.onclick=()=>menu(!nav.classList.contains("open"));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){menu(false);close()}});
document.addEventListener("click",e=>{if(!nav.contains(e.target))menu(false)});
$$("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
$("#navIng").onclick=()=>go(me?home():"ingresar");
$("#navOut").onclick=e=>{e.preventDefault();salir()};

function chrome(){
 const ok=me&&!(me.mustChange&&!me.demo),tgt=ok?home():me?"cambiar":"ingresar";
 const a=$("#navAcc");a.textContent=!me?"Mi cuenta":me.demo?"Mi cuenta (demo)":{paciente:"Mi cuenta",funcionario:"Panel",admin:"Administración"}[me.role]||"Mi cuenta";a.href="#"+tgt;a.dataset.r=tgt;
 const ni=$("#navIng");ni.textContent=me?"Hola, "+String(me.n).split(" ")[0]:"Ingresar";ni.classList.toggle("pulse",!me);
 $("#liOut").hidden=!me||!!me.demo;$("#demoBar").hidden=!(me&&me.demo);
 const lb=$("#localBar");lb.hidden=!(B&&B.mode==="local"&&!me);
 lb.innerHTML=lb.hidden?"":"<b>Modo de pruebas (sin Firebase):</b> los datos viven solo en este navegador. Administración: 1.234.567-2 / admin1234 · Funcionario: 4.123.456-3 / func1234.";
 $$("[data-demo]").forEach(b=>b.hidden=!!me);$("#heroIng").hidden=!!me;
 $$("[data-agendar]").forEach(b=>b.hidden=!!me&&me.role!=="paciente");
}

// ===== Ingresar, demo, cambio de contraseña =====
const info=h=>{$("#iBody").innerHTML=h;open("#mInfo")};
$("#fLogin").onsubmit=async e=>{
 e.preventDefault();const er=$("#lErr"),ci=$("#lCi").value,pass=$("#lPass").value,d=ci.replace(/\D/g,"");let m="";
 if(d.length<7||d.length>8)m="Ingresá tu cédula (7 u 8 números).";else if(!pass)m="Ingresá tu contraseña.";
 er.textContent=m;if(m)return;
 const btn=$("#fLogin button[type=submit]");btn.disabled=true;
 try{const u=await B.login(ciN(ci),pass);me=u;$("#lPass").value="";await refresh();toast("¡Listo, "+String(u.n).split(" ")[0]+"! Sesión iniciada");go(home())}
 catch(x){er.textContent=errMsg(x)}finally{btn.disabled=false}
};
function startDemo(){sessionStorage.setItem("jd_on","1");B=DEMO;me={...DEMO_USER};refresh().then(()=>{toast("Modo demo activado");go("cuenta")})}
function endDemo(){Object.keys(sessionStorage).filter(k=>k.startsWith("jd_")).forEach(k=>sessionStorage.removeItem(k));B=REAL||OFF;me=null;refresh().then(()=>{go("inicio");toast("Saliste del demo")})}
$$("[data-demo]").forEach(b=>b.onclick=startDemo);$("#demoOut").onclick=endDemo;
async function salir(){try{await B.logout()}catch(e){}me=null;await refresh();go("inicio");toast("Cerraste sesión")}
$("#fPass").onsubmit=async e=>{
 e.preventDefault();const a=$("#cpN").value,b=$("#cpN2").value,er=$("#cpErr");
 const m=a.length<8?"La contraseña debe tener al menos 8 caracteres.":!/[a-zA-Z]/.test(a)||!/\d/.test(a)?"Usá letras y números.":a!==b?"Las contraseñas no coinciden.":"";
 er.textContent=m;if(m)return;
 const btn=$("#fPass button[type=submit]");btn.disabled=true;
 try{me=await B.changePassword(me.uid,a);$("#cpN").value=$("#cpN2").value="";await refresh();toast("Contraseña actualizada ✔");go(home())}
 catch(x){er.textContent=errMsg(x)}finally{btn.disabled=false}
};

// ===== Agendar cita (asistente: profesional > agenda > seña > comprobante) =====

const WAI='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.52.146-.181.194-.301.297-.497.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.18 2.095 3.195 5.076 4.483.709.307 1.262.49 1.694.625.712.227 1.36.195 1.871.12.571-.09 1.758-.72 2.006-1.41.248-.69.248-1.289.173-1.41-.074-.123-.272-.195-.571-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"/></svg>';
const wa=m=>"https://wa.me/"+WSP.intl+"?text="+encodeURIComponent(m);
let W={};
async function reserva(id){
 if(!me){LMSG="Ingresá con tu cuenta (o probá el demo) para agendar tu cita.";go("ingresar");return}
 if(me.role!=="paciente"){toast("Las citas las reservan los pacientes desde su cuenta.");return}
 try{APPTS=await B.listAppts()}catch(e){}
 W={pres:0,card:0,step:id?2:1,p:id?PROS.find(x=>x.id===id):null,f:null,h:null,esp:"Todas"};wz();open("#mBook");
}
async function guardar(c){
 try{APPTS=await B.listAppts()}catch(e){}
 if(tomado(W.p,W.f,W.h)){toast("Ese horario se acaba de ocupar. Elegí otro");W.card=0;W.step=2;W.h=null;wz();return false}
 try{await B.putAppt({u:me.uid,p:W.p.id,f:W.f,h:W.h,s:PRECIO[W.p.e]/2,c})}catch(e){toast(errMsg(e));return false}
 await refresh();return true;
}
function wz(){
 const s=W.step,p=W.p,st=["Profesional","Fecha y hora","Seña","Comprobante"];
 let h=`<div class="wst">${st.map((t,i)=>`<span class="${i+1===s?"on":i+1<s?"done":""}"><i>${i+1<s?"✓":i+1}</i><em>${t}</em></span>`).join("")}</div>`;
 if(s===1){
  const esp=["Todas",...new Set(PROS.map(x=>x.e))];
  h+=`<h3>Agendar cita con un profesional</h3><p class="note">Elegí quién te va a atender. Estos son los profesionales con horarios disponibles.</p><div class="filters">${esp.map(e=>`<button data-e="${e}" class="${e===W.esp?"on":""}">${e}</button>`).join("")}</div><div class="plist">${PROS.filter(x=>W.esp==="Todas"||x.e===W.esp).map(x=>{const n=libres(x);return `<button class="pitem" data-p="${x.id}" ${n?"":"disabled"}><span class="avatar">${ini(x)}</span><span><b>${x.n}</b><br><span class="note">${x.e} · ${x.d.map(d=>DN[d]).join(", ")}</span></span><span class="chip">${n?n+" horarios":"Sin horarios"}</span></button>`}).join("")}</div>`;
 }else if(s===2){
  h+=`<button class="back" data-back>← Cambiar profesional</button><h3>Agenda de ${p.n}</h3><p class="note">${p.e} · tocá un horario libre. «Tuyo» es una cita que ya reservaste.</p><div class="agwrap"><table class="ag"><thead><tr><th></th>${p.h.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${fechas(p).map(d=>{const f=iso(d);return `<tr><th>${DN[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}</th>${p.h.map(x=>{const t=tomado(p,f,x),mine=APPTS.some(a=>a.p===p.id&&a.f===f&&a.h===x&&a.u===me.uid);return `<td><button data-ag="${f}|${x}" class="${mine?"mine":t?"occ":W.f===f&&W.h===x?"on":""}" ${t?"disabled":""}>${mine?"Tuyo":t?"Ocupado":W.f===f&&W.h===x?"✓":"Libre"}</button></td>`}).join("")}</tr>`}).join("")}</tbody></table></div><p class="note">${W.f&&W.h?"Elegiste: <b>"+lbl(W.f)+" · "+W.h+" h</b>":"Elegí un horario para continuar."}</p><button class="btn full" id="wNext" ${W.f&&W.h?"":"disabled"}>Continuar a la seña</button>`;
 }else if(s===3&&W.card){
  const se=PRECIO[p.e]/2;
  h+=`<button class="back" id="cBack">← Elegir otra forma de pago</button><h3>Pagar con tarjeta</h3><div class="sum"><div><span>Cita</span><b>${p.n} · ${lbl(W.f)} · ${W.h} h</b></div><div class="tot"><span>Seña (50 %)</span><b>${money(se)}</b></div></div>
  <form id="cForm" autocomplete="on" novalidate>
   <label for="cNum">Número de tarjeta</label><input id="cNum" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="23">
   <label for="cName">Nombre del titular</label><input id="cName" autocomplete="cc-name" placeholder="Como figura en la tarjeta">
   <div class="crow"><div><label for="cExp">Vencimiento</label><input id="cExp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5"></div><div><label for="cCvv">Código (CVV)</label><input id="cCvv" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4" type="password"></div></div>
   <p class="note err" id="cErr"></p>
   <button class="btn full" type="submit">Pagar ${money(se)}</button></form>
  <p class="note">🔒 Versión de demostración: los datos de la tarjeta no se guardan ni se envían a ningún lado.</p>`;
 }else if(s===3){
  const pr=PRECIO[p.e],se=pr/2;
  h+=`<button class="back" data-back>← Cambiar fecha u hora</button><h3>Abonar la seña</h3><div class="sum"><div><span>Profesional</span><b>${p.n}</b></div><div><span>Cita</span><b>${lbl(W.f)} · ${W.h} h</b></div><div><span>Consulta</span><b>${money(pr)}</b></div><div class="tot"><span>Seña (50 %)</span><b>${money(se)}</b></div></div>`
  +`<p class="note">Elegí cómo pagar la seña de <b>${money(se)}</b>:</p><div class="pays">
   <button class="pay" id="wCard"><span class="pi">💳</span><span><b>Tarjeta de crédito o débito</b><br><span class="note">Visa · Mastercard · OCA · Creditel</span></span><em>Pagar →</em></button>
   <a class="pay" target="_blank" rel="noopener" href="${PAGO.mp}"><span class="pi mp">MP</span><span><b>Mercado Pago</b><br><span class="note">Con tu cuenta, saldo o QR</span></span><em>Pagar →</em></a>
   <button class="pay" id="wTr"><span class="pi">🏦</span><span><b>Transferencia bancaria</b><br><span class="note">Desde cualquier banco o redes de cobranza</span></span><em>Ver datos</em></button></div>
  <div class="trf" id="wTrBox" hidden>${PAGO.ejemplo?'<span class="ej">DATOS DE EJEMPLO</span>':""}
   ${[["Banco",PAGO.banco],["Cuenta",PAGO.tipo],["N.º de cuenta",PAGO.cuenta],["Alias",PAGO.alias],["Titular",PAGO.titular],["Importe",money(se)]].map(r=>`<div><span>${r[0]}</span><b>${r[1]}</b>${["N.º de cuenta","Alias"].includes(r[0])?`<button data-cp="${r[1]}">Copiar</button>`:""}</div>`).join("")}</div>
  <button class="btn full" id="wPaid">Ya aboné la seña</button><p class="note">Pagá primero y después tocá este botón.</p>
  <div class="pres"><b>¿No podés pagar por la web?</b><p>Podés venir a la clínica (${DIR.split(",")[0]}) y abonar la seña con POS o en efectivo.</p><div class="row2"><a class="btn ghost sm" target="_blank" rel="noopener" href="${MAPS}">📍 Ver en Google Maps</a><button class="btn ghost sm" id="wPres">Voy a pagar en la clínica</button></div></div>`;
 }else{
  const se=PRECIO[p.e]/2;
  if(W.pres)h+=`<div class="okbox"><div class="check">✓</div><h3>¡Cita reservada!</h3><p>Abonás la seña de <b>${money(se)}</b> en la clínica, con POS o en efectivo: <b>${DIR.split(",")[0]}</b>.</p><a class="btn full" target="_blank" rel="noopener" href="${MAPS}">📍 Cómo llegar</a><p class="note">Mientras tanto, cargá tu documentación: cédula, constancia del BPS e informe médico.</p><button class="btn ghost full" id="wSent">Cargar documentos</button></div>`;
  else h+=`<div class="okbox"><div class="check">✓</div><h3>¡Perfecto! La seña ya quedó abonada correctamente.</h3><p>Ahora debés mandar el comprobante al WhatsApp: <b>${WSP.mostrar}</b></p><a class="btn wa full" target="_blank" rel="noopener" href="${wa("Hola, soy "+me.n+". Te envío el comprobante de la seña de "+money(se)+" para mi cita con "+p.n+" el "+lbl(W.f)+" a las "+W.h+" h.")}">${WAI} Enviar comprobante por WhatsApp</a><p class="note">Después de enviarlo, cargá tu documentación: cédula, constancia del BPS e informe médico.</p><button class="btn full" id="wSent">Ya envié el comprobante · Cargar documentos</button></div>`;
 }
 $("#wBody").innerHTML=h;
 $$("[data-e]").forEach(b=>b.onclick=()=>{W.esp=b.dataset.e;wz()});
 $$("[data-p]").forEach(b=>b.onclick=()=>{W.p=PROS.find(x=>x.id===+b.dataset.p);W.f=W.h=null;W.step=2;wz()});
 $$("[data-back]").forEach(b=>b.onclick=()=>{W.step--;wz()});
 $$("[data-ag]").forEach(b=>b.onclick=()=>{[W.f,W.h]=b.dataset.ag.split("|");wz()});
 const nx=$("#wNext");if(nx)nx.onclick=()=>{W.step=3;wz()};
 const pd=$("#wPaid");if(pd)pd.onclick=async()=>{pd.disabled=true;if(await guardar(0)){W.step=4;wz()}else pd.disabled=false};
 const cd=$("#wCard");if(cd)cd.onclick=()=>{W.card=1;wz()};
 const cb=$("#cBack");if(cb)cb.onclick=()=>{W.card=0;wz()};
 const cf=$("#cForm");if(cf){
  const num=$("#cNum"),exp=$("#cExp"),cvv=$("#cCvv"),nm=$("#cName"),er=$("#cErr");
  num.oninput=()=>{num.value=num.value.replace(/\D/g,"").slice(0,19).replace(/(.{4})/g,"$1 ").trim()};
  exp.oninput=()=>{let v=exp.value.replace(/\D/g,"").slice(0,4);if(v.length>2)v=v.slice(0,2)+"/"+v.slice(2);exp.value=v};
  cvv.oninput=()=>{cvv.value=cvv.value.replace(/\D/g,"").slice(0,4)};
  const luhn=n=>{let t=0,alt=false;for(let i=n.length-1;i>=0;i--){let d=+n[i];if(alt){d*=2;if(d>9)d-=9}t+=d;alt=!alt}return t%10===0};
  cf.onsubmit=async e=>{e.preventDefault();
   const n=num.value.replace(/\s/g,""),m=exp.value.match(/^(\d\d)\/(\d\d)$/);let msg="";
   if(n.length<13||!luhn(n))msg="El número de tarjeta no es válido.";
   else if(nm.value.trim().length<3)msg="Ingresá el nombre del titular.";
   else if(!m||+m[1]<1||+m[1]>12||new Date(2000+ +m[2],+m[1],1)<=new Date())msg="El vencimiento no es válido o la tarjeta está vencida.";
   else if(cvv.value.length<3)msg="Ingresá el código de seguridad.";
   if(msg){er.textContent=msg;return}
   if(await guardar(0)){W.card=0;W.step=4;wz()}};
 }
 const tr=$("#wTr");if(tr)tr.onclick=()=>{const x=$("#wTrBox");x.hidden=!x.hidden};
 $$("[data-cp]").forEach(b=>b.onclick=()=>{try{navigator.clipboard.writeText(b.dataset.cp).then(()=>toast("Copiado ✔"),()=>toast("No se pudo copiar"))}catch(e){toast("No se pudo copiar")}});
 const pr=$("#wPres");if(pr)pr.onclick=async()=>{pr.disabled=true;if(await guardar(2)){W.pres=1;W.step=4;wz()}else pr.disabled=false};
 const sn=$("#wSent");if(sn)sn.onclick=async()=>{
  const a=APPTS.find(x=>x.u===me.uid&&same(x,{p:W.p.id,f:W.f,h:W.h}));
  if(a&&!W.pres){try{await B.putAppt({...a,c:1})}catch(e){toast(errMsg(e))}}
  close();toast("Ahora cargá tus documentos");await refresh();showTab("docs");go("cuenta")};
}
$$("[data-agendar]").forEach(b=>b.onclick=()=>reserva());
$$("[data-wa]").forEach(e=>e.innerHTML=WAI);

// ===== Pestañas =====
const tabs=(sel,pre,fn)=>{$$(sel+" button").forEach(b=>b.onclick=()=>fn(b.dataset.t))};
const showTab=t=>{$$("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.t===t));$$("#pg-cuenta .pane").forEach(p=>p.classList.toggle("on",p.id==="p-"+t))};
const showFTab=t=>{$$("#ftabs button").forEach(x=>x.classList.toggle("on",x.dataset.t===t));$$("#pg-panel .pane").forEach(p=>p.classList.toggle("on",p.id==="f-"+t))};
tabs("#tabs","p-",showTab);tabs("#ftabs","f-",showFTab);

function paint(){
 if(!me)return;
 if(cur==="cuenta"&&me.role==="paciente")paintCuenta();
 else if(cur==="panel"&&me.role==="funcionario")paintPanel();
 else if(cur==="admin"&&me.role==="admin")paintAdmin();
}

// ===== Mi cuenta (paciente) =====
function resumen(dm){
 const l=DOCS.map((_,i)=>dm[i]),n=l.filter(Boolean).length,ap=l.filter(x=>x&&x.estado==="aprobado").length;
 if(ap===DOCS.length)return["ok","¡Documentación aprobada!","La clínica ya revisó todos tus documentos.",ap];
 if(l.some(x=>x&&x.estado==="rechazado"))return["bad","Hay documentos rechazados","La clínica se va a comunicar con vos por teléfono. Después podés volver a subirlos.",ap];
 if(n===DOCS.length)return["","Documentación en revisión","La clínica la revisa en 24 a 48 horas hábiles. Que llegue no significa que esté aprobada.",ap];
 return["","Cargá tu documentación","Faltan "+(DOCS.length-n)+" documento(s) por subir.",ap];
}
function paintCuenta(){
 $("#cAv").textContent=iniciales(me.n);$("#cNom").textContent=me.n;
 $("#cSub").textContent="Paciente · CI "+fmtCi(me.ci)+(me.tel?" · "+me.tel:"");
 const dm={};MYDOCS.forEach(d=>dm[d.i]=d);
 const [cl,tit,sub,ap]=resumen(dm),est=cl==="ok"?"g":cl==="bad"?"r":"y";
 $("#cEst").innerHTML=`<span class="st ${est}">${tit}</span>`;
 $("#p-docs").innerHTML=`<div class="alert ${cl}"><b>${tit}</b><div class="bar"><i style="width:${ap/DOCS.length*100}%"></i></div><span class="note">${ap} de ${DOCS.length} aprobados · ${sub}</span></div>`
 +DOCS.map((d,i)=>{const f=dm[i],puede=!f||f.estado!=="aprobado";
  return `<div class="row"><div><b>${d}</b><br><span class="note">${f?esc(f.name)+" · "+esc(f.date):"JPG, PNG o PDF (las fotos se comprimen solas)"}</span>${f&&f.estado==="rechazado"?`<br><span class="note warn">La clínica se va a comunicar con vos${me.tel?" al "+esc(me.tel):""}.${f.motivo?" Motivo: "+esc(f.motivo):""}</span>`:""}${me.demo&&f?`<br><span class="note">Demo · simular revisión: <button class="lnk" data-sim="${f.id}|aprobado">aprobar</button> · <button class="lnk" data-sim="${f.id}|rechazado">rechazar</button></span>`:""}</div><div class="rgt">${pill(f&&f.estado)}${puede?`<span class="btn sm file">${f?"Reemplazar":"Subir"}<input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" data-d="${i}"></span>`:""}</div></div>`}).join("");
 $$("[data-d]").forEach(inp=>inp.onchange=async()=>{const f=inp.files[0];if(!f)return;
  try{toast("Procesando archivo…");const data=await prepararArchivo(f);await B.putDoc(me.uid,+inp.dataset.d,{name:f.name,date:new Date().toLocaleDateString("es-UY")},data);toast("Documento enviado ✔ · en revisión")}
  catch(e){toast(errMsg(e))}await refresh()});
 $$("[data-sim]").forEach(b=>b.onclick=async()=>{const[id,e]=b.dataset.sim.split("|");await B.setEstado(id,e,e==="rechazado"?"(demo)":"","demo");await refresh()});
 const ap2=APPTS.filter(a=>a.u===me.uid).sort((a,b)=>(a.f+a.h).localeCompare(b.f+b.h));
 $("#p-agenda").innerHTML=(ap2.length?ap2.map(a=>{const p=PROS.find(x=>x.id===a.p);if(!p)return"";return `<div class="row"><div><b>${lbl(a.f)} · ${a.h} h</b><br><span class="note">${p.n} · ${p.e}${a.c===2?"<br>Seña "+money(a.s)+" a abonar en la clínica (POS o efectivo)":a.s?"<br>Seña "+money(a.s)+" abonada · "+(a.c?"comprobante enviado":"falta enviar el comprobante"):""}</span></div><button class="btn ghost sm" data-c="${a.p}|${a.f}|${a.h}">Cancelar</button></div>`}).join(""):'<p class="note">Todavía no tenés turnos.</p>')+'<a class="btn sm" href="#profesionales">Reservar turno</a>';
 $$("[data-c]").forEach(b=>b.onclick=async()=>{const[p,f,h]=b.dataset.c.split("|");try{await B.delAppt({p:+p,f,h});toast("Turno cancelado")}catch(e){toast(errMsg(e))}await refresh()});
 const pp=$("#p-perfil");if(!pp.contains(document.activeElement)){
  pp.innerHTML=[["Nombre",me.n],["Cédula","CI "+fmtCi(me.ci)],["Tipo","Paciente"]].map(r=>`<div class="row"><span class="note">${r[0]}</span><b>${esc(r[1])}</b></div>`).join("")+`<form id="fTel" novalidate class="row" style="align-items:flex-end"><div style="flex:1;min-width:200px"><label for="tT">Teléfono de contacto</label><input id="tT" inputmode="tel" value="${esc(me.tel)}"></div><button class="btn sm" type="submit">Guardar</button></form><p class="note err" id="tE"></p><p class="note">Para corregir nombre o cédula, consultá en la clínica.</p>`;
  $("#fTel").onsubmit=async e=>{e.preventDefault();const t=$("#tT").value.trim();if(!telOk(t)){$("#tE").textContent="Ingresá un teléfono válido.";return}
   try{await B.saveProfile(me.uid,{tel:t});me={...me,tel:t};toast("Teléfono guardado ✔");await refresh()}catch(x){$("#tE").textContent=errMsg(x)}};
 }
}

// ===== Crear cuentas (funcionario crea pacientes · administrador crea funcionarios) =====
async function crear(role,ids){
 const n=$(ids.n).value.trim(),c=$(ids.c).value.trim(),t=$(ids.t).value.trim(),er=$(ids.e);
 const m=n.length<3?"Ingresá el nombre completo.":!ciValida(c)?"La cédula no es válida. Revisá el número y el dígito final (ej. 1.234.567-2).":!telOk(t)?"Ingresá un teléfono de contacto válido.":"";
 er.textContent=m;if(m)return;
 const btn=$(ids.f+" button[type=submit]");btn.disabled=true;
 try{
  const pass=tempPass(),u=await B.createUser({n,ci:ciN(c),tel:t,role,pass});
  $(ids.f).reset();er.textContent="";
  info(`<div class="okbox"><div class="check">✓</div><h3>Cuenta creada</h3><p>${esc(u.n)} · CI ${fmtCi(u.ci)}</p><div class="cred"><span>Contraseña temporal</span><b>${esc(pass)}</b></div><button class="btn full" id="tpc">Copiar contraseña</button><p class="note">Entregásela ahora: no se vuelve a mostrar. Al ingresar por primera vez la persona tiene que elegir una propia.</p></div>`);
  $("#tpc").onclick=()=>{try{navigator.clipboard.writeText(pass).then(()=>toast("Copiada ✔"),()=>toast("No se pudo copiar"))}catch(e){toast("No se pudo copiar")}};
  await refresh();
 }catch(x){er.textContent=errMsg(x)}finally{btn.disabled=false}
}
$("#fPac").onsubmit=e=>{e.preventDefault();crear("paciente",{n:"#nPn",c:"#nPc",t:"#nPt",e:"#nPe",f:"#fPac"})};
$("#fFun").onsubmit=e=>{e.preventDefault();crear("funcionario",{n:"#nFn",c:"#nFc",t:"#nFt",e:"#nFe",f:"#fFun"})};

// ===== Panel de funcionarios =====
const contacto=u=>`<div class="sum"><div><span>Paciente</span><b>${esc(u.n||"—")}</b></div><div><span>Cédula</span><b>${u.ci?"CI "+fmtCi(u.ci):"—"}</b></div><div><span>Teléfono</span><b>${esc(u.tel||"—")}</b></div></div>${u.tel?`<div class="row2"><a class="btn sm" href="tel:${esc(String(u.tel).replace(/[^\d+]/g,""))}">📞 Llamar</a><a class="btn wa sm" target="_blank" rel="noopener" href="${waTel(u.tel)}">WhatsApp</a></div>`:""}`;
async function verArchivo(id){
 info("<h3>Cargando documento…</h3>");
 try{const data=await B.getFile(id);if(!data){info("<h3>Archivo no disponible</h3>");return}
  const blob=await (await fetch(data)).blob(),url=URL.createObjectURL(blob);
  info(`<h3>Documento</h3>${blob.type==="application/pdf"?`<iframe class="docview" src="${url}" title="Documento"></iframe>`:`<img class="docview" src="${url}" alt="Documento subido">`}<a class="btn ghost sm" target="_blank" rel="noopener" href="${url}">Abrir en otra pestaña</a>`)}
 catch(e){info("<h3>No se pudo abrir el documento</h3><p class='note'>"+esc(errMsg(e))+"</p>")}
}
function rechazar(d){
 const u=USERS.find(x=>x.uid===d.u)||{};
 info(`<h3>Rechazar documento</h3><p class="note">${DOCS[d.i]} · ${esc(d.name)}</p><p>Estos son los datos para comunicarte con la persona:</p>${contacto(u)}<label for="rMot">Motivo (opcional, lo ve el paciente)</label><input id="rMot" placeholder="Ej.: la foto está borrosa"><button class="btn full" id="rOk">Confirmar rechazo</button>`);
 $("#rOk").onclick=async()=>{try{await B.setEstado(d.id,"rechazado",$("#rMot").value.trim(),me.uid);close();toast("Documento rechazado · el paciente ya lo ve");await refresh()}catch(e){toast(errMsg(e))}};
}
$("#docList").onclick=async e=>{
 const b=e.target.closest("[data-a]");if(!b)return;const d=ALLDOCS.find(x=>x.id===b.dataset.id);if(!d)return;
 if(b.dataset.a==="ver")verArchivo(d.id);
 else if(b.dataset.a==="no")rechazar(d);
 else if(b.dataset.a==="dat")info(`<h3>Datos de contacto</h3>${d.motivo?`<p class="note">Motivo del rechazo: ${esc(d.motivo)}</p>`:""}${contacto(USERS.find(x=>x.uid===d.u)||{})}`);
 else if(b.dataset.a==="ok"){try{await B.setEstado(d.id,"aprobado","",me.uid);toast("Documento aprobado ✔");await refresh()}catch(x){toast(errMsg(x))}}
};
$("#docF").onchange=paint;$("#pacQ").oninput=paint;
function agendaDe(uid){
 const u=USERS.find(x=>x.uid===uid)||{},l=APPTS.filter(a=>a.u===uid).sort((a,b)=>(a.f+a.h).localeCompare(b.f+b.h));
 info(`<h3>Agenda de ${esc(u.n||"paciente")}</h3>${contacto(u)}`+(l.length?l.map(a=>{const p=PROS.find(x=>x.id===a.p);return p?`<div class="row"><div><b>${lbl(a.f)} · ${a.h} h</b><br><span class="note">${p.n} · ${p.e}${a.c===2?" · seña a abonar en la clínica":a.s?" · seña "+money(a.s)+(a.c?" · comprobante enviado":" · falta comprobante"):""}</span></div></div>`:""}).join(""):'<p class="note">Todavía no reservó turnos.</p>'));
}
function paintPanel(){
 $("#fSub").textContent="Funcionario: "+me.n+". Podés crear cuentas de pacientes y revisar sus documentos.";
 const pend=ALLDOCS.filter(d=>d.estado==="revision").length;$("#ftDoc").textContent="Documentos"+(pend?" ("+pend+")":"");
 const q=$("#pacQ").value.trim().toLowerCase();
 const res=uid=>{const l=ALLDOCS.filter(d=>d.u===uid),ap=l.filter(d=>d.estado==="aprobado").length,rj=l.filter(d=>d.estado==="rechazado").length,rv=l.filter(d=>d.estado==="revision").length;
  return `<span class="st ${ap===DOCS.length?"g":rj?"r":l.length?"y":"n"}">${ap===DOCS.length?"Aprobada":rj?"Rechazada":rv?"En revisión":"Sin documentos"}</span> <span class="note">${ap}/${DOCS.length} aprobados</span>`};
 $("#pacList").innerHTML=USERS.filter(u=>u.role==="paciente"&&(!q||(u.n+" "+fmtCi(u.ci)+" "+u.ci).toLowerCase().includes(q))).sort((a,b)=>b.at-a.at).map(u=>`<div class="row"><div><b>${esc(u.n)}</b><br><span class="note">CI ${fmtCi(u.ci)} · Tel ${esc(u.tel)||"—"}</span></div><div class="rgt">${res(u.uid)}<button class="btn ghost sm" data-pa="${u.uid}">Ver agenda</button></div></div>`).join("")||'<p class="note">No hay pacientes para mostrar.</p>';
 $$("[data-pa]").forEach(b=>b.onclick=()=>agendaDe(b.dataset.pa));
 const f=$("#docF").value;
 $("#docList").innerHTML=ALLDOCS.filter(d=>f==="todos"||d.estado===f).sort((a,b)=>(b.ts||0)-(a.ts||0)).map(d=>{const u=USERS.find(x=>x.uid===d.u)||{};
  return `<div class="row"><div><b>${esc(u.n||"Paciente")}</b> <span class="note">· CI ${u.ci?fmtCi(u.ci):"—"}</span><br><span class="note">${DOCS[d.i]} · ${esc(d.name)} · ${esc(d.date)}${d.estado==="rechazado"&&d.motivo?" · Motivo: "+esc(d.motivo):""}</span></div><div class="rgt">${pill(d.estado)}<button class="btn ghost sm" data-a="ver" data-id="${d.id}">Ver</button>${d.estado!=="aprobado"?`<button class="btn sm" data-a="ok" data-id="${d.id}">Aprobar</button>`:""}${d.estado!=="rechazado"?`<button class="btn ghost sm" data-a="no" data-id="${d.id}">Rechazar</button>`:`<button class="btn ghost sm" data-a="dat" data-id="${d.id}">Datos</button>`}</div></div>`}).join("")||'<p class="note">No hay documentos en este estado.</p>';
 const hoy=iso(new Date());
 $("#agList").innerHTML=APPTS.filter(a=>a.f>=hoy).sort((a,b)=>(a.f+a.h).localeCompare(b.f+b.h)).map(a=>{const p=PROS.find(x=>x.id===a.p);if(!p)return"";const u=USERS.find(x=>x.uid===a.u);
  return `<div class="row"><div><b>${lbl(a.f)} · ${a.h} h</b> <span class="note">· ${p.n} (${p.e})</span><br><span class="note">Paciente: ${esc(u?u.n:"—")}${u&&u.tel?" · Tel "+esc(u.tel):""} · ${a.c===2?"seña a abonar en la clínica":a.s?"seña "+money(a.s)+(a.c?" · comprobante enviado":" · falta comprobante"):""}</span></div><button class="btn ghost sm" data-ac="${a.p}|${a.f}|${a.h}">Cancelar</button></div>`}).join("")||'<p class="note">No hay turnos próximos.</p>';
 $$("[data-ac]").forEach(b=>b.onclick=async()=>{if(!confirm("¿Cancelar este turno?"))return;const[p,f,h]=b.dataset.ac.split("|");try{await B.delAppt({p:+p,f,h});toast("Turno cancelado")}catch(e){toast(errMsg(e))}await refresh()});
}

// ===== Administración (solo crea funcionarios) =====
function paintAdmin(){
 $("#aSub").textContent="Administrador: "+me.n+". Desde acá se crean las cuentas de los funcionarios.";
 $("#funList").innerHTML=USERS.filter(u=>u.role==="funcionario").sort((a,b)=>b.at-a.at).map(u=>`<div class="row"><div><b>${esc(u.n)}</b><br><span class="note">CI ${fmtCi(u.ci)} · Tel ${esc(u.tel)||"—"}</span></div><span class="st ${u.mustChange?"y":"g"}">${u.mustChange?"Aún no cambió la clave":"Activo"}</span></div>`).join("")||'<p class="note">Todavía no hay funcionarios.</p>';
}

// ===== Video instructivo =====
$("#btnVideo").onclick=()=>{$("#vBox").innerHTML=VIDEO_URL?`<iframe src="${VIDEO_URL}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px" allowfullscreen></iframe>`:'<div class="vid">'+["Aceptás el tratamiento en la clínica y te crean la cuenta","Ingresás con tu cédula y la contraseña temporal, y elegís una propia","Tocás «Agendar cita» y elegís profesional, día y hora","Abonás la seña del 50 % y mandás el comprobante","Cargás cédula, constancia del BPS e informe médico"].map((t,i)=>`<div class="vs" style="animation-delay:${i*1.2}s"><span class="num">${i+1}</span> ${t}</div>`).join("")+'</div><p class="note">Acá va el video explicativo de la clínica.</p>';open("#mVideo")};

// ===== Arranque =====
pintaPros();
setInterval(()=>{if(me&&!document.hidden&&!(me.mustChange&&!me.demo)&&!$(".overlay.open")&&["cuenta","panel","admin"].includes(cur))refresh()},20000);
(async()=>{
 if(HASFB){try{REAL=await fbBackend(window.FIREBASE_CONFIG)}catch(e){console.error(e);BERR=(e&&(e.code||e.message))||"error desconocido";toast("No se pudo conectar con Firebase. Podés usar el demo.")}}
 else REAL=mkLocal(localStorage,"jac_",true);
 if(sessionStorage.getItem("jd_on")){B=DEMO;me={...DEMO_USER};BOOTED=true;await refresh();route();return}
 B=REAL||OFF;
 if(!REAL){BOOTED=true;chrome();route();return}
 REAL.init(async u=>{if(me&&me.demo)return;me=u;BOOTED=true;await refresh();route()});
})();
