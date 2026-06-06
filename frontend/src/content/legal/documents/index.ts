import type { LegalDocumentContent } from "../types";
import { privacyPolicy } from "./privacy";
import { termsOfUse } from "./terms";

export const LEGAL_DOCUMENTS: LegalDocumentContent[] = [privacyPolicy, termsOfUse];

export { privacyPolicy, termsOfUse };
