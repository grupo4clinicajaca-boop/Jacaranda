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
const S={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),3200)};
const open=id=>$(id).classList.add("open"),close=()=>$$(".overlay").forEach(o=>o.classList.remove("open"));
$$("[data-close]").forEach(b=>b.onclick=close);
$$(".overlay").forEach(o=>o.onclick=e=>{if(e.target===o)close()});
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const fechas=p=>{const r=[],t=new Date();for(let i=1;i<=28&&r.length<8;i++){const d=new Date(t);d.setDate(t.getDate()+i);if(p.d.includes(d.getDay()))r.push(d)}return r};
const lbl=s=>{const d=new Date(s+"T12:00");return DN[d.getDay()]+" "+d.getDate()+"/"+(d.getMonth()+1)};
const money=n=>"$ "+Math.round(n).toLocaleString("es-UY");
const same=(a,b)=>a.p===b.p&&a.f===b.f&&a.h===b.h;
const iniciales=n=>String(n||"").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("")||"?";

// ===== Cuentas y datos: Firebase (Google) si está configurado, si no modo demo local =====
const ERR={"auth/email-already-in-use":"Ya existe una cuenta con ese correo.","auth/invalid-credential":"Correo o contraseña incorrectos.","auth/wrong-password":"Correo o contraseña incorrectos.","auth/user-not-found":"Correo o contraseña incorrectos.","auth/weak-password":"La contraseña es muy débil (mínimo 8 caracteres).","auth/invalid-email":"El correo no es válido.","auth/popup-closed-by-user":"Cerraste la ventana de Google antes de terminar.","auth/popup-blocked":"El navegador bloqueó la ventana de Google. Permitila e intentá de nuevo.","auth/network-request-failed":"Sin conexión. Revisá tu internet e intentá de nuevo.","auth/too-many-requests":"Demasiados intentos. Esperá unos minutos.","permission-denied":"Sin permiso. Revisá las reglas de Firestore (ver README).","auth/operation-not-allowed":"Ese método de ingreso no está activado en Firebase (Authentication → Método de acceso).","auth/unauthorized-domain":"Este dominio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).","auth/popup-closed-by-user":"Cerraste la ventana de Google antes de terminar.","auth/cancelled-popup-request":"Se canceló la ventana de Google. Intentá de nuevo.","auth/operation-not-supported-in-this-environment":"Este navegador no permite la ventana de Google. Abrí el sitio desde la dirección https:// en Chrome o Safari.","auth/internal-error":"Error interno de Firebase. Revisá que Google esté activado y recargá.","auth/configuration-not-found":"Falta activar Authentication en Firebase (Compilación → Authentication → Comenzar).","auth/invalid-api-key":"La apiKey de firebase-config.js no es válida.","auth/api-key-not-valid":"La apiKey de firebase-config.js no es válida."};
const errMsg=e=>ERR[e&&e.code]||(e&&e.message&&!/^Firebase/.test(e.message)?e.message:"Ocurrió un error"+(e&&e.code?" ("+e.code+")":"")+". Intentá de nuevo.");

const Local={
 mode:"local",
 users(){return S.get("jac_users",{})},
 pub(u){return {uid:u.uid,n:u.n,ci:u.ci,mail:u.mail}},
 async hash(pass,salt){ // la contraseña nunca se guarda: solo un hash con sal (PBKDF2)
  const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(pass),"PBKDF2",false,["deriveBits"]);
  const b=await crypto.subtle.deriveBits({name:"PBKDF2",salt:Uint8Array.from(atob(salt),c=>c.charCodeAt(0)),iterations:100000,hash:"SHA-256"},k,256);
  return btoa(String.fromCharCode(...new Uint8Array(b)));
 },
 init(cb){const m=S.get("jac_session",null),u=m&&this.users()[m];cb(u?this.pub(u):null)},
 async register(d){
  const us=this.users(),k=d.mail.toLowerCase();
  if(us[k])throw new Error("Ya existe una cuenta con ese correo.");
  const salt=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  us[k]={uid:"u"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),n:d.n,ci:d.ci,mail:d.mail,salt,hash:await this.hash(d.pass,salt)};
  S.set("jac_users",us);S.set("jac_session",k);return this.pub(us[k]);
 },
 async login(mail,pass){
  const k=mail.toLowerCase(),u=this.users()[k];
  if(!u||await this.hash(pass,u.salt)!==u.hash)throw new Error("Correo o contraseña incorrectos.");
  S.set("jac_session",k);return this.pub(u);
 },
 async google(){throw new Error("El ingreso con Google se activa al conectar Firebase (ver README).")},
 async reset(){throw new Error("Restablecer la contraseña se activa al conectar Firebase (ver README).")},
 async logout(){S.set("jac_session",null)},
 async listAppts(){return S.get("jac_appts",[])},
 async putAppt(a){const l=S.get("jac_appts",[]).filter(x=>!same(x,a));l.push(a);S.set("jac_appts",l)},
 async delAppt(a){S.set("jac_appts",S.get("jac_appts",[]).filter(x=>!same(x,a)))},
 async getDocs(uid){return S.get("jac_docs",{})[uid]||{}},
 async setDocs(uid,d){const all=S.get("jac_docs",{});all[uid]=d;S.set("jac_docs",all)},
 async saveProfile(uid,d){const us=this.users();for(const k in us){if(us[k].uid===uid){us[k].n=d.n;us[k].ci=d.ci}}S.set("jac_users",us)}
};

async function fbBackend(cfg){
 const base="https://www.gstatic.com/firebasejs/10.12.2/";
 const [A,Au,F]=await Promise.all([import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]);
 const app=A.initializeApp(cfg),auth=Au.getAuth(app),db=F.getFirestore(app);
 auth.languageCode="es";
 const uref=uid=>F.doc(db,"users",uid);
 const aid=a=>a.p+"_"+a.f+"_"+a.h.replace(":","");
 const prof=async u=>{let d={};try{const s=await F.getDoc(uref(u.uid));if(s.exists())d=s.data()}catch(e){}
  return {uid:u.uid,n:d.n||u.displayName||(u.email||"").split("@")[0],ci:d.ci||"",mail:u.email||""}};
 return {
  mode:"firebase",
  init(cb){Au.onAuthStateChanged(auth,async u=>cb(u?await prof(u):null))},
  async register(d){
   const c=await Au.createUserWithEmailAndPassword(auth,d.mail,d.pass);
   try{await Au.updateProfile(c.user,{displayName:d.n})}catch(e){}
   await F.setDoc(uref(c.user.uid),{n:d.n,ci:d.ci,mail:d.mail});
   return {uid:c.user.uid,n:d.n,ci:d.ci,mail:d.mail};
  },
  async login(mail,pass){const c=await Au.signInWithEmailAndPassword(auth,mail,pass);return prof(c.user)},
  async google(){
   const c=await Au.signInWithPopup(auth,new Au.GoogleAuthProvider());
   const s=await F.getDoc(uref(c.user.uid));
   if(!s.exists())await F.setDoc(uref(c.user.uid),{n:c.user.displayName||"",ci:"",mail:c.user.email||""});
   return prof(c.user);
  },
  reset:mail=>Au.sendPasswordResetEmail(auth,mail),
  logout:()=>Au.signOut(auth),
  async listAppts(){const s=await F.getDocs(F.collection(db,"turnos"));return s.docs.map(d=>d.data())},
  putAppt:a=>F.setDoc(F.doc(db,"turnos",aid(a)),a),
  delAppt:a=>F.deleteDoc(F.doc(db,"turnos",aid(a))),
  async getDocs(uid){const s=await F.getDoc(uref(uid));return (s.exists()&&s.data().docs)||{}},
  setDocs:(uid,d)=>F.setDoc(uref(uid),{docs:d},{merge:true}),
  saveProfile:(uid,d)=>F.setDoc(uref(uid),{n:d.n,ci:d.ci},{merge:true})
 };
}

let B=Local,me=null,APPTS=[],DOCSD={},filt="Todas",AUTHMODE="login",AFTER=null,AMSG="";
const HASFB=!!(window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.apiKey);
let BERR="",READY=Promise.resolve();
const listo=async()=>{await READY;if(HASFB&&B.mode!=="firebase")throw new Error("No se pudo conectar con Firebase ("+BERR+"). Recargá la página con Ctrl+F5.")};
const tomado=(p,f,h)=>APPTS.some(a=>a.p===p.id&&a.f===f&&a.h===h);
const libres=p=>fechas(p).reduce((n,d)=>n+p.h.filter(h=>!tomado(p,iso(d),h)).length,0);
const ini=p=>p.n.split(" ").slice(1).map(w=>w[0]).join("");
async function refresh(){
 try{APPTS=await B.listAppts()}catch(e){APPTS=[]}
 try{DOCSD=me?await B.getDocs(me.uid):{}}catch(e){DOCSD={}}
 cuenta();
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

// ===== Ingresar / crear cuenta =====
const GI='<b style="display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#fff;color:#4285f4;font-size:13px;margin-right:8px;vertical-align:-3px">G</b>';
function abrirAuth(mode,after,msg){AUTHMODE=mode||"login";AFTER=after||null;AMSG=msg||"";authView();open("#mAuth")}
function authView(){
 const reg=AUTHMODE==="reg",fb=HASFB&&!BERR;
 $("#aBody").innerHTML=`${fb?"":`<div class="demo"><b>Modo demo:</b> ${BERR?"no se pudo conectar con Firebase ("+esc(BERR)+"). ":""}las cuentas se guardan solo en este navegador.</div>`}
 <div class="mtabs"><button data-am="login" class="${reg?"":"on"}">Ingresar</button><button data-am="reg" class="${reg?"on":""}">Crear cuenta</button></div>
 ${AMSG?`<p class="note" style="margin:0 0 8px">${esc(AMSG)}</p>`:""}
 <form id="aForm" novalidate>
  ${reg?`<label for="aN">Nombre completo</label><input id="aN" autocomplete="name"><label for="aCi">Cédula de identidad</label><input id="aCi" inputmode="numeric" autocomplete="off" placeholder="1.234.567-8">`:""}
  <label for="aMail">Correo electrónico</label><input id="aMail" type="email" autocomplete="email">
  <label for="aPass">Contraseña${reg?" (mínimo 8 caracteres)":""}</label><input id="aPass" type="password" autocomplete="${reg?"new-password":"current-password"}">
  ${reg?'<label for="aPass2">Repetir contraseña</label><input id="aPass2" type="password" autocomplete="new-password">':""}
  <p class="note err" id="aErr"></p>
  <button class="btn full" type="submit">${reg?"Crear cuenta":"Ingresar"}</button>
 </form>
 ${fb?`<div class="or"><span>o</span></div><button class="btn ghost full" id="aGoogle">${GI}Continuar con Google</button>`:""}
 ${!reg&&fb?'<button class="back" id="aReset" style="margin-top:12px">¿Olvidaste tu contraseña?</button>':""}`;
 $$("[data-am]").forEach(b=>b.onclick=()=>{AUTHMODE=b.dataset.am;authView()});
 const g=id=>$(id)?$(id).value.trim():"";
 $("#aForm").onsubmit=async e=>{
  e.preventDefault();
  const mail=g("#aMail"),pass=$("#aPass").value,er=$("#aErr");let msg="";
  if(reg){if(g("#aN").length<3)msg="Ingresá tu nombre completo.";else if(g("#aCi").replace(/\D/g,"").length<7)msg="Ingresá una cédula válida."}
  if(!msg&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail))msg="Ingresá un correo válido.";
  if(!msg&&reg&&pass.length<8)msg="La contraseña debe tener al menos 8 caracteres.";
  if(!msg&&!reg&&!pass)msg="Ingresá tu contraseña.";
  if(!msg&&reg&&pass!==$("#aPass2").value)msg="Las contraseñas no coinciden.";
  if(msg){er.textContent=msg;return}
  const btn=$("#aForm button[type=submit]");btn.disabled=true;er.textContent="";
  try{await listo();const u=reg?await B.register({n:g("#aN"),ci:g("#aCi"),mail,pass}):await B.login(mail,pass);await entrar(u)}
  catch(x){er.textContent=errMsg(x);btn.disabled=false}
 };
 const gg=$("#aGoogle");if(gg)gg.onclick=async()=>{try{await listo();await entrar(await B.google())}catch(x){$("#aErr").textContent=errMsg(x)}};
 const rs=$("#aReset");if(rs)rs.onclick=async()=>{
  const m=g("#aMail");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)){$("#aErr").textContent="Escribí tu correo arriba y tocá de nuevo.";return}
  try{await listo();await B.reset(m);toast("Te enviamos un correo para restablecer la contraseña")}catch(x){$("#aErr").textContent=errMsg(x)}};
}
function abrirCompletar(after){
 $("#aBody").innerHTML=`<h3>Completá tus datos</h3><p class="note">Necesitamos tu cédula para la ficha de paciente.</p>
 <form id="pForm" novalidate><label for="pN">Nombre completo</label><input id="pN" autocomplete="name" value="${esc(me.n)}">
 <label for="pCi">Cédula de identidad</label><input id="pCi" inputmode="numeric" autocomplete="off" placeholder="1.234.567-8" value="${esc(me.ci)}">
 <p class="note err" id="pErr"></p><button class="btn full" type="submit">Guardar</button></form>`;
 $("#pForm").onsubmit=async e=>{e.preventDefault();
  const n=$("#pN").value.trim(),ci=$("#pCi").value.trim(),er=$("#pErr");
  if(n.length<3){er.textContent="Ingresá tu nombre completo.";return}
  if(ci.replace(/\D/g,"").length<7){er.textContent="Ingresá una cédula válida.";return}
  try{await B.saveProfile(me.uid,{n,ci});me={...me,n,ci};close();toast("Datos guardados ✔");await refresh();if(after)after()}
  catch(x){er.textContent=errMsg(x)}};
 open("#mAuth");
}
async function entrar(u){
 me=u;close();toast("¡Listo, "+esc(String(u.n).split(" ")[0])+"! Sesión iniciada");
 const f=AFTER;AFTER=null;await refresh();
 if(!u.ci)abrirCompletar(f);else if(f)f();
}
async function salir(){try{await B.logout()}catch(e){}me=null;APPTS=[];DOCSD={};await refresh();toast("Cerraste sesión")}
$("#navIng").onclick=()=>{if(me)location.hash="#cuenta";else abrirAuth("login")};
$("#navAuth").onclick=e=>{if(me){e.preventDefault();salir()}else{e.preventDefault();abrirAuth("login")}};
$$("[data-login]").forEach(b=>b.onclick=()=>abrirAuth("login"));
$$("[data-reg]").forEach(b=>b.onclick=()=>abrirAuth("reg"));

// ===== Agendar cita (asistente: profesional > fecha y hora > seña > comprobante) =====
const WAI='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.52.146-.181.194-.301.297-.497.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.18 2.095 3.195 5.076 4.483.709.307 1.262.49 1.694.625.712.227 1.36.195 1.871.12.571-.09 1.758-.72 2.006-1.41.248-.69.248-1.289.173-1.41-.074-.123-.272-.195-.571-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"/></svg>';
const wa=m=>"https://wa.me/"+WSP.intl+"?text="+encodeURIComponent(m);
let W={};
async function reserva(id){
 if(!me){abrirAuth("login",()=>reserva(id),"Ingresá o creá tu cuenta para agendar tu cita.");return}
 if(!me.ci){abrirCompletar(()=>reserva(id));return}
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
  h+=`<button class="back" data-back>← Cambiar profesional</button><h3>${p.n}</h3><p class="note">${p.e} · elegí día y hora</p><label>Día</label><div class="slots">${fechas(p).map(d=>`<button data-f="${iso(d)}" class="${W.f===iso(d)?"on":""}">${DN[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}</button>`).join("")}</div><label>Hora</label><div class="slots">${W.f?p.h.map(x=>`<button data-h="${x}" class="${W.h===x?"on":""}" ${tomado(p,W.f,x)?"disabled":""}>${x}</button>`).join(""):'<span class="note">Elegí un día primero</span>'}</div><button class="btn full" id="wNext" ${W.f&&W.h?"":"disabled"}>Continuar a la seña</button>`;
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
 $$("[data-f]").forEach(b=>b.onclick=()=>{W.f=b.dataset.f;W.h=null;wz()});
 $$("[data-h]").forEach(b=>b.onclick=()=>{W.h=b.dataset.h;wz()});
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
  close();toast("Ahora cargá tus documentos");await refresh();showTab("docs");$("#cuenta").scrollIntoView({behavior:"smooth"})};
}
$$("[data-agendar]").forEach(b=>b.onclick=()=>reserva());

// ===== Mi cuenta =====
const showTab=t=>{$$("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.t===t));$$(".pane").forEach(p=>p.classList.toggle("on",p.id==="p-"+t))};
$$("[data-docs]").forEach(a=>a.addEventListener("click",()=>showTab("docs")));
$$("#tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.t));
$("#cSalir").onclick=salir;
function cuenta(){
 const ni=$("#navIng");if(ni){ni.textContent=me?"Hola, "+String(me.n).split(" ")[0]:"Ingresar";ni.classList.toggle("pulse",!me)}
 const hi=$("#heroIng");if(hi)hi.hidden=!!me;
 const na=$("#navAuth");na.textContent="Cerrar sesión";na.parentElement.hidden=!me;
 $("#cOut").hidden=!!me;$("#cIn").hidden=!me;
 if(!me)return;
 $("#cAv").textContent=iniciales(me.n);$("#cNom").textContent=me.n;
 $("#cSub").textContent="Paciente"+(me.ci?" · CI "+me.ci:"")+" · "+me.mail;
 const ap=APPTS.filter(a=>a.u===me.uid).sort((a,b)=>(a.f+a.h).localeCompare(b.f+b.h));
 $("#p-agenda").innerHTML=(ap.length?ap.map(a=>{const p=PROS.find(x=>x.id===a.p);if(!p)return"";return `<div class="row"><div><b>${lbl(a.f)} · ${a.h} h</b><br><span class="note">${p.n} · ${p.e}${a.c===2?"<br>Seña "+money(a.s)+" a abonar en la clínica (POS o efectivo)":a.s?"<br>Seña "+money(a.s)+" abonada · "+(a.c?"comprobante enviado":"falta enviar el comprobante"):""}</span></div><button class="btn ghost sm" data-c="${a.p}|${a.f}|${a.h}">Cancelar</button></div>`}).join(""):'<p class="note">Todavía no tenés turnos. Reservá uno desde Profesionales.</p>')+'<a class="btn sm" href="#profesionales">Reservar turno</a>';
 $$("[data-c]").forEach(b=>b.onclick=async()=>{const[p,f,h]=b.dataset.c.split("|");try{await B.delAppt({p:+p,f,h});toast("Turno cancelado")}catch(e){toast(errMsg(e))}await refresh()});
 const dc=DOCSD||{};
 $("#p-docs").innerHTML=banner(dc)+DOCS.map((d,i)=>{const f=dc[i];return `<div class="row"><div><b>${d}</b><br><span class="note">${f?esc(f.name)+" · "+esc(f.date):"JPG, PNG o PDF de hasta 5 MB"}</span></div><div style="display:flex;gap:10px;align-items:center"><span class="st ${f?"y":"r"}">${f?"En revisión":"Pendiente"}</span><span class="btn sm file">${f?"Reemplazar":"Subir"}<input type="file" accept=".jpg,.jpeg,.png,.pdf" data-d="${i}"></span></div></div>`}).join("")+'<p class="note">Secretaría revisa cada archivo en 24 a 48 horas hábiles. Que llegue no significa que esté aprobado.</p>';
 $$("[data-d]").forEach(inp=>inp.onchange=async()=>{const f=inp.files[0];if(!f)return;if(f.size>5*1048576)return toast("El archivo supera los 5 MB");
  DOCSD[inp.dataset.d]={name:f.name,date:new Date().toLocaleDateString("es-UY")};
  try{await B.setDocs(me.uid,DOCSD);toast("Documento enviado ✔")}catch(e){toast(errMsg(e))}cuenta()});
 $("#p-perfil").innerHTML=[["Nombre",me.n],["Cédula",me.ci?"CI "+me.ci:"—"],["Correo",me.mail],["Tipo","Paciente"]].map(r=>`<div class="row"><span class="note">${r[0]}</span><b>${esc(r[1])}</b></div>`).join("")+'<button class="btn ghost sm" id="pEdit">Editar mis datos</button>';
 $("#pEdit").onclick=()=>abrirCompletar();
}
function banner(dc){const n=DOCS.filter((_,i)=>dc[i]).length,ok=n===DOCS.length;return `<div class="alert ${ok?"ok":""}"><b>${ok?"¡Documentación completa! Secretaría la va a revisar.":"Cargá tu documentación para completar la reserva."}</b><div class="bar"><i style="width:${n/DOCS.length*100}%"></i></div><span class="note">${n} de ${DOCS.length} documentos cargados</span></div>`}

// ===== Video instructivo =====
$("#btnVideo").onclick=()=>{$("#vBox").innerHTML=VIDEO_URL?`<iframe src="${VIDEO_URL}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px" allowfullscreen></iframe>`:'<div class="vid">'+["Creá tu cuenta o entrá con Google","Tocá «Agendar cita» y elegí profesional, día y hora","Abonás la seña del 50 %","Mandás el comprobante por WhatsApp","Cargás cédula, constancia del BPS e informe médico"].map((t,i)=>`<div class="vs" style="animation-delay:${i*1.2}s"><span class="num">${i+1}</span> ${t}</div>`).join("")+'</div><p class="note">Acá va el video explicativo de la clínica.</p>';open("#mVideo")};

// ===== Navegación =====
const nav=$("#nav"),bg=$("#burger"),menu=v=>{nav.classList.toggle("open",v);bg.setAttribute("aria-expanded",v)};
bg.onclick=()=>menu(!nav.classList.contains("open"));
$$("#menu a").forEach(a=>a.addEventListener("click",()=>menu(false)));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){menu(false);close()}});
document.addEventListener("click",e=>{if(!nav.contains(e.target))menu(false)});
const lk=$$("#menu a:not(#navAuth)"),sc=lk.map(a=>$(a.getAttribute("href")));
const spy=()=>{const y=scrollY+120;let k=-1;let m=-1;sc.forEach((s,i)=>{if(s&&s.offsetTop<=y&&s.offsetTop>m){m=s.offsetTop;k=i}});lk.forEach((a,i)=>a.classList.toggle("on",i===k));nav.classList.toggle("sc",scrollY>10)};
addEventListener("scroll",spy,{passive:true});spy();
$$("[data-wa]").forEach(e=>e.innerHTML=WAI);

// ===== Arranque =====
pintaPros();cuenta();watch();
READY=(async()=>{
 if(HASFB){try{B=await fbBackend(window.FIREBASE_CONFIG)}catch(e){console.error(e);BERR=(e&&(e.code||e.message))||"error desconocido";toast("No se pudo conectar con Firebase: se usa el modo demo");if($("#mAuth").classList.contains("open"))authView()}}
 B.init(async u=>{me=u;await refresh()});
})();
