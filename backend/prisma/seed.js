import { PrismaClient, CaseCategory, CaseStatus, WhatWentWrong, EvidenceLevel, EvidenceType, RiskLevel } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
async function main() {
    const isProduction = process.env.NODE_ENV === "production";
    const fallbackEmail = "admin@diiwaankabukaanka.org";
    const fallbackPassword = "AdminChangeMe123!";
    const adminEmail = process.env.ADMIN_EMAIL ?? fallbackEmail;
    const adminPassword = process.env.ADMIN_PASSWORD ?? fallbackPassword;
    if (isProduction && (adminEmail === fallbackEmail || adminPassword === fallbackPassword)) {
        throw new Error("Refusing to seed default admin credentials in production. Set ADMIN_EMAIL and ADMIN_PASSWORD.");
    }
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.admin.upsert({
        where: { email: adminEmail },
        update: {},
        create: { email: adminEmail, name: "System Administrator", passwordHash },
    });
    const akram = await prisma.hospital.upsert({
        where: { name: "Akram Hospital" },
        update: {},
        create: {
            name: "Akram Hospital",
            slug: "akram-hospital",
            location: "Mogadishu, Banadir",
            description: "Major private hospital in Mogadishu.",
        },
    });
    const banadir = await prisma.hospital.upsert({
        where: { name: "Banadir Hospital" },
        update: {},
        create: {
            name: "Banadir Hospital",
            slug: "banadir-hospital",
            location: "Mogadishu, Banadir",
            description: "Public referral hospital.",
        },
    });
    const abdi = await prisma.patient.upsert({
        where: { slug: "abdi-mohamed" },
        update: {},
        create: { fullName: "Abdi Mohamed", slug: "abdi-mohamed", age: 34, gender: "Male" },
    });
    const ali = await prisma.patient.upsert({
        where: { slug: "ali-xakiim" },
        update: {},
        create: { fullName: "Ali Xakiim", slug: "ali-xakiim", age: 28, gender: "Male" },
    });
    const fatima = await prisma.patient.upsert({
        where: { slug: "fatima-hassan" },
        update: {},
        create: { fullName: "Fatima Hassan", slug: "fatima-hassan", age: 45, gender: "Female" },
    });
    const drAhmed = await prisma.doctor.upsert({
        where: { slug: "dr-ahmed-ali" },
        update: {},
        create: {
            fullName: "Dr Ahmed Ali",
            slug: "dr-ahmed-ali",
            specialty: "Internal Medicine",
            hospitalId: akram.id,
        },
    });
    const insulin = await prisma.medication.upsert({
        where: { slug: "insulin" },
        update: {},
        create: { name: "Insulin", slug: "insulin", type: "Antidiabetic" },
    });
    const insulinCase = await prisma.case.upsert({
        where: { slug: "wrong-insulin-dosage-akram-hospital" },
        update: {
            riskLevel: RiskLevel.HIGH,
            incidentDescription: "Patient received incorrect insulin dosage leading to worsening condition. Documented through administrator-verified medical records and witness interviews.",
        },
        create: {
            caseNumber: "DB-2026-001",
            title: "Wrong Insulin Dosage at Akram Hospital",
            slug: "wrong-insulin-dosage-akram-hospital",
            reasonForVisit: "High blood sugar (diabetes)",
            incidentDescription: "Patient received incorrect insulin dosage leading to worsening condition. Documented through administrator-verified medical records and witness interviews.",
            currentCondition: "Stable under observation",
            whatWentWrong: WhatWentWrong.WRONG_DOSAGE,
            category: CaseCategory.WRONG_MEDICATION,
            status: CaseStatus.PUBLISHED,
            riskLevel: RiskLevel.HIGH,
            evidenceLevel: EvidenceLevel.VERIFIED,
            incidentDate: new Date("2024-03-15"),
            publishedAt: new Date("2024-04-01"),
            hospitalId: akram.id,
            patientId: abdi.id,
            doctorId: drAhmed.id,
            medicationId: insulin.id,
            authorId: admin.id,
        },
    });
    await prisma.evidence.upsert({
        where: { id: "seed-evidence-doc-001" },
        update: {},
        create: {
            id: "seed-evidence-doc-001",
            caseId: insulinCase.id,
            type: EvidenceType.DOCUMENT,
            visibility: "PUBLIC",
            url: "https://res.cloudinary.com/demo/raw/upload/v1/samples/sample.doc",
            description: "Medical document — verified dosage records",
            fileName: "medical-record.pdf",
            mimeType: "application/pdf",
        },
    });
    await prisma.evidence.upsert({
        where: { id: "seed-evidence-doc-002" },
        update: {},
        create: {
            id: "seed-evidence-doc-002",
            caseId: insulinCase.id,
            type: EvidenceType.DOCUMENT,
            visibility: "PUBLIC",
            url: "https://res.cloudinary.com/demo/raw/upload/v1/samples/sample.doc",
            description: "Witness statement — family member account",
            fileName: "witness-statement.pdf",
            mimeType: "application/pdf",
        },
    });
    await prisma.case.upsert({
        where: { slug: "misdiagnosis-ali-akram" },
        update: { riskLevel: RiskLevel.MEDIUM },
        create: {
            caseNumber: "DB-2026-002",
            title: "Misdiagnosis Leading to Delayed Treatment",
            slug: "misdiagnosis-ali-akram",
            reasonForVisit: "Persistent abdominal pain",
            incidentDescription: "Ali Xakiim was initially misdiagnosed at Akram Hospital. Evidence collected and verified by archive administrators.",
            currentCondition: "Recovering",
            whatWentWrong: WhatWentWrong.MISDIAGNOSIS,
            category: CaseCategory.MISDIAGNOSIS,
            status: CaseStatus.PUBLISHED,
            riskLevel: RiskLevel.MEDIUM,
            evidenceLevel: EvidenceLevel.HIGH,
            incidentDate: new Date("2024-05-20"),
            publishedAt: new Date("2024-06-01"),
            hospitalId: akram.id,
            patientId: ali.id,
            doctorId: drAhmed.id,
            authorId: admin.id,
        },
    });
    await prisma.case.upsert({
        where: { slug: "delayed-treatment-fatima-banadir" },
        update: { riskLevel: RiskLevel.HIGH },
        create: {
            caseNumber: "DB-2026-003",
            title: "Delayed Emergency Treatment",
            slug: "delayed-treatment-fatima-banadir",
            reasonForVisit: "Chest pain and shortness of breath",
            incidentDescription: "Documented delay in emergency department treatment for Fatima Hassan at Banadir Hospital.",
            currentCondition: "Under follow-up care",
            whatWentWrong: WhatWentWrong.DELAYED_TREATMENT,
            category: CaseCategory.DELAYED_TREATMENT,
            status: CaseStatus.VERIFIED,
            riskLevel: RiskLevel.HIGH,
            evidenceLevel: EvidenceLevel.MEDIUM,
            incidentDate: new Date("2024-07-10"),
            hospitalId: banadir.id,
            patientId: fatima.id,
            authorId: admin.id,
        },
    });
    await prisma.case.upsert({
        where: { slug: "medication-error-abdi-banadir" },
        update: {
            status: CaseStatus.PUBLISHED,
            riskLevel: RiskLevel.HIGH,
            evidenceLevel: EvidenceLevel.MEDIUM,
            publishedAt: new Date("2024-09-15"),
        },
        create: {
            caseNumber: "DB-2026-004",
            title: "Medication Dosage Error",
            slug: "medication-error-abdi-banadir",
            reasonForVisit: "Inpatient diabetes management",
            incidentDescription: "Incorrect dosage administered during inpatient care at Banadir Hospital.",
            currentCondition: "Under observation",
            whatWentWrong: WhatWentWrong.WRONG_DOSAGE,
            category: CaseCategory.MEDICATION_ERROR,
            status: CaseStatus.PUBLISHED,
            riskLevel: RiskLevel.HIGH,
            evidenceLevel: EvidenceLevel.MEDIUM,
            incidentDate: new Date("2024-09-01"),
            publishedAt: new Date("2024-09-15"),
            hospitalId: banadir.id,
            patientId: abdi.id,
            authorId: admin.id,
        },
    });
    console.log("Seed complete (V2):", {
        hospitals: 2,
        patients: 3,
        doctors: 1,
        medications: 1,
        cases: 4,
        admin: admin.email,
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
