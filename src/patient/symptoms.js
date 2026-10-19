/* ============================================================
   symptoms.js — what the "Help me choose" body map offers.
   Every body area / category lists everyday symptoms (not diagnoses),
   and each symptom points to one of the 12 departments by name.
   Coverage: Cardiology, Neurology, Orthopedics, General, Gastroenterology,
   Surgery, Pediatrics, Dermatology, ENT, Ophthalmology, Psychiatry, Oncology.
   ============================================================ */

// areas drawn on the body figure
export const BODY_AREAS = {
  head:      { label: "Head & brain", symptoms: [
    ["Headache or migraine", "Neurology"], ["Dizziness or fainting", "Neurology"], ["Fits or seizures", "Neurology"],
    ["Memory or concentration problems", "Neurology"], ["Head injury", "Neurology"], ["Hair loss or dandruff", "Dermatology"] ] },
  eyes:      { label: "Eyes", symptoms: [
    ["Blurred or weak vision", "Ophthalmology"], ["Red, itchy or watery eyes", "Ophthalmology"], ["Eye pain or injury", "Ophthalmology"],
    ["Cloudy vision (cataract)", "Ophthalmology"], ["Eye test / new glasses", "Ophthalmology"] ] },
  ent:       { label: "Ears, nose & throat", symptoms: [
    ["Ear pain or discharge", "ENT"], ["Hearing loss or ringing", "ENT"], ["Sore throat or tonsils", "ENT"],
    ["Blocked nose or sinus pain", "ENT"], ["Nosebleeds", "ENT"], ["Hoarse voice", "ENT"] ] },
  neck:      { label: "Neck", symptoms: [
    ["Neck pain or stiffness", "Orthopedics"], ["Swelling in the neck (thyroid)", "General"], ["Lump in the neck", "Oncology"] ] },
  chest:     { label: "Chest & heart", symptoms: [
    ["Chest pain or tightness", "Cardiology"], ["Fast or irregular heartbeat", "Cardiology"], ["Breathless on walking", "Cardiology"],
    ["High blood pressure", "Cardiology"], ["Cough for more than 2 weeks", "General"], ["Breast lump", "Oncology"] ] },
  abdomen:   { label: "Stomach & abdomen", symptoms: [
    ["Stomach pain", "Gastroenterology"], ["Acidity or heartburn", "Gastroenterology"], ["Vomiting or diarrhoea", "Gastroenterology"],
    ["Constipation or blood in stool", "Gastroenterology"], ["Yellow eyes / jaundice", "Gastroenterology"],
    ["Pain low on the right side", "Surgery"], ["Bulge in the groin (hernia)", "Surgery"] ] },
  arms:      { label: "Arms & hands", symptoms: [
    ["Shoulder or elbow pain", "Orthopedics"], ["Wrist or hand pain", "Orthopedics"], ["Fracture or sprain", "Orthopedics"],
    ["Numbness or tingling in hands", "Neurology"], ["Rash on the arms", "Dermatology"] ] },
  legs:      { label: "Legs & feet", symptoms: [
    ["Knee pain", "Orthopedics"], ["Hip or ankle pain", "Orthopedics"], ["Sports injury", "Orthopedics"],
    ["Swollen feet or ankles", "Cardiology"], ["Varicose veins", "Surgery"], ["Foot wound that won't heal", "Surgery"] ] },
  upperBack: { label: "Upper back", symptoms: [
    ["Upper back pain", "Orthopedics"], ["Pain between the shoulder blades", "Orthopedics"], ["Rash or spots on the back", "Dermatology"] ] },
  lowerBack: { label: "Lower back", symptoms: [
    ["Lower back pain", "Orthopedics"], ["Pain shooting down the leg (sciatica)", "Neurology"], ["Pain in the side (kidney area)", "General"],
    ["Slipped disc", "Orthopedics"] ] },
};

// problems that are not one body part, shown as buttons beside the figure
export const CATEGORIES = {
  general:  { label: "Fever & general health", icon: "activity", symptoms: [
    ["Fever", "General"], ["Cold, cough or flu", "General"], ["Tiredness or weakness", "General"],
    ["Diabetes or thyroid check", "General"], ["Routine health check-up", "General"], ["Not sure what's wrong", "General"] ] },
  skin:     { label: "Skin, hair & nails", icon: "sparkles", symptoms: [
    ["Rash or itching", "Dermatology"], ["Acne or pimples", "Dermatology"], ["Hair fall", "Dermatology"],
    ["Nail infection", "Dermatology"], ["Mole that has changed", "Dermatology"], ["Allergy or hives", "Dermatology"] ] },
  mind:     { label: "Mind & mood", icon: "heart", symptoms: [
    ["Stress or anxiety", "Psychiatry"], ["Low mood or depression", "Psychiatry"], ["Trouble sleeping", "Psychiatry"],
    ["Alcohol or substance use", "Psychiatry"], ["Panic attacks", "Psychiatry"] ] },
  child:    { label: "Child's health (under 14)", icon: "users", symptoms: [
    ["Fever in a child", "Pediatrics"], ["Child's cough or cold", "Pediatrics"], ["Vaccination", "Pediatrics"],
    ["Growth or development concern", "Pediatrics"], ["Newborn check-up", "Pediatrics"], ["Child's behaviour or learning", "Psychiatry"] ] },
  cancer:   { label: "Cancer care", icon: "shield", symptoms: [
    ["Lump or swelling anywhere", "Oncology"], ["Weight loss without trying", "Oncology"], ["Cancer screening", "Oncology"],
    ["Chemotherapy or cancer follow-up", "Oncology"] ] },
  surgery:  { label: "Wounds & surgery", icon: "clipboard", symptoms: [
    ["Cut or wound", "Surgery"], ["Boil or abscess", "Surgery"], ["Gallstones", "Surgery"],
    ["Piles", "Surgery"], ["Check-up after an operation", "Surgery"] ] },
};
