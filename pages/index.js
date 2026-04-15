import { useState, useMemo, useEffect } from "react";
import Head from "next/head";

const LOGO_SRC = "/logo.jpg";

const CATEGORY_ICONS = {
  "Laptops":"💻","Computers":"🖥️","Scanners":"📷","Printers":"🖨️",
  "Vehicles":"🚗","Mobile Device":"📱","Firearms":"🔫","External Drives":"💾",
  "Body Cameras":"📹","GPS Units":"📍","Radios":"📻","Golf Carts":"⛳",
  "Tactical Flashlight":"🔦","Vehicle Accessories":"🔧","Office Phones":"☎️","Monitors":"🖥️",
};

const STATUS_CONFIG = {
  "Working Condition":                  {color:"#16a34a",bg:"#dcfce7",label:"Working"},
  "Working Condition - Out of Warranty":{color:"#65a30d",bg:"#ecfccb",label:"Out of Warranty"},
  "Broken - Needs Repair":              {color:"#ea580c",bg:"#ffedd5",label:"Needs Repair"},
  "Out of Service":                     {color:"#dc2626",bg:"#fee2e2",label:"Out of Service"},
  "Out of Service- Traded In":          {color:"#6b7280",bg:"#f3f4f6",label:"Traded In"},
  "Missing":                            {color:"#db2777",bg:"#fce7f3",label:"Missing"},
  "Restrict Loan":                      {color:"#9333ea",bg:"#f3e8ff",label:"Restrict Loan"},
  "":                                   {color:"#6b7280",bg:"#f3f4f6",label:"Unknown"},
};
const ALL_STATUSES = ["Working Condition","Working Condition - Out of Warranty","Broken - Needs Repair","Out of Service","Out of Service- Traded In","Missing","Restrict Loan"];
const CATEGORIES = ["All","Laptops","Computers","Monitors","Printers","Scanners","External Drives","Mobile Device","Office Phones","Radios","Body Cameras","GPS Units","Vehicles","Golf Carts","Tactical Flashlight","Vehicle Accessories","Firearms"];

const BLUE="#1d4ed8", BLUE_MID="#2563eb", BLUE_BG="#eff6ff", BLUE_BORDER="#bfdbfe";

const inp = (x={}) => ({background:"#fff",border:"1px solid #d1d5db",borderRadius:"7px",color:"#111827",padding:"8px 12px",fontSize:"13px",outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",...x});
const sel = (x={}) => inp({cursor:"pointer",...x});

function Btn({children,onClick,variant="primary",disabled,style={}}) {
  const base = {padding:"9px 18px",borderRadius:"8px",fontSize:"13px",fontWeight:700,cursor:disabled?"default":"pointer",border:"none",fontFamily:"inherit",opacity:disabled?0.6:1,...style};
  const variants = {
    primary:{background:BLUE_MID,color:"#fff",boxShadow:`0 2px 6px ${BLUE_MID}40`},
    secondary:{background:"#f9fafb",border:"1px solid #d1d5db",color:"#374151"},
    danger:{background:"#fee2e2",color:"#dc2626",border:"1px solid #fca5a5"},
    success:{background:"#dcfce7",color:"#16a34a",border:"1px solid #86efac"},
    ghost:{background:"transparent",border:"1px solid #d1d5db",color:"#374151"},
    orange:{background:"#fff7ed",border:"1px solid #fed7aa",color:"#ea580c"},
  };
  return <button onClick={onClick} disabled={disabled} style={{...base,...variants[variant]}}>{children}</button>;
}
function StatusBadge({status}) {
  const c=STATUS_CONFIG[status]||STATUS_CONFIG[""];
  return <span style={{background:c.bg,color:c.color,border:`1px solid ${c.color}40`,padding:"3px 9px",borderRadius:"20px",fontSize:"11px",fontWeight:600,whiteSpace:"nowrap"}}>{c.label}</span>;
}
function LoanBadge({status}) {
  const out=status==="out";
  return <span style={{background:out?"#ffedd5":"#dcfce7",color:out?"#ea580c":"#16a34a",border:`1px solid ${out?"#fdba7440":"#86efac40"}`,padding:"3px 9px",borderRadius:"20px",fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{out?"OUT":"IN"}</span>;
}
function Label({children}) {
  return <div style={{color:"#6b7280",fontSize:"11px",fontWeight:600,letterSpacing:"0.05em",marginBottom:"5px",textTransform:"uppercase"}}>{children}</div>;
}
function SecTitle({children}) {
  return <div style={{color:BLUE_MID,fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"14px",paddingBottom:"8px",borderBottom:"2px solid #e5e7eb",display:"flex",alignItems:"center",gap:"8px"}}>
    <div style={{width:"3px",height:"14px",background:BLUE_MID,borderRadius:"2px"}}/>{children}
  </div>;
}
function Grid({children}) { return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>{children}</div>; }
function Full({children}) { return <div style={{gridColumn:"1/-1"}}>{children}</div>; }

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
function exportCSV(rows, filename) {
  if (!rows.length) return;
  const headers = ["Asset #","Title","Category","Location","Status","Loan Status","Loanee","Serial Number","Make","Model","Year","VIN","Tag","Tag Expires","Purchase Cost","Date Purchased","Warranty Expires","Vendor","Manufacturer","Processor","RAM","Hard Drive","Phone Number","Email Account","Purpose","Notes","Comments","Parent Location","Address","Contact","Contact Email","Contact Phone","Lease/Own","Monthly Payment","Payoff Date","Bank","Insurance Policy #","Insurance Payment","Vehicle #","Created Date"];
  const escape = v => `"${(v||"").replace(/"/g,'""')}"`;
  const csvRows = [headers.join(",")];
  for (const a of rows) {
    csvRows.push([
      a.id,a.title,a.category,a.location,a.status,a.loanStatus,a.loanee,
      a.serialNumber,a.make,a.model,a.vehicleYear,a.vin,a.tag,a.tagExpires,
      a.purchaseCost,a.datePurchased,a.warrantyExpires,a.vendor,a.manufacturer,
      a.processor,a.ram,a.hardDrive,a.phoneNumber,a.emailAccount,a.purpose,
      a.notes,a.comments,a.parentLocation,a.locationAddress,a.locationContact,
      a.locationEmail,a.locationPhone,a.leaseOwn,a.monthlyPayment,a.payoffDate,
      a.bank,a.insurancePolicyNum,a.insurancePolicyPayment,a.vehicleNumber,a.createdDate
    ].map(escape).join(","));
  }
  const blob = new Blob([csvRows.join("\n")],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

function exportSummaryCSV(assets) {
  const cats = [...new Set(assets.map(a=>a.category))].filter(Boolean).sort();
  const statuses = [...new Set(assets.map(a=>a.status))].filter(Boolean).sort();
  const lines = [];
  lines.push(`"FPI Security Services — Asset Summary Report"`);
  lines.push(`"Generated: ${new Date().toLocaleString()}"`);
  lines.push(`"Total Assets: ${assets.length}"`);
  lines.push(``);
  lines.push(`"BY CATEGORY"`);
  lines.push(`"Category","Total","Checked In","Checked Out"`);
  for (const cat of cats) {
    const catAssets = assets.filter(a=>a.category===cat);
    const inCount = catAssets.filter(a=>a.loanStatus!=="out").length;
    const outCount = catAssets.filter(a=>a.loanStatus==="out").length;
    lines.push(`"${cat}","${catAssets.length}","${inCount}","${outCount}"`);
  }
  lines.push(``);
  lines.push(`"BY STATUS"`);
  lines.push(`"Status","Count"`);
  for (const st of statuses) {
    lines.push(`"${st}","${assets.filter(a=>a.status===st).length}"`);
  }
  lines.push(``);
  lines.push(`"CHECKED OUT ASSETS"`);
  lines.push(`"Asset #","Title","Category","Loanee","Checked Out Date"`);
  for (const a of assets.filter(a=>a.loanStatus==="out")) {
    lines.push(`"${a.id}","${a.title}","${a.category}","${a.loanee||a.checkedOutBy||""}","${a.checkedOutDate||""}"`);
  }
  const blob = new Blob([lines.join("\n")],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href=url; el.download=`FPI_Asset_Summary_${new Date().toISOString().slice(0,10)}.csv`; el.click();
  URL.revokeObjectURL(url);
}

// ─── EXPORT MODAL ─────────────────────────────────────────────────────────────
function ExportModal({onClose,assets,filteredAssets,category}) {
  const date = new Date().toISOString().slice(0,10);
  const exports = [
    {label:"📋 Full Inventory",desc:`All ${assets.length} assets — every field`,action:()=>exportCSV(assets,`FPI_Full_Inventory_${date}.csv`)},
    {label:"🔍 Current Filtered View",desc:`${filteredAssets.length} assets matching current filters`,action:()=>exportCSV(filteredAssets,`FPI_Filtered_${date}.csv`)},
    {label:"📤 Checked Out Assets",desc:`${assets.filter(a=>a.loanStatus==="out").length} assets currently loaned out`,action:()=>exportCSV(assets.filter(a=>a.loanStatus==="out"),`FPI_CheckedOut_${date}.csv`)},
    {label:"🔧 Assets Needing Attention",desc:"Broken, Out of Service, or Missing",action:()=>exportCSV(assets.filter(a=>["Broken - Needs Repair","Out of Service","Missing"].includes(a.status)),`FPI_NeedsAttention_${date}.csv`)},
    {label:"🚗 Vehicles Report",desc:`${assets.filter(a=>["Vehicles","Golf Carts"].includes(a.category)).length} vehicles & golf carts`,action:()=>exportCSV(assets.filter(a=>["Vehicles","Golf Carts"].includes(a.category)),`FPI_Vehicles_${date}.csv`)},
    {label:"📊 Summary Report",desc:"Counts by category, status & checked-out list",action:()=>exportSummaryCSV(assets)},
  ];
  // Per-category exports
  const catList = CATEGORIES.filter(c=>c!=="All");

  return (
    <div style={{position:"fixed",inset:0,zIndex:80,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.4)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",zIndex:10,background:"#fff",borderRadius:"16px",width:"560px",maxWidth:"95vw",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
        <div style={{position:"sticky",top:0,background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"20px 24px",display:"flex",alignItems:"center",gap:"14px",borderRadius:"16px 16px 0 0"}}>
          <div style={{width:"42px",height:"42px",background:"#f0fdf4",border:"1px solid #86efac",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>📊</div>
          <div style={{flex:1}}>
            <div style={{color:"#16a34a",fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>EXPORT REPORTS</div>
            <div style={{color:"#111827",fontSize:"17px",fontWeight:700}}>Download Asset Data</div>
          </div>
          <button onClick={onClose} style={{background:"#f3f4f6",border:"1px solid #e5e7eb",color:"#6b7280",cursor:"pointer",width:"34px",height:"34px",borderRadius:"8px",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>

        <div style={{padding:"20px 24px"}}>
          <div style={{color:"#6b7280",fontSize:"12px",marginBottom:"16px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Quick Reports</div>
          <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"24px"}}>
            {exports.map((ex,i)=>(
              <button key={i} onClick={()=>{ex.action();}} style={{display:"flex",alignItems:"center",gap:"14px",padding:"14px 16px",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"10px",cursor:"pointer",textAlign:"left",transition:"all 0.15s",fontFamily:"inherit"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#eff6ff";e.currentTarget.style.borderColor=BLUE_BORDER;}}
                onMouseLeave={e=>{e.currentTarget.style.background="#f9fafb";e.currentTarget.style.borderColor="#e5e7eb";}}>
                <div style={{flex:1}}>
                  <div style={{color:"#111827",fontWeight:700,fontSize:"14px"}}>{ex.label}</div>
                  <div style={{color:"#9ca3af",fontSize:"12px",marginTop:"2px"}}>{ex.desc}</div>
                </div>
                <div style={{color:BLUE_MID,fontSize:"12px",fontWeight:600,background:BLUE_BG,padding:"4px 10px",borderRadius:"6px",whiteSpace:"nowrap"}}>↓ CSV</div>
              </button>
            ))}
          </div>

          <div style={{color:"#6b7280",fontSize:"12px",marginBottom:"12px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Export by Category</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            {catList.map(cat=>{
              const count = assets.filter(a=>a.category===cat).length;
              return (
                <button key={cat} onClick={()=>exportCSV(assets.filter(a=>a.category===cat),`FPI_${cat.replace(/\s+/g,"_")}_${date}.csv`)}
                  style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"8px",cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#eff6ff";e.currentTarget.style.borderColor=BLUE_BORDER;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#f9fafb";e.currentTarget.style.borderColor="#e5e7eb";}}>
                  <span style={{fontSize:"16px"}}>{CATEGORY_ICONS[cat]||"📦"}</span>
                  <div style={{flex:1}}>
                    <div style={{color:"#111827",fontWeight:600,fontSize:"12px"}}>{cat}</div>
                    <div style={{color:"#9ca3af",fontSize:"11px"}}>{count} assets</div>
                  </div>
                  <span style={{color:BLUE_MID,fontSize:"11px"}}>↓</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LOAN MODAL ───────────────────────────────────────────────────────────────
function LoanModal({asset,onClose,onSave}) {
  const [loanee,setLoanee]=useState(asset.loanee||"");
  const [date,setDate]=useState(new Date().toLocaleDateString());
  const isOut=asset.loanStatus==="out";
  const handle=()=>{
    if(!isOut&&!loanee.trim()){alert("Enter employee name");return;}
    onSave({...asset,loanStatus:isOut?"in":"out",loanee:isOut?"":loanee,checkedOutDate:isOut?"":date,checkedOutBy:isOut?"":loanee});
  };
  return (
    <div style={{position:"fixed",inset:0,zIndex:80,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.4)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"relative",zIndex:10,background:"#fff",borderRadius:"16px",padding:"28px",width:"400px",maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
          <div style={{width:"44px",height:"44px",background:isOut?"#dcfce7":"#eff6ff",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px"}}>{isOut?"✅":"📤"}</div>
          <div>
            <div style={{color:BLUE_MID,fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{isOut?"CHECK IN":"LOAN OUT"}</div>
            <div style={{color:"#111827",fontSize:"16px",fontWeight:700}}>{asset.title}</div>
          </div>
        </div>
        {isOut ? (
          <div style={{background:"#f9fafb",borderRadius:"10px",padding:"16px",marginBottom:"20px"}}>
            <div style={{color:"#6b7280",fontSize:"12px",marginBottom:"4px"}}>Currently loaned to</div>
            <div style={{color:"#111827",fontWeight:700,fontSize:"15px"}}>{asset.loanee||asset.checkedOutBy||"Unknown"}</div>
            {asset.checkedOutDate&&<div style={{color:"#9ca3af",fontSize:"12px",marginTop:"4px"}}>Since {asset.checkedOutDate}</div>}
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"20px"}}>
            <div><Label>Employee Name *</Label><input style={inp()} value={loanee} onChange={e=>setLoanee(e.target.value)} placeholder="Full name" autoFocus/></div>
            <div><Label>Date</Label><input style={inp()} value={date} onChange={e=>setDate(e.target.value)}/></div>
          </div>
        )}
        <div style={{display:"flex",gap:"10px"}}>
          <Btn variant="secondary" onClick={onClose} style={{flex:1}}>Cancel</Btn>
          <Btn variant={isOut?"success":"primary"} onClick={handle} style={{flex:2}}>{isOut?"✓ Check In":"📤 Loan Out"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
function EditModal({asset,onClose,onSave,locations,saving}) {
  const [form,setForm]=useState({...asset});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const fi=(k,label,ph="")=><div><Label>{label}</Label><input style={inp()} value={form[k]||""} onChange={e=>set(k,e.target.value)} placeholder={ph}/></div>;
  const showV=["Vehicles","Golf Carts"].includes(form.category);
  const locNames=locations.map(l=>l.name);
  return (
    <div style={{position:"fixed",inset:0,zIndex:70,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.4)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",zIndex:10,width:"580px",maxWidth:"100vw",height:"100vh",overflowY:"auto",background:"#f9fafb",borderLeft:"1px solid #e5e7eb",boxShadow:"-8px 0 40px rgba(0,0,0,0.12)"}}>
        <div style={{position:"sticky",top:0,zIndex:10,background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"18px 24px",display:"flex",alignItems:"center",gap:"14px"}}>
          <div style={{width:"42px",height:"42px",background:BLUE_BG,border:`1px solid ${BLUE_BORDER}`,borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>✏️</div>
          <div style={{flex:1}}>
            <div style={{color:BLUE_MID,fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>EDIT ASSET #{asset.id}</div>
            <div style={{color:"#111827",fontSize:"16px",fontWeight:700}}>{asset.title}</div>
          </div>
          <button onClick={onClose} style={{background:"#f3f4f6",border:"1px solid #e5e7eb",color:"#6b7280",cursor:"pointer",width:"34px",height:"34px",borderRadius:"8px",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"24px",display:"flex",flexDirection:"column",gap:"0"}}>
          <div style={{marginBottom:"28px"}}><SecTitle>Identification</SecTitle><Grid>
            <Full><Label>Title</Label><input style={inp()} value={form.title||""} onChange={e=>set("title",e.target.value)}/></Full>
            <div><Label>Category</Label><select style={sel()} value={form.category||""} onChange={e=>set("category",e.target.value)}>{CATEGORIES.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}</select></div>
            {fi("serialNumber","Serial Number")}
            <Full><Label>Notes</Label><textarea style={inp({resize:"vertical",minHeight:"56px"})} value={form.notes||""} onChange={e=>set("notes",e.target.value)}/></Full>
          </Grid></div>
          <div style={{marginBottom:"28px"}}><SecTitle>Status</SecTitle><Grid>
            <div><Label>Asset Status</Label><select style={sel()} value={form.status||""} onChange={e=>set("status",e.target.value)}>{ALL_STATUSES.map(s=><option key={s} value={s}>{STATUS_CONFIG[s]?.label||s}</option>)}</select></div>
            <div><Label>Loan Status</Label><select style={sel()} value={form.loanStatus||"in"} onChange={e=>set("loanStatus",e.target.value)}><option value="in">Checked In</option><option value="out">Checked Out</option></select></div>
            {form.loanStatus==="out"&&<>{fi("loanee","Loanee / Employee")}{fi("checkedOutDate","Checked Out Date","MM/DD/YYYY")}</>}
          </Grid></div>
          <div style={{marginBottom:"28px"}}><SecTitle>Location</SecTitle><Grid>
            <div><Label>Location</Label><input style={inp()} list="ed-loc-list" value={form.location||""} onChange={e=>set("location",e.target.value)} placeholder="Type or select"/><datalist id="ed-loc-list">{locNames.map(l=><option key={l} value={l}/>)}</datalist></div>
            {fi("parentLocation","Parent Location")}
            <Full>{fi("locationAddress","Address")}</Full>
            {fi("locationContact","Contact Name")}{fi("locationEmail","Email")}{fi("locationPhone","Phone")}
          </Grid></div>
          <div style={{marginBottom:"28px"}}><SecTitle>Purchase Info</SecTitle><Grid>
            {fi("vendor","Vendor")}{fi("datePurchased","Date Purchased","MM/DD/YYYY")}{fi("purchaseCost","Cost","$0.00")}{fi("warrantyExpires","Warranty Expires","MM/DD/YYYY")}
          </Grid></div>
          {!showV&&<div style={{marginBottom:"28px"}}><SecTitle>Hardware / Specs</SecTitle><Grid>
            {fi("manufacturer","Manufacturer")}{fi("model","Model")}{fi("processor","Processor","e.g. i7")}{fi("ram","RAM","e.g. 16GB")}{fi("hardDrive","Hard Drive")}{fi("type","Type")}{fi("purpose","Purpose")}
            <div><Label>B/W or Color</Label><select style={sel()} value={form.bwColor||""} onChange={e=>set("bwColor",e.target.value)}><option value="">—</option><option value="Color">Color</option><option value="B/W">B/W</option></select></div>
          </Grid></div>}
          {showV&&<div style={{marginBottom:"28px"}}><SecTitle>Vehicle Info</SecTitle><Grid>
            {fi("make","Make")}{fi("model","Model")}{fi("vehicleYear","Year")}{fi("vehicleNumber","Vehicle #")}{fi("vin","VIN")}{fi("tag","Tag / Plate")}{fi("tagExpires","Tag Expires","MM/DD/YYYY")}
            <div><Label>Lease/Own</Label><select style={sel()} value={form.leaseOwn||""} onChange={e=>set("leaseOwn",e.target.value)}><option value="">—</option><option value="Lease">Lease</option><option value="Own">Own</option><option value="Finance">Finance</option></select></div>
            {fi("monthlyPayment","Monthly Payment","$0.00")}{fi("payoffDate","Payoff Date","MM/DD/YYYY")}{fi("bank","Bank")}{fi("insurancePolicyNum","Insurance Policy #")}{fi("insurancePolicyPayment","Insurance Payment","$0.00")}
          </Grid></div>}
          <div style={{marginBottom:"28px"}}><SecTitle>Contact / Comms</SecTitle><Grid>{fi("phoneNumber","Phone")}{fi("emailAccount","Email Account")}</Grid></div>
          <div style={{display:"flex",gap:"10px",paddingTop:"8px",borderTop:"1px solid #e5e7eb"}}>
            <Btn variant="secondary" onClick={onClose} style={{flex:1}}>Cancel</Btn>
            <Btn variant="primary" onClick={()=>onSave(form)} disabled={saving} style={{flex:2}}>{saving?"Saving…":"✓ Save Changes"}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADD ASSET MODAL ──────────────────────────────────────────────────────────
function AddModal({onClose,onSave,nextId,locations,saving}) {
  const [form,setForm]=useState({id:String(nextId),title:"",category:"Computers",notes:"",location:"",parentLocation:"",locationAddress:"",locationContact:"",locationEmail:"",locationPhone:"",status:"Working Condition",loanStatus:"in",loanee:"",checkedOutDate:"",vendor:"",datePurchased:"",purchaseCost:"",warrantyExpires:"",manufacturer:"",model:"",processor:"",ram:"",hardDrive:"",bwColor:"",type:"",purpose:"",serialNumber:"",phoneNumber:"",emailAccount:"",make:"",vehicleYear:"",vehicleNumber:"",vin:"",tag:"",tagExpires:"",leaseOwn:"",monthlyPayment:"",payoffDate:"",bank:"",insurancePolicyNum:"",insurancePolicyPayment:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const fi=(k,label,ph="")=><div><Label>{label}</Label><input style={inp()} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}/></div>;
  const showV=["Vehicles","Golf Carts"].includes(form.category);
  const locNames=locations.map(l=>l.name);
  return (
    <div style={{position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.4)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",zIndex:10,width:"580px",maxWidth:"100vw",height:"100vh",overflowY:"auto",background:"#f9fafb",borderLeft:"1px solid #e5e7eb",boxShadow:"-8px 0 40px rgba(0,0,0,0.12)"}}>
        <div style={{position:"sticky",top:0,zIndex:10,background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"18px 24px",display:"flex",alignItems:"center",gap:"14px"}}>
          <div style={{width:"42px",height:"42px",background:BLUE_BG,border:`1px solid ${BLUE_BORDER}`,borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>➕</div>
          <div style={{flex:1}}>
            <div style={{color:BLUE_MID,fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>NEW ASSET</div>
            <div style={{color:"#111827",fontSize:"17px",fontWeight:700}}>Add to Inventory</div>
          </div>
          <button onClick={onClose} style={{background:"#f3f4f6",border:"1px solid #e5e7eb",color:"#6b7280",cursor:"pointer",width:"34px",height:"34px",borderRadius:"8px",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"24px",display:"flex",flexDirection:"column",gap:"0"}}>
          <div style={{marginBottom:"28px"}}><SecTitle>Identification</SecTitle><Grid>
            <div><Label>Asset #</Label><input style={inp({color:BLUE_MID,fontWeight:700})} value={form.id} onChange={e=>set("id",e.target.value)}/></div>
            <Full><Label>Title *</Label><input style={inp()} value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Dell Latitude 5520"/></Full>
            <div><Label>Category</Label><select style={sel()} value={form.category} onChange={e=>set("category",e.target.value)}>{CATEGORIES.filter(c=>c!=="All").map(c=><option key={c}>{c}</option>)}</select></div>
            {fi("serialNumber","Serial Number")}
            <Full><Label>Notes</Label><textarea style={inp({resize:"vertical",minHeight:"56px"})} value={form.notes} onChange={e=>set("notes",e.target.value)}/></Full>
          </Grid></div>
          <div style={{marginBottom:"28px"}}><SecTitle>Status</SecTitle><Grid>
            <div><Label>Asset Status</Label><select style={sel()} value={form.status} onChange={e=>set("status",e.target.value)}>{ALL_STATUSES.map(s=><option key={s} value={s}>{STATUS_CONFIG[s]?.label||s}</option>)}</select></div>
            <div><Label>Loan Status</Label><select style={sel()} value={form.loanStatus} onChange={e=>set("loanStatus",e.target.value)}><option value="in">Checked In</option><option value="out">Checked Out</option></select></div>
            {form.loanStatus==="out"&&<>{fi("loanee","Loanee Name","Who has it")}{fi("checkedOutDate","Checked Out Date","MM/DD/YYYY")}</>}
          </Grid></div>
          <div style={{marginBottom:"28px"}}><SecTitle>Location</SecTitle><Grid>
            <div><Label>Location</Label><input style={inp()} list="add-loc-list" value={form.location} onChange={e=>set("location",e.target.value)} placeholder="Type or select"/><datalist id="add-loc-list">{locNames.map(l=><option key={l} value={l}/>)}</datalist></div>
            {fi("parentLocation","Parent Location")}
            <Full>{fi("locationAddress","Address")}</Full>
            {fi("locationContact","Contact Name")}{fi("locationEmail","Contact Email")}{fi("locationPhone","Contact Phone")}
          </Grid></div>
          <div style={{marginBottom:"28px"}}><SecTitle>Purchase Info</SecTitle><Grid>
            {fi("vendor","Vendor")}{fi("datePurchased","Date Purchased","MM/DD/YYYY")}{fi("purchaseCost","Cost","$0.00")}{fi("warrantyExpires","Warranty Expires","MM/DD/YYYY")}
          </Grid></div>
          {!showV&&<div style={{marginBottom:"28px"}}><SecTitle>Hardware / Specs</SecTitle><Grid>
            {fi("manufacturer","Manufacturer")}{fi("model","Model")}{fi("processor","Processor","e.g. i7")}{fi("ram","RAM","e.g. 16GB")}{fi("hardDrive","Hard Drive")}{fi("type","Type")}{fi("purpose","Purpose")}
            <div><Label>B/W or Color</Label><select style={sel()} value={form.bwColor} onChange={e=>set("bwColor",e.target.value)}><option value="">—</option><option value="Color">Color</option><option value="B/W">B/W</option></select></div>
          </Grid></div>}
          {showV&&<div style={{marginBottom:"28px"}}><SecTitle>Vehicle Info</SecTitle><Grid>
            {fi("make","Make")}{fi("model","Model")}{fi("vehicleYear","Year")}{fi("vehicleNumber","Vehicle #")}{fi("vin","VIN")}{fi("tag","Tag / Plate")}{fi("tagExpires","Tag Expires")}
            <div><Label>Lease/Own</Label><select style={sel()} value={form.leaseOwn} onChange={e=>set("leaseOwn",e.target.value)}><option value="">—</option><option value="Lease">Lease</option><option value="Own">Own</option><option value="Finance">Finance</option></select></div>
            {fi("monthlyPayment","Monthly Payment","$0.00")}{fi("payoffDate","Payoff Date")}{fi("bank","Bank")}{fi("insurancePolicyNum","Insurance Policy #")}{fi("insurancePolicyPayment","Insurance Payment","$0.00")}
          </Grid></div>}
          <div style={{marginBottom:"28px"}}><SecTitle>Contact / Comms</SecTitle><Grid>{fi("phoneNumber","Phone")}{fi("emailAccount","Email Account")}</Grid></div>
          <div style={{display:"flex",gap:"10px",paddingTop:"8px",borderTop:"1px solid #e5e7eb"}}>
            <Btn variant="secondary" onClick={onClose} style={{flex:1}}>Cancel</Btn>
            <Btn variant="primary" onClick={()=>onSave(form)} disabled={saving} style={{flex:2}}>{saving?"Saving…":"✓ Add Asset"}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LOCATIONS PANEL ──────────────────────────────────────────────────────────
function LocationsPanel({onClose,locations,onAdd,onUpdate,onDelete}) {
  const [form,setForm]=useState({name:"",address:"",contact:"",email:"",phone:""});
  const [editId,setEditId]=useState(null);
  const [saving,setSaving]=useState(false);
  const sf=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handleSave=async()=>{
    if(!form.name.trim()){alert("Name required");return;}
    setSaving(true);
    if(editId!=null){await onUpdate({id:editId,...form});setEditId(null);}
    else{await onAdd(form);}
    setForm({name:"",address:"",contact:"",email:"",phone:""});
    setSaving(false);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.4)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",zIndex:10,width:"540px",maxWidth:"100vw",height:"100vh",overflowY:"auto",background:"#f9fafb",borderLeft:"1px solid #e5e7eb",boxShadow:"-8px 0 40px rgba(0,0,0,0.12)"}}>
        <div style={{position:"sticky",top:0,zIndex:10,background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"18px 24px",display:"flex",alignItems:"center",gap:"14px"}}>
          <div style={{width:"42px",height:"42px",background:"#f0fdf4",border:"1px solid #86efac",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>📍</div>
          <div style={{flex:1}}>
            <div style={{color:"#16a34a",fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>MANAGE LOCATIONS</div>
            <div style={{color:"#111827",fontSize:"17px",fontWeight:700}}>{locations.length} Location{locations.length!==1?"s":""}</div>
          </div>
          <button onClick={onClose} style={{background:"#f3f4f6",border:"1px solid #e5e7eb",color:"#6b7280",cursor:"pointer",width:"34px",height:"34px",borderRadius:"8px",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"24px"}}>
          <div style={{background:"#fff",borderRadius:"12px",border:"1px solid #e5e7eb",padding:"20px",marginBottom:"24px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <div style={{color:"#111827",fontSize:"13px",fontWeight:700,marginBottom:"14px"}}>{editId!=null?"✏️ Edit Location":"➕ Add New Location"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              <div><Label>Location Name *</Label><input style={inp()} value={form.name} onChange={e=>sf("name",e.target.value)} placeholder="e.g. FPI Main Office"/></div>
              <div><Label>Address</Label><input style={inp()} value={form.address} onChange={e=>sf("address",e.target.value)}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div><Label>Contact Name</Label><input style={inp()} value={form.contact} onChange={e=>sf("contact",e.target.value)}/></div>
                <div><Label>Phone</Label><input style={inp()} value={form.phone} onChange={e=>sf("phone",e.target.value)}/></div>
              </div>
              <div><Label>Email</Label><input style={inp()} value={form.email} onChange={e=>sf("email",e.target.value)}/></div>
              <div style={{display:"flex",gap:"8px"}}>
                {editId!=null&&<Btn variant="secondary" onClick={()=>{setEditId(null);setForm({name:"",address:"",contact:"",email:"",phone:""});}} style={{flex:1}}>Cancel</Btn>}
                <Btn variant="primary" onClick={handleSave} disabled={saving} style={{flex:2}}>{saving?"Saving…":editId!=null?"✓ Update":"➕ Add Location"}</Btn>
              </div>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:"10px",paddingBottom:"40px"}}>
            {locations.length===0&&<div style={{textAlign:"center",color:"#d1d5db",padding:"32px",fontSize:"14px"}}>No locations yet.</div>}
            {locations.map(loc=>(
              <div key={loc.id} style={{background:"#fff",borderRadius:"10px",border:"1px solid #e5e7eb",padding:"14px 16px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
                  <div style={{flex:1}}>
                    <div style={{color:"#111827",fontWeight:700,fontSize:"14px",marginBottom:"3px"}}>{loc.name}</div>
                    {loc.address&&<div style={{color:"#6b7280",fontSize:"12px",marginBottom:"2px"}}>📍 {loc.address}</div>}
                    {loc.contact&&<div style={{color:"#6b7280",fontSize:"12px",marginBottom:"2px"}}>👤 {loc.contact}</div>}
                    {loc.phone&&<div style={{color:"#6b7280",fontSize:"12px",marginBottom:"2px"}}>📞 {loc.phone}</div>}
                    {loc.email&&<div style={{color:"#6b7280",fontSize:"12px"}}>✉️ {loc.email}</div>}
                  </div>
                  <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                    <button onClick={()=>{setEditId(loc.id);setForm({name:loc.name,address:loc.address||"",contact:loc.contact||"",email:loc.email||"",phone:loc.phone||""});}} style={{background:"#eff6ff",border:`1px solid ${BLUE_BORDER}`,color:BLUE_MID,cursor:"pointer",padding:"5px 10px",borderRadius:"6px",fontSize:"12px",fontWeight:600}}>Edit</button>
                    <button onClick={()=>onDelete(loc.id)} style={{background:"#fee2e2",border:"1px solid #fca5a5",color:"#dc2626",cursor:"pointer",padding:"5px 10px",borderRadius:"6px",fontSize:"12px",fontWeight:600}}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
function DetailPanel({asset,onClose,notes,onAddNote,onDeleteNote,onEdit,onLoan}) {
  const [noteText,setNoteText]=useState("");
  const [savingNote,setSavingNote]=useState(false);
  if(!asset)return null;
  const assetNotes=notes[asset.id]||[];

  const handleNote=async()=>{
    const t=noteText.trim();if(!t)return;
    setSavingNote(true);await onAddNote(asset.id,t);setNoteText("");setSavingNote(false);
  };

  const infoGroups=[
    {group:"Identification",items:[{label:"Asset #",value:asset.id},{label:"Category",value:asset.category},{label:"Serial Number",value:asset.serialNumber},{label:"Notes",value:asset.notes}]},
    {group:"Location",items:[{label:"Location",value:asset.location},{label:"Parent",value:asset.parentLocation},{label:"Address",value:asset.locationAddress},{label:"Contact",value:asset.locationContact},{label:"Email",value:asset.locationEmail},{label:"Phone",value:asset.locationPhone}]},
    {group:"Purchase Info",items:[{label:"Vendor",value:asset.vendor},{label:"Date Purchased",value:asset.datePurchased},{label:"Cost",value:asset.purchaseCost},{label:"Warranty Expires",value:asset.warrantyExpires},{label:"Created",value:asset.createdDate}]},
    {group:"Hardware",items:[{label:"Manufacturer",value:asset.manufacturer},{label:"Model",value:asset.model},{label:"Processor",value:asset.processor},{label:"RAM",value:asset.ram},{label:"Hard Drive",value:asset.hardDrive},{label:"Type",value:asset.type},{label:"Purpose",value:asset.purpose}]},
    {group:"Vehicle Info",items:[{label:"Make",value:asset.make},{label:"Model",value:asset.model},{label:"Year",value:asset.vehicleYear},{label:"Vehicle #",value:asset.vehicleNumber},{label:"VIN",value:asset.vin},{label:"Tag",value:asset.tag},{label:"Tag Expires",value:asset.tagExpires},{label:"Lease/Own",value:asset.leaseOwn},{label:"Monthly Payment",value:asset.monthlyPayment},{label:"Payoff Date",value:asset.payoffDate},{label:"Bank",value:asset.bank},{label:"Insurance #",value:asset.insurancePolicyNum},{label:"Insurance Payment",value:asset.insurancePolicyPayment}]},
    {group:"Contact / Comms",items:[{label:"Phone",value:asset.phoneNumber},{label:"Email",value:asset.emailAccount}]},
    {group:"Comments",items:[{label:"Comments",value:asset.comments,multiline:true}]},
  ];
  const relevant=infoGroups.filter(g=>g.items.some(item=>typeof item.value==="string"?item.value&&item.value.trim()!=="":item.value!=null&&item.value!==undefined));

  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(15,23,42,0.35)",backdropFilter:"blur(3px)"}}/>
      <div style={{position:"relative",zIndex:10,width:"500px",maxWidth:"100vw",height:"100vh",overflowY:"auto",background:"#f9fafb",borderLeft:"1px solid #e5e7eb",boxShadow:"-8px 0 40px rgba(0,0,0,0.1)"}}>
        <div style={{position:"sticky",top:0,zIndex:10,background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"16px 20px",display:"flex",alignItems:"flex-start",gap:"12px"}}>
          <div style={{width:"46px",height:"46px",flexShrink:0,background:BLUE_BG,border:`1px solid ${BLUE_BORDER}`,borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px"}}>
            {CATEGORY_ICONS[asset.category]||"📦"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:BLUE_MID,fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"1px"}}>ASSET #{asset.id}</div>
            <div style={{color:"#111827",fontSize:"16px",fontWeight:700,lineHeight:1.25}}>{asset.title||"Untitled"}</div>
            <div style={{color:"#9ca3af",fontSize:"12px",marginTop:"2px"}}>{asset.category}{asset.location?` · ${asset.location}`:""}</div>
          </div>
          <button onClick={onClose} style={{background:"#f3f4f6",border:"1px solid #e5e7eb",color:"#6b7280",cursor:"pointer",width:"32px",height:"32px",borderRadius:"8px",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
        </div>

        <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"12px 20px",display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
          <StatusBadge status={asset.status}/>
          <LoanBadge status={asset.loanStatus}/>
          <div style={{flex:1}}/>
          <Btn variant="ghost" onClick={()=>onEdit(asset)} style={{padding:"6px 14px",fontSize:"12px"}}>✏️ Edit</Btn>
          <Btn variant={asset.loanStatus==="out"?"success":"primary"} onClick={()=>onLoan(asset)} style={{padding:"6px 14px",fontSize:"12px"}}>
            {asset.loanStatus==="out"?"✅ Check In":"📤 Loan Out"}
          </Btn>
        </div>

        {asset.loanStatus==="out"&&(asset.loanee||asset.checkedOutBy)&&(
          <div style={{background:"#fff7ed",border:"1px solid #fed7aa",margin:"12px 16px 0",borderRadius:"10px",padding:"12px 16px",display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"20px"}}>📤</span>
            <div>
              <div style={{color:"#ea580c",fontSize:"12px",fontWeight:700}}>Currently Loaned Out</div>
              <div style={{color:"#374151",fontSize:"13px",fontWeight:600}}>{asset.loanee||asset.checkedOutBy}</div>
              {asset.checkedOutDate&&<div style={{color:"#9ca3af",fontSize:"11px"}}>Since {asset.checkedOutDate}</div>}
            </div>
          </div>
        )}

        <div style={{margin:"16px 16px 0",background:"#fff",borderRadius:"12px",border:"1px solid #e5e7eb",padding:"18px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
          <div style={{color:"#111827",fontSize:"13px",fontWeight:700,marginBottom:"14px",display:"flex",alignItems:"center",gap:"8px"}}>
            📝 Notes
            {assetNotes.length>0&&<span style={{background:BLUE_BG,color:BLUE_MID,border:`1px solid ${BLUE_BORDER}`,padding:"1px 8px",borderRadius:"20px",fontSize:"11px",fontWeight:700}}>{assetNotes.length}</span>}
          </div>
          {assetNotes.length===0?<div style={{color:"#d1d5db",fontSize:"13px",marginBottom:"12px",fontStyle:"italic"}}>No notes yet.</div>
          :<div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"12px"}}>
            {assetNotes.map(note=>(
              <div key={note.id} style={{background:"#f9fafb",border:"1px solid #f3f4f6",borderRadius:"8px",padding:"10px 12px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"4px"}}>
                  <div style={{color:"#9ca3af",fontSize:"11px"}}>🕐 {note.timestamp}</div>
                  <button onClick={()=>onDeleteNote(asset.id,note.id)} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:"14px",padding:0,lineHeight:1}}
                    onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color="#d1d5db"}>🗑</button>
                </div>
                <div style={{color:"#374151",fontSize:"13px",lineHeight:"1.6",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{note.text}</div>
              </div>
            ))}
          </div>}
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey))handleNote();}}
              placeholder="Add a note… (Ctrl+Enter to save)"
              style={{...inp({resize:"vertical",minHeight:"68px",lineHeight:"1.5",borderColor:noteText.trim()?BLUE_MID:"#d1d5db"})}}/>
            <Btn variant={noteText.trim()?"primary":"ghost"} onClick={handleNote} disabled={savingNote||!noteText.trim()} style={{alignSelf:"flex-end",padding:"7px 16px",fontSize:"12px"}}>
              {savingNote?"Saving…":"＋ Add Note"}
            </Btn>
          </div>
        </div>

        <div style={{padding:"16px 16px 40px",display:"flex",flexDirection:"column",gap:"12px"}}>
          {relevant.map(group=>(
            <div key={group.group} style={{background:"#fff",borderRadius:"12px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",overflow:"hidden",border:"1px solid #e5e7eb"}}>
              <div style={{background:BLUE_BG,padding:"9px 16px",color:BLUE_MID,fontSize:"11px",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",borderBottom:`1px solid ${BLUE_BORDER}`}}>{group.group}</div>
              <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:"10px"}}>
                {group.items.filter(item=>typeof item.value==="string"?item.value&&item.value.trim()!=="":item.value!=null&&item.value!==undefined&&item.value!=="").map(item=>(
                  <div key={item.label} style={{display:"flex",alignItems:item.multiline?"flex-start":"center",gap:"12px"}}>
                    <div style={{color:"#9ca3af",fontSize:"12px",minWidth:"120px",flexShrink:0,lineHeight:"1.6"}}>{item.label}</div>
                    <div style={{color:"#111827",fontSize:item.multiline?"12px":"13px",lineHeight:"1.6",wordBreak:"break-word",flex:1,
                      whiteSpace:item.multiline?"pre-wrap":"normal",background:item.multiline?"#f9fafb":"transparent",
                      padding:item.multiline?"10px 12px":"0",borderRadius:item.multiline?"6px":"0",border:item.multiline?"1px solid #f3f4f6":"none"
                    }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({label,value,bg,icon}) {
  return (
    <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"18px 20px",display:"flex",alignItems:"center",gap:"14px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      <div style={{width:"46px",height:"46px",background:bg,borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px"}}>{icon}</div>
      <div>
        <div style={{color:"#9ca3af",fontSize:"11px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"3px"}}>{label}</div>
        <div style={{color:"#111827",fontSize:"26px",fontWeight:800,lineHeight:1}}>{value}</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AssetTracker() {
  const [assets,setAssets]=useState([]);
  const [notes,setNotes]=useState({});
  const [locations,setLocations]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("All");
  const [statusFilter,setStatusFilter]=useState("All");
  const [loanFilter,setLoanFilter]=useState("All");
  const [selected,setSelected]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [editAsset,setEditAsset]=useState(null);
  const [loanAsset,setLoanAsset]=useState(null);
  const [showLocations,setShowLocations]=useState(false);
  const [showExport,setShowExport]=useState(false);
  const [saving,setSaving]=useState(false);
  const [sortField,setSortField]=useState("id");
  const [sortDir,setSortDir]=useState("asc");
  const [page,setPage]=useState(1);
  const pageSize=25;

  // Init DB then load all data
  useEffect(()=>{
    async function init(){
      try {
        await fetch("/api/init",{method:"POST"});
        const [aRes,nRes,lRes]=await Promise.all([fetch("/api/assets"),fetch("/api/notes"),fetch("/api/locations")]);
        const [aData,nData,lData]=await Promise.all([aRes.json(),nRes.json(),lRes.json()]);
        setAssets(aData);setNotes(nData);setLocations(lData);
      } catch(e){setError(e.message);}
      setLoading(false);
    }
    init();
  },[]);

  const nextId=useMemo(()=>{
    if(!assets.length)return 500;
    return Math.max(...assets.map(a=>parseInt(a.id)||0))+1;
  },[assets]);

  const stats=useMemo(()=>({
    total:assets.length,
    checkedOut:assets.filter(a=>a.loanStatus==="out").length,
    needsRepair:assets.filter(a=>a.status==="Broken - Needs Repair").length,
    outOfService:assets.filter(a=>a.status==="Out of Service").length,
  }),[assets]);

  // Asset CRUD
  const handleAddAsset=async(form)=>{
    setSaving(true);
    try{
      const res=await fetch("/api/assets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const newAsset=await res.json();
      setAssets(p=>[...p,newAsset]);
      setShowAdd(false);
    }catch(e){alert("Error saving asset: "+e.message);}
    setSaving(false);
  };

  const handleEditSave=async(form)=>{
    setSaving(true);
    try{
      const res=await fetch("/api/assets",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const updated=await res.json();
      setAssets(p=>p.map(a=>a.id===updated.id?updated:a));
      setSelected(updated);setEditAsset(null);
    }catch(e){alert("Error updating asset: "+e.message);}
    setSaving(false);
  };

  const handleLoanSave=async(updated)=>{
    setSaving(true);
    try{
      const res=await fetch("/api/assets",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(updated)});
      const saved=await res.json();
      setAssets(p=>p.map(a=>a.id===saved.id?saved:a));
      setSelected(saved);setLoanAsset(null);
    }catch(e){alert("Error updating loan: "+e.message);}
    setSaving(false);
  };

  // Notes CRUD
  const handleAddNote=async(assetId,text)=>{
    const timestamp=new Date().toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});
    const res=await fetch("/api/notes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({assetId,text,timestamp})});
    const note=await res.json();
    setNotes(p=>({...p,[assetId]:[...(p[assetId]||[]),note]}));
  };

  const handleDeleteNote=async(assetId,noteId)=>{
    await fetch("/api/notes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:noteId})});
    setNotes(p=>({...p,[assetId]:(p[assetId]||[]).filter(n=>n.id!==noteId)}));
  };

  // Locations CRUD
  const handleAddLocation=async(form)=>{
    const res=await fetch("/api/locations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const loc=await res.json();setLocations(p=>[...p,loc]);
  };
  const handleUpdateLocation=async(form)=>{
    const res=await fetch("/api/locations",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
    const loc=await res.json();setLocations(p=>p.map(l=>l.id===loc.id?loc:l));
  };
  const handleDeleteLocation=async(id)=>{
    if(!confirm("Delete this location?"))return;
    await fetch("/api/locations",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    setLocations(p=>p.filter(l=>l.id!==id));
  };

  // Filtering & sorting
  const filtered=useMemo(()=>{
    let r=assets;
    if(category!=="All")r=r.filter(a=>a.category===category);
    if(statusFilter!=="All")r=r.filter(a=>a.status===statusFilter);
    if(loanFilter!=="All")r=r.filter(a=>a.loanStatus===loanFilter);
    if(search.trim()){
      const q=search.trim().toLowerCase();
      r=r.filter(a=>a.id?.toLowerCase().includes(q)||a.title?.toLowerCase().includes(q)||a.location?.toLowerCase().includes(q)||a.serialNumber?.toLowerCase().includes(q)||a.loanee?.toLowerCase().includes(q)||a.make?.toLowerCase().includes(q)||a.manufacturer?.toLowerCase().includes(q)||a.tag?.toLowerCase().includes(q)||a.vin?.toLowerCase().includes(q));
    }
    return [...r].sort((a,b)=>{
      let va=a[sortField]||"",vb=b[sortField]||"";
      if(sortField==="id"){va=parseInt(va)||0;vb=parseInt(vb)||0;}
      if(va<vb)return sortDir==="asc"?-1:1;
      if(va>vb)return sortDir==="asc"?1:-1;
      return 0;
    });
  },[assets,search,category,statusFilter,loanFilter,sortField,sortDir]);

  const totalPages=Math.ceil(filtered.length/pageSize);
  const paginated=filtered.slice((page-1)*pageSize,page*pageSize);
  useEffect(()=>{setPage(1);},[search,category,statusFilter,loanFilter]);

  const handleSort=(f)=>{if(sortField===f)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortField(f);setSortDir("asc");}};
  const SortIcon=({field})=>sortField!==field?<span style={{color:"#d1d5db",marginLeft:"4px"}}>⇅</span>:<span style={{color:BLUE_MID,marginLeft:"4px"}}>{sortDir==="asc"?"↑":"↓"}</span>;
  const colStyle=(f)=>({padding:"11px 16px",textAlign:"left",color:"#6b7280",fontSize:"11px",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",background:sortField===f?BLUE_BG:"transparent",whiteSpace:"nowrap",userSelect:"none",borderBottom:"1px solid #e5e7eb"});

  const selectedLive=useMemo(()=>selected?assets.find(a=>a.id===selected.id)||selected:null,[selected,assets]);

  if(loading) return (
    <div style={{minHeight:"100vh",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"16px"}}>
      <img src={LOGO_SRC} alt="FPI" style={{height:"60px",objectFit:"contain"}}/>
      <div style={{color:"#6b7280",fontSize:"14px"}}>Loading asset inventory…</div>
    </div>
  );

  if(error) return (
    <div style={{minHeight:"100vh",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}>
      <div style={{color:"#dc2626",fontSize:"16px",fontWeight:700}}>⚠️ Failed to connect to database</div>
      <div style={{color:"#6b7280",fontSize:"13px",maxWidth:"400px",textAlign:"center"}}>{error}</div>
      <div style={{color:"#9ca3af",fontSize:"12px"}}>Check that DATABASE_URL is set in your Vercel environment variables.</div>
    </div>
  );

  return (
    <>
      <Head><title>FPI Asset Tracker</title><meta name="viewport" content="width=device-width,initial-scale=1"/><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></Head>
      <div style={{minHeight:"100vh",background:"#f3f4f6",color:"#111827",fontFamily:"'DM Sans',system-ui,sans-serif"}}>

        {/* Top Bar */}
        <div style={{background:"#fff",borderBottom:"1px solid #e5e7eb",padding:"0 32px",display:"flex",alignItems:"center",gap:"20px",height:"64px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
          <img src={LOGO_SRC} alt="FPI Security Services" style={{height:"40px",objectFit:"contain",display:"block"}}/>
          <div style={{width:"1px",height:"30px",background:"#e5e7eb"}}/>
          <div>
            <div style={{color:"#111827",fontWeight:700,fontSize:"15px",lineHeight:1.1}}>Asset Tracker</div>
            <div style={{color:"#9ca3af",fontSize:"11px",letterSpacing:"0.06em",textTransform:"uppercase"}}>Inventory Management</div>
          </div>
          <div style={{flex:1}}/>
          <button onClick={()=>setShowExport(true)} style={{display:"flex",alignItems:"center",gap:"7px",padding:"8px 16px",background:"#f0fdf4",border:"1px solid #86efac",borderRadius:"8px",color:"#16a34a",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            📊 Export
          </button>
          <button onClick={()=>setShowLocations(true)} style={{display:"flex",alignItems:"center",gap:"7px",padding:"8px 16px",background:"#f9fafb",border:"1px solid #d1d5db",borderRadius:"8px",color:"#374151",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            📍 Locations
          </button>
          <button onClick={()=>setShowAdd(true)} style={{display:"flex",alignItems:"center",gap:"8px",padding:"9px 20px",background:BLUE_MID,border:"none",borderRadius:"8px",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 2px 8px ${BLUE_MID}40`}}>
            ＋ Add Asset
          </button>
        </div>

        <div style={{padding:"28px 32px",maxWidth:"1400px",margin:"0 auto"}}>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",marginBottom:"24px"}}>
            <StatCard label="Total Assets" value={stats.total} bg={BLUE_BG} icon="📦"/>
            <StatCard label="Checked Out" value={stats.checkedOut} bg="#ffedd5" icon="📤"/>
            <StatCard label="Needs Repair" value={stats.needsRepair} bg="#fee2e2" icon="🔧"/>
            <StatCard label="Out of Service" value={stats.outOfService} bg="#f3f4f6" icon="⛔"/>
          </div>

          {/* Category Tabs */}
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"18px"}}>
            {CATEGORIES.map(cat=>{
              const count=cat==="All"?assets.length:assets.filter(a=>a.category===cat).length;
              const active=category===cat;
              return <button key={cat} onClick={()=>setCategory(cat)} style={{padding:"6px 14px",borderRadius:"20px",border:"1px solid",borderColor:active?BLUE_MID:"#d1d5db",background:active?BLUE_MID:"#fff",color:active?"#fff":"#6b7280",fontSize:"12px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:"5px",transition:"all 0.15s",fontFamily:"inherit"}}>
                {cat!=="All"&&<span>{CATEGORY_ICONS[cat]}</span>}
                {cat}
                <span style={{background:active?"rgba(255,255,255,0.25)":"#f3f4f6",color:active?"#fff":"#9ca3af",padding:"0 6px",borderRadius:"10px",fontSize:"10px",fontWeight:700}}>{count}</span>
              </button>;
            })}
          </div>

          {/* Table Card */}
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"14px",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <div style={{padding:"16px 20px",borderBottom:"1px solid #f3f4f6",display:"flex",gap:"12px",flexWrap:"wrap",alignItems:"center"}}>
              <div style={{position:"relative",flex:1,minWidth:"200px"}}>
                <span style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontSize:"15px"}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, asset #, location, serial, tag, VIN…" style={{width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"8px",color:"#111827",padding:"9px 14px 9px 38px",fontSize:"13px",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"8px",color:"#374151",padding:"9px 14px",fontSize:"13px",cursor:"pointer",outline:"none",fontFamily:"inherit"}}>
                <option value="All">All Statuses</option>
                {ALL_STATUSES.map(s=><option key={s} value={s}>{STATUS_CONFIG[s]?.label||s}</option>)}
              </select>
              <select value={loanFilter} onChange={e=>setLoanFilter(e.target.value)} style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"8px",color:"#374151",padding:"9px 14px",fontSize:"13px",cursor:"pointer",outline:"none",fontFamily:"inherit"}}>
                <option value="All">In & Out</option>
                <option value="in">Checked In</option>
                <option value="out">Checked Out</option>
              </select>
              <div style={{color:"#9ca3af",fontSize:"13px",whiteSpace:"nowrap"}}>{filtered.length} result{filtered.length!==1?"s":""}</div>
            </div>

            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#f9fafb"}}>
                    <th style={colStyle("id")} onClick={()=>handleSort("id")}># <SortIcon field="id"/></th>
                    <th style={colStyle("title")} onClick={()=>handleSort("title")}>Title <SortIcon field="title"/></th>
                    <th style={colStyle("category")} onClick={()=>handleSort("category")}>Category <SortIcon field="category"/></th>
                    <th style={colStyle("location")} onClick={()=>handleSort("location")}>Location <SortIcon field="location"/></th>
                    <th style={colStyle("status")} onClick={()=>handleSort("status")}>Status <SortIcon field="status"/></th>
                    <th style={colStyle("loanStatus")} onClick={()=>handleSort("loanStatus")}>Loan <SortIcon field="loanStatus"/></th>
                    <th style={{...colStyle("x"),cursor:"default"}}>Loanee</th>
                    <th style={{...colStyle("y"),cursor:"default"}}>Cost</th>
                    <th style={{...colStyle("z"),cursor:"default"}}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length===0
                    ?<tr><td colSpan={9} style={{padding:"56px",textAlign:"center",color:"#d1d5db",fontSize:"14px"}}>No assets match your filters</td></tr>
                    :paginated.map((asset,i)=>{
                      const nc=(notes[asset.id]||[]).length;
                      return <tr key={asset.id} onClick={()=>setSelected(asset)}
                        style={{borderBottom:"1px solid #f3f4f6",cursor:"pointer",background:"#fff",transition:"background 0.1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
                        onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                        <td style={{padding:"13px 16px",fontSize:"12px",color:BLUE_MID,fontWeight:700,fontFamily:"monospace"}}>{asset.id}</td>
                        <td style={{padding:"13px 16px",fontSize:"13px",color:"#111827",fontWeight:500,maxWidth:"200px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:"9px"}}>
                            <span style={{fontSize:"16px"}}>{CATEGORY_ICONS[asset.category]||"📦"}</span>
                            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{asset.title||"—"}</span>
                          </div>
                        </td>
                        <td style={{padding:"13px 16px",fontSize:"12px",color:"#9ca3af",whiteSpace:"nowrap"}}>{asset.category||"—"}</td>
                        <td style={{padding:"13px 16px",fontSize:"13px",color:"#6b7280",maxWidth:"180px"}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{asset.location||"—"}</div></td>
                        <td style={{padding:"13px 16px"}}><StatusBadge status={asset.status}/></td>
                        <td style={{padding:"13px 16px"}}><LoanBadge status={asset.loanStatus}/></td>
                        <td style={{padding:"13px 16px",fontSize:"13px",color:"#6b7280",maxWidth:"150px"}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{asset.loanee||asset.checkedOutBy?.split("@")[0]||"—"}</div></td>
                        <td style={{padding:"13px 16px",fontSize:"13px",color:"#16a34a",fontWeight:600,whiteSpace:"nowrap"}}>{asset.purchaseCost||"—"}</td>
                        <td style={{padding:"13px 16px"}}>
                          {nc>0?<span style={{background:BLUE_BG,color:BLUE_MID,border:`1px solid ${BLUE_BORDER}`,padding:"3px 9px",borderRadius:"20px",fontSize:"11px",fontWeight:700}}>📝 {nc}</span>:<span style={{color:"#e5e7eb"}}>—</span>}
                        </td>
                      </tr>;
                    })
                  }
                </tbody>
              </table>
            </div>

            {totalPages>1&&(
              <div style={{borderTop:"1px solid #f3f4f6",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f9fafb"}}>
                <div style={{color:"#9ca3af",fontSize:"13px"}}>Page {page} of {totalPages} · {filtered.length} assets</div>
                <div style={{display:"flex",gap:"6px"}}>
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{padding:"6px 14px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:"7px",color:page===1?"#d1d5db":"#374151",fontSize:"13px",cursor:page===1?"default":"pointer",fontFamily:"inherit"}}>← Prev</button>
                  {Array.from({length:Math.min(7,totalPages)},(_,i)=>{
                    let p;
                    if(totalPages<=7)p=i+1;
                    else if(page<=4)p=i+1;
                    else if(page>=totalPages-3)p=totalPages-6+i;
                    else p=page-3+i;
                    return <button key={p} onClick={()=>setPage(p)} style={{width:"34px",height:"34px",background:page===p?BLUE_MID:"#fff",border:`1px solid ${page===p?BLUE_MID:"#e5e7eb"}`,borderRadius:"7px",color:page===p?"#fff":"#374151",fontSize:"13px",cursor:"pointer",fontWeight:page===p?700:400,fontFamily:"inherit"}}>{p}</button>;
                  })}
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{padding:"6px 14px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:"7px",color:page===totalPages?"#d1d5db":"#374151",fontSize:"13px",cursor:page===totalPages?"default":"pointer",fontFamily:"inherit"}}>Next →</button>
                </div>
              </div>
            )}
          </div>
          <div style={{height:"40px"}}/>
        </div>

        {selectedLive&&<DetailPanel asset={selectedLive} onClose={()=>setSelected(null)} notes={notes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} onEdit={a=>setEditAsset(a)} onLoan={a=>setLoanAsset(a)}/>}
        {editAsset&&<EditModal asset={editAsset} onClose={()=>setEditAsset(null)} onSave={handleEditSave} locations={locations} saving={saving}/>}
        {loanAsset&&<LoanModal asset={loanAsset} onClose={()=>setLoanAsset(null)} onSave={handleLoanSave}/>}
        {showAdd&&<AddModal onClose={()=>setShowAdd(false)} onSave={handleAddAsset} nextId={nextId} locations={locations} saving={saving}/>}
        {showLocations&&<LocationsPanel onClose={()=>setShowLocations(false)} locations={locations} onAdd={handleAddLocation} onUpdate={handleUpdateLocation} onDelete={handleDeleteLocation}/>}
        {showExport&&<ExportModal onClose={()=>setShowExport(false)} assets={assets} filteredAssets={filtered} category={category}/>}
      </div>
    </>
  );
}
