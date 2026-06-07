import { termsOfUse } from "@/content/legal/documents/terms";
import { createLegalMetadata, createLegalPage } from "@/lib/legal-page";

export const generateMetadata = createLegalMetadata(termsOfUse);
export default createLegalPage(termsOfUse);
