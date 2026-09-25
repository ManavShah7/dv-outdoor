/**
 * The address clients write to. Lives apart from lib/mail.ts because that
 * module is server-only and this is rendered in the footer and the contact
 * band — both of which ship to the browser.
 */
export const SALES_EMAIL =
  process.env.NEXT_PUBLIC_SALES_EMAIL ?? "sales@timesmedia.online";
