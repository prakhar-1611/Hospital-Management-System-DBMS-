/* ============================================================
   PaymentModal.jsx
   Place this file at: src/components/PaymentModal.jsx
   ============================================================ */
import { useState } from "react";
import { btnGreenStyle } from "../constants";

export default function PaymentModal({ invoice: inv, css, onClose, onPay }) {
  const [method,     setMethod]     = useState(inv.paymentMethod || "Card");
  const [cardNum,    setCardNum]    = useState("");
  const [cardName,   setCardName]   = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv,    setCardCvv]    = useState("");
  const [processing, setProcessing] = useState(false);
  const [done,       setDone]       = useState(false);

  function handlePay(e) {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      setTimeout(() => onPay(method), 1200);
    }, 1800);
  }

  /* ── Success screen ── */
  if (done) return (
    <>
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:19999,backdropFilter:"blur(4px)"}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:css.card,width:400,padding:40,borderRadius:16,zIndex:20000,boxShadow:"0 25px 50px rgba(0,0,0,.3)",textAlign:"center",animation:"slideUp .3s ease"}}>
        <div style={{fontSize:60,marginBottom:16}}>✅</div>
        <h3 style={{color:"#22c55e",marginBottom:8}}>Payment Successful!</h3>
        <p style={{color:css.textGray,fontSize:14}}>${inv.grandTotal.toFixed(2)} received via {method}</p>
        <p style={{color:css.textGray,fontSize:12,marginTop:4}}>{inv.id} · {inv.patientName}</p>
      </div>
    </>
  );

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:19999,backdropFilter:"blur(4px)"}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:css.card,width:480,maxHeight:"88vh",overflowY:"auto",padding:28,borderRadius:16,zIndex:20000,boxShadow:"0 25px 50px rgba(0,0,0,.3)",animation:"slideUp .3s ease"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{color:"#4361ee",margin:0}}>💳 Process Payment</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:css.textGray}}>✕</button>
        </div>

        {/* Invoice summary banner */}
        <div style={{background:"linear-gradient(135deg,#4361ee,#4cc9f0)",borderRadius:12,padding:18,marginBottom:20,color:"white"}}>
          <div style={{fontSize:12,opacity:.8,marginBottom:4}}>{inv.id} · {inv.patientName}</div>
          <div style={{fontSize:28,fontWeight:800,marginBottom:2}}>${inv.grandTotal.toFixed(2)}</div>
          <div style={{fontSize:12,opacity:.8}}>{inv.doctor} · {inv.dept}</div>
        </div>

        {/* Method tabs */}
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {["Card","Cash","Insurance","Bank Transfer","UPI"].map(m => (
            <button key={m} onClick={() => setMethod(m)} type="button"
              style={{padding:"8px 14px",borderRadius:8,border:`2px solid ${method===m?"#4361ee":css.border}`,background:method===m?"#4361ee":"transparent",color:method===m?"white":css.textGray,cursor:"pointer",fontSize:12,fontWeight:method===m?700:400,transition:"all .15s"}}>
              {m==="Card"?"💳":m==="Cash"?"💵":m==="Insurance"?"🏥":m==="Bank Transfer"?"🏦":"📱"} {m}
            </button>
          ))}
        </div>

        <form onSubmit={handlePay}>

          {/* Card fields */}
          {method === "Card" && (
            <div style={{display:"grid",gap:12,marginBottom:20}}>
              <div>
                <label style={{fontSize:12,color:css.textGray,display:"block",marginBottom:5}}>Card Number</label>
                <input required value={cardNum}
                  onChange={e => setCardNum(e.target.value.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim())}
                  placeholder="1234 5678 9012 3456" maxLength={19}
                  style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13,outline:"none",letterSpacing:"1px"}}/>
              </div>
              <div>
                <label style={{fontSize:12,color:css.textGray,display:"block",marginBottom:5}}>Cardholder Name</label>
                <input required value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Full name on card"
                  style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13,outline:"none"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={{fontSize:12,color:css.textGray,display:"block",marginBottom:5}}>Expiry (MM/YY)</label>
                  <input required value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength={5}
                    style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13,outline:"none"}}/>
                </div>
                <div>
                  <label style={{fontSize:12,color:css.textGray,display:"block",marginBottom:5}}>CVV</label>
                  <input required type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value.slice(0,4))} placeholder="•••"
                    style={{width:"100%",padding:11,border:`1px solid ${css.border}`,borderRadius:8,background:css.inputBg,color:css.text,fontSize:13,outline:"none"}}/>
                </div>
              </div>
            </div>
          )}

          {/* Cash */}
          {method === "Cash" && (
            <div style={{background:css.bg,borderRadius:10,padding:16,marginBottom:20,textAlign:"center",border:`1px solid ${css.border}`}}>
              <div style={{fontSize:32,marginBottom:8}}>💵</div>
              <div style={{fontWeight:700,color:css.text,fontSize:15,marginBottom:4}}>Amount to Collect</div>
              <div style={{fontSize:28,fontWeight:800,color:"#4361ee"}}>${inv.grandTotal.toFixed(2)}</div>
              <div style={{fontSize:12,color:css.textGray,marginTop:8}}>Mark as paid after collecting cash from patient.</div>
            </div>
          )}

          {/* Insurance */}
          {method === "Insurance" && (
            <div style={{background:css.bg,borderRadius:10,padding:16,marginBottom:20,border:`1px solid ${css.border}`}}>
              <div style={{fontSize:13,color:css.text,marginBottom:10,fontWeight:600}}>Insurance Claim Details</div>
              <input placeholder="Insurance Provider"
                style={{width:"100%",padding:10,border:`1px solid ${css.border}`,borderRadius:7,background:css.card,color:css.text,fontSize:12,marginBottom:8,outline:"none"}}/>
              <input placeholder="Policy / Claim Number"
                style={{width:"100%",padding:10,border:`1px solid ${css.border}`,borderRadius:7,background:css.card,color:css.text,fontSize:12,outline:"none"}}/>
            </div>
          )}

          {/* Bank Transfer / UPI */}
          {(method === "Bank Transfer" || method === "UPI") && (
            <div style={{background:css.bg,borderRadius:10,padding:16,marginBottom:20,textAlign:"center",border:`1px solid ${css.border}`}}>
              <div style={{fontSize:32,marginBottom:8}}>{method === "UPI" ? "📱" : "🏦"}</div>
              <div style={{fontWeight:700,color:css.text,fontSize:14,marginBottom:4}}>
                {method === "UPI" ? "UPI ID: medcare@upi" : "Account: 1234567890 · IFSC: MEDC0001"}
              </div>
              <div style={{fontSize:12,color:css.textGray,marginTop:6}}>Confirm once transfer is received.</div>
            </div>
          )}

          <button type="submit" disabled={processing}
            style={{...btnGreenStyle,width:"100%",padding:13,fontSize:14,opacity:processing?0.7:1,cursor:processing?"wait":"pointer"}}>
            {processing
              ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                  <span style={{width:16,height:16,border:"2px solid white",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin 0.6s linear infinite"}}/>
                  Processing...
                </span>
              : `✅ Confirm Payment · $${inv.grandTotal.toFixed(2)}`
            }
          </button>
        </form>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
