import { useState, useMemo } from "react";

const ADMIN_PASSWORD = "Ajo123";
const CAT_LABEL = { primera:"Primera", arana:"Araña", segunda:"Segunda", industria:"Industria" };
const CAL_LABEL = { N3:"N°3", N4:"N°4", N5:"N°5", N6:"N°6", N7:"N°7", N8:"N°8", N9:"N°9", bulk:"Industria" };
const CAT_STYLE = {
  primera:  { bg:"#1a3a0a", border:"#3a7a1a", color:"#a8e06a" },
  arana:    { bg:"#0a2a3a", border:"#1a5a7a", color:"#60c0f0" },
  segunda:  { bg:"#2a2a00", border:"#5a5a00", color:"#f0c060" },
  industria:{ bg:"#1a0a2a", border:"#3a1a5a", color:"#c090f0" },
};

const initialCargas = [
  { id:4,  fecha:"2026-05-09", nroFactura:"FAC-04", proforma:"00002-00000005", vencimiento:"2026-06-09", notas:"Chofer: Moreston Jose Hentz | Camión: TRC3A70", totalFactura:22356, cobrado:0, cobradoExtra:0, preciosCal:{}, calidad:{ primera:{N5:40,N7:445,N8:109,N9:580}, arana:{N5:133,N6:180,N7:523,N8:40,N9:450}, segunda:{}, industria:{} }},
  { id:5,  fecha:"2026-05-12", nroFactura:"FAC-05", proforma:"00002-00000006", vencimiento:"2026-06-12", notas:"Chofer: Michel Moreira Correa | Camión: IRS1J14", totalFactura:21120, cobrado:0, cobradoExtra:0, preciosCal:{}, calidad:{ primera:{N3:28,N4:163,N5:167,N7:170,N8:255,N9:320}, arana:{N5:200,N6:100,N7:508,N8:293,N9:296}, segunda:{}, industria:{} }},
  { id:6,  fecha:"2026-05-15", nroFactura:"FAC-06", proforma:"00002-00000007", vencimiento:"2026-06-15", notas:"Chofer: Vanderlei Brackmann | Camión: KOJ6831", totalFactura:23500, cobrado:0, cobradoExtra:0, preciosCal:{}, calidad:{ primera:{N6:178,N7:545,N8:165,N9:612}, arana:{N7:430,N8:270,N9:300}, segunda:{}, industria:{} }},
  { id:7,  fecha:"2026-05-16", nroFactura:"FAC-07", proforma:"00002-00000008", vencimiento:"2026-06-16", notas:"Chofer: Hilario Candido Diel Kleist | Camión: JAS6H94", totalFactura:21096, cobrado:0, cobradoExtra:0, preciosCal:{}, calidad:{ primera:{N3:12,N4:32,N7:161,N8:382,N9:359}, arana:{N5:34,N6:255,N7:400,N8:543,N9:122}, segunda:{N7:200}, industria:{} }},
  { id:8,  fecha:"2026-05-18", nroFactura:"FAC-08", proforma:"00002-00000009", vencimiento:"2026-06-18", notas:"Chofer: Luis Fernando Elhers | Camión: GGT4280", totalFactura:17500, cobrado:0, cobradoExtra:0, preciosCal:{}, calidad:{ primera:{}, arana:{N8:36}, segunda:{N5:117,N6:327,N7:563,N8:137,N9:320}, industria:{bulk:1000} }},
  { id:9,  fecha:"2026-05-22", nroFactura:"FAC-09", proforma:"00002-00000010", vencimiento:"2026-06-22", notas:"Chofer: Franco Tomas Beyer | Camión: ITC1621", totalFactura:25340, cobrado:0, cobradoExtra:0, preciosCal:{}, calidad:{ primera:{N9:1960}, arana:{N8:70,N9:38}, segunda:{}, industria:{bulk:432} }},
  { id:10, fecha:"2026-05-23", nroFactura:"FAC-10", proforma:"00002-00000011", vencimiento:"2026-06-23", notas:"Chofer: Leandro Kipper | Camión: IZI9F44", totalFactura:18940, cobrado:0, cobradoExtra:0, preciosCal:{}, calidad:{ primera:{N9:330,N7:30}, arana:{N7:408,N8:90,N9:180}, segunda:{N6:112,N7:515,N8:337,N9:498}, industria:{} }},
  { id:11, fecha:"2026-05-26", nroFactura:"FAC-11", proforma:"00002-00000012", vencimiento:"2026-09-23", notas:"Chofer: Adao Ilario Rambo | Camión: JDK 7E46 | Acoplado: JDK 6J74", totalFactura:23260, cobrado:0, cobradoExtra:0, preciosCal:{}, calidad:{ primera:{N9:1440}, arana:{N8:90,N9:450}, segunda:{N9:520}, industria:{} }},
];

function usd(n){ return new Intl.NumberFormat("es-AR",{style:"currency",currency:"USD",minimumFractionDigits:2}).format(n||0); }
function diasHasta(f){ return Math.ceil((new Date(f)-new Date("2026-05-27"))/(1000*60*60*24)); }
function totalCat(cal,cat){ return Object.values(cal[cat]||{}).reduce((a,b)=>a+(Number(b)||0),0); }
function totalCajas(cal){ return ["primera","arana","segunda","industria"].reduce((s,c)=>s+totalCat(cal,c),0); }
function calcExtra(carga){
  let totalReal=0;
  ["primera","arana","segunda","industria"].forEach(cat=>{
    Object.entries(carga.calidad[cat]||{}).forEach(([cal,cajas])=>{
      totalReal+=(Number(carga.preciosCal?.[cat+"."+cal])||0)*Number(cajas);
    });
  });
  const extra=totalReal>0?Math.max(0,totalReal-carga.totalFactura):0;
  const cobradoExtra=Number(carga.cobradoExtra)||0;
  return { totalReal, extra, cobradoExtra, pendienteExtra:Math.max(0,extra-cobradoExtra) };
}

function ModalPrecios({carga,onClose,onSave}){
  const [precios,setPrecios]=useState({...carga.preciosCal});
  const items=[];
  ["primera","arana","segunda","industria"].forEach(cat=>{
    Object.entries(carga.calidad[cat]||{}).forEach(([cal,cajas])=>{ if(Number(cajas)>0) items.push({cat,cal,cajas:Number(cajas)}); });
  });
  let totalReal=0;
  items.forEach(({cat,cal,cajas})=>{ totalReal+=(Number(precios[cat+"."+cal])||0)*cajas; });
  const extra=Math.max(0,totalReal-carga.totalFactura);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0a120a",border:"2px solid #f0d060",borderRadius:16,padding:24,width:"100%",maxWidth:460,maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{color:"#f0d060",fontFamily:"monospace",fontWeight:700,fontSize:16}}>💵 Precios por calibre</div>
            <div style={{color:"#8a7a20",fontSize:11,fontFamily:"monospace"}}>{carga.nroFactura} · Facturado: {usd(carga.totalFactura)}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#5a5a3a",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {items.map(({cat,cal,cajas})=>{
            const key=cat+"."+cal;
            const precio=Number(precios[key]||0);
            const st=CAT_STYLE[cat];
            return(
              <div key={key} style={{background:st.bg,border:`1px solid ${st.border}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{color:st.color,fontSize:11,fontFamily:"monospace",fontWeight:700}}>{CAT_LABEL[cat]} · {CAL_LABEL[cal]}</div>
                  <div style={{color:"#5a6a5a",fontSize:10,fontFamily:"monospace"}}>{cajas.toLocaleString()} cajas</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:"#6a6a30",fontSize:12,fontFamily:"monospace"}}>USD</span>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={precios[key]||""}
                    onChange={e=>setPrecios(p=>({...p,[key]:e.target.value}))}
                    style={{width:80,background:"#0f1a0f",border:"2px solid #8a7000",borderRadius:6,color:"#f0d060",padding:"5px 8px",fontSize:13,fontFamily:"monospace",outline:"none",textAlign:"center"}}
                  />
                </div>
                {precio>0&&<div style={{color:"#a0c060",fontSize:11,fontFamily:"monospace",minWidth:80,textAlign:"right"}}>{usd(precio*cajas)}</div>}
              </div>
            );
          })}
        </div>
        <div style={{background:"#1a1500",border:"1px solid #5a4a00",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
          {[["Total vendido",usd(totalReal)],["Facturado",usd(carga.totalFactura)],["Diferencia",usd(extra)]].map(([l,v])=>(
            <div key={l}><div style={{color:"#7a6a20",fontSize:9,fontFamily:"monospace",textTransform:"uppercase"}}>{l}</div><div style={{color:"#f0d060",fontWeight:700,fontFamily:"monospace",fontSize:13}}>{v}</div></div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,background:"#1a2a1a",border:"1px solid #3a5a3a",borderRadius:8,color:"#6a9a5a",padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
          <button onClick={()=>{onSave(precios);onClose();}} style={{flex:2,background:"#8a6a00",border:"none",borderRadius:8,color:"#fff",padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>Guardar precios</button>
        </div>
      </div>
    </div>
  );
}

function ModalPass({onSuccess,onClose}){
  const [pwd,setPwd]=useState(""), [err,setErr]=useState(false);
  function check(){ if(pwd===ADMIN_PASSWORD){onSuccess();onClose();}else{setErr(true);setPwd("");} }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0a120a",border:"2px solid #3a7a1a",borderRadius:16,padding:32,width:"100%",maxWidth:300,textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:12}}>🔑</div>
        <div style={{color:"#a8e06a",fontFamily:"monospace",fontWeight:700,fontSize:16,marginBottom:6}}>Modo administrador</div>
        <div style={{color:"#4a6a3a",fontSize:11,fontFamily:"monospace",marginBottom:20}}>Ingresá la contraseña</div>
        <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&check()} autoFocus placeholder="••••••"
          style={{width:"100%",background:"#0f1a0f",border:"1px solid #2d4f1e",borderRadius:8,color:"#d4f09a",padding:"10px",fontSize:16,fontFamily:"monospace",outline:"none",textAlign:"center",boxSizing:"border-box",marginBottom:8,letterSpacing:4}}/>
        {err&&<div style={{color:"#f07050",fontSize:11,fontFamily:"monospace",marginBottom:8}}>Contraseña incorrecta</div>}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={onClose} style={{flex:1,background:"#1a2a1a",border:"1px solid #2a4a1a",borderRadius:8,color:"#6a9a5a",padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
          <button onClick={check} style={{flex:2,background:"#3a7a1a",border:"none",borderRadius:8,color:"#fff",padding:"10px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>Ingresar</button>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [cargas,setCargas]=useState(initialCargas);
  const [isAdmin,setIsAdmin]=useState(false);
  const [showPass,setShowPass]=useState(false);
  const [expandido,setExpandido]=useState(null);
  const [modalPrecios,setModalPrecios]=useState(null);
  const [filtro,setFiltro]=useState("todas");

  const totals=useMemo(()=>{
    const totalExtra=cargas.reduce((s,c)=>s+calcExtra(c).extra,0);
    const cobExtra=cargas.reduce((s,c)=>s+(Number(c.cobradoExtra)||0),0);
    return {
      cargas:cargas.length,
      cajas:cargas.reduce((s,c)=>s+totalCajas(c.calidad),0),
      facturado:cargas.reduce((s,c)=>s+c.totalFactura,0),
      cobrado:cargas.reduce((s,c)=>s+(Number(c.cobrado)||0),0),
      pendiente:cargas.reduce((s,c)=>s+(c.totalFactura-(Number(c.cobrado)||0)),0),
      totalExtra, cobExtra, pendienteExtra:totalExtra-cobExtra,
      vencidas:cargas.filter(c=>(c.totalFactura-(Number(c.cobrado)||0))>0&&diasHasta(c.vencimiento)<0).length,
    };
  },[cargas]);

  const lista=useMemo(()=>{
    if(filtro==="vencidas") return cargas.filter(c=>(c.totalFactura-c.cobrado)>0&&diasHasta(c.vencimiento)<0);
    if(filtro==="pendientes") return cargas.filter(c=>(c.totalFactura-c.cobrado)>0.01);
    if(filtro==="cobradas") return cargas.filter(c=>(c.totalFactura-c.cobrado)<=0.01);
    return cargas;
  },[cargas,filtro]);

  function registrarCobro(carga){
    const m=prompt(`💰 Cobro factura ${carga.nroFactura}\nPendiente: ${usd(carga.totalFactura-carga.cobrado)}\n\n¿Cuánto cobraste?`);
    if(!m||isNaN(m))return;
    setCargas(p=>p.map(c=>c.id===carga.id?{...c,cobrado:(Number(c.cobrado)||0)+Number(m)}:c));
  }
  function registrarCobroExtra(carga){
    const ex=calcExtra(carga);
    const m=prompt(`💵 Cobro efectivo ${carga.nroFactura}\nPendiente: ${usd(ex.pendienteExtra)}\n\n¿Cuánto cobraste?`);
    if(!m||isNaN(m))return;
    setCargas(p=>p.map(c=>c.id===carga.id?{...c,cobradoExtra:(Number(c.cobradoExtra)||0)+Number(m)}:c));
  }

  return(
    <div style={{minHeight:"100vh",background:"#060e06",fontFamily:"'DM Sans',sans-serif",color:"#c8e8a0"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet"/>
      <div style={{background:"linear-gradient(135deg,#0d1f0d,#152b10)",borderBottom:"1px solid #1e3a14",padding:"18px 20px"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"#a8e06a",margin:0}}>🧄 Altos States</h1>
            <p style={{color:"#4a7a30",fontSize:11,margin:"4px 0 0",fontFamily:"monospace"}}>Exportaciones → ALISUL Brasil · USD · 30 días</p>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {isAdmin&&<span style={{fontSize:10,fontFamily:"monospace",color:"#a8e06a",background:"#1a3a0a",border:"1px solid #3a7a1a",borderRadius:20,padding:"3px 12px"}}>🔑 Admin</span>}
            {isAdmin
              ?<button onClick={()=>setIsAdmin(false)} style={{background:"#1a1010",border:"1px solid #4a2020",color:"#aa7a7a",borderRadius:8,padding:"8px 14px",fontSize:11,fontWeight:600,cursor:"pointer"}}>Cerrar sesión</button>
              :<button onClick={()=>setShowPass(true)} style={{background:"#0f1a0f",border:"1px solid #2a4a1a",color:"#5a8a3a",borderRadius:8,padding:"8px 14px",fontSize:11,cursor:"pointer"}}>🔑 Admin</button>
            }
          </div>
        </div>
      </div>

      <div style={{maxWidth:900,margin:"0 auto",padding:"16px 12px"}}>
        {totals.vencidas>0&&(
          <div style={{background:"#2a1200",border:"1px solid #8a4000",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:20}}>🔴</span>
            <div><div style={{color:"#f0a030",fontWeight:700,fontSize:13}}>¡{totals.vencidas} factura{totals.vencidas>1?"s":""} vencida{totals.vencidas>1?"s":""}!</div>
            <div style={{color:"#a07020",fontSize:11}}>Contactá a ALISUL para gestionar el cobro</div></div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:10}}>
          {[{l:"Cargas",v:totals.cargas,icon:"🚛"},{l:"Total cajas",v:totals.cajas.toLocaleString(),icon:"📦"},{l:"Facturado",v:usd(totals.facturado),icon:"🧾"},{l:"Cobrado",v:usd(totals.cobrado),icon:"✅"},{l:"Pend. factura",v:usd(totals.pendiente),icon:"⏳",warn:true}].map(({l,v,icon,warn})=>(
            <div key={l} style={{background:warn?"linear-gradient(135deg,#2a1a0a,#1a1000)":"#0e180e",border:`1px solid ${warn?"#6a4010":"#1e3a14"}`,borderRadius:12,padding:"14px 12px"}}>
              <div style={{fontSize:18,marginBottom:6}}>{icon}</div>
              <div style={{color:warn?"#f0c060":"#a8e06a",fontSize:15,fontWeight:700,fontFamily:"monospace"}}>{v}</div>
              <div style={{color:"#3a6a20",fontSize:9,marginTop:3,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:0.5}}>{l}</div>
            </div>
          ))}
        </div>

        {totals.totalExtra>0&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
            {[{l:"Total extra efectivo",v:usd(totals.totalExtra),icon:"💵"},{l:"Cobrado efectivo",v:usd(totals.cobExtra),icon:"✅"},{l:"Pendiente efectivo",v:usd(totals.pendienteExtra),icon:"⏳",warn:true}].map(({l,v,icon,warn})=>(
              <div key={l} style={{background:warn?"linear-gradient(135deg,#2a1500,#1a1000)":"#100e00",border:`1px solid ${warn?"#6a4000":"#4a3a00"}`,borderRadius:12,padding:"14px 12px"}}>
                <div style={{fontSize:18,marginBottom:6}}>{icon}</div>
                <div style={{color:warn?"#f0c060":"#f0d060",fontSize:15,fontWeight:700,fontFamily:"monospace"}}>{v}</div>
                <div style={{color:"#7a6020",fontSize:9,marginTop:3,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:0.5}}>{l}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {[["todas","Todas"],["vencidas","🔴 Vencidas"],["pendientes","⏳ Pendientes"],["cobradas","✅ Cobradas"]].map(([val,lbl])=>(
            <button key={val} onClick={()=>setFiltro(val)} style={{background:filtro===val?"#2a5a1a":"#0e180e",border:`1px solid ${filtro===val?"#4a9a2a":"#1e3a14"}`,color:filtro===val?"#d4f09a":"#4a7a30",borderRadius:20,padding:"5px 14px",fontSize:11,cursor:"pointer",fontFamily:"monospace",fontWeight:filtro===val?700:400}}>{lbl}</button>
          ))}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {lista.map(carga=>{
            const dias=diasHasta(carga.vencimiento);
            const pendFact=carga.totalFactura-(Number(carga.cobrado)||0);
            const vencida=pendFact>0&&dias<0;
            const cobrada=pendFact<=0.01;
            const ex=calcExtra(carga);
            const abierta=expandido===carga.id;
            const tienePrecio=Object.values(carga.preciosCal||{}).some(v=>Number(v)>0);
            return(
              <div key={carga.id} style={{background:"#0e180e",border:`1px solid ${vencida?"#6a3000":cobrada?"#1e4a14":"#1e3a14"}`,borderRadius:14,overflow:"hidden"}}>
                <div style={{padding:"14px 16px",cursor:"pointer"}} onClick={()=>setExpandido(abierta?null:carga.id)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                        <span style={{fontFamily:"monospace",color:"#a8e06a",fontWeight:700,fontSize:15}}>{carga.nroFactura}</span>
                        <span style={{fontSize:10,padding:"2px 10px",borderRadius:20,fontFamily:"monospace",background:vencida?"#3a1200":cobrada?"#1a3a1a":"#1a2a0a",color:vencida?"#f07020":cobrada?"#5aaa3a":"#80cc40"}}>
                          {cobrada?"✓ Cobrada":vencida?`🔴 Vencida hace ${Math.abs(dias)}d`:`⏳ Vence en ${dias}d`}
                        </span>
                        {tienePrecio&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontFamily:"monospace",background:"#1a1400",color:"#f0d060"}}>💵 con precios</span>}
                      </div>
                      <div style={{color:"#3a6a20",fontSize:11,fontFamily:"monospace"}}>{carga.fecha} · {totalCajas(carga.calidad).toLocaleString()} cajas</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{color:"#a8e06a",fontFamily:"monospace",fontWeight:700,fontSize:15}}>{usd(carga.totalFactura)}</div>
                      {pendFact>0.01&&<div style={{color:"#f0b030",fontFamily:"monospace",fontSize:11}}>Pend: {usd(pendFact)}</div>}
                      {ex.extra>0&&<div style={{color:"#f0d060",fontFamily:"monospace",fontSize:11}}>💵 Extra: {usd(ex.extra)}</div>}
                      {ex.pendienteExtra>0&&<div style={{color:"#c0a000",fontFamily:"monospace",fontSize:10}}>Pend. ef: {usd(ex.pendienteExtra)}</div>}
                      <div style={{color:"#2a5a20",fontSize:10,marginTop:2}}>{abierta?"▲ cerrar":"▼ ver detalle"}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                    {["primera","arana","segunda","industria"].map(cat=>{
                      const t=totalCat(carga.calidad,cat); if(!t)return null;
                      const st=CAT_STYLE[cat];
                      return(<div key={cat} style={{background:st.bg,border:`1px solid ${st.border}`,borderRadius:6,padding:"3px 10px",display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{color:st.color,fontSize:10,fontFamily:"monospace",fontWeight:700}}>{CAT_LABEL[cat]}</span>
                        <span style={{color:"#d4f09a",fontSize:11,fontFamily:"monospace"}}>{t.toLocaleString()}</span>
                      </div>);
                    })}
                  </div>
                </div>
                {abierta&&(
                  <div style={{borderTop:"1px solid #1a3a14",padding:"16px",background:"#080e08"}}>
                    <div style={{marginBottom:14}}>
                      {["primera","arana","segunda","industria"].map(cat=>{
                        const items=Object.entries(carga.calidad[cat]||{}).filter(([,v])=>Number(v)>0);
                        if(!items.length)return null;
                        const st=CAT_STYLE[cat];
                        return(
                          <div key={cat} style={{marginBottom:10}}>
                            <div style={{color:st.color,fontFamily:"monospace",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{CAT_LABEL[cat]}</div>
                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                              {items.map(([cal,cajas])=>{
                                const precio=Number(carga.preciosCal?.[cat+"."+cal]||0);
                                return(
                                  <div key={cal} style={{background:st.bg,border:`1px solid ${st.border}`,borderRadius:8,padding:"6px 12px",textAlign:"center",minWidth:80}}>
                                    <div style={{color:st.color,fontSize:9,fontFamily:"monospace"}}>{CAL_LABEL[cal]}</div>
                                    <div style={{color:"#d4f09a",fontWeight:700,fontFamily:"monospace",fontSize:14}}>{Number(cajas).toLocaleString()}</div>
                                    {precio>0&&<div style={{color:"#f0d060",fontSize:9,fontFamily:"monospace",marginTop:2}}>${precio}/caja</div>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {ex.extra>0&&(
                      <div style={{background:"#1a1400",border:"1px solid #5a4a00",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                        <div style={{color:"#f0d060",fontSize:10,fontFamily:"monospace",fontWeight:700,marginBottom:8}}>💵 EXTRA EN EFECTIVO</div>
                        <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                          {[["Total vendido",usd(ex.totalReal)],["Facturado",usd(carga.totalFactura)],["Extra",usd(ex.extra)],["Cobrado",usd(ex.cobradoExtra)],["Pendiente",usd(ex.pendienteExtra)]].map(([l,v])=>(
                            <div key={l}><div style={{color:"#7a6a20",fontSize:9,fontFamily:"monospace",textTransform:"uppercase"}}>{l}</div><div style={{color:"#f0d060",fontWeight:700,fontFamily:"monospace",fontSize:13}}>{v}</div></div>
                          ))}
                        </div>
                      </div>
                    )}
                    {carga.notas&&<div style={{color:"#3a6a20",fontSize:11,fontStyle:"italic",fontFamily:"monospace",marginBottom:12}}>📝 {carga.notas}</div>}
                    {isAdmin&&(
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        {pendFact>0.01&&<button onClick={()=>registrarCobro(carga)} style={{background:"#1a3a0a",border:"1px solid #3a7a1a",color:"#8acc5a",borderRadius:8,padding:"7px 14px",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>💰 Cobro factura</button>}
                        <button onClick={()=>setModalPrecios(carga)} style={{background:"#1a1400",border:"1px solid #8a6a00",color:"#f0c040",borderRadius:8,padding:"7px 14px",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>💵 {tienePrecio?"Editar precios":"Cargar precios"}</button>
                        {ex.pendienteExtra>0&&<button onClick={()=>registrarCobroExtra(carga)} style={{background:"#1a1000",border:"1px solid #6a5000",color:"#d0a000",borderRadius:8,padding:"7px 14px",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>✅ Cobro efectivo</button>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {showPass&&<ModalPass onSuccess={()=>setIsAdmin(true)} onClose={()=>setShowPass(false)}/>}
      {modalPrecios&&isAdmin&&(
        <ModalPrecios carga={modalPrecios} onClose={()=>setModalPrecios(null)}
          onSave={precios=>setCargas(p=>p.map(c=>c.id===modalPrecios.id?{...c,preciosCal:precios}:c))}/>
      )}
    </div>
  );
}
