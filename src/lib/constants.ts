export const INDIAN_STATES = [
  "Andhra Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu and Kashmir","Ladakh","Puducherry",
] as const;

export const CRAFT_TYPES = [
  { value: "pottery",   label: "Pottery" },
  { value: "textiles",  label: "Textiles" },
  { value: "jewelry",   label: "Jewelry" },
  { value: "woodwork",  label: "Woodwork" },
  { value: "metalwork", label: "Metalwork" },
  { value: "painting",  label: "Painting" },
  { value: "leather",   label: "Leather" },
  { value: "glasswork", label: "Glasswork" },
  { value: "basketry",  label: "Basketry" },
  { value: "stonework", label: "Stonework" },
  { value: "other",     label: "Other" },
] as const;

export type CraftValue = typeof CRAFT_TYPES[number]["value"];
