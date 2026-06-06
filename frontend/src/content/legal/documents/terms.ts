import { LEGAL_ENTITY as E } from "../entity";
import type { LegalDocumentContent } from "../types";

export const termsOfUse: LegalDocumentContent = {
  id: "terms",
  slug: "terms",
  path: "/terms",
  title: "Terms of Use",
  lastUpdated: E.lastUpdated,
  intro: `These Terms govern your use of ${E.platformName}, an independent healthcare incident documentation archive operated by ${E.operatorName}. By using this website, you agree to these Terms.`,
  sections: [
    {
      id: "nature",
      title: "1. What This Site Is",
      paragraphs: [
        "CodkaBukaanka is a public documentation and search archive. It helps people find healthcare incident reports and related documents more easily than scattered social media posts.",
        "We are not a government agency, court, regulator, hospital, or law firm. We do not provide medical treatment, emergency response, or legal representation.",
      ],
    },
    {
      id: "sources",
      title: "2. Sources of Information",
      paragraphs: [
        "Archive content is compiled from public discussions, documents shared with the project, and administrative review. Our goal is to preserve and organize information for public accountability.",
        "We strive for accuracy and may update or correct records when reliable new information is provided.",
      ],
    },
    {
      id: "medical",
      title: "3. Medical Disclaimer",
      paragraphs: [
        "Nothing on this site is medical advice. Do not use this website to make decisions about treatment, medication, or emergency care. Always consult qualified healthcare professionals for medical questions.",
        "If you have a medical emergency, contact local emergency services immediately.",
      ],
    },
    {
      id: "not-legal-finding",
      title: "4. Not a Legal Finding",
      paragraphs: [
        "Publication of a report does not mean a hospital, doctor, or other party has been found guilty of negligence, malpractice, or wrongdoing by a court or government body.",
        "Named hospitals and doctors appear because they are part of the documented incident, not because we have issued an official judgment against them.",
      ],
    },
    {
      id: "hospitals",
      title: "5. Hospitals and Providers",
      paragraphs: [
        "Hospital and doctor listings and statistics reflect how often they appear in documented reports. This is for public information and research, not an official safety rating.",
        "For factual corrections, use our correction request form or email us. We review corrections in good faith but are an independent archive, not an official dispute tribunal.",
      ],
    },
    {
      id: "acceptable",
      title: "6. Acceptable Use",
      paragraphs: ["You agree not to:"],
      listItems: [
        "Attempt to hack, disrupt, or overload the website",
        "Scrape or harvest content at abusive rates",
        "Use archive information to harass, threaten, or dox individuals",
        "Submit malware or knowingly false bulk reports",
        "Impersonate another person or organization",
      ],
    },
    {
      id: "content",
      title: "7. Archive Content and Your Use",
      paragraphs: [
        "You may read, cite, and reference published reports for journalism, research, personal information, and accountability purposes with proper attribution to CodkaBukaanka.",
        "You may not misrepresent the source or claim that we endorsed your interpretation.",
      ],
    },
    {
      id: "liability",
      title: "8. Limitation of Liability",
      paragraphs: [
        `To the fullest extent permitted by law, ${E.operatorName} is not liable for damages arising from your use of or reliance on this website or its content.`,
      ],
    },
    {
      id: "enforcement",
      title: "9. Enforcement",
      paragraphs: [
        "We may restrict access or remove content that violates these Terms, threatens safety, or appears to be abusive or fraudulent.",
      ],
    },
    {
      id: "changes",
      title: "10. Changes",
      paragraphs: [
        "We may update these Terms. Continued use after changes are posted means you accept the updated Terms.",
      ],
    },
    {
      id: "law",
      title: "11. Governing Law",
      paragraphs: [
        `These Terms are governed by the laws of the ${E.jurisdiction}, to the extent applicable.`,
      ],
    },
    {
      id: "contact",
      title: "12. Contact",
      paragraphs: [
        `General contact and corrections: ${E.contactEmail}`,
        `Location: ${E.contactLocation}`,
      ],
    },
  ],
};
