import { useState, useMemo } from "react";

const CATEGORIAS = ["primera", "arana", "segunda", "industria"];
const CAT_LABELS = { primera:"Primera", arana:"Araña", segunda:"Segunda", industria:"Industria" };
const CAT_COLORS = { primera:"#a8e06a", arana:"#60c0f0", segunda:"#f0c060", industria:"#c090f0" };
const CAT_BG = { primera:"#1a3a0a", arana:"#0a2a3a", segunda:"#2a2a00", industria:"#1a0a2a" };
const CAT_BORDER = { primera:"#3a7a1a", arana:"#1a5a7a", segunda:"#5a5a00", industria:"#3a1a5a" };
const CALIBRES_CAT = { primera:["N3","N4","N5","N6","N7","N8","N9"], arana:["N5","N6","N7","N8","N9"], segunda:["N5","N6","N7","N8","N9"], industria:["bulk"] };
const CAL_LABEL = { N3:"N°3 (31/40)", N4:"N°4 (41/45)", N5:"N°5 (46/50)", N6:"N°6 (51/55)", N7:"N°7 (56/60)", N8:"N°8 (61/65)", N9:"N°9 (66+)", bulk:"Industria" };
const ADMIN_PASSWORD = "Ajo123";

const initialCargas = [
  { id:4, fecha:"2026-05-09", nroFactura:"FAC-04", proforma:"00002-00000005", cliente:"ALISUL IMPORT E EXPORT LTDA", totalFactura:22356, cobrado:0, pendiente:22356, vencimiento:"2026-06-09", notas:"Chofer: Moreston Jose Hentz | Camión: TRC3A70", preciosCal:{}, cobradoExtra:0, calidad:{ primera:{ N5:40, N7:445, N8:109, N9:580 }, arana:{ N5:133, N6:180, N7:523, N8:40, N9:450 }, segunda:{}, industria:{} } },
  { id:5, fecha:"2026-05-12", nroFactura:"FAC-05", proforma:"00002-00000006", cliente:"ALISUL IMPORT E EXPORT LTDA", totalFactura:21120, cobrado:0, pendiente:21120, vencimiento:"2026-06-12", notas:"Chofer: Michel Moreira Correa | Camión: IRS1J14", preciosCal:{}, cobradoExtra:0, calidad:{ primera:{ N3:28, N4:163, N5:167, N7:170, N8:255, N9:320 }, arana:{ N5:200, N6:100, N7:508, N8:293, N9:296 }, segunda:{}, industria:{} } },
  { id:6, fecha:"2026-05-15", nroFactura:"FAC-06", proforma:"00002-00000007", cliente:"ALISUL IMPORT E EXPORT LTDA", totalFactura:23500, cobrado:0, pendiente:23500, vencimiento:"2026-06-15", notas:"Chofer: Vanderlei Brackmann | Camión: KOJ6831", preciosCal:{}, cobradoExtra:0, calidad:{ primera:{ N6:178, N7:545, N8:165, N9:612 }, arana:{ N7:430, N8:270, N9:300 }, segunda:{}, industria:{} } },
  { id:7, fecha:"2026-05-16", nroFactura:"FAC-07", proforma:"00002-00000008", cliente:"ALISUL IMPORT E EXPORT LTDA", totalFactura:21096, cobrado:0, pendiente:21096, vencimiento:"2026-06-16", notas:"Chofer: Hilario Candido Diel Kleist | Camión: JAS6H94", preciosCal:{}, cobradoExtra:0, calidad:{ primera:{ N3:12, N4:32, N7:161, N8:382, N9:359 }, arana:{ N5:34, N6:255, N7:400, N8:543, N9:122 }, segunda:{ N7:200 }, industria:{} } },
  { id:8, fecha:"2026-05-18", nroFactura:"FAC-08", proforma:"00002-00000009", cliente:"ALISUL IMPORT E EXPORT LTDA", totalFactura:17500, cobrado:0, pendiente:17500, vencimiento:"2026-06-18", notas:"Chofer: Luis Fernando Elhers | Camión: GGT4280", preciosCal:{}, cobradoExtra:0, calidad:{ primera:{}, arana:{ N8:36 }, segunda:{ N5:117, N6:327, N7:563, N8:137, N9:320 }, industria:{ bulk:1000 } } },
  { id:9, fecha:"2026-05-22", nroFactura:"FAC-09", proforma:"00002-00000010", cliente:"ALISUL IMPORT E EXPORT LTDA", totalFactura:25340, cobrado:0, pendiente:25340, vencimiento:"2026-06-22", notas:"Chofer: Franco Tomas Beyer | Camión: ITC1621", preciosCal:{}, cobradoExtra:0, calidad:{ primera:{ N9:1960 }, arana:{ N8:70, N9:38 }, segunda:{}, industria:{ bulk:432 } } },
  { id:10, fecha:"2026-05-23", nroFactura:"FAC-10", proforma:"00002-00000011", cliente:"ALISUL IMPORT E EXPORT LTDA", totalFactura:18940, cobrado:0, pendiente:18940, vencimiento:"2026-06-23", notas:"Chofer: Leandro Kipper | Camión: IZI9F44", preciosCal:{}, cobradoExtra:0, calidad:{ primera:{ N9:330, N7:30 }, arana:{ N7:408, N8:90, N9:180 }, segunda:{ N6:112, N7:515, N8:337, N9:498 }, industria:{} } },
];

function totalCajasCalidad(calidad) { return CATEGORIAS.reduce((s,cat)=>s+Object.values(calidad[cat]||{}).reduce((a,b)=>a+(Number(b)||0),0),0); }
function totalCat(calidad,cat) { return Object.values(calidad[cat]||{}).reduce((a,b)=>a+(Number(b)||0),0); }
function formatUSD(n) { return new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(n||0); }
function diasHastaVence(f) { return Math.ceil((new Date(f)-new Date("2026-05-26"))/(1000*60*60*24)); }

function calibresDeCarga(calidad) {
  const cals = [];
  const seen = new Set();
  CATEGORIAS.forEach(cat => Object.entries(calidad[cat]||{}).forEach(([cal,v]) => { if(Number(v)>0 && !seen.has(cal)){ seen.add(cal); cals.push(cal); } }));
  return cals;
}

function calcularExtra(carga) {
  const precios = carga.preciosCal || {};
  let totalReal = 0;
  CATEGORIAS.forEach(cat => Object.entries(carga.calidad[cat]||{}).forEach(([cal,cajas]) => {
    totalReal += (Number(precios[cal])||0) * Number(cajas);
  }));
  const totalExtra = totalReal > 0 ? Math.max(0, totalReal - carga.totalFactura) : 0;
  const cobradoExtra = Number(carga.cobradoExtra)||0;
  return { totalReal, totalExtra, cobradoExtra, pendienteExtra: Math.max(0, totalExtra - cobradoExtra) };
}

const ls={display:"flex",flexDirection:"column",gap:4,color:"#7aaa55",fontSize:10,fontFamily:"monospace",letterSpacing:0.5};
const is={background:"#0f1a0f",border:"1px solid #2d4f1e",borderRadius:6,color:"#d4f09a",padding:"6px 8px",fontSize:12,fontFamily:"monospace",outline:"none",width:"100%",boxSizing:"border-box"};
const bs={border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer"};

// ── MODAL PRECIOS ─────────────────────────────────────────────
function ModalPrecios({carga, onClose, onSave}){
  const calibres = calibresDeCarga(carga.calidad);
  const [precios, setPrecios] = useState({...carga.preciosCal});
  
  // calcular total en tiempo real
  let totalReal = 0;
  calibres.forEach(cal => {
    const precio = Number(precios[cal]||0);
    CATEGORIAS.forEach(cat => { totalReal += precio * Number(carga.calidad[cat]?.[cal]||0); });
  });
  const totalExtra = Math.max(0, totalReal - carga.totalFactura);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(5,12,5,0.92)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0a150a",border:"1.5px solid #5a4a00",borderRadius:16,padding:"24px 18px",width:"100%",maxWidth:420,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 8px 48px rgba(0,0,0,0.9)"}}>
        <h2 style={{color:"#f0d060",fontFamily:"'Playfair Display',serif",fontSize:18,margin:"0 0 4px"}}>💵 Precio real por caja</h2>
        <p style={{color:"#8a7a20",fontSize:11,fontFamily:"monospace",margin:"0 0 20px"}}>{carga.nroFactura} · Facturado: {formatUSD(carga.totalFactura)}</p>

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          {calibres.map(cal => {
            // contar cajas de este calibre
            let cajas = 0;
            CATEGORIAS.forEach(cat => { cajas += Number(carga.calidad[cat]?.[cal]||0); });
            const subtotal = (Number(precios[cal])||0) * cajas;
            return(
              <div key={cal} style={{background:"#1a1500",border:"1px solid #4a3a00",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{color:"#f0d060",fontSize:12,fontFamily:"monospace",fontWeight:700}}>{CAL_LABEL[cal]}</div>
                  <div style={{color:"#7a6a20",fontSize:10,fontFamily:"monospace"}}>{cajas.toLocaleString()} cajas</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:"#8a7a20",fontSize:11,fontFamily:"monospace"}}>$</span>
                  <input
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={precios[cal]||""}
                    onChange={e=>setPrecios(p=>({...p,[cal]:e.target.value}))}
                    style={{...is,width:80,borderColor:"#5a4a00"}}
                  />
                </div>
                {subtotal>0&&<div style={{color:"#f0c040",fontSize:11,fontFamily:"monospace",minWidth:70,textAlign:"right"}}>{formatUSD(subtotal)}</div>}
              </div>
            );
          })}
        </div>

        {/* Resumen */}
        <div style={{background:"#1a1500",border:"1px solid #5a4a00",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
            {[["Total real",formatUSD(totalReal)],["Facturado",formatUSD(carga.totalFactura)],["Extra efectivo",formatUSD(totalExtra)]].map(([l,v])=>(
              <div key={l}>
                <div style={{color:"#7a6a20",fontSize:9,fontFamily:"monospace",textTransform:"uppercase"}}>{l}</div>
                <div style={{color:"#f0d060",fontWeight:700,fontFamily:"monospace",fontSize:13}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{...bs,background:"#1c2e1c",color:"#7aaa55",flex:1}}>Cancelar</button>
          <button onClick={()=>{onSave(precios);onClose();}} style={{...bs,background:"#8a6a00",color:"#fff",flex:2}}>Guardar precios</button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL CARGA ───────────────────────────────────────────────
function Modal({onClose,onSave,editData}){
  const blank={primera:{},arana:{},segunda:{},industria:{}};
  const [form,setForm]=useState(editData||{fecha:new Date().toISOString().split("T")[0],nroFactura:"",proforma:"",cliente:"ALISUL IMPORT E EXPORT LTDA",totalFactura:"",cobrado:"",notas:"",calidad:blank,preciosCal:{},cobradoExtra:0});
  function setCal(cat,cal,val){setForm(f=>({...f,calidad:{...f.calidad,[cat]:{...f.calidad[cat],[cal]:val}}}));}
  const totalCajas=totalCajasCalidad(form.calidad);
  const pendiente=(Number(form.totalFactura)||0)-(Number(form.cobrado)||0);
  function handleSubmit(){
    if(!form.fecha||!form.nroFactura){alert("Completá Fecha y N° Factura.");return;}
    const d=new Date(form.fecha);d.setDate(d.getDate()+30);
    onSave({...form,totalCajas,totalFactura:Number(form.totalFactura),cobrado:Number(form.cobrado)||0,pendiente,cobradoExtra:Number(form.cobradoExtra)||0,vencimiento:editData?.vencimiento||d.toISOString().split("T")[0],id:editData?.id||Date.now()});
    onClose();
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(5,12,5,0.88)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div style={{background:"#0a150a",border:"1.5px solid #3a6b2a",borderRadius:16,padding:"24px 18px",width:"100%",maxWidth:500,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 8px 48px rgba(0,0,0,0.8)"}}>
        <h2 style={{color:"#a8e06a",fontFamily:"'Playfair Display',serif",fontSize:19,margin:"0 0 18px"}}>{editData?"✏️ Editar":"➕ Nueva"} carga</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <label style={ls}>Fecha<input type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))} style={is}/></label>
          <label style={ls}>N° Factura<input value={form.nroFactura} onChange={e=>setForm(f=>({...f,nroFactura:e.target.value}))} style={is} placeholder="FAC-11"/></label>
          <label style={{...ls,gridColumn:"span 2"}}>Cliente<input value={form.cliente} onChange={e=>setForm(f=>({...f,cliente:e.target.value}))} style={is}/></label>
          <label style={{...ls,gridColumn:"span 2"}}>Proforma N°<input value={form.proforma} onChange={e=>setForm(f=>({...f,proforma:e.target.value}))} style={is}/></label>
        </div>
        {CATEGORIAS.map(cat=>(
          <div key={cat} style={{background:CAT_BG[cat],border:`1px solid ${CAT_BORDER[cat]}`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
            <p style={{color:CAT_COLORS[cat],fontSize:11,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,margin:"0 0 8px",fontWeight:700}}>{CAT_LABELS[cat]} — {totalCat(form.calidad,cat)} cajas</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {CALIBRES_CAT[cat].map(cal=>(<label key={cal} style={ls}>{CAL_LABEL[cal]}<input type="number" min="0" placeholder="0" value={form.calidad[cat]?.[cal]||""} onChange={e=>setCal(cat,cal,e.target.value)} style={is}/></label>))}
            </div>
          </div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"12px 0"}}>
          <label style={ls}>Total Factura USD<input type="number" value={form.totalFactura} onChange={e=>setForm(f=>({...f,totalFactura:e.target.value}))} style={is}/></label>
          <label style={ls}>Cobrado factura USD<input type="number" value={form.cobrado} onChange={e=>setForm(f=>({...f,cobrado:e.target.value}))} style={is}/></label>
        </div>
        <div style={{background:"#162216",border:"1px solid #2a4a1a",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-around"}}>
          {[["Total cajas",totalCajas],["Facturado",formatUSD(Number(form.totalFactura))],["Pendiente",formatUSD(pendiente)]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{color:"#4a7a30",fontSize:9,textTransform:"uppercase",letterSpacing:0.5,fontFamily:"monospace"}}>{l}</div><div style={{color:"#d4f09a",fontWeight:700,fontFamily:"monospace",fontSize:13}}>{v}</div></div>
          ))}
        </div>
        <label style={ls}>Notas<textarea value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))} rows={2} style={{...is,resize:"vertical"}}/></label>
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button onClick={onClose} style={{...bs,background:"#1c2e1c",color:"#7aaa55",flex:1}}>Cancelar</button>
          <button onClick={handleSubmit} style={{...bs,background:"#4a9a2a",color:"#fff",flex:2}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ── MODAL CONTRASEÑA ──────────────────────────────────────────
function ModalPassword({onSuccess,onClose}){
  const [pwd,setPwd]=useState("");
  const [error,setError]=useState(false);
  function handleCheck(){ if(pwd===ADMIN_PASSWORD){ onSuccess(); onClose(); } else{ setError(true); setPwd(""); } }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(5,12,5,0.92)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0a150a",border:"1.5px solid #3a6b2a",borderRadius:16,padding:"28px 24px",width:"100%",maxWidth:320,boxShadow:"0 8px 48px rgba(0,0,0,0.9)",textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:12}}>🔑</div>
        <h2 style={{color:"#a8e06a",fontFamily:"'Playfair Display',serif",fontSize:17,margin:"0 0 6px"}}>Modo administrador</h2>
        <p style={{color:"#5a8a3a",fontSize:11,fontFamily:"monospace",marginBottom:20}}>Ingresá la contraseña para editar</p>
        <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setError(false);}} onKeyDown={e=>e.key==="Enter"&&handleCheck()} placeholder="Contraseña" autoFocus style={{...is,marginBottom:8,textAlign:"center",fontSize:15,letterSpacing:2}}/>
        {error&&<div style={{color:"#f07050",fontSize:11,fontFamily:"monospace",marginBottom:8}}>Contraseña incorrecta</div>}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={onClose} style={{...bs,background:"#1c2e1c",color:"#7aaa55",flex:1,padding:"9px 0"}}>Cancelar</button>
          <button onClick={handleCheck} style={{...bs,background:"#4a9a2a",color:"#fff",flex:2,padding:"9px 0"}}>Ingresar</button>
        </div>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────
export default function App(){
  const [cargas,setCargas]=useState(initialCargas);
  const [showModal,setShowModal]=useState(false);
  const [editData,setEditData]=useState(null);
  const [filtro,setFiltro]=useState("todas");
  const [expandido,setExpandido]=useState(null);
  const [vistaReporte,setVistaReporte]=useState(false);
  const [isAdmin,setIsAdmin]=useState(false);
  const [showPasswordModal,setShowPasswordModal]=useState(false);
  const [pendingAction,setPendingAction]=useState(null);
  const [modalPrecios,setModalPrecios]=useState(null); // carga seleccionada para precios

  function requireAdmin(action){ if(isAdmin){ action(); } else{ setPendingAction(()=>action); setShowPasswordModal(true); } }

  const totals=useMemo(()=>{
    const totalExtraTotal=cargas.reduce((s,c)=>s+calcularExtra(c).totalExtra,0);
    const cobradoExtraTotal=cargas.reduce((s,c)=>s+(Number(c.cobradoExtra)||0),0);
    return {
      cargas:cargas.length,
      cajas:cargas.reduce((s,c)=>s+(totalCajasCalidad(c.calidad)||0),0),
      facturado:cargas.reduce((s,c)=>s+(c.totalFactura||0),0),
      cobrado:cargas.reduce((s,c)=>s+(Number(c.cobrado)||0),0),
      pendiente:cargas.reduce((s,c)=>s+(c.pendiente||0),0),
      totalExtra:totalExtraTotal,
      cobradoExtra:cobradoExtraTotal,
      pendienteExtra:totalExtraTotal-cobradoExtraTotal,
      vencidas:cargas.filter(c=>c.pendiente>0&&diasHastaVence(c.vencimiento)<0).length,
      porCat:CATEGORIAS.reduce((acc,cat)=>{ acc[cat]=cargas.reduce((s,c)=>s+totalCat(c.calidad,cat),0); return acc; },{}),
    };
  },[cargas]);

  const lista=useMemo(()=>{
    if(filtro==="vencidas") return cargas.filter(c=>c.pendiente>0&&diasHastaVence(c.vencimiento)<0);
    if(filtro==="pendientes") return cargas.filter(c=>c.pendiente>0.01);
    if(filtro==="cobradas") return cargas.filter(c=>c.pendiente<=0.01);
    return cargas;
  },[cargas,filtro]);

  function handleSave(d){ if(d.id&&cargas.find(c=>c.id===d.id)) setCargas(p=>p.map(c=>c.id===d.id?d:c)); else setCargas(p=>[d,...p]); }
  function handleDelete(id){ if(confirm("¿Eliminar esta carga?")) setCargas(p=>p.filter(c=>c.id!==id)); }
  function handlePago(carga){
    const m=prompt(`¿Cuánto USD cobraste (factura) para ${carga.nroFactura}?\nPendiente: ${formatUSD(carga.pendiente)}`);
    if(!m||isNaN(m))return;
    const nc=(Number(carga.cobrado)||0)+Number(m);
    setCargas(p=>p.map(c=>c.id===carga.id?{...c,cobrado:nc,pendiente:c.totalFactura-nc}:c));
  }
  function handlePagoExtra(carga){
    const ex=calcularExtra(carga);
    const m=prompt(`¿Cuánto USD cobrado en efectivo para ${carga.nroFactura}?\nPendiente extra: ${formatUSD(ex.pendienteExtra)}`);
    if(!m||isNaN(m))return;
    const nc=(Number(carga.cobradoExtra)||0)+Number(m);
    setCargas(p=>p.map(c=>c.id===carga.id?{...c,cobradoExtra:nc}:c));
  }
  function handleGuardarPrecios(cargaId, precios){
    setCargas(p=>p.map(c=>c.id===cargaId?{...c,preciosCal:precios}:c));
  }

  // ── VISTA REPORTE ──────────────────────────────────────────
  if(vistaReporte){
    const totFact=cargas.reduce((s,c)=>s+c.totalFactura,0);
    const totPend=cargas.reduce((s,c)=>s+c.pendiente,0);
    const totCajas=cargas.reduce((s,c)=>s+totalCajasCalidad(c.calidad),0);
    const catTotals=CATEGORIAS.reduce((acc,cat)=>{ acc[cat]=cargas.reduce((s,c)=>s+totalCat(c.calidad,cat),0); return acc; },{});
    const totExtra=cargas.reduce((s,c)=>s+calcularExtra(c).totalExtra,0);
    const totPendExtra=cargas.reduce((s,c)=>s+calcularExtra(c).pendienteExtra,0);
    return(
      <div style={{background:"#fff",minHeight:"100vh",fontFamily:"'DM Sans',sans-serif",color:"#222",padding:"28px 24px",maxWidth:900,margin:"0 auto"}}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap" rel="stylesheet"/>
        <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
          <button onClick={()=>setVistaReporte(false)} style={{background:"#f0f0f0",border:"1px solid #ddd",borderRadius:8,padding:"8px 16px",fontSize:12,cursor:"pointer",fontWeight:600}}>← Volver</button>
          <button onClick={()=>window.print()} style={{background:"#1a4a08",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:12,fontWeight:700,cursor:"pointer"}}>🖨️ Imprimir / PDF</button>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,borderBottom:"2px solid #1a4a08",paddingBottom:16}}>
          <div>
            <div style={{fontSize:26,fontWeight:900,color:"#1a4a08"}}>🧄 Altos States</div>
            <div style={{color:"#888",fontSize:12,marginTop:4}}>Exportaciones de Ajo → ALISUL IMPORT E EXPORT LTDA · Brasil</div>
            <div style={{color:"#aaa",fontSize:11,marginTop:2}}>Reporte: 26/05/2026 · Condición de pago: 30 días</div>
          </div>
          <div style={{textAlign:"right",color:"#aaa",fontSize:11}}>CUIT: 30718904435</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
          {[{l:"Cargas",v:cargas.length},{l:"Total Cajas",v:totCajas.toLocaleString()},{l:"Facturado",v:formatUSD(totFact)}].map(({l,v})=>(
            <div key={l} style={{background:"#f8fdf5",border:"1px solid #c8e8a0",borderRadius:10,padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:800,color:"#1a4a08"}}>{v}</div>
              <div style={{fontSize:10,color:"#888",marginTop:3,textTransform:"uppercase"}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
          {[{l:"Pendiente factura",v:formatUSD(totPend),warn:true},{l:"Total extra efectivo",v:formatUSD(totExtra),gold:true},{l:"Pendiente efectivo",v:formatUSD(totPendExtra),warn:true}].map(({l,v,warn,gold})=>(
            <div key={l} style={{background:warn?"#fff8ee":gold?"#fffbe8":"#f8fdf5",border:`1px solid ${warn?"#e0b040":gold?"#c0a000":"#c8e8a0"}`,borderRadius:10,padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:15,fontWeight:800,color:warn?"#c06000":gold?"#806000":"#1a4a08"}}>{v}</div>
              <div style={{fontSize:10,color:"#888",marginTop:3,textTransform:"uppercase"}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Resumen por calidad</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {[{cat:"primera",bg:"#f0fff0",bc:"#8acc5a",tc:"#2a6a10"},{cat:"arana",bg:"#f0f8ff",bc:"#60a0d0",tc:"#1a5090"},{cat:"segunda",bg:"#fffdf0",bc:"#c0a030",tc:"#705000"},{cat:"industria",bg:"#fdf0ff",bc:"#a060c0",tc:"#502080"}].map(({cat,bg,bc,tc})=>(
              <div key={cat} style={{background:bg,border:`1px solid ${bc}`,borderRadius:8,padding:"10px",textAlign:"center"}}>
                <div style={{fontSize:10,fontWeight:700,color:tc,textTransform:"uppercase"}}>{CAT_LABELS[cat]}</div>
                <div style={{fontSize:18,fontWeight:800,color:tc,marginTop:4}}>{catTotals[cat].toLocaleString()}</div>
                <div style={{fontSize:10,color:"#888",marginTop:2}}>{totCajas?Math.round(catTotals[cat]/totCajas*100):0}%</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Detalle de cargas</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:"#1a4a08",color:"#fff"}}>
              <th style={{padding:"9px 8px",fontSize:11,textAlign:"left",fontWeight:600}}>Factura</th>
              <th style={{padding:"9px 8px",fontSize:11,textAlign:"left",fontWeight:600}}>Cajas por calidad</th>
              <th style={{padding:"9px 8px",fontSize:11,textAlign:"right",fontWeight:600}}>Factura USD</th>
              <th style={{padding:"9px 8px",fontSize:11,textAlign:"right",fontWeight:600}}>Extra efectivo</th>
            </tr>
          </thead>
          <tbody>
            {cargas.map((c,i)=>{
              const dias=diasHastaVence(c.vencimiento);
              const vencida=c.pendiente>0.01&&dias<0;
              const estadoColor=c.pendiente<=0.01?"#2a7a2a":vencida?"#c03000":"#7a7000";
              const estadoTxt=c.pendiente<=0.01?"✓ COBRADA":vencida?`⚠ VENCIDA (${Math.abs(dias)}d)`:`⏳ Vence en ${dias}d`;
              const ex=calcularExtra(c);
              return(
                <tr key={c.id} style={{background:i%2===0?"#fff":"#fafff8",verticalAlign:"top"}}>
                  <td style={{padding:"10px 8px",borderBottom:"1px solid #eee"}}>
                    <div style={{fontWeight:700,color:"#1a4a08",fontSize:13}}>{c.nroFactura}</div>
                    <div style={{color:"#888",fontSize:10,marginTop:2}}>{c.fecha}</div>
                    <div style={{color:"#aaa",fontSize:10}}>Vence: {c.vencimiento}</div>
                  </td>
                  <td style={{padding:"10px 8px",borderBottom:"1px solid #eee",fontSize:11}}>
                    {CATEGORIAS.map(cat=>{ const items=Object.entries(c.calidad[cat]||{}).filter(([,v])=>Number(v)>0); if(!items.length)return null; return(<div key={cat} style={{marginBottom:3}}><span style={{fontWeight:700,color:"#444"}}>{CAT_LABELS[cat]}: </span>{items.map(([cal,v])=>`${CAL_LABEL[cal]}: ${Number(v).toLocaleString()}`).join(" · ")}</div>); })}
                    <div style={{marginTop:4,fontWeight:700,color:"#333"}}>Total: {totalCajasCalidad(c.calidad).toLocaleString()} cajas</div>
                    {Object.keys(c.preciosCal||{}).length>0&&<div style={{marginTop:3,color:"#666",fontSize:10}}>Precios: {Object.entries(c.preciosCal).filter(([,v])=>Number(v)>0).map(([cal,v])=>`${CAL_LABEL[cal]}: $${v}`).join(" · ")}</div>}
                  </td>
                  <td style={{padding:"10px 8px",borderBottom:"1px solid #eee",textAlign:"right"}}>
                    <div style={{fontWeight:700,color:"#1a4a08",fontSize:13}}>{formatUSD(c.totalFactura)}</div>
                    <div style={{color:"#2a8a2a",fontSize:11}}>Cobrado: {formatUSD(Number(c.cobrado))}</div>
                    <div style={{color:"#c05000",fontSize:11}}>Pendiente: {formatUSD(c.pendiente)}</div>
                    <div style={{marginTop:4,fontWeight:700,fontSize:10,color:estadoColor}}>{estadoTxt}</div>
                  </td>
                  <td style={{padding:"10px 8px",borderBottom:"1px solid #eee",textAlign:"right"}}>
                    {ex.totalExtra>0?(<>
                      <div style={{fontWeight:700,color:"#806000",fontSize:13}}>{formatUSD(ex.totalExtra)}</div>
                      <div style={{color:"#2a8a2a",fontSize:11}}>Cobrado: {formatUSD(ex.cobradoExtra)}</div>
                      <div style={{color:"#c05000",fontSize:11}}>Pendiente: {formatUSD(ex.pendienteExtra)}</div>
                    </>):<div style={{color:"#ccc",fontSize:10}}>—</div>}
                  </td>
                </tr>
              );
            })}
            <tr style={{background:"#f0f8e8",fontWeight:700,borderTop:"2px solid #3a7a18"}}>
              <td style={{padding:"10px 8px",fontSize:13}}>TOTAL</td>
              <td style={{padding:"10px 8px",fontSize:13}}>{totCajas.toLocaleString()} cajas</td>
              <td style={{padding:"10px 8px",textAlign:"right",fontSize:13}}>
                <div style={{color:"#1a4a08"}}>{formatUSD(totFact)}</div>
                <div style={{color:"#c05000",fontSize:11}}>Pendiente: {formatUSD(totPend)}</div>
              </td>
              <td style={{padding:"10px 8px",textAlign:"right",fontSize:13}}>
                <div style={{color:"#806000"}}>{formatUSD(totExtra)}</div>
                <div style={{color:"#c05000",fontSize:11}}>Pendiente: {formatUSD(totPendExtra)}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{marginTop:24,color:"#ccc",fontSize:10,textAlign:"center",borderTop:"1px solid #eee",paddingTop:12}}>Altos States · Exportaciones de Ajo · 26/05/2026</div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:"#080f08",fontFamily:"'DM Sans',sans-serif",color:"#c8e8a0"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700&family=DM+Mono&display=swap" rel="stylesheet"/>
      <div style={{background:"linear-gradient(135deg,#0d1f0d,#152b10)",borderBottom:"1px solid #2a4a1a",padding:"20px 18px 16px"}}>
        <div style={{maxWidth:860,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#a8e06a",margin:0}}>🧄 Altos States</h1>
            <p style={{color:"#5a8a3a",fontSize:11,margin:"3px 0 0",fontFamily:"monospace"}}>Exportaciones → ALISUL Brasil · USD · Pago 30 días</p>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {isAdmin&&<span style={{fontSize:10,fontFamily:"monospace",color:"#a8e06a",background:"#1a3a0a",border:"1px solid #3a7a1a",borderRadius:6,padding:"3px 10px"}}>🔑 Admin</span>}
            <button onClick={()=>setVistaReporte(v=>!v)} style={{background:"#1a3a6a",color:"#80c0ff",border:"1px solid #2a5aaa",borderRadius:10,padding:"9px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>📄 Reporte</button>
            <button onClick={()=>requireAdmin(()=>{setEditData(null);setShowModal(true);})} style={{background:"#4a9a2a",color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Nueva carga</button>
            {isAdmin
              ?<button onClick={()=>setIsAdmin(false)} style={{background:"#1a1010",border:"1px solid #4a2020",color:"#aa7a7a",borderRadius:10,padding:"9px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Cerrar sesión</button>
              :<button onClick={()=>setShowPasswordModal(true)} style={{background:"#0f1a0f",border:"1px solid #2a4a1a",color:"#5a8a3a",borderRadius:10,padding:"9px 12px",fontSize:11,cursor:"pointer"}}>🔑</button>
            }
          </div>
        </div>
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"18px 12px"}}>
        {totals.vencidas>0&&(
          <div style={{background:"#2a1500",border:"1px solid #8a4a00",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>🔴</span>
            <div>
              <div style={{color:"#f0a030",fontWeight:700,fontSize:13}}>¡{totals.vencidas} factura{totals.vencidas>1?"s":""} vencida{totals.vencidas>1?"s":""}!</div>
              <div style={{color:"#a07020",fontSize:11,marginTop:1}}>Ya pasaron los 30 días. Contactá a ALISUL para gestionar el cobro.</div>
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8,marginBottom:10}}>
          {[{label:"Cargas",value:totals.cargas,icon:"🚛"},{label:"Total cajas",value:totals.cajas.toLocaleString(),icon:"📦"},{label:"Facturado",value:formatUSD(totals.facturado),icon:"🧾"},{label:"Cobrado",value:formatUSD(totals.cobrado),icon:"✅"},{label:"Pend. factura",value:formatUSD(totals.pendiente),icon:"⏳",warn:true}].map(({label,value,icon,warn})=>(
            <div key={label} style={{background:warn?"linear-gradient(135deg,#2a1a0a,#3a2a0a)":"#0f1a0f",border:`1px solid ${warn?"#7a5a1a":"#2a4a1a"}`,borderRadius:11,padding:"12px 10px"}}>
              <div style={{fontSize:16,marginBottom:4}}>{icon}</div>
              <div style={{color:warn?"#f0c060":"#a8e06a",fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{value}</div>
              <div style={{color:"#4a7a30",fontSize:9,marginTop:2,letterSpacing:0.5}}>{label}</div>
            </div>
          ))}
        </div>

        {totals.totalExtra>0&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
            {[{label:"Total extra efectivo",value:formatUSD(totals.totalExtra),icon:"💵"},{label:"Cobrado efectivo",value:formatUSD(totals.cobradoExtra),icon:"✅"},{label:"Pend. efectivo",value:formatUSD(totals.pendienteExtra),icon:"⏳",warn:true}].map(({label,value,icon,warn})=>(
              <div key={label} style={{background:warn?"linear-gradient(135deg,#2a1a00,#3a2a00)":"#0f1500",border:`1px solid ${warn?"#7a5a00":"#4a4000"}`,borderRadius:11,padding:"12px 10px"}}>
                <div style={{fontSize:16,marginBottom:4}}>{icon}</div>
                <div style={{color:warn?"#f0c060":"#f0d060",fontSize:13,fontWeight:700,fontFamily:"monospace"}}>{value}</div>
                <div style={{color:"#7a6a20",fontSize:9,marginTop:2,letterSpacing:0.5}}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{background:"#0f1a0f",border:"1px solid #2a4a1a",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
          <p style={{color:"#5a8a3a",fontSize:10,textTransform:"uppercase",letterSpacing:1,margin:"0 0 10px",fontFamily:"monospace"}}>Total cajas por calidad</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {CATEGORIAS.map(cat=>(
              <div key={cat} style={{background:CAT_BG[cat],border:`1px solid ${CAT_BORDER[cat]}`,borderRadius:9,padding:"10px 8px",textAlign:"center"}}>
                <div style={{color:CAT_COLORS[cat],fontSize:10,fontFamily:"monospace",fontWeight:700,letterSpacing:0.5}}>{CAT_LABELS[cat]}</div>
                <div style={{color:"#d4f09a",fontWeight:700,fontFamily:"monospace",fontSize:16,marginTop:4}}>{totals.porCat[cat].toLocaleString()}</div>
                <div style={{color:"#4a7a30",fontSize:9,marginTop:2}}>{totals.cajas>0?Math.round(totals.porCat[cat]/totals.cajas*100):0}%</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {[["todas","Todas"],["vencidas","🔴 Vencidas"],["pendientes","⏳ Pendientes"],["cobradas","✅ Cobradas"]].map(([val,label])=>(
            <button key={val} onClick={()=>setFiltro(val)} style={{background:filtro===val?"#3a6b2a":"#0f1a0f",border:`1px solid ${filtro===val?"#5aaa3a":"#2a4a1a"}`,color:filtro===val?"#d4f09a":"#5a8a3a",borderRadius:7,padding:"5px 11px",fontSize:11,cursor:"pointer",fontFamily:"monospace",fontWeight:filtro===val?700:400}}>{label}</button>
          ))}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {lista.map(carga=>{
            const dias=diasHastaVence(carga.vencimiento);
            const vencida=carga.pendiente>0.01&&dias<0;
            const abierta=expandido===carga.id;
            const ex=calcularExtra(carga);
            const tienePrecio=Object.values(carga.preciosCal||{}).some(v=>Number(v)>0);
            return(
              <div key={carga.id} style={{background:"#0f1a0f",border:`1px solid ${vencida?"#6a3a00":carga.pendiente<=0.01?"#1e3a14":"#1e3014"}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"13px 15px",cursor:"pointer"}} onClick={()=>setExpandido(abierta?null:carga.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"monospace",color:"#a8e06a",fontWeight:700,fontSize:14}}>{carga.nroFactura}</span>
                        <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontFamily:"monospace",background:vencida?"#3a1500":carga.pendiente<=0.01?"#1a3a1a":"#1a2a0a",color:vencida?"#f07020":carga.pendiente<=0.01?"#5aaa3a":"#80cc40"}}>
                          {carga.pendiente<=0.01?"✓ Cobrada":vencida?`🔴 Vencida hace ${Math.abs(dias)}d`:`⏳ Vence en ${dias}d`}
                        </span>
                        {tienePrecio&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:20,fontFamily:"monospace",background:"#1a1500",color:"#f0d060"}}>💵 con precio</span>}
                      </div>
                      <div style={{color:"#4a7a30",fontSize:11,fontFamily:"monospace",marginTop:3}}>{carga.fecha} · {totalCajasCalidad(carga.calidad).toLocaleString()} cajas</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{color:"#a8e06a",fontFamily:"monospace",fontWeight:700,fontSize:14}}>{formatUSD(carga.totalFactura)}</div>
                      {carga.pendiente>0.01&&<div style={{color:"#f0b030",fontFamily:"monospace",fontSize:11}}>Pend: {formatUSD(carga.pendiente)}</div>}
                      {ex.totalExtra>0&&<div style={{color:"#f0d060",fontFamily:"monospace",fontSize:11}}>💵 Extra: {formatUSD(ex.totalExtra)}</div>}
                      {ex.pendienteExtra>0&&<div style={{color:"#c0a000",fontFamily:"monospace",fontSize:10}}>Pend. ef: {formatUSD(ex.pendienteExtra)}</div>}
                      <div style={{color:"#3a6a20",fontSize:10,marginTop:2}}>{abierta?"▲ cerrar":"▼ ver detalle"}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                    {CATEGORIAS.map(cat=>{ const t=totalCat(carga.calidad,cat); if(!t)return null; return(<div key={cat} style={{background:CAT_BG[cat],border:`1px solid ${CAT_BORDER[cat]}`,borderRadius:6,padding:"3px 9px",display:"flex",gap:6,alignItems:"center"}}><span style={{color:CAT_COLORS[cat],fontSize:10,fontFamily:"monospace",fontWeight:700}}>{CAT_LABELS[cat]}</span><span style={{color:"#d4f09a",fontSize:11,fontFamily:"monospace"}}>{t.toLocaleString()}</span></div>); })}
                  </div>
                </div>

                {abierta&&(
                  <div style={{borderTop:"1px solid #1e3a14",padding:"14px 15px",background:"#080f08"}}>
                    {CATEGORIAS.map(cat=>{ const items=Object.entries(carga.calidad[cat]||{}).filter(([,v])=>Number(v)>0); if(!items.length)return null; return(
                      <div key={cat} style={{marginBottom:14}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                          <span style={{color:CAT_COLORS[cat],fontFamily:"monospace",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:1}}>{CAT_LABELS[cat]}</span>
                          <span style={{color:"#4a7a30",fontFamily:"monospace",fontSize:10}}>— {totalCat(carga.calidad,cat).toLocaleString()} cajas</span>
                        </div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                          {items.map(([cal,v])=>{
                            const precio=Number(carga.preciosCal?.[cal]||0);
                            return(
                              <div key={cal} style={{background:CAT_BG[cat],border:`1px solid ${CAT_BORDER[cat]}`,borderRadius:7,padding:"5px 10px",textAlign:"center"}}>
                                <div style={{color:CAT_COLORS[cat],fontSize:9,fontFamily:"monospace"}}>{CAL_LABEL[cal]}</div>
                                <div style={{color:"#d4f09a",fontWeight:700,fontFamily:"monospace",fontSize:13}}>{Number(v).toLocaleString()}</div>
                                {precio>0&&<div style={{color:"#f0d060",fontSize:9,fontFamily:"monospace",marginTop:2}}>${precio}/caja</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ); })}

                    {ex.totalExtra>0&&(
                      <div style={{background:"#1a1500",border:"1px solid #5a4a00",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
                        <div style={{color:"#f0d060",fontSize:10,fontFamily:"monospace",fontWeight:700,textTransform:"uppercase",marginBottom:6}}>💵 Extra en efectivo</div>
                        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                          {[["Total extra",formatUSD(ex.totalExtra)],["Cobrado",formatUSD(ex.cobradoExtra)],["Pendiente",formatUSD(ex.pendienteExtra)]].map(([l,v])=>(
                            <div key={l}><div style={{color:"#8a7a20",fontSize:9,fontFamily:"monospace"}}>{l}</div><div style={{color:"#f0d060",fontWeight:700,fontFamily:"monospace",fontSize:13}}>{v}</div></div>
                          ))}
                        </div>
                      </div>
                    )}

                    {carga.notas&&<div style={{color:"#4a7a30",fontSize:11,fontStyle:"italic",fontFamily:"monospace",marginBottom:12}}>📝 {carga.notas}</div>}

                    {isAdmin&&(
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        {carga.pendiente>0.01&&<button onClick={()=>handlePago(carga)} style={{background:"#1e3a0a",border:"1px solid #4a8a2a",color:"#8acc5a",borderRadius:7,padding:"6px 12px",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>💰 Cobro factura</button>}
                        <button onClick={()=>requireAdmin(()=>setModalPrecios(carga))} style={{background:"#1a1500",border:"1px solid #8a6a00",color:"#f0c040",borderRadius:7,padding:"6px 12px",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>💵 {tienePrecio?"Editar precios":"Cargar precios"}</button>
                        {ex.pendienteExtra>0&&<button onClick={()=>handlePagoExtra(carga)} style={{background:"#1a1200",border:"1px solid #6a5000",color:"#d0a000",borderRadius:7,padding:"6px 12px",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>✅ Cobro efectivo</button>}
                        <button onClick={()=>{setEditData(carga);setShowModal(true);}} style={{background:"#1a2a1a",border:"1px solid #2a4a1a",color:"#6aaa4a",borderRadius:7,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>✏️ Editar</button>
                        <button onClick={()=>handleDelete(carga.id)} style={{background:"#1a1010",border:"1px solid #4a2020",color:"#aa5a5a",borderRadius:7,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>🗑️ Eliminar</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showPasswordModal&&(
        <ModalPassword
          onSuccess={()=>{ setIsAdmin(true); if(pendingAction){ pendingAction(); setPendingAction(null); } }}
          onClose={()=>{ setShowPasswordModal(false); setPendingAction(null); }}
        />
      )}
      {showModal&&isAdmin&&<Modal editData={editData} onClose={()=>{setShowModal(false);setEditData(null);}} onSave={handleSave}/>}
      {modalPrecios&&isAdmin&&(
        <ModalPrecios
          carga={modalPrecios}
          onClose={()=>setModalPrecios(null)}
          onSave={(precios)=>handleGuardarPrecios(modalPrecios.id, precios)}
        />
      )}
    </div>
  );
}
