/* ============================================================
   constants.js — UI constants, the billing price list and theme tokens.
   Departments, doctors, patients and appointments are NOT defined here any
   more: they are loaded from MongoDB through src/api.js after login.
   Billing (DEPT_FEES, SERVICE_CATALOG, INITIAL_INVOICES) is front-end only.
   ============================================================ */

export function getTodayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const DEPT_FEES = {
  Cardiology:      { consultation: 300, procedure: 1800, bed: 450 },
  Neurology:       { consultation: 280, procedure: 1600, bed: 420 },
  Orthopedics:     { consultation: 260, procedure: 2200, bed: 400 },
  General:         { consultation: 150, procedure:  800, bed: 300 },
  Gastroenterology:{ consultation: 240, procedure: 1400, bed: 380 },
  Surgery:         { consultation: 320, procedure: 3500, bed: 500 },
  Pediatrics:      { consultation: 180, procedure:  900, bed: 350 },
};

export const SERVICE_CATALOG = [
  { id: "consultation", label: "Consultation Fee",    category: "Clinical" },
  { id: "procedure",    label: "Procedure / Treatment",category: "Clinical" },
  { id: "bed",          label: "Bed Charges (per day)",category: "Ward"    },
  { id: "xray",         label: "X-Ray / Imaging",     category: "Diagnostic", price: 180 },
  { id: "lab",          label: "Lab Tests (Panel)",    category: "Diagnostic", price: 220 },
  { id: "mri",          label: "MRI Scan",             category: "Diagnostic", price: 950 },
  { id: "pharmacy",     label: "Pharmacy / Medication",category: "Pharmacy",   price: 0   },
  { id: "ambulance",    label: "Ambulance Service",    category: "Emergency",  price: 350 },
  { id: "icu",          label: "ICU Charges (per day)",category: "Critical",   price: 1200},
  { id: "physio",       label: "Physiotherapy Session",category: "Rehab",      price: 140 },
];

// sample invoices for the billing demo (front-end only; the patient names are not in MongoDB)
export const INITIAL_INVOICES = [
  {
    id:"INV-0001", patientId:102, patientName:"Alice Wonderland", doctor:"Dr. James Wilson",
    dept:"Neurology", date:getTodayPlus(-5), dueDate:getTodayPlus(0),
    lineItems:[
      { serviceId:"consultation", label:"Consultation Fee",    qty:1, unitPrice:280, total:280 },
      { serviceId:"lab",          label:"Lab Tests (Panel)",   qty:1, unitPrice:220, total:220 },
    ],
    subtotal:500, discount:0, tax:45, grandTotal:545,
    paymentMethod:"Card", status:"Paid", paidOn:getTodayPlus(-4),
  },
  {
    id:"INV-0002", patientId:105, patientName:"Chen Wei", doctor:"Dr. Lisa Wong",
    dept:"Gastroenterology", date:getTodayPlus(-4), dueDate:getTodayPlus(1),
    lineItems:[
      { serviceId:"consultation", label:"Consultation Fee",    qty:1, unitPrice:240, total:240 },
      { serviceId:"procedure",    label:"Procedure / Treatment",qty:1, unitPrice:1400,total:1400},
      { serviceId:"bed",          label:"Bed Charges (per day)",qty:2, unitPrice:380, total:760 },
      { serviceId:"pharmacy",     label:"Pharmacy / Medication",qty:1, unitPrice:85,  total:85  },
    ],
    subtotal:2485, discount:50, tax:219.15, grandTotal:2654.15,
    paymentMethod:"Cash", status:"Paid", paidOn:getTodayPlus(-2),
  },
  {
    id:"INV-0003", patientId:103, patientName:"Robert Stark", doctor:"Dr. Emily Davis",
    dept:"Orthopedics", date:getTodayPlus(-1), dueDate:getTodayPlus(7),
    lineItems:[
      { serviceId:"consultation", label:"Consultation Fee",     qty:1, unitPrice:260, total:260 },
      { serviceId:"xray",         label:"X-Ray / Imaging",      qty:2, unitPrice:180, total:360 },
      { serviceId:"procedure",    label:"Procedure / Treatment", qty:1, unitPrice:2200,total:2200},
      { serviceId:"bed",          label:"Bed Charges (per day)", qty:1, unitPrice:400, total:400 },
    ],
    subtotal:3220, discount:0, tax:289.8, grandTotal:3509.8,
    paymentMethod:"Insurance", status:"Unpaid", paidOn:null,
  },
];

export const DIAGNOSES = {
  Head:  ["Migraine","Concussion","Vision Loss","Sinusitis"],
  Torso: ["Chest Pain","Asthma","Arrhythmia","Rib Fracture","Bronchitis"],
  Arm:   ["Fracture (Radius)","Carpal Tunnel","Dislocation","Burn"],
  Leg:   ["ACL Tear","Fracture (Femur)","DVT","Sprain"],
};

export const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const DAY_FULL  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export function generateTimeSlots(start, end) {
  const slots = [];
  let [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  while (sh*60+sm < eh*60+em) {
    slots.push(`${String(sh).padStart(2,"0")}:${String(sm).padStart(2,"0")}`);
    sm += 60; if (sm >= 60) { sh++; sm -= 60; }
  }
  return slots;
}

let invoiceCounter = INITIAL_INVOICES.length + 1;
export function nextInvoiceId() {
  return `INV-${String(invoiceCounter++).padStart(4,"0")}`;
}

/* ============================================================
   THEME TOKENS
   ============================================================ */
export const light = { bg:"#f3f4f8", card:"#ffffff", text:"#1e2535", textGray:"#6b7280", border:"#e5e7eb", inputBg:"#f9fafb" };
export const dark  = { bg:"#0f172a", card:"#1e293b", text:"#f1f5f9", textGray:"#94a3b8", border:"#334155", inputBg:"#334155" };
export const btnStyle      = { padding:"9px 20px",border:"none",borderRadius:8,cursor:"pointer",background:"#4361ee",color:"white",fontSize:13,fontWeight:600 };
export const btnGreenStyle = { padding:"9px 20px",border:"none",borderRadius:8,cursor:"pointer",background:"#22c55e",color:"white",fontSize:13,fontWeight:600 };
export const btnRedStyle   = { padding:"9px 20px",border:"none",borderRadius:8,cursor:"pointer",background:"#ef4444",color:"white",fontSize:13,fontWeight:600 };
export function btnOutlineStyle(css) {
  return { padding:"9px 20px",border:`1px solid ${css.border}`,borderRadius:8,cursor:"pointer",background:"transparent",color:css.text,fontSize:13 };
}
