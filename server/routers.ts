import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { uploadFile as uploadToCloudinary } from "./services/cloudinary";
import { initializePayment as initializePaystackPayment, verifyPayment as verifyPaystackPayment, isPaymentSuccessful } from "./services/paystack";
import { 
  sendApplicationSubmittedEmail, 
  sendApplicationApprovedEmail, 
  sendApplicationRejectedEmail,
  sendPaymentConfirmationEmail,
  sendApplicationUnderReviewEmail 
} from "./services/email";
import {
  createApplication,
  getApplicationById,
  getUserApplications,
  getAllApplications,
  updateApplication,
  addAcademicQualification,
  getAcademicQualifications,
  addProfessionalQualification,
  getProfessionalQualifications,
  addEmploymentHistory,
  getEmploymentHistory,
  addReferee,
  getReferees,
  addSupportingDocument,
  getSupportingDocuments,
  deleteSupportingDocument,
  createPayment,
  getPaymentByReference,
  getPaymentsByApplicationId,
  updatePayment,
  getCohorts,
  getCohortById,
  getTracks,
  getFeeConfiguration,
  setFeeConfiguration,
  createCertificate,
  getCertificatesByUserId,
  getCertificateByApplicationId,
  getApplicationByNumber,
  getUserById,
  createUserWithPassword,
  verifyUserPassword,
} from "./db";
import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";

// Helper to check if user is admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Generate unique application number
function generateApplicationNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `APP-${timestamp}-${random}`;
}

export const appRouter = router({
  system: systemRouter,

  // ============ AUTH ROUTER ============
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    
    signup: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Invalid email address"),
          password: z.string().min(8, "Password must be at least 8 characters"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await createUserWithPassword(input.name, input.email, input.password);
          return {
            success: true,
            userId: user.id,
          };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "Failed to create account",
          });
        }
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("Invalid email address"),
          password: z.string().min(1, "Password is required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await verifyUserPassword(input.email, input.password);
        
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Create JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");
        const token = await new SignJWT({ userId: user.id })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("7d")
          .sign(secret);

        // Set cookie with 7 days expiration
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ COHORT ROUTER ============
  cohorts: router({
    list: publicProcedure.query(async () => {
      return getCohorts();
    }),

    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      return getCohortById(input);
    }),
  }),

  // ============ TRACK ROUTER ============
  tracks: router({
    list: publicProcedure.query(async () => {
      return getTracks();
    }),
  }),

  // ============ APPLICATION ROUTER ============
  applications: router({
    // Create a new application (draft)
    create: protectedProcedure
      .input(
        z.object({
          // Basic required fields
          cohortId: z.number(),
          fullName: z.string().min(1),
          email: z.string().email(),
          mobileNumber: z.string().min(1),
          participationMode: z.enum(["physical", "virtual"]),
          selectedTracks: z.array(z.string()).min(1),
          eligibilityCategory: z.string().min(1),
          statementOfPurpose: z.string().min(250),
          
          // Optional personal fields
          title: z.string().optional(),
          titleOther: z.string().optional(),
          dateOfBirth: z.string().optional(),
          gender: z.enum(["male", "female", "other"]).optional(),
          nationality: z.string().optional(),
          countryOfResidence: z.string().optional(),
          contactAddress: z.string().optional(),
          whatsappNumber: z.string().optional(),
          linkedinProfile: z.string().optional(),
          
          // Academic & Professional
          highestQualification: z.string().optional(),
          classOfDegree: z.string().optional(),
          isIbakmmember: z.boolean().optional(),
          ibakmmembershipNumber: z.string().optional(),
          totalYearsExperience: z.number().optional(),
          
          // Declaration
          declarationAccepted: z.boolean().optional(),
          dataConsentAccepted: z.boolean().optional(),
          
          // Related data arrays
          academicQualifications: z.array(z.object({
            qualification: z.string(),
            discipline: z.string(),
            institution: z.string(),
            yearObtained: z.number(),
          })).optional(),
          
          professionalQualifications: z.array(z.object({
            professionalBody: z.string(),
            designation: z.string(),
            yearAdmitted: z.number(),
            membershipStatus: z.string(),
          })).optional(),
          
          employmentHistory: z.array(z.object({
            organization: z.string(),
            positionHeld: z.string(),
            periodFrom: z.string(),
            periodTo: z.string(),
            keyResponsibilities: z.string(),
          })).optional(),
          
          referees: z.array(z.object({
            refereeName: z.string(),
            positionOrganization: z.string(),
            email: z.string().email(),
            phoneNumber: z.string(),
          })).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const cohort = await getCohortById(input.cohortId);
        if (!cohort) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cohort not found",
          });
        }

        const fee = await getFeeConfiguration(input.cohortId);
        if (!fee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fee not configured for this cohort",
          });
        }

        const applicationNumber = generateApplicationNumber();
        const result = await createApplication({
          applicationNumber,
          userId: ctx.user.id,
          cohortId: input.cohortId,
          
          // Personal information
          fullName: input.fullName,
          title: input.title,
          titleOther: input.titleOther,
          dateOfBirth: input.dateOfBirth,
          gender: input.gender,
          nationality: input.nationality,
          countryOfResidence: input.countryOfResidence,
          contactAddress: input.contactAddress,
          email: input.email,
          mobileNumber: input.mobileNumber,
          whatsappNumber: input.whatsappNumber,
          linkedinProfile: input.linkedinProfile,
          
          // Programme selection
          participationMode: input.participationMode,
          selectedTracks: input.selectedTracks,
          
          // Academic & Professional
          highestQualification: input.highestQualification,
          classOfDegree: input.classOfDegree,
          isIbakmmember: input.isIbakmmember,
          ibakmmembershipNumber: input.ibakmmembershipNumber,
          totalYearsExperience: input.totalYearsExperience,
          
          // Eligibility & Statement
          eligibilityCategory: input.eligibilityCategory,
          statementOfPurpose: input.statementOfPurpose,
          
          // Declaration
          declarationAccepted: input.declarationAccepted,
          dataConsentAccepted: input.dataConsentAccepted,
          
          // Payment
          applicationFee: fee.amount,
          status: "draft",
        });

        // Save related data if provided
        if (input.academicQualifications && input.academicQualifications.length > 0) {
          for (const aq of input.academicQualifications) {
            await addAcademicQualification({
              applicationId: result.id,
              ...aq,
            });
          }
        }
        
        if (input.professionalQualifications && input.professionalQualifications.length > 0) {
          for (const pq of input.professionalQualifications) {
            await addProfessionalQualification({
              applicationId: result.id,
              ...pq,
            });
          }
        }
        
        if (input.employmentHistory && input.employmentHistory.length > 0) {
          for (const eh of input.employmentHistory) {
            await addEmploymentHistory({
              applicationId: result.id,
              ...eh,
            });
          }
        }
        
        if (input.referees && input.referees.length > 0) {
          for (const ref of input.referees) {
            await addReferee({
              applicationId: result.id,
              ...ref,
            });
          }
        }

        return {
          success: true,
          applicationNumber,
          id: result.id,
        };
      }),

    // Get user's applications
    myApplications: protectedProcedure.query(async ({ ctx }) => {
      return getUserApplications(ctx.user.id);
    }),

    // Get single application
    getById: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const app = await getApplicationById(input);
        if (!app) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application not found",
          });
        }

        // Check authorization
        if (app.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        return app;
      }),

    // Update application (only draft status)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            fullName: z.string().optional(),
            email: z.string().email().optional(),
            mobileNumber: z.string().optional(),
            title: z.string().optional(),
            dateOfBirth: z.string().optional(),
            gender: z.enum(["male", "female", "other"]).optional(),
            nationality: z.string().optional(),
            countryOfResidence: z.string().optional(),
            contactAddress: z.string().optional(),
            linkedinProfile: z.string().optional(),
            participationMode: z.enum(["physical", "virtual"]).optional(),
            highestQualification: z.string().optional(),
            classOfDegree: z.string().optional(),
            ibakmmembershipNumber: z.string().optional(),
            isIbakmmember: z.boolean().optional(),
            totalYearsExperience: z.number().optional(),
            statementOfPurpose: z.string().optional(),
          }),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const app = await getApplicationById(input.id);
        if (!app) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application not found",
          });
        }

        if (app.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        if (app.status !== "draft") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only edit draft applications",
          });
        }

        await updateApplication(input.id, input.data);
        return { success: true };
      }),

    // Submit application for review
    submit: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const app = await getApplicationById(input);
        if (!app) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application not found",
          });
        }

        if (app.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        if (app.status !== "draft") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Application already submitted",
          });
        }

        // Validate required fields
        if (!app.fullName || !app.email || !app.statementOfPurpose) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please complete all required fields",
          });
        }

        await updateApplication(input, {
          status: "submitted",
          submittedAt: new Date(),
        });

        // Send application submitted confirmation email
        try {
          if (ctx.user.email) {
            await sendApplicationSubmittedEmail(
              ctx.user.email,
              ctx.user.name ?? "Applicant",
              app.applicationNumber
            );
          }
        } catch (emailError) {
          console.error("[Email] Failed to send submission confirmation:", emailError);
          // Don't fail the whole operation if email fails
        }

        return { success: true };
      }),

    // Admin: Get all applications
    adminList: adminProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
          status: z.string().optional(),
          cohortId: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return getAllApplications(input.limit, input.offset);
      }),

    // Admin: Update application status
    adminUpdateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          admissionStatus: z.enum(["approved", "pending", "declined"]),
          remarks: z.string().optional(),
          verifiedBy: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const app = await getApplicationById(input.id);
        if (!app) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application not found",
          });
        }

        // Get user details for email
        const user = await getUserById(app.userId);
        
        await updateApplication(input.id, {
          admissionStatus: input.admissionStatus,
          remarks: input.remarks,
          verifiedBy: input.verifiedBy,
          dateOfApproval: new Date(),
          status:
            input.admissionStatus === "approved"
              ? "approved"
              : input.admissionStatus === "declined"
                ? "declined"
                : "under_review",
        });

        // Send email notification based on status
        try {
          if (input.admissionStatus === "approved" && user && user.email) {
            // Get cohort details
            const cohort = app.cohortId ? await getCohortById(app.cohortId) : null;
            await sendApplicationApprovedEmail(
              user.email,
              user.name ?? "Applicant",
              app.applicationNumber,
              cohort?.name || "Upcoming Cohort",
              cohort?.startDate?.toLocaleDateString() || "To be announced"
            );
          } else if (input.admissionStatus === "declined" && user && user.email) {
            await sendApplicationRejectedEmail(
              user.email,
              user.name ?? "Applicant",
              app.applicationNumber
            );
          } else if (input.admissionStatus === "pending" && user && user.email) {
            await sendApplicationUnderReviewEmail(
              user.email,
              user.name ?? "Applicant",
              app.applicationNumber
            );
          }
        } catch (emailError) {
          console.error("[Email] Failed to send status notification:", emailError);
          // Don't fail the whole operation if email fails
        }

        return { success: true };
      }),
  }),

  // ============ ACADEMIC QUALIFICATIONS ROUTER ============
  academicQualifications: router({
    add: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          qualification: z.string(),
          discipline: z.string(),
          institution: z.string(),
          yearObtained: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        await addAcademicQualification(input);
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const app = await getApplicationById(input);
        if (!app || (app.userId !== ctx.user.id && ctx.user.role !== "admin")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        return getAcademicQualifications(input);
      }),
  }),

  // ============ PROFESSIONAL QUALIFICATIONS ROUTER ============
  professionalQualifications: router({
    add: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          professionalBody: z.string(),
          designation: z.string(),
          yearAdmitted: z.number(),
          membershipStatus: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        await addProfessionalQualification(input);
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const app = await getApplicationById(input);
        if (!app || (app.userId !== ctx.user.id && ctx.user.role !== "admin")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        return getProfessionalQualifications(input);
      }),
  }),

  // ============ EMPLOYMENT HISTORY ROUTER ============
  employmentHistory: router({
    add: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          organization: z.string(),
          positionHeld: z.string(),
          periodFrom: z.string(),
          periodTo: z.string(),
          keyResponsibilities: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        await addEmploymentHistory(input);
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const app = await getApplicationById(input);
        if (!app || (app.userId !== ctx.user.id && ctx.user.role !== "admin")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        return getEmploymentHistory(input);
      }),
  }),

  // ============ REFEREES ROUTER ============
  referees: router({
    add: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          refereeName: z.string(),
          positionOrganization: z.string(),
          email: z.string().email(),
          phoneNumber: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        await addReferee(input);
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const app = await getApplicationById(input);
        if (!app || (app.userId !== ctx.user.id && ctx.user.role !== "admin")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        return getReferees(input);
      }),
  }),

  // ============ SUPPORTING DOCUMENTS ROUTER ============
  documents: router({
    // Upload file to Google Drive and save record
    upload: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          documentType: z.enum([
            "academic_certificate",
            "professional_certificate",
            "cv",
            "passport_photo",
            "identification",
            "other",
          ]),
          fileName: z.string(),
          fileData: z.string(), // Base64 encoded file
          mimeType: z.string(),
          fileSize: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        try {
          // Decode base64 file data
          const fileBuffer = Buffer.from(input.fileData, 'base64');
          
          // Upload to Cloudinary
          const { publicId, secureUrl } = await uploadToCloudinary(
            input.fileName,
            fileBuffer,
            input.mimeType
          );

          // Save document record to database
          await addSupportingDocument({
            applicationId: input.applicationId,
            documentType: input.documentType,
            fileName: input.fileName,
            cloudinaryUrl: secureUrl,
            cloudinaryPublicId: publicId,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
          });

          return { 
            success: true, 
            fileId: publicId, 
            webViewLink: secureUrl 
          };
        } catch (error) {
          console.error("[Documents] Upload error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to upload document to Cloudinary",
          });
        }
      }),

    add: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
          documentType: z.enum([
            "academic_certificate",
            "professional_certificate",
            "cv",
            "passport_photo",
            "identification",
            "other",
          ]),
          fileName: z.string(),
          cloudinaryUrl: z.string(),
          cloudinaryPublicId: z.string(),
          fileSize: z.number().optional(),
          mimeType: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        await addSupportingDocument(input);
        return { success: true };
      }),

    list: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const app = await getApplicationById(input);
        if (!app || (app.userId !== ctx.user.id && ctx.user.role !== "admin")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        return getSupportingDocuments(input);
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        // Verify authorization by checking the document's application
        const docs = await getSupportingDocuments(input);
        if (docs.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        await deleteSupportingDocument(input);
        return { success: true };
      }),
  }),

  // ============ PAYMENTS ROUTER ============
  payments: router({
    // Initialize payment with Paystack
    initiate: protectedProcedure
      .input(
        z.object({
          applicationId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app || app.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        // Get fee configuration for the cohort
        const feeConfig = await getFeeConfiguration(app.cohortId);
        if (!feeConfig) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fee not configured for this cohort",
          });
        }

        const amount = parseFloat(feeConfig.amount);
        const reference = `APP-${app.applicationNumber}-${Date.now()}`;

        try {
          // Initialize Paystack payment
          const paystackResponse = await initializePaystackPayment(
            app.email,
            amount,
            reference,
            {
              applicationId: app.id,
              applicationNumber: app.applicationNumber,
              userId: ctx.user.id,
              fullName: app.fullName,
            }
          );

          if (!paystackResponse.status || !paystackResponse.data) {
            throw new Error(paystackResponse.message || "Failed to initialize payment");
          }

          // Create payment record
          await createPayment({
            applicationId: app.id,
            userId: ctx.user.id,
            amount: amount.toString(),
            currency: "NGN",
            paystackReference: reference,
            status: "pending",
          });

          return {
            success: true,
            authorizationUrl: paystackResponse.data.authorization_url,
            reference,
            amount,
          };
        } catch (error) {
          console.error("[Payments] Initialization error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to initialize payment",
          });
        }
      }),

    // Verify payment with Paystack
    verify: protectedProcedure
      .input(
        z.object({
          reference: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify with Paystack
          const paystackResponse = await verifyPaystackPayment(input.reference);
          
          if (!isPaymentSuccessful(paystackResponse)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Payment verification failed",
            });
          }

          const payment = await getPaymentByReference(input.reference);
          if (!payment) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Payment not found",
            });
          }

          // Get application and user details for email
          const application = await getApplicationById(payment.applicationId);
          const user = application ? await getUserById(application.userId) : null;

          // Update payment status
          await updatePayment(payment.id, {
            status: "completed",
            paidAt: new Date(),
          });

          // Update application payment status
          await updateApplication(payment.applicationId, {
            paymentStatus: "completed",
            paymentReference: input.reference,
          });

          // Send payment confirmation email
          try {
            if (user && user.email && application) {
              await sendPaymentConfirmationEmail(
                user.email,
                user.name ?? "Applicant",
                application.applicationNumber,
                Number(payment.amount),
                input.reference
              );
            }
          } catch (emailError) {
            console.error("[Email] Failed to send payment confirmation:", emailError);
            // Don't fail the whole operation if email fails
          }

          return { 
            success: true,
            message: "Payment verified successfully",
          };
        } catch (error) {
          console.error("[Payments] Verification error:", error);
          throw error;
        }
      }),

    // Get payment history for application
    getByApplication: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const app = await getApplicationById(input);
        if (!app || (app.userId !== ctx.user.id && ctx.user.role !== "admin")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        return getPaymentsByApplicationId(input);
      }),
  }),

  // ============ FEE CONFIGURATION ROUTER ============
  feeConfig: router({
    getForCohort: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getFeeConfiguration(input);
      }),

    // Admin: Update fee configuration
    adminUpdate: adminProcedure
      .input(
        z.object({
          cohortId: z.number(),
          amount: z.number(),
          currency: z.string().default("NGN"),
          description: z.string().optional(),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await setFeeConfiguration({
            cohortId: input.cohortId,
            amount: input.amount.toString(),
            currency: input.currency,
            description: input.description,
            isActive: input.isActive,
          });

          return { 
            success: true,
            message: "Fee configuration updated successfully",
          };
        } catch (error) {
          console.error("[FeeConfig] Update error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update fee configuration",
          });
        }
      }),
  }),

  // ============ CERTIFICATES ROUTER ============
  certificates: router({
    // Get user's certificates
    myCertificates: protectedProcedure.query(async ({ ctx }) => {
      return getCertificatesByUserId(ctx.user.id);
    }),

    // Get certificate for application
    getByApplication: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const app = await getApplicationById(input);
        if (!app || (app.userId !== ctx.user.id && ctx.user.role !== "admin")) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        return getCertificateByApplicationId(input);
      }),

    // Admin: Generate certificate
    adminGenerate: adminProcedure
      .input(
        z.object({
          applicationId: z.number(),
          trackCode: z.string(),
          postNominals: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const app = await getApplicationById(input.applicationId);
        if (!app) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application not found",
          });
        }

        const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        await createCertificate({
          applicationId: input.applicationId,
          userId: app.userId,
          certificateNumber,
          trackCode: input.trackCode,
          postNominals: input.postNominals,
          status: "generated",
        });

        return { success: true, certificateNumber };
      }),
  }),

  // ============ USER PROFILE ROUTER ============
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getUserById(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
