/* ============================================================
   CreateInvoiceModal.jsx
   Place this file at: src/components/CreateInvoiceModal.jsx
   ============================================================ */
import { useState } from "react";
import { SERVICE_CATALOG, DEPT_FEES, getTodayPlus, btnStyle, btnOutlineStyle } from "../constants";

export default function CreateInvoiceModal({ patient, patients, css, onClose, onCreate }) {
  const [selectedPatient, setSelectedPatient] = useState(patient || null);
  const [lineItems,   setLineItems]   = useState([]);
  const [discount,    setDiscount]    = useState(0);
  const [payMethod,   setPayMethod]   = useState("Card");
  const [dueDate,     setDueDate]     = useState(getTodayPlus(14));
  const [newService,  setNewService]  = useState(SERVICE_CATALOG[0].id);
  const [newQty,      setNewQty]      = useState(1);
  const [customPrice, setCustomPrice] = useState("");

  const dept = selectedPatient?.dept || "General";
  const fees = DEPT_FEES[dept] || DEPT_FEES.General;

  function getUnitPrice(serviceId) {
    const cat = SERVICE_CATALOG.find(s => s.id === serviceId);
    if (cat?.price !== undefined && cat.price !== 0) return cat.price;
    if (serviceId === "consultation") return fees.consultation;
    if (serviceId === "procedure")    return fees.procedure;
    if (serviceId === "bed")          return fees.bed;
    if (serviceId === "pharmacy")     return parseFloat(customPrice) || 0;
    return cat?.price || 0;
  }

  function addLine() {
    const cat  = SERVICE_CATALOG.find(s => s.id === newService);
    const unit = newService === "pharmacy" ? (parseFloat(customPrice) || 0) : getUnitPrice(newService);
    if (unit <= 0 && newService !== "pharmacy") return;
    setLineItems(prev => [...prev, { serviceId:newService, label:cat.label, qty:parseInt(newQty)||1, unitPrice:unit, total:unit*(parseInt(newQty)||1) }]);
    setNewQty(1); setCustomPrice("");
  }

  function removeLine(i) { setLineItems(prev => prev.filter((_, idx) => idx !== i)); }
  function updateQty(i, qty) { setLineItems(prev => prev.map((l, idx) => idx===i ? {...l,qty,total:l.unitPrice*qty} : l)); }

  const subtotal  = lineItems.reduce((s, l) => s + l.total, 0);
  const taxAmt    = (subtotal - discount) * 0.09;
  const grandTotal = subtotal - discount + taxAmt;

  function handleCreate() {
    if (!selectedPatient) { alert("Please select a patient."); return; }
    if (lineItems.length === 0) { alert("Please add at least one service."); return; }
    onCreate({
      patientId:selectedPatient.id, patientName:selectedPatient.name,
      doctor:selectedPatient.doctor, dept:selectedPatient.dept||"General",
      date:getTodayPlus(0), dueDate,
      lineItems, subtotal, discount:parseFloat(discount)||0,
      tax:parseFloat(taxAmt.toFixed(2)), grandTotal:parseFloat(grandTotal.toFixed(2)),
      paymentMethod:payMethod,
    });
  }

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:19999,backdropFilter:"blur(4px)"}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:css.card,width:680,maxHeight:"90vh",overflowY:"auto",padding:28,borderRadius:16,zIndex:20000,boxShadow:"0 25px 50px rgba(0,0,0,.3)",animation:"slideUp .3s ease"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <h3 style={{color:"#4361ee",marginBottom:2}}>💳 Create Invoice</h3>
            <p style={{color:css.textGray,fontSize:12}}>Generate a billing invoice for a patient</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:css.textGray}}>✕</button>
        </div>

        {/* Patient select */}
        <div style={{marginBottom:18}}>
          <label style={{fontSize:12,fontWeight:600,color:css.textGray,display:"block",marginBottom:6}}>Patient *</label>
          <select value={selectedPatient?.id||""} onChange={e => { const p = patients.find(x => x.id === parseInt(e.target.value)); setSelectedPatient(p||null); }}
            style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13}}>
            <option value="">-- Select patient --</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name} · {p.condition} · {p.doctor}</option>)}
          </select>
          {selectedPatient && (
            <div style={{marginTop:8,padding:"8px 12px",background:css.bg,borderRadius:8,fontSize:12,color:css.textGray,display:"flex",gap:16}}>
              <span>🏥 Dept: <strong style={{color:css.text}}>{selectedPatient.dept||"General"}</strong></span>
              <span>📋 Status: <strong style={{color:css.text}}>{selectedPatient.status}</strong></span>
              <span>👨‍⚕️ <strong style={{color:css.text}}>{selectedPatient.doctor}</strong></span>
            </div>
          )}
        </div>

        {/* Due date & method */}
        <div style={{marginBottom:18,display:"flex",gap:16,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:160}}>
            <label style={{fontSize:12,fontWeight:600,color:css.textGray,display:"block",marginBottom:6}}>Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{width:"100%",padding:10,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13}}/>
          </div>
          <div style={{flex:1,minWidth:160}}>
            <label style={{fontSize:12,fontWeight:600,color:css.textGray,display:"block",marginBottom:6}}>Payment Method</label>
            <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
              style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13}}>
              {["Card","Cash","Insurance","Bank Transfer","UPI"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Add service */}
        <div style={{background:css.bg,borderRadius:10,padding:14,marginBottom:18,border:`1px solid ${css.border}`}}>
          <label style={{fontSize:12,fontWeight:600,color:css.text,display:"block",marginBottom:10}}>➕ Add Service</label>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{flex:2,minWidth:180}}>
              <label style={{fontSize:11,color:css.textGray,display:"block",marginBottom:4}}>Service</label>
              <select value={newService} onChange={e => setNewService(e.target.value)}
                style={{width:"100%",padding:9,border:`1px solid ${css.border}`,borderRadius:7,background:css.card,color:css.text,fontSize:12}}>
                {SERVICE_CATALOG.map(s => <option key={s.id} value={s.id}>{s.label} ({s.category})</option>)}
              </select>
            </div>
            <div style={{width:70}}>
              <label style={{fontSize:11,color:css.textGray,display:"block",marginBottom:4}}>Qty</label>
              <input type="number" min="1" value={newQty} onChange={e => setNewQty(parseInt(e.target.value)||1)}
                style={{width:"100%",padding:9,border:`1px solid ${css.border}`,borderRadius:7,background:css.card,color:css.text,fontSize:12,outline:"none"}}/>
            </div>
            <div style={{width:120}}>
              <label style={{fontSize:11,color:css.textGray,display:"block",marginBottom:4}}>
                Unit Price {newService !== "pharmacy" && <span style={{color:"#4361ee"}}>($)</span>}
              </label>
              {newService === "pharmacy"
                ? <input type="number" min="0" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="Enter price"
                    style={{width:"100%",padding:9,border:`1px solid ${css.border}`,borderRadius:7,background:css.card,color:css.text,fontSize:12,outline:"none"}}/>
                : <input readOnly value={"$"+getUnitPrice(newService).toFixed(2)}
                    style={{width:"100%",padding:9,border:`1px solid ${css.border}`,borderRadius:7,background:css.inputBg,color:css.textGray,fontSize:12}}/>
              }
            </div>
            <button type="button" onClick={addLine} style={{...btnStyle,padding:"9px 16px",fontSize:12,flexShrink:0}}>Add</button>
          </div>
        </div>

        {/* Line items */}
        {lineItems.length > 0 && (
          <div style={{marginBottom:18}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Service","Qty","Unit Price","Total",""].map(h => <th key={h} style={{textAlign:"left",padding:"8px 10px",color:css.textGray,fontSize:11,borderBottom:`1px solid ${css.border}`}}>{h}</th>)}</tr></thead>
              <tbody>
                {lineItems.map((l, i) => (
                  <tr key={i}>
                    <td style={{padding:"10px 10px",color:css.text,fontSize:12}}>{l.label}</td>
                    <td style={{padding:"10px 10px"}}>
                      <input type="number" min="1" value={l.qty} onChange={e => updateQty(i, parseInt(e.target.value)||1)}
                        style={{width:50,padding:"4px 6px",border:`1px solid ${css.border}`,borderRadius:5,background:css.inputBg,color:css.text,fontSize:12,outline:"none"}}/>
                    </td>
                    <td style={{padding:"10px 10px",color:css.textGray,fontSize:12}}>${l.unitPrice.toFixed(2)}</td>
                    <td style={{padding:"10px 10px",color:css.text,fontSize:12,fontWeight:700}}>${l.total.toFixed(2)}</td>
                    <td style={{padding:"10px 10px"}}><button onClick={() => removeLine(i)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:16}}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div style={{background:css.bg,borderRadius:10,padding:16,marginBottom:20,border:`1px solid ${css.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13,color:css.textGray}}>
            <span>Subtotal</span><span style={{color:css.text,fontWeight:600}}>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13,color:css.textGray,alignItems:"center"}}>
            <span>Discount ($)</span>
            <input type="number" min="0" max={subtotal} value={discount} onChange={e => setDiscount(parseFloat(e.target.value)||0)}
              style={{width:100,padding:"4px 8px",border:`1px solid ${css.border}`,borderRadius:6,background:css.card,color:css.text,fontSize:12,textAlign:"right",outline:"none"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13,color:css.textGray}}>
            <span>Tax (9%)</span><span style={{color:css.text}}>${taxAmt.toFixed(2)}</span>
          </div>
          <div style={{height:1,background:css.border,margin:"10px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:800,color:"#4361ee"}}>
            <span>TOTAL DUE</span><span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={btnOutlineStyle(css)}>Cancel</button>
          <button onClick={handleCreate} disabled={lineItems.length===0||!selectedPatient}
            style={{...btnStyle,opacity:lineItems.length===0||!selectedPatient?0.5:1,cursor:lineItems.length===0||!selectedPatient?"not-allowed":"pointer"}}>
            💳 Generate Invoice
          </button>
        </div>
      </div>
    </>
  );
}
