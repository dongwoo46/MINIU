import { insertRows } from "./supabase";

export type SignupConsentInput = {
  terms: boolean;
  privacyRequired: boolean;
  processorTransferNotice: boolean;
  aiAnalysisTransfer: boolean;
  partnerInfoResponsibility: boolean;
  age14OrOver: boolean;
  marketing?: boolean;
};

type ConsentType =
  | "terms"
  | "privacy_required"
  | "processor_transfer_notice"
  | "ai_analysis_transfer"
  | "partner_info_responsibility"
  | "age_14_or_over"
  | "marketing";

const documentVersions = {
  terms: "terms-2026-09-10",
  privacy_required: "privacy-2026-09-10",
  processor_transfer_notice: "privacy-2026-09-10",
  ai_analysis_transfer: "privacy-2026-09-10",
  partner_info_responsibility: "terms-privacy-2026-09-10",
  age_14_or_over: "signup-consent-2026-09-10",
  marketing: "marketing-2026-09-10",
} satisfies Record<ConsentType, string>;

export const requiredSignupConsentFields = [
  "terms",
  "privacyRequired",
  "processorTransferNotice",
  "aiAnalysisTransfer",
  "partnerInfoResponsibility",
  "age14OrOver",
] as const;

const consentTypeByField = {
  terms: "terms",
  privacyRequired: "privacy_required",
  processorTransferNotice: "processor_transfer_notice",
  aiAnalysisTransfer: "ai_analysis_transfer",
  partnerInfoResponsibility: "partner_info_responsibility",
  age14OrOver: "age_14_or_over",
  marketing: "marketing",
} satisfies Record<keyof SignupConsentInput, ConsentType>;

export async function insertSignupConsents(input: {
  userId: string;
  consents: SignupConsentInput;
  ip: string | null;
  userAgent: string | null;
  agreedAt: string;
}): Promise<void> {
  const rows = Object.entries(consentTypeByField).map(([field, consentType]) => ({
    user_id: input.userId,
    consent_type: consentType,
    agreed: Boolean(input.consents[field as keyof SignupConsentInput]),
    document_version: documentVersions[consentType],
    agreed_at: input.agreedAt,
    metadata: {
      ip: input.ip,
      userAgent: input.userAgent,
    },
  }));

  await insertRows("user_consents", rows);
}
