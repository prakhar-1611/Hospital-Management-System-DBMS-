/* ============================================================
   LoginScreen.jsx
   Place this file at: src/components/LoginScreen.jsx
   ============================================================ */
import { useState } from "react";
import { btnStyle } from "../constants";

export default function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#4361ee,#4cc9f0)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50000}}>
      <div style={{background:"rgba(255,255,255,.96)",padding:44,borderRadius:20,width:400,textAlign:"center",boxShadow:"0 20px 40px rgba(0,0,0,.2)"}}>
        <div style={{fontSize:52,marginBottom:16}}>🏥</div>
        <h2 style={{marginBottom:6,color:"#1e2535"}}>MedCare OS</h2>
        <p style={{color:"#666",marginBottom:28,fontSize:14}}>Secure Hospital Portal</p>
        <input value={user} onChange={e=>setUser(e.target.value)} placeholder="Username (admin)"
          style={{width:"100%",padding:13,border:"2px solid #e0e0e0",borderRadius:10,marginBottom:12,fontSize:14,outline:"none"}}/>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password (123)"
          onKeyDown={e=>e.key==="Enter"&&onLogin(user,pass)}
          style={{width:"100%",padding:13,border:"2px solid #e0e0e0",borderRadius:10,marginBottom:18,fontSize:14,outline:"none"}}/>
        <button onClick={()=>onLogin(user,pass)} style={{...btnStyle,width:"100%",padding:13,fontSize:15}}>Access System</button>
        <p style={{marginTop:18,fontSize:12,color:"#aaa"}}>Hint: admin / 123</p>
      </div>
    </div>
  );
}
