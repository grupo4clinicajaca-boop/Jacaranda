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
// Demo sin servidor: los datos se guardan en este navegador (localStorage).
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const S={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const me={n:"Merilin Suárez",ci:"4.123.456-7",mail:"merilin.suarez@ejemplo.com"}; // perfil de ejemplo
const VIDEO_URL=""; // pegá acá el enlace de embed del video (YouTube, Vimeo...)
let sel={},filt="Todas";
const docsOk=()=>{const d=S.get("jac_docs",{})[me.mail]||{};return DOCS.every((_,i)=>d[i])};
const showTab=t=>{$$("#tabs button").forEach(x=>x.classList.toggle("on",x.dataset.t===t));$$(".pane").forEach(p=>p.classList.toggle("on",p.id==="p-"+t))};
$$("[data-docs]").forEach(a=>a.addEventListener("click",()=>showTab("docs")));
const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("show"),2800)};
const open=id=>$(id).classList.add("open"),close=()=>$$(".overlay").forEach(o=>o.classList.remove("open"));
$$("[data-close]").forEach(b=>b.onclick=close);
$$(".overlay").forEach(o=>o.onclick=e=>{if(e.target===o)close()});
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const fechas=p=>{const r=[],t=new Date();for(let i=1;i<=28&&r.length<8;i++){const d=new Date(t);d.setDate(t.getDate()+i);if(p.d.includes(d.getDay()))r.push(d)}return r};
const lbl=s=>{const d=new Date(s+"T12:00");return DN[d.getDay()]+" "+d.getDate()+"/"+(d.getMonth()+1)};
// Fondo animado
for(let i=0;i<16;i++){const p=document.createElement("span");p.className="petal";p.style.cssText=`left:${Math.random()*100}%;--dx:${Math.random()*160-80}px;animation-duration:${9+Math.random()*10}s;animation-delay:${-Math.random()*15}s;opacity:${.25+Math.random()*.5}`;$(".hero").appendChild(p)}
// Aparecer al hacer scroll y contadores
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add("in");const n=$("[data-n]",e.target);if(n&&!n._d){n._d=1;const T=+n.dataset.n;let c=0;const id=setInterval(()=>{c+=Math.max(1,T/40);if(c>=T){c=T;clearInterval(id)}n.textContent=Math.round(c)+(n.dataset.s||"")},30)}io.unobserve(e.target)}),{threshold:.15});
const watch=()=>$$(".rv:not(.in)").forEach(e=>io.observe(e));
// Profesionales
function pintaPros(){
 const esp=["Todas",...new Set(PROS.map(p=>p.e))];
 $("#filtros").innerHTML=esp.map(e=>`<button class="${e===filt?"on":""}">${e}</button>`).join("");
 $$("#filtros button").forEach(b=>b.onclick=()=>{filt=b.textContent;pintaPros()});
 $("#pros").innerHTML=PROS.filter(p=>filt==="Todas"||p.e===filt).map(p=>`<div class="card rv"><div class="avatar">${p.n.split(" ").slice(1).map(x=>x[0]).join("")}</div><h3>${p.n}</h3><p>${p.e}</p><div class="chips">${p.d.map(d=>`<span class="chip">${DN[d]}</span>`).join("")}</div><p class="note">${p.h[0]} a ${p.h[p.h.length-1]} h</p><button class="btn sm" data-b="${p.id}">Ver horarios</button></div>`).join("");
 $$("[data-b]").forEach(b=>b.onclick=()=>reserva(+b.dataset.b));watch();
}
// Reserva
function reserva(id){
 if(!docsOk()){toast("Primero cargá tus documentos para reservar");showTab("docs");location.hash="#cuenta";return}
 const p=PROS.find(x=>x.id===id),ap=S.get("jac_appts",[]);sel={p,f:null,h:null};
 $("#bT").textContent=p.n+" · "+p.e;
 $("#bDias").innerHTML=fechas(p).map(d=>`<button data-f="${iso(d)}">${DN[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}</button>`).join("");
 $("#bHoras").innerHTML='<span class="note">Elegí un día primero</span>';
 $$("#bDias button").forEach(b=>b.onclick=()=>{sel.f=b.dataset.f;sel.h=null;$$("#bDias button").forEach(x=>x.classList.toggle("on",x===b));
  $("#bHoras").innerHTML=p.h.map(h=>`<button data-h="${h}" ${ap.some(a=>a.p===p.id&&a.f===sel.f&&a.h===h)?"disabled":""}>${h}</button>`).join("");
  $$("#bHoras button").forEach(x=>x.onclick=()=>{sel.h=x.dataset.h;$$("#bHoras button").forEach(y=>y.classList.toggle("on",y===x))})});
 open("#mBook");
}
$("#bOk").onclick=()=>{
 if(!sel.f||!sel.h)return toast("Elegí día y hora");
 const ap=S.get("jac_appts",[]);ap.push({u:me.mail,p:sel.p.id,f:sel.f,h:sel.h});S.set("jac_appts",ap);
 close();toast("Turno reservado ✔");cuenta();showTab("agenda");location.hash="#cuenta";
};
// Cuenta
$$("#tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.t));
function cuenta(){
 const ap=S.get("jac_appts",[]).filter(a=>a.u===me.mail).sort((a,b)=>(a.f+a.h).localeCompare(b.f+b.h));
 $("#p-agenda").innerHTML=(ap.length?ap.map(a=>{const p=PROS.find(x=>x.id===a.p);return `<div class="row"><div><b>${lbl(a.f)} · ${a.h} h</b><br><span class="note">${p.n} · ${p.e}</span></div><button class="btn ghost sm" data-c="${a.p}|${a.f}|${a.h}">Cancelar</button></div>`}).join(""):'<p class="note">Todavía no tenés turnos. Reservá uno desde Profesionales.</p>')+'<a class="btn sm" href="#profesionales">Reservar turno</a>';
 $$("[data-c]").forEach(b=>b.onclick=()=>{const[p,f,h]=b.dataset.c.split("|");S.set("jac_appts",S.get("jac_appts",[]).filter(a=>!(a.u===me.mail&&a.p==+p&&a.f===f&&a.h===h)));toast("Turno cancelado");cuenta()});
 const dc=S.get("jac_docs",{})[me.mail]||{};
 $("#p-docs").innerHTML=banner(dc)+DOCS.map((d,i)=>{const f=dc[i];return `<div class="row"><div><b>${d}</b><br><span class="note">${f?f.name+" · "+f.date:"JPG, PNG o PDF de hasta 5 MB"}</span></div><div style="display:flex;gap:10px;align-items:center"><span class="st ${f?"y":"r"}">${f?"En revisión":"Pendiente"}</span><span class="btn sm file">${f?"Reemplazar":"Subir"}<input type="file" accept=".jpg,.jpeg,.png,.pdf" data-d="${i}"></span></div></div>`}).join("")+'<p class="note">Secretaría revisa cada archivo en 24 a 48 horas hábiles. Que llegue no significa que esté aprobado.</p>';
 $$("[data-d]").forEach(inp=>inp.onchange=()=>{const f=inp.files[0];if(!f)return;if(f.size>5*1048576)return toast("El archivo supera los 5 MB");
  const all=S.get("jac_docs",{});all[me.mail]=all[me.mail]||{};all[me.mail][inp.dataset.d]={name:f.name,date:new Date().toLocaleDateString("es-UY")};S.set("jac_docs",all);toast("Documento enviado ✔");cuenta()});
 $("#p-perfil").innerHTML=[["Nombre",me.n],["Cédula","CI "+me.ci],["Correo",me.mail],["Tipo","Paciente"]].map(r=>`<div class="row"><span class="note">${r[0]}</span><b>${r[1]}</b></div>`).join("");
}
function banner(dc){const n=DOCS.filter((_,i)=>dc[i]).length,ok=n===DOCS.length;return `<div class="alert ${ok?"ok":""}"><b>${ok?"¡Listo! Ya podés reservar tu hora.":"Primero, para reservar hora, tenés que cargar tus documentos."}</b><div class="bar"><i style="width:${n/DOCS.length*100}%"></i></div><span class="note">${n} de ${DOCS.length} documentos cargados</span>${ok?' · <a href="#profesionales">Elegir profesional</a>':""}</div>`}
// Video instructivo
$("#btnVideo").onclick=()=>{$("#vBox").innerHTML=VIDEO_URL?`<iframe src="${VIDEO_URL}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px" allowfullscreen></iframe>`:'<div class="vid">'+["Entrá a «Cargar mis documentos»","Subí cédula, constancia del BPS e informe médico","Elegí profesional, día y hora","Confirmá y mirá tu turno en «Mi agenda»"].map((t,i)=>`<div class="vs" style="animation-delay:${i*1.2}s"><span class="num">${i+1}</span> ${t}</div>`).join("")+'</div><p class="note">Acá va el video explicativo de la clínica.</p>';open("#mVideo")};
pintaPros();cuenta();watch();
