/**
 * The client registry. Category is a real attribute of the company, not a
 * guess made at render time — analytics rolls up by it, and the assistant
 * filters on it, so it has to live in one place.
 */
export type Category =
  | "Automobiles"
  | "Jewellery"
  | "Electronics & Appliances"
  | "Banking & Finance"
  | "Telecom"
  | "Retail & Fashion"
  | "FMCG & Food"
  | "Real Estate"
  | "Building & Home"
  | "Healthcare"
  | "Education"
  | "Hospitality";

export const CATEGORIES: Category[] = [
  "Automobiles", "Jewellery", "Electronics & Appliances", "Banking & Finance",
  "Telecom", "Retail & Fashion", "FMCG & Food", "Real Estate",
  "Building & Home", "Healthcare", "Education", "Hospitality",
];

export type CompanyRecord = {
  name: string;
  category: Category;
  /** relative booking weight — some clients are simply more active */
  weight: number;
};

export const COMPANIES: CompanyRecord[] = [
  { name: "Audi Junagadh",        category: "Automobiles", weight: 5 },
  { name: "Royal Enfield",        category: "Automobiles", weight: 6 },
  { name: "Maruti Suzuki Arena",  category: "Automobiles", weight: 8 },
  { name: "Hero MotoCorp",        category: "Automobiles", weight: 6 },

  { name: "Tanishq",              category: "Jewellery", weight: 9 },
  { name: "Malabar Gold",         category: "Jewellery", weight: 10 },
  { name: "Kalyan Jewellers",     category: "Jewellery", weight: 8 },
  { name: "Senco Gold",           category: "Jewellery", weight: 4 },

  { name: "Croma",                category: "Electronics & Appliances", weight: 7 },
  { name: "Havells",              category: "Electronics & Appliances", weight: 6 },
  { name: "Vijay Sales",          category: "Electronics & Appliances", weight: 5 },

  { name: "HDFC Bank",            category: "Banking & Finance", weight: 8 },
  { name: "Bajaj Finserv",        category: "Banking & Finance", weight: 7 },
  { name: "ICICI Lombard",        category: "Banking & Finance", weight: 4 },

  { name: "Jio Fiber",            category: "Telecom", weight: 9 },
  { name: "Airtel",               category: "Telecom", weight: 7 },

  { name: "Reliance Trends",      category: "Retail & Fashion", weight: 8 },
  { name: "D-Mart",               category: "Retail & Fashion", weight: 7 },
  { name: "Westside",             category: "Retail & Fashion", weight: 4 },

  { name: "Amul",                 category: "FMCG & Food", weight: 8 },
  { name: "Patanjali",            category: "FMCG & Food", weight: 5 },
  { name: "Balaji Wafers",        category: "FMCG & Food", weight: 6 },

  { name: "Lodha Developers",     category: "Real Estate", weight: 5 },
  { name: "Shivalik Group",       category: "Real Estate", weight: 4 },

  { name: "Asian Paints",         category: "Building & Home", weight: 7 },
  { name: "Ambuja Cement",        category: "Building & Home", weight: 5 },

  { name: "Sterling Hospital",    category: "Healthcare", weight: 4 },
  { name: "Wockhardt",            category: "Healthcare", weight: 3 },

  { name: "Allen Career Institute", category: "Education", weight: 5 },
  { name: "Aakash Institute",     category: "Education", weight: 4 },

  { name: "The Fern Hotel",       category: "Hospitality", weight: 3 },
];

export const COMPANY_BY_NAME = new Map(COMPANIES.map((c) => [c.name, c]));

export function categoryOf(company: string): Category | null {
  return COMPANY_BY_NAME.get(company)?.category ?? null;
}

/**
 * Seasonal pull by category, as a multiplier per calendar month (index 0 = Jan).
 * Jewellery peaks around Diwali and the wedding season; education peaks before
 * the academic intake; real estate leans on the festive quarter. This is what
 * makes "what months do they do business" a real question rather than noise.
 */
export const SEASONALITY: Record<Category, number[]> = {
  //                     J    F    M    A    M    J    J    A    S    O    N    D
  "Automobiles":        [0.8, 0.7, 1.4, 0.9, 0.8, 0.7, 0.7, 0.9, 1.3, 1.9, 1.6, 1.0],
  "Jewellery":          [0.7, 1.2, 0.9, 1.4, 1.5, 0.6, 0.5, 0.8, 1.1, 2.1, 1.8, 1.0],
  "Electronics & Appliances": [0.9, 0.8, 1.2, 1.3, 1.4, 0.8, 0.7, 0.9, 1.2, 1.8, 1.3, 0.9],
  "Banking & Finance":  [1.3, 1.5, 1.8, 0.8, 0.7, 0.8, 1.0, 0.9, 0.9, 1.0, 0.9, 1.0],
  "Telecom":            [1.0, 1.0, 1.1, 1.0, 1.0, 1.1, 1.0, 1.0, 1.0, 1.2, 1.1, 1.0],
  "Retail & Fashion":   [0.9, 0.8, 0.9, 1.1, 1.0, 0.8, 1.2, 1.0, 1.1, 1.9, 1.4, 1.1],
  "FMCG & Food":        [1.0, 0.9, 1.1, 1.2, 1.3, 0.9, 0.8, 1.0, 1.0, 1.4, 1.1, 1.0],
  "Real Estate":        [1.1, 1.0, 1.3, 0.9, 0.8, 0.6, 0.6, 0.8, 1.2, 1.7, 1.4, 1.1],
  "Building & Home":    [1.0, 1.1, 1.3, 1.2, 1.1, 0.6, 0.5, 0.6, 1.0, 1.5, 1.3, 1.1],
  "Healthcare":         [1.1, 1.0, 1.0, 1.0, 1.0, 1.2, 1.3, 1.1, 1.0, 0.9, 0.9, 1.0],
  "Education":          [1.2, 1.4, 1.8, 1.9, 1.6, 1.3, 0.7, 0.6, 0.6, 0.6, 0.7, 0.9],
  "Hospitality":        [0.9, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0, 1.1, 1.6, 1.7, 1.5],
};
