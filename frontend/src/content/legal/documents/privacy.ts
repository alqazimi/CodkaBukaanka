import { LEGAL_ENTITY as E } from "../entity";
import type { LegalDocumentContent } from "../types";

export const privacyPolicy: LegalDocumentContent = {
  id: "privacy",
  slug: "privacy",
  path: "/privacy",
  title: "Privacy Policy",
  lastUpdated: E.lastUpdated,
  intro: `${E.platformName} is an independent public documentation archive for healthcare incident reports in Somalia. This policy explains what information we collect, how we use it, and how you can contact us. We are not a government body, hospital, or law firm. Last revised ${E.lastUpdated}.`,
  sections: [
    {
      id: "operator",
      title: "1. Who Operates This Site",
      paragraphs: [
        `This website is operated by ${E.operatorName}, an independent documentation project based in ${E.contactLocation}.`,
        `For privacy questions or data requests, email: ${E.contactEmail}`,
      ],
    },
    {
      id: "purpose",
      title: "2. What This Archive Does",
      paragraphs: [
        "CodkaBukaanka organizes healthcare incident reports and supporting documents so the public can search cases more easily than scattered social media posts. Information often originates from public discussions and documents shared by affected people or witnesses.",
        "We may redact or summarize identifying details before publication where appropriate for safety and privacy.",
      ],
    },
    {
      id: "collect",
      title: "3. Information We Collect",
      paragraphs: ["Depending on how you use the site, we may process:"],
      listItems: [
        "Contact and correction form data: name, email, message, and optional report reference",
        "Case submission form data: contact details, incident narrative, hospital and patient information, classification fields, and evidence notes (text only — no file uploads on the public form)",
        "Technical logs: IP address, browser type, pages visited, and timestamps for security and reliability (including one case submission per connection per week)",
        "Archive content: incident descriptions, hospital and doctor names, medication references, dates, and uploaded documents used to document cases",
      ],
    },
    {
      id: "use",
      title: "4. How We Use Information",
      paragraphs: [
        "Contact messages and case submissions are used only to respond to inquiries, review reported incidents, and handle correction requests. Technical logs help protect the site from abuse, including limits on repeated case submissions from the same connection. Archive content is used to publish and maintain searchable public records for accountability and public interest.",
        "We do not sell personal data. We do not use your contact details for advertising.",
      ],
    },
    {
      id: "published",
      title: "5. Published Archive Content",
      paragraphs: [
        "Published reports may include hospital names, doctor names, treatment details, and patient-related information in redacted or summarized form. Full original files are generally not exposed publicly where privacy risk is high.",
        "Publication does not mean we have made a legal finding against any person or institution.",
      ],
    },
    {
      id: "sharing",
      title: "6. Sharing",
      paragraphs: [
        "We may use hosting, email, storage, and security providers to run the site. Published archive pages are intentionally public. We may disclose information if required by law.",
      ],
    },
    {
      id: "retention",
      title: "7. Retention",
      paragraphs: [
        "Contact messages are kept as long as needed to handle requests and maintain an administrative record. Published accountability records may be retained for historical and public-interest purposes. Server logs are kept for a limited period for security.",
      ],
    },
    {
      id: "security",
      title: "8. Security",
      paragraphs: [
        "We use access controls, encryption in transit where supported, and administrative safeguards. No online service can guarantee perfect security.",
      ],
    },
    {
      id: "rights",
      title: "9. Your Rights",
      paragraphs: [
        "You may contact us to request access, correction, or removal of your personal data where applicable law allows. We review requests in good faith but cannot guarantee removal of published accountability records where public interest, accuracy review, or legal obligations apply.",
        `Email: ${E.contactEmail}`,
      ],
    },
    {
      id: "children",
      title: "10. Minors",
      paragraphs: [
        "Reports involving minors are handled with extra care. We avoid publishing unnecessary identifying details about children.",
      ],
    },
    {
      id: "changes",
      title: "11. Changes",
      paragraphs: [
        "We may update this policy. The date at the top shows when it was last revised.",
      ],
    },
  ],
};
