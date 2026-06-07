import { Link } from "@/i18n/routing";

export function LegalDocumentFooter() {
  return (
    <p className="text-sm font-medium text-muted">
      <Link href="/corrections" className="link-theme">
        Request a correction
      </Link>
      {" · "}
      <Link href="/contact" className="link-theme">
        Contact
      </Link>
    </p>
  );
}
