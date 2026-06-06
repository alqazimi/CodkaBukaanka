import { LegalDocumentFooter } from "@/components/legal/LegalDocumentFooter";
import { privacyPolicy } from "@/content/legal/documents/privacy";
import { createLegalMetadata, createLegalPage } from "@/lib/legal-page";

export const generateMetadata = createLegalMetadata(privacyPolicy);
export default createLegalPage(privacyPolicy, <LegalDocumentFooter />);
