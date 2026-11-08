import { shippingCountries } from "@/config/site";
import type { CustomerDetails, FieldErrors, ValidationResult } from "@/types/commerce";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value);
}

export type CustomerField = keyof CustomerDetails;

export function validateCustomer(input: unknown): ValidationResult<CustomerDetails, CustomerField> {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const data: CustomerDetails = {
    email: str(raw.email).toLowerCase(),
    fullName: str(raw.fullName),
    phone: str(raw.phone),
    address1: str(raw.address1),
    address2: str(raw.address2),
    city: str(raw.city),
    postalCode: str(raw.postalCode),
    country: str(raw.country),
  };
  const errors: FieldErrors<CustomerField> = {};

  if (!data.email) errors.email = "Enter your email address.";
  else if (!isEmail(data.email)) errors.email = "Enter a valid email address.";

  if (data.fullName.length < 2) errors.fullName = "Enter your full name.";
  else if (data.fullName.length > 120) errors.fullName = "Name is too long.";

  if (data.phone && !/^\+?[0-9 ()-]{6,20}$/.test(data.phone)) errors.phone = "Enter a valid phone number.";

  if (data.address1.length < 3) errors.address1 = "Enter your street address.";
  else if (data.address1.length > 160) errors.address1 = "Address is too long.";
  if (data.address2.length > 160) errors.address2 = "Address is too long.";

  if (data.city.length < 2) errors.city = "Enter your city.";
  else if (data.city.length > 80) errors.city = "City is too long.";

  if (!/^[A-Za-z0-9 -]{2,12}$/.test(data.postalCode)) errors.postalCode = "Enter a valid postal code.";

  if (!(shippingCountries as readonly string[]).includes(data.country)) errors.country = "Choose a shipping country.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}
export type ContactField = keyof ContactMessage;

export function validateContact(input: unknown): ValidationResult<ContactMessage, ContactField> {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const data: ContactMessage = { name: str(raw.name), email: str(raw.email).toLowerCase(), message: str(raw.message) };
  const errors: FieldErrors<ContactField> = {};
  if (data.name.length < 2) errors.name = "Enter your name.";
  else if (data.name.length > 80) errors.name = "Name is too long.";
  if (!isEmail(data.email)) errors.email = "Enter a valid email address.";
  if (data.message.length < 10) errors.message = "Tell us a little more (at least 10 characters).";
  else if (data.message.length > 2000) errors.message = "Message is too long (2000 characters max).";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

export function normalizeOrderId(value: string): string {
  return value.trim().toUpperCase();
}

export function isOrderId(value: string): boolean {
  return /^RR-[A-Z0-9]{8}$/.test(value);
}
