export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  slotNumber: number;
  tray: number;
  price: number;
  stock: number;
  capacity: number;
  category: string;
  pillColor: string; // Tailwind color class for pill/capsule indicator
  description: string;
}

export const mockMedicines: Medicine[] = [
  // Tray 1: Pain Relief & Fever
  {
    id: "med_1",
    name: "Paracetamol",
    dosage: "500mg",
    slotNumber: 1,
    tray: 1,
    price: 4.99,
    stock: 12,
    capacity: 20,
    category: "Analgesic",
    pillColor: "bg-blue-500",
    description: "Effective relief from fever, headache, and mild pain."
  },
  {
    id: "med_2",
    name: "Ibuprofen",
    dosage: "200mg",
    slotNumber: 2,
    tray: 1,
    price: 5.49,
    stock: 8,
    capacity: 15,
    category: "Anti-inflammatory",
    pillColor: "bg-red-500",
    description: "Reduces swelling, joint stiffness, and targets muscle aches."
  },
  {
    id: "med_3",
    name: "Aspirin",
    dosage: "325mg",
    slotNumber: 3,
    tray: 1,
    price: 3.99,
    stock: 15,
    capacity: 20,
    category: "NSAID",
    pillColor: "bg-yellow-500",
    description: "Relieves minor aches and provides cardiovascular benefits."
  },
  {
    id: "med_4",
    name: "Naproxen",
    dosage: "220mg",
    slotNumber: 4,
    tray: 1,
    price: 6.99,
    stock: 0, // Out of stock to test sold-out state
    capacity: 10,
    category: "NSAID",
    pillColor: "bg-purple-500",
    description: "Long-lasting pain reliever for backaches and cramps."
  },
  {
    id: "med_5",
    name: "Acetaminophen",
    dosage: "650mg",
    slotNumber: 5,
    tray: 1,
    price: 5.99,
    stock: 10,
    capacity: 15,
    category: "Analgesic",
    pillColor: "bg-teal-500",
    description: "Extra strength formula for severe headaches."
  },

  // Tray 2: Allergy & Cold
  {
    id: "med_6",
    name: "Cetirizine",
    dosage: "10mg",
    slotNumber: 6,
    tray: 2,
    price: 7.99,
    stock: 22,
    capacity: 25,
    category: "Antihistamine",
    pillColor: "bg-sky-400",
    description: "24-hour non-drowsy relief from seasonal allergy symptoms."
  },
  {
    id: "med_7",
    name: "Loratadine",
    dosage: "10mg",
    slotNumber: 7,
    tray: 2,
    price: 8.49,
    stock: 18,
    capacity: 20,
    category: "Antihistamine",
    pillColor: "bg-emerald-400",
    description: "Relieves runny nose, itchy eyes, and sneezing."
  },
  {
    id: "med_8",
    name: "Fexofenadine",
    dosage: "180mg",
    slotNumber: 8,
    tray: 2,
    price: 12.99,
    stock: 5,
    capacity: 12,
    category: "Antihistamine",
    pillColor: "bg-indigo-400",
    description: "Fast-acting relief for indoor and outdoor allergies."
  },
  {
    id: "med_9",
    name: "Diphenhydramine",
    dosage: "25mg",
    slotNumber: 9,
    tray: 2,
    price: 4.49,
    stock: 14,
    capacity: 15,
    category: "Antihistamine / Sleep Aid",
    pillColor: "bg-violet-500",
    description: "Nighttime allergy relief and temporary sleep aid."
  },
  {
    id: "med_10",
    name: "Pseudoephedrine",
    dosage: "30mg",
    slotNumber: 10,
    tray: 2,
    price: 9.99,
    stock: 3,
    capacity: 10,
    category: "Decongestant",
    pillColor: "bg-orange-500",
    description: "Clears sinus congestion and relieves sinus pressure."
  },

  // Tray 3: Digestion & Stomach
  {
    id: "med_11",
    name: "Omeprazole",
    dosage: "20mg",
    slotNumber: 11,
    tray: 3,
    price: 11.49,
    stock: 9,
    capacity: 15,
    category: "Acid Reducer",
    pillColor: "bg-blue-600",
    description: "Treats frequent heartburn and acid reflux."
  },
  {
    id: "med_12",
    name: "Ranitidine",
    dosage: "150mg",
    slotNumber: 12,
    tray: 3,
    price: 6.99,
    stock: 0,
    capacity: 15,
    category: "H2 Blocker",
    pillColor: "bg-pink-500",
    description: "Prevents and relieves heartburn and acid indigestion."
  },
  {
    id: "med_13",
    name: "Famotidine",
    dosage: "20mg",
    slotNumber: 13,
    tray: 3,
    price: 7.99,
    stock: 16,
    capacity: 20,
    category: "Acid Reducer",
    pillColor: "bg-fuchsia-500",
    description: "Fast-acting relief from sour stomach and acid indigestion."
  },
  {
    id: "med_14",
    name: "Loperamide",
    dosage: "2mg",
    slotNumber: 14,
    tray: 3,
    price: 4.89,
    stock: 11,
    capacity: 15,
    category: "Anti-diarrheal",
    pillColor: "bg-green-600",
    description: "Controls and relieves symptoms of acute diarrhea."
  },
  {
    id: "med_15",
    name: "Simethicone",
    dosage: "125mg",
    slotNumber: 15,
    tray: 3,
    price: 5.29,
    stock: 20,
    capacity: 20,
    category: "Anti-gas",
    pillColor: "bg-cyan-500",
    description: "Relieves gas pressure, bloating, and stomach discomfort."
  },

  // Tray 4: Vitamins & Supplements
  {
    id: "med_16",
    name: "Vitamin C",
    dosage: "1000mg",
    slotNumber: 16,
    tray: 4,
    price: 8.99,
    stock: 25,
    capacity: 30,
    category: "Immune Support",
    pillColor: "bg-amber-400",
    description: "High potency antioxidant for immune health."
  },
  {
    id: "med_17",
    name: "Vitamin D3",
    dosage: "5000 IU",
    slotNumber: 17,
    tray: 4,
    price: 9.49,
    stock: 30,
    capacity: 35,
    category: "Bone Health",
    pillColor: "bg-amber-200",
    description: "Supports strong bones, teeth, and muscle health."
  },
  {
    id: "med_18",
    name: "Zinc",
    dosage: "50mg",
    slotNumber: 18,
    tray: 4,
    price: 6.49,
    stock: 12,
    capacity: 20,
    category: "Mineral Support",
    pillColor: "bg-slate-400",
    description: "Promotes immune function and cellular health."
  },
  {
    id: "med_19",
    name: "Melatonin",
    dosage: "5mg",
    slotNumber: 19,
    tray: 4,
    price: 7.99,
    stock: 14,
    capacity: 15,
    category: "Sleep Aid",
    pillColor: "bg-indigo-900",
    description: "Helps establish normal sleep patterns for restful sleep."
  },
  {
    id: "med_20",
    name: "Iron Supplement",
    dosage: "65mg",
    slotNumber: 20,
    tray: 4,
    price: 5.99,
    stock: 8,
    capacity: 15,
    category: "Mineral Support",
    pillColor: "bg-red-700",
    description: "Essential for healthy red blood cell formation."
  },

  // Tray 5: Cardiovascular & Diabetes
  {
    id: "med_21",
    name: "Metformin",
    dosage: "500mg",
    slotNumber: 21,
    tray: 5,
    price: 14.99,
    stock: 6,
    capacity: 10,
    category: "Antidiabetic",
    pillColor: "bg-cyan-600",
    description: "Helps control blood sugar levels for Type 2 diabetes."
  },
  {
    id: "med_22",
    name: "Atorvastatin",
    dosage: "20mg",
    slotNumber: 22,
    tray: 5,
    price: 18.99,
    stock: 4,
    capacity: 8,
    category: "Cholesterol",
    pillColor: "bg-teal-600",
    description: "Lowers LDL cholesterol and triglyceride levels."
  },
  {
    id: "med_23",
    name: "Lisinopril",
    dosage: "10mg",
    slotNumber: 23,
    tray: 5,
    price: 12.49,
    stock: 0,
    capacity: 10,
    category: "Antihypertensive",
    pillColor: "bg-sky-600",
    description: "Treats high blood pressure and heart failure."
  },
  {
    id: "med_24",
    name: "Amlodipine",
    dosage: "5mg",
    slotNumber: 24,
    tray: 5,
    price: 11.99,
    stock: 9,
    capacity: 12,
    category: "Calcium Channel Blocker",
    pillColor: "bg-emerald-500",
    description: "Relaxes blood vessels to lower blood pressure."
  },
  {
    id: "med_25",
    name: "Metoprolol Succinate",
    dosage: "25mg",
    slotNumber: 25,
    tray: 5,
    price: 15.49,
    stock: 7,
    capacity: 10,
    category: "Beta Blocker",
    pillColor: "bg-indigo-600",
    description: "Used to treat chest pain (angina) and high blood pressure."
  },

  // Tray 6: Miscellaneous / First Aid
  {
    id: "med_26",
    name: "Hydrocortisone Cream",
    dosage: "1% tube",
    slotNumber: 26,
    tray: 6,
    price: 5.99,
    stock: 14,
    capacity: 15,
    category: "Topical Steroid",
    pillColor: "bg-blue-300",
    description: "Relieves skin irritation, itching, and rashes."
  },
  {
    id: "med_27",
    name: "Neosporin Ointment",
    dosage: "0.5 oz",
    slotNumber: 27,
    tray: 6,
    price: 6.49,
    stock: 10,
    capacity: 15,
    category: "First Aid Antibiotic",
    pillColor: "bg-green-300",
    description: "Helps prevent infection in minor cuts, scrapes, and burns."
  },
  {
    id: "med_28",
    name: "Band-Aid Strips",
    dosage: "40 ct",
    slotNumber: 28,
    tray: 6,
    price: 3.49,
    stock: 22,
    capacity: 25,
    category: "Wound Care",
    pillColor: "bg-yellow-300",
    description: "Sterile adhesive bandages for minor wounds."
  },
  {
    id: "med_29",
    name: "Saline Nasal Spray",
    dosage: "1.5 oz",
    slotNumber: 29,
    tray: 6,
    price: 4.99,
    stock: 12,
    capacity: 15,
    category: "Nasal Care",
    pillColor: "bg-sky-300",
    description: "Moisturizes dry nasal passages and clears congestion."
  },
  {
    id: "med_30",
    name: "Antiseptic Wipes",
    dosage: "20 ct",
    slotNumber: 30,
    tray: 6,
    price: 2.99,
    stock: 15,
    capacity: 20,
    category: "Sanitization",
    pillColor: "bg-slate-300",
    description: "Cleanses wounds to help prevent bacterial infection."
  }
];
