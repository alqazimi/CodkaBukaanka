import { Link } from "@/i18n/routing";

export function LegalDocumentFooter() {
  return (
    <p className="text-sm text-navy-600 dark:text-navy-400">
      <Link href="/corrections">Request a correction</Link>
      {" · "}
      <Link href="/contact">Contact</Link>
    </p>
  );
}
