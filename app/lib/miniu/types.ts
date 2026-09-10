export type User = {
  id: string;
  name: string;
  birthDate: string;
  email: string;
  passwordHash?: string;
  emailVerifiedAt: string | null;
  verificationCodeHash?: string;
  termsAgreedAt: string;
  requiredConsentsAgreedAt: string | null;
  marketingAgreedAt: string | null;
  onboardingStep: "emailVerification" | "coupleLink" | "preQuestions" | "home";
  createdAt: string;
  deletedAt: string | null;
};

export type Session = {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

export type Invitation = {
  id: string;
  codeHash: string;
  codePreview: string;
  createdByUserId: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
  acceptedByUserId: string | null;
  acceptedAt: string | null;
  createdAt: string;
};

export type Couple = {
  id: string;
  userIds: [string, string];
  status: "connected" | "unlinkPending";
  connectedAt: string;
  unlinkRequestedAt: string | null;
  purgeAfter: string | null;
};

export type PreQuestions = {
  id: string;
  userId: string;
  relationshipStartedOn: string;
  likes: string[];
  dislikes: string[];
  tendencies: string[];
  habits: string[];
  values: string[];
  createdAt: string;
};

export type Miniu = {
  id: string;
  userId: string;
  name: string;
  preset: string;
  hairStyle: string;
  hairColor: string;
  skinTone: string;
  faceShape: string;
  expression: string;
  createdAt: string;
  updatedAt: string;
};

export type ProfileCategory = "likes" | "dislikes" | "values" | "habits" | "tendencies";

export type ProfileSourceType = "preQuestion" | "record" | "message";

export type ProfileSource = {
  type: ProfileSourceType;
  id: string;
};

export type ProfileCard = {
  id: string;
  userId: string;
  category: ProfileCategory;
  content: string;
  sources: ProfileSource[];
  mergeCandidateOf: string | null;
  userEdited: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecordEntry = {
  id: string;
  userId: string;
  content: string;
  happenedOn: string;
  analysisStatus: "pending" | "complete" | "failedTemporary" | "failedPermanent";
  analysisError: string | null;
  createdAt: string;
};

export type ChatUsage = {
  userId: string;
  kstDate: string;
  used: number;
};

export type EventLog = {
  id: string;
  userId: string | null;
  coupleId: string | null;
  name: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type MiniuDb = {
  users: User[];
  sessions: Session[];
  invitations: Invitation[];
  couples: Couple[];
  preQuestions: PreQuestions[];
  minius: Miniu[];
  records: RecordEntry[];
  profileCards: ProfileCard[];
  chatUsages: ChatUsage[];
  events: EventLog[];
};
