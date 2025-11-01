import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  numeric,
  json,
  serial,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const participationModeEnum = pgEnum("participation_mode", ["physical", "virtual"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed"]);
export const admissionStatusEnum = pgEnum("admission_status", ["approved", "pending", "declined"]);
export const applicationStatusEnum = pgEnum("application_status", ["draft", "submitted", "under_review", "approved", "declined"]);
export const cohortStatusEnum = pgEnum("cohort_status", ["open", "closed", "completed"]);
export const documentTypeEnum = pgEnum("document_type", [
  "academic_certificate",
  "professional_certificate",
  "cv",
  "passport_photo",
  "identification",
  "other"
]);
export const certificateStatusEnum = pgEnum("certificate_status", ["generated", "issued", "revoked"]);

/**
 * Core user table backing auth flow.
 * Extended with additional fields for fellowship system.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: text("password"),
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Cohorts table - Defines the four annual cohorts
 */
export const cohorts = pgTable("cohorts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  applicationDeadline: timestamp("applicationDeadline").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  capacity: integer("capacity").notNull().default(100),
  status: cohortStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Cohort = typeof cohorts.$inferSelect;
export type InsertCohort = typeof cohorts.$inferInsert;

/**
 * Fellowship tracks/programmes
 */
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

/**
 * Fellowship applications - Main application form data
 */
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  applicationNumber: varchar("applicationNumber", { length: 50 }).notNull().unique(),
  userId: integer("userId").notNull(),
  cohortId: integer("cohortId").notNull(),
  
  // Section A: Personal Information
  fullName: varchar("fullName", { length: 255 }).notNull(),
  title: varchar("title", { length: 50 }),
  titleOther: varchar("titleOther", { length: 50 }),
  dateOfBirth: varchar("dateOfBirth", { length: 10 }),
  gender: genderEnum("gender"),
  nationality: varchar("nationality", { length: 100 }),
  countryOfResidence: varchar("countryOfResidence", { length: 100 }),
  contactAddress: text("contactAddress"),
  email: varchar("email", { length: 320 }).notNull(),
  mobileNumber: varchar("mobileNumber", { length: 20 }).notNull(),
  whatsappNumber: varchar("whatsappNumber", { length: 20 }),
  linkedinProfile: varchar("linkedinProfile", { length: 500 }),
  
  // Section B: Programme Selection
  participationMode: participationModeEnum("participationMode").notNull(),
  selectedTracks: json("selectedTracks").$type<string[]>().notNull(),
  
  // Section C: Academic Qualifications
  highestQualification: varchar("highestQualification", { length: 100 }),
  classOfDegree: varchar("classOfDegree", { length: 50 }),
  
  // Section D: Professional Memberships
  ibakmmembershipNumber: varchar("ibakmmembershipNumber", { length: 100 }),
  isIbakmmember: boolean("isIbakmmember").default(false),
  
  // Section E: Employment History
  totalYearsExperience: integer("totalYearsExperience"),
  
  // Section F: Eligibility Category
  eligibilityCategory: varchar("eligibilityCategory", { length: 255 }).notNull(),
  
  // Section G: Statement of Purpose
  statementOfPurpose: text("statementOfPurpose").notNull(),
  
  // Section J: Declaration and Consent
  declarationAccepted: boolean("declarationAccepted").default(false).notNull(),
  dataConsentAccepted: boolean("dataConsentAccepted").default(false).notNull(),
  signatureData: text("signatureData"),
  
  // Section K: Application Fee Payment
  applicationFee: numeric("applicationFee", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("paymentStatus").default("pending").notNull(),
  paymentReference: varchar("paymentReference", { length: 100 }),
  
  // Section L: Official Use Only
  admissionStatus: admissionStatusEnum("admissionStatus").default("pending").notNull(),
  remarks: text("remarks"),
  verifiedBy: varchar("verifiedBy", { length: 255 }),
  dateOfApproval: timestamp("dateOfApproval"),
  
  // System fields
  status: applicationStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  submittedAt: timestamp("submittedAt"),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

/**
 * Academic qualifications for each applicant
 */
export const academicQualifications = pgTable("academicQualifications", {
  id: serial("id").primaryKey(),
  applicationId: integer("applicationId").notNull(),
  qualification: varchar("qualification", { length: 100 }).notNull(),
  discipline: varchar("discipline", { length: 100 }).notNull(),
  institution: varchar("institution", { length: 255 }).notNull(),
  yearObtained: integer("yearObtained").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AcademicQualification = typeof academicQualifications.$inferSelect;
export type InsertAcademicQualification = typeof academicQualifications.$inferInsert;

/**
 * Professional qualifications and memberships
 */
export const professionalQualifications = pgTable("professionalQualifications", {
  id: serial("id").primaryKey(),
  applicationId: integer("applicationId").notNull(),
  professionalBody: varchar("professionalBody", { length: 100 }).notNull(),
  designation: varchar("designation", { length: 100 }).notNull(),
  yearAdmitted: integer("yearAdmitted").notNull(),
  membershipStatus: varchar("membershipStatus", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProfessionalQualification = typeof professionalQualifications.$inferSelect;
export type InsertProfessionalQualification = typeof professionalQualifications.$inferInsert;

/**
 * Employment/Career history
 */
export const employmentHistory = pgTable("employmentHistory", {
  id: serial("id").primaryKey(),
  applicationId: integer("applicationId").notNull(),
  organization: varchar("organization", { length: 255 }).notNull(),
  positionHeld: varchar("positionHeld", { length: 100 }).notNull(),
  periodFrom: varchar("periodFrom", { length: 10 }).notNull(),
  periodTo: varchar("periodTo", { length: 10 }).notNull(),
  keyResponsibilities: text("keyResponsibilities"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmploymentHistory = typeof employmentHistory.$inferSelect;
export type InsertEmploymentHistory = typeof employmentHistory.$inferInsert;

/**
 * Referees (professional or academic)
 */
export const referees = pgTable("referees", {
  id: serial("id").primaryKey(),
  applicationId: integer("applicationId").notNull(),
  refereeName: varchar("refereeName", { length: 255 }).notNull(),
  positionOrganization: varchar("positionOrganization", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referee = typeof referees.$inferSelect;
export type InsertReferee = typeof referees.$inferInsert;

/**
 * Supporting documents uploaded by applicants
 */
export const supportingDocuments = pgTable("supportingDocuments", {
  id: serial("id").primaryKey(),
  applicationId: integer("applicationId").notNull(),
  documentType: documentTypeEnum("documentType").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  cloudinaryUrl: text("cloudinaryUrl").notNull(),
  cloudinaryPublicId: varchar("cloudinaryPublicId", { length: 255 }).notNull(),
  fileSize: integer("fileSize"),
  mimeType: varchar("mimeType", { length: 50 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupportingDocument = typeof supportingDocuments.$inferSelect;
export type InsertSupportingDocument = typeof supportingDocuments.$inferInsert;

/**
 * Payment records for Paystack transactions
 */
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  applicationId: integer("applicationId").notNull(),
  userId: integer("userId").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("NGN").notNull(),
  paystackReference: varchar("paystackReference", { length: 100 }).unique(),
  paystackAccessCode: varchar("paystackAccessCode", { length: 100 }),
  status: paymentStatusEnum("status").default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paidAt: timestamp("paidAt"),
  receiptUrl: text("receiptUrl"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Certificates issued to fellows
 */
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  applicationId: integer("applicationId").notNull(),
  userId: integer("userId").notNull(),
  certificateNumber: varchar("certificateNumber", { length: 50 }).notNull().unique(),
  trackCode: varchar("trackCode", { length: 20 }).notNull(),
  postNominals: varchar("postNominals", { length: 20 }).notNull(),
  issuedDate: timestamp("issuedDate").defaultNow().notNull(),
  certificateUrl: text("certificateUrl"),
  status: certificateStatusEnum("status").default("generated").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

/**
 * Application fee configuration
 */
export const feeConfiguration = pgTable("feeConfiguration", {
  id: serial("id").primaryKey(),
  cohortId: integer("cohortId").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("NGN").notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FeeConfiguration = typeof feeConfiguration.$inferSelect;
export type InsertFeeConfiguration = typeof feeConfiguration.$inferInsert;
