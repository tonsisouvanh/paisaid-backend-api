import { Prisma } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const slugify = (text: string): string => {
  return text
    .normalize("NFD") // Normalize Lao and English characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9ກ-ໝ\s-]/g, "") // Remove special characters (except Lao, English, numbers, and spaces)
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase(); // Convert to lowercase
};

export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value));

export const convertFileToUrl = (file: File) => URL.createObjectURL(file);

export function encryptKey(passkey: string) {
  return btoa(passkey);
}

export function decryptKey(passkey: string) {
  return atob(passkey);
}

export const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError
) => {
  if (error.code) {
    switch (error.code) {
      case "P2002":
        return { statusCode: 409, message: "Unique constraint error" };
      case "P2014":
        return { statusCode: 400, message: "Invalid ID provided" };
      case "P2003":
        return { statusCode: 400, message: "Foreign key constraint failed" };
      case "P2025":
        return { statusCode: 404, message: "Record not found" };
      default:
        return { statusCode: 500, message: `Unexpected error: ${error.code}` };
    }
  }
  return { status: 500, message: "An unexpected error occurred" };
};

export const formatLaoDateStr = (
  dateString: string = "2024-10-06T15:29:40.040Z"
): string => {
  const [datePart, timePart] = dateString.split("T");
  const [year, month, day] = datePart.split("-");
  const [time] = timePart.split(".");

  const monthNames = [
    "ມັງກອນ",
    "ກຸມພາ",
    "ມີນາ",
    "ເມສາ",
    "ພຶດສະພາ",
    "ມິຖຸນາ",
    "ກໍລະກົດ",
    "ສິງຫາ",
    "ກັນຍາ",
    "ຕຸລາ",
    "ພະຈິກ",
    "ທັນວາ",
  ];
  const monthName = monthNames[parseInt(month, 10) - 1];

  return `${parseInt(day, 10)} ${monthName} ${year} - ${time}`;
};

export const formatDateStr = (
  dateString: string = "2024-10-06T15:29:40.040Z"
): string => {
  const [datePart, timePart] = dateString.split("T");
  const [year, month, day] = datePart.split("-");
  const [time] = timePart.split(".");

  return `${parseInt(day, 10)}/${month}/${year} - ${time}`;
};

// Date and Time functions
export function getLocalDateTime(
  now: Date = new Date(),
  TimeZone: string = "Asia/Bangkok"
) {
  // Format the time in Laos timezone as ISO 8601 with milliseconds
  const laosTime = formatInTimeZone(now, TimeZone, "yyyy-MM-dd'T'HH:mm:ss.sss");

  return laosTime + "Z"; // Already in the correct format
}

export const formatDateToISOString = (date: string) => {
  const formattedDate = date.split("+")[0];
  return formattedDate;
};

export const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return "No Date";
  return dateStr
    .replace(/T|Z/g, (match) => (match === "T" ? " " : ""))
    .replace(/\.\d{3}$/, "");
};

export const getCurrentDateInLaos = () => {
  const nowUTC = new Date();
  const laosOffset = 7 * 60; // Laos is UTC+7, so add 7 hours in minutes
  const laosTime = new Date(nowUTC.getTime() + laosOffset * 60 * 1000);
  return laosTime;
};

export const formatRelativeTime = (
  dateStr: string,
  timeZone: string = "UTC"
): string => {
  const date = toZonedTime(dateStr, timeZone);
  return formatDistanceToNow(date, { addSuffix: true });
};

// ==========================

export const formatPrice = (price: number, currency?: string) => {
  if (!currency) {
    // Format the price with commas without currency
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
    }).format(price);
  }
  // Format the price with commas to LAK
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "LAK",
  }).format(price);
};

export const getPaymentStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
      return "green";
    case "pending":
      return "orange";
    case "failed":
      return "red";
    default:
      return "default";
  }
};

export const provinceMapping: { [key: string]: string } = {
  VT: "ນະຄອນຫຼວງວຽງຈັນ",
  VI: "ວຽງຈັນ",
  BL: "ບໍລິຄຳໄຊ",
  XS: "ໄຊສົມບູນ",
  BK: "ບໍ່ແກ້ວ",
  HO: "ຫົວພັນ",
  LM: "ຫຼວງນ້ຳທາ",
  LP: "ຫຼວງພະບາງ",
  XA: "ໄຊຍະບູລີ",
  XI: "ຊຽງຂວາງ",
  AT: "ອັດຕະປື",
  CH: "ຈຳປາສັກ",
  KH: "ຄຳມ່ວນ",
  OU: "ອຸດົມໄຊ",
  PH: "ຜົ້ງສາລີ",
  SL: "ສາລະວັນ",
  SV: "ສະຫວັນນະເຂດ",
  XE: "ເຊກອງ",
};

export const provinceData = [
  { eng_name: "VT", lao_name: "ນະຄອນຫຼວງວຽງຈັນ" },
  { eng_name: "VI", lao_name: "ວຽງຈັນ" },
  { eng_name: "BL", lao_name: "ບໍລິຄຳໄຊ" },
  { eng_name: "XS", lao_name: "ໄຊສົມບູນ" },
  { eng_name: "BK", lao_name: "ບໍ່ແກ້ວ" },
  { eng_name: "HO", lao_name: "ຫົວພັນ" },
  { eng_name: "LM", lao_name: "ຫຼວງນ້ຳທາ" },
  { eng_name: "LP", lao_name: "ຫຼວງພະບາງ" },
  { eng_name: "XA", lao_name: "ໄຊຍະບູລີ" },
  { eng_name: "XI", lao_name: "ຊຽງຂວາງ" },
  { eng_name: "AT", lao_name: "ອັດຕະປື" },
  { eng_name: "CH", lao_name: "ຈຳປາສັກ" },
  { eng_name: "KH", lao_name: "ຄຳມ່ວນ" },
  { eng_name: "OU", lao_name: "ອຸດົມໄຊ" },
  { eng_name: "PH", lao_name: "ຜົ້ງສາລີ" },
  { eng_name: "SL", lao_name: "ສາລະວັນ" },
  { eng_name: "SV", lao_name: "ສະຫວັນນະເຂດ" },
  { eng_name: "XE", lao_name: "ເຊກອງ" },
];

export const getProvinceFullName = (shortcut: string) => {
  return provinceMapping[shortcut] || shortcut;
};

export const isRolesAllowed = (
  session: any | undefined = {},
  allowedRoles: string[]
) => {
  if (
    !session ||
    !session.roles?.some((role: string) => allowedRoles.includes(role))
  ) {
    return false;
  }
  return true;
};

export const isJsonStr = (str: string): boolean => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._]/g, "-");
};

export const upperFirstChar = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const getIdFromSlug = (slug: string): number | null => {
  const parts = slug.split("-"); // Split the slug by hyphen
  const lastPart = parts[parts.length - 1]; // Get the last part

  // Ensure the last part is a valid numeric ID
  const id = parseInt(lastPart, 10);
  return isNaN(id) ? null : id; // Return null if not a valid ID
};

export const convertStringToArrayOfNumbers = (input: string): number[] => {
  return input
    .split(",") // Split the string by commas
    .map((str) => parseInt(str.trim(), 10)) // Convert each substring to a number
    .filter((num) => !isNaN(num)); // Filter out any NaN values
};
// /**
//  * Converts a comma-separated string to an array of numbers.
//  * @param input - The string to convert (e.g., "1,2,7,3")
//  * @returns Array of numbers
//  */
// export const convertStringToArrayOfNumbers = (input: string): number[] => {
//   return input.split(",").map((str) => parseInt(str, 10));
// };
