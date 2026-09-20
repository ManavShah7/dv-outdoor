export type BoardStatus = "available" | "booked" | "under_maintenance" | "damaged";
export type Lighting = "backlit" | "frontlit" | "none";
export type SizeCategory = "small" | "medium" | "large";

export type Board = {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  area: string;
  city: string;
  pincode: string;
  status: BoardStatus;
  lighting: Lighting;
  sizeCategory: SizeCategory;
  widthFt: number;
  heightFt: number;
  askingRate: number;
  /** present when status === "booked" */
  rental?: {
    company: string;
    rate: number;
    startDate: string;
    endDate: string;
    printedBy: "us" | "client";
    contactPerson: string;
    phone: string;
  };
  availableSince?: string;
};
