/* ============================================================
   BillingSection.jsx
   Place this file at: src/components/BillingSection.jsx
   ============================================================ */
import { useState } from "react";
import { getTodayPlus, btnStyle, btnGreenStyle, btnOutlineStyle } from "../constants";

export default function BillingSection({ invoices, patients, css, onCreateInvoice, onViewInvoice, onPay, onPrint }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = invoices.filter(inv => {
    const matchStatus = filter === "All" || inv.status === filter;
    const matchSearch = inv.patientName.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPaid   = invoices.filter(i => i.status==="Paid").reduce((s,i) => s+i.grandTotal, 0);
  const totalUnpaid = invoices.filter(i => i.status==="Unpaid").reduce((s,i) => s+i.grandTotal, 0);
  const totalVoided = invoices.filter(i => i.status==="Voided").reduce((s,i) => s+i.grandTotal, 0);

  const summaryCards = [
    { label:"Total Collected",      value:"$"+totalPaid.toLocaleString(undefined,{minimumFractionDigits:2}),   icon:"✅", bg:"#dcfce7", c:"#166534" },
    { label:"Outstanding",          value:"$"+totalUnpaid.toLocaleString(undefined,{minimumFractionDigits:2}), icon:"⏳", bg:"#fef9c3", c:"#854d0e" },
    { label:"Voided / Written Off", value:"$"+totalVoided.toLocaleString(undefined,{minimumFractionDigits:2}), icon:"❌", bg:"#fee2e2", c:"#991b1b" },
    { label:"Total Invoices",       value:invoices.length,                                                      icon:"📄", bg:"#dbeafe", c:"#1e40af" },
  ];

  const statusStyle = {
    Paid:   { bg:"#dcfce7", c:"#166534" },
    Unpaid: { bg:"#fef9c3", c:"#854d0e" },
    Voided: { bg:"#f3f4f6", c:"#6b7280" },
  };

  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:24}}>
        {summaryCards.map(s => (
          <div key={s.label} style={{background:css.card,padding:18,borderRadius:12,border:`1px solid ${css.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{color:css.textGray,fontSize:11,marginBottom:4}}>{s.label}</div>
              <div style={{fontWeight:800,fontSize:20,color:css.text}}>{s.value}</div>
            </div>
            <div style={{width:42,height:42,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div style={{background:css.card,padding:24,borderRadius:14,border:`1px solid ${css.border}`}}>
        {/* Toolbar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:12}}>
          <h3 style={{color:css.text}}>Invoices</h3>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient / invoice..."
              style={{padding:"8px 14px",border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:12,outline:"none",width:200}}/>
            {["All","Paid","Unpaid","Voided"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${filter===f?"#4361ee":css.border}`,background:filter===f?"#4361ee":"transparent",color:filter===f?"white":css.textGray,cursor:"pointer",fontSize:12,fontWeight:filter===f?600:400}}>{f}</button>
            ))}
            <button onClick={onCreateInvoice} style={{...btnStyle,padding:"8px 16px",fontSize:12}}>+ New Invoice</button>
          </div>
        </div>

        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:720}}>
            <thead>
              <tr>{["Invoice #","Patient","Doctor","Dept","Date","Due","Total","Status","Actions"].map(h => (
                <th key={h} style={{textAlign:"left",padding:"10px 14px",color:css.textGray,fontSize:11,fontWeight:600,borderBottom:`1px solid ${css.border}`}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const s         = statusStyle[inv.status] || statusStyle.Unpaid;
                const isOverdue = inv.status === "Unpaid" && inv.dueDate < getTodayPlus(0);
                return (
                  <tr key={inv.id} style={{transition:"background .15s"}}>
                    <td style={{padding:"12px 14px",color:"#4361ee",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={() => onViewInvoice(inv)}>{inv.id}</td>
                    <td style={{padding:"12px 14px",color:css.text,fontSize:13,fontWeight:600}}>{inv.patientName}</td>
                    <td style={{padding:"12px 14px",color:css.text,fontSize:12}}>{inv.doctor}</td>
                    <td style={{padding:"12px 14px",color:css.textGray,fontSize:12}}>{inv.dept}</td>
                    <td style={{padding:"12px 14px",color:css.textGray,fontSize:12}}>{inv.date}</td>
                    <td style={{padding:"12px 14px",fontSize:12,color:isOverdue?"#ef4444":css.textGray,fontWeight:isOverdue?700:400}}>{inv.dueDate}{isOverdue && " ⚠"}</td>
                    <td style={{padding:"12px 14px",color:css.text,fontSize:13,fontWeight:700}}>${inv.grandTotal.toFixed(2)}</td>
                    <td style={{padding:"12px 14px"}}>
                      <span style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:s.bg,color:s.c}}>{inv.status}</span>
                      {inv.paidOn && <div style={{fontSize:10,color:css.textGray,marginTop:2}}>{inv.paymentMethod} · {inv.paidOn}</div>}
                    </td>
                    <td style={{padding:"12px 14px"}}>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={() => onViewInvoice(inv)} style={{...btnOutlineStyle(css),padding:"4px 10px",fontSize:11,borderRadius:6}}>View</button>
                        {inv.status === "Unpaid" && <button onClick={() => onPay(inv)} style={{...btnGreenStyle,padding:"4px 10px",fontSize:11}}>Pay</button>}
                        <button onClick={() => onPrint(inv)} style={{...btnOutlineStyle(css),padding:"4px 10px",fontSize:11,borderRadius:6}}>🖨</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{padding:28,textAlign:"center",color:css.textGray,fontSize:13}}>No invoices match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
