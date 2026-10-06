/* ============================================================
   PatientsSection.jsx
   Place this file at: src/components/PatientsSection.jsx
   ============================================================ */
import { btnStyle, btnOutlineStyle } from "../constants";

export default function PatientsSection({ patients, invoices, css, onNavigate, onDownload, onCreateInvoice, onViewInvoice }) {
  const statusBadge = s => ({
    Admitted:  { bg:"#fee2e2", c:"#991b1b" },
    ICU:       { bg:"#fef9c3", c:"#854d0e" },
    Discharged:{ bg:"#dcfce7", c:"#166534" },
  }[s] || { bg:"#e5e7eb", c:"#374151" });

  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      <div style={{background:css.card,padding:24,borderRadius:14,border:`1px solid ${css.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{color:css.text}}>Patient Records</h3>
          <button onClick={() => onNavigate("appointments")} style={btnStyle}>+ New Admission</button>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:620}}>
            <thead>
              <tr>{["ID","Name","Condition","Doctor","Status","Invoice","Record"].map(h => (
                <th key={h} style={{textAlign:"left",padding:"10px 14px",color:css.textGray,fontSize:12,borderBottom:`1px solid ${css.border}`}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {patients.map(p => {
                const b          = statusBadge(p.status);
                const ptInvoices = invoices.filter(i => i.patientId === p.id || i.patientName === p.name);
                const latestInv  = ptInvoices[0];
                const invStatusColor = { Paid:"#166534", Unpaid:"#854d0e", Voided:"#6b7280" };
                const invStatusBg    = { Paid:"#dcfce7", Unpaid:"#fef9c3", Voided:"#f3f4f6" };
                return (
                  <tr key={p.id}>
                    <td style={{padding:"12px 14px",color:css.textGray,fontSize:12}}>#{p.id}</td>
                    <td style={{padding:"12px 14px",color:css.text,fontSize:13,fontWeight:600}}>{p.name}</td>
                    <td style={{padding:"12px 14px",color:css.text,fontSize:13}}>{p.condition}</td>
                    <td style={{padding:"12px 14px",color:css.text,fontSize:13}}>{p.doctor}</td>
                    <td style={{padding:"12px 14px"}}><span style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:b.bg,color:b.c}}>{p.status}</span></td>
                    <td style={{padding:"12px 14px"}}>
                      {latestInv
                        ? <button onClick={() => onViewInvoice(latestInv)} style={{padding:"4px 10px",border:`1px solid ${invStatusBg[latestInv.status]}`,borderRadius:7,background:invStatusBg[latestInv.status],color:invStatusColor[latestInv.status],fontSize:11,cursor:"pointer",fontWeight:600}}>
                            {latestInv.id} · {latestInv.status}
                          </button>
                        : <button onClick={() => onCreateInvoice(p)} style={{...btnStyle,padding:"4px 10px",fontSize:11}}>+ Invoice</button>
                      }
                    </td>
                    <td style={{padding:"12px 14px"}}>
                      <button onClick={() => onDownload(p)} style={{...btnOutlineStyle(css),padding:"5px 12px",fontSize:12,borderRadius:7}}>⬇ Slip</button>
                    </td>
                  </tr>
                );
              })}
              {patients.length === 0 && (
                <tr><td colSpan={7} style={{padding:24,textAlign:"center",color:css.textGray,fontSize:13}}>No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
