/* ============================================================
   ViewInvoiceModal.jsx
   Place this file at: src/components/ViewInvoiceModal.jsx
   ============================================================ */
import { btnStyle, btnGreenStyle, btnOutlineStyle } from "../constants";

export default function ViewInvoiceModal({ invoice: inv, css, onClose, onPay, onPrint, onVoid }) {
  const statusStyle = {
    Paid:   { bg:"#dcfce7", c:"#166534" },
    Unpaid: { bg:"#fef9c3", c:"#854d0e" },
    Voided: { bg:"#f3f4f6", c:"#6b7280" },
  };
  const s = statusStyle[inv.status] || statusStyle.Unpaid;

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:19999,backdropFilter:"blur(4px)"}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:css.card,width:600,maxHeight:"88vh",overflowY:"auto",padding:28,borderRadius:16,zIndex:20000,boxShadow:"0 25px 50px rgba(0,0,0,.3)",animation:"slideUp .3s ease"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
              <h3 style={{color:"#4361ee",margin:0}}>🧾 {inv.id}</h3>
              <span style={{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700,background:s.bg,color:s.c}}>{inv.status}</span>
            </div>
            <p style={{color:css.textGray,fontSize:12,margin:0}}>Generated {inv.date} · Due {inv.dueDate}</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:css.textGray}}>✕</button>
        </div>

        {/* Patient info */}
        <div style={{background:css.bg,borderRadius:10,padding:14,marginBottom:18,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,border:`1px solid ${css.border}`}}>
          {[["Patient",inv.patientName],["Doctor",inv.doctor],["Department",inv.dept],["Payment Method",inv.paymentMethod||"—"]].map(([k,v]) => (
            <div key={k}>
              <div style={{fontSize:10,color:css.textGray,marginBottom:2}}>{k}</div>
              <div style={{fontSize:13,fontWeight:600,color:css.text}}>{v}</div>
            </div>
          ))}
          {inv.paidOn && (
            <div>
              <div style={{fontSize:10,color:css.textGray,marginBottom:2}}>Paid On</div>
              <div style={{fontSize:13,fontWeight:600,color:"#166534"}}>✅ {inv.paidOn}</div>
            </div>
          )}
        </div>

        {/* Line items */}
        <div style={{marginBottom:18}}>
          <h4 style={{color:css.text,marginBottom:10,fontSize:13}}>Services</h4>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr>{["Service","Qty","Unit Price","Total"].map(h => (
                <th key={h} style={{textAlign:"left",padding:"8px 10px",color:css.textGray,fontSize:11,borderBottom:`1px solid ${css.border}`}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {inv.lineItems.map((l, i) => (
                <tr key={i}>
                  <td style={{padding:"10px 10px",color:css.text,fontSize:13}}>{l.label}</td>
                  <td style={{padding:"10px 10px",color:css.textGray,fontSize:12}}>×{l.qty}</td>
                  <td style={{padding:"10px 10px",color:css.textGray,fontSize:12}}>${l.unitPrice.toFixed(2)}</td>
                  <td style={{padding:"10px 10px",color:css.text,fontSize:13,fontWeight:600}}>${l.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{background:css.bg,borderRadius:10,padding:14,marginBottom:20,border:`1px solid ${css.border}`}}>
          {[["Subtotal",`$${inv.subtotal.toFixed(2)}`],["Discount",`-$${inv.discount.toFixed(2)}`],["Tax (9%)",`$${inv.tax.toFixed(2)}`]].map(([k,v]) => (
            <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13,color:css.textGray}}>
              <span>{k}</span><span style={{color:css.text}}>{v}</span>
            </div>
          ))}
          <div style={{height:1,background:css.border,margin:"8px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:17,fontWeight:800,color:"#4361ee"}}>
            <span>TOTAL</span><span>${inv.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
          {inv.status === "Unpaid" && <button onClick={onVoid} style={{...btnOutlineStyle(css),borderColor:"#ef4444",color:"#ef4444"}}>🗑 Void</button>}
          <button onClick={onPrint} style={btnOutlineStyle(css)}>🖨 Print</button>
          {inv.status === "Unpaid" && <button onClick={onPay} style={btnGreenStyle}>💳 Process Payment</button>}
          <button onClick={onClose} style={btnStyle}>Close</button>
        </div>
      </div>
    </>
  );
}
