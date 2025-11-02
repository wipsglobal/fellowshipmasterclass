import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import {
  InsertUser,
  users,
  applications,
  academicQualifications,
  professionalQualifications,
  employmentHistory,
  referees,
  supportingDocuments,
  payments,
  certificates,
  cohorts,
  tracks,
  feeConfiguration,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error("[Database] DATABASE_URL not found in environment variables");
      throw new Error("DATABASE_URL is not configured");
    }

    try {
      console.log("[Database] Connecting to PostgreSQL...");
      _pool = new Pool({ 
        connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        max: 20, // Maximum number of clients in pool
        idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
        connectionTimeoutMillis: 30000, // Increased to 30 seconds for slower networks
        maxUses: 7500, // Close connection after 7500 uses (helps with Neon serverless)
        allowExitOnIdle: false, // Keep pool alive
      });

      // Handle pool errors
      _pool.on('error', (err) => {
        console.error('[Database] Unexpected pool error:', err);
      });

      // Test the connection
      try {
        const client = await _pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log("[Database] ✓ Connection test successful");
      } catch (testError) {
        console.error("[Database] Connection test failed:", testError);
        throw testError;
      }

      _db = drizzle(_pool);
      console.log("[Database] ✓ Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      throw error;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(
  name: string,
  email: string,
  password: string
): Promise<typeof users.$inferSelect> {
  const db = await getDb();

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const result = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashedPassword,
      loginMethod: "email",
      role: "user",
      lastSignedIn: new Date(),
    })
    .returning();

  if (!result || result.length === 0) {
    throw new Error("Failed to create user");
  }

  console.log("[Database] ✓ User created:", email);
  return result[0];
}

export async function verifyUserPassword(email: string, password: string): Promise<typeof users.$inferSelect | null> {
  const db = await getDb();

  const user = await getUserByEmail(email);
  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return null;
  }

  // Update last signed in
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  console.log("[Database] ✓ User authenticated:", email);
  return user;
}

// ============ COHORT OPERATIONS ============

export async function getCohorts() {
  const db = await getDb();
  if (!db) return [];

  const allCohorts = await db.select().from(cohorts).orderBy(cohorts.month);
  
  // Remove duplicates by name and year, keeping the latest created one
  const uniqueCohorts = allCohorts.reduce((acc, cohort) => {
    const key = `${cohort.name}-${cohort.year}`;
    const existing = acc.find((c: any) => `${c.name}-${c.year}` === key);
    
    if (!existing) {
      acc.push(cohort);
    } else {
      // Keep the one with higher ID (more recently created)
      const existingIndex = acc.indexOf(existing);
      if (cohort.id > existing.id) {
        acc[existingIndex] = cohort;
      }
    }
    
    return acc;
  }, [] as typeof allCohorts);
  
  return uniqueCohorts;
}

export async function getCohortById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(cohorts).where(eq(cohorts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ TRACK OPERATIONS ============

export async function getTracks() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tracks);
}

export async function getTrackByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tracks).where(eq(tracks.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ APPLICATION OPERATIONS ============

export async function createApplication(data: typeof applications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(applications).values(data);
  
  // Get the inserted application by applicationNumber
  const newApp = await db
    .select()
    .from(applications)
    .where(eq(applications.applicationNumber, data.applicationNumber))
    .limit(1);
  
  return newApp[0];
}

export async function getApplicationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getApplicationByNumber(applicationNumber: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(applications)
    .where(eq(applications.applicationNumber, applicationNumber))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserApplications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt));
}

export async function getAllApplications(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(applications)
    .orderBy(desc(applications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateApplication(
  id: number,
  data: Partial<typeof applications.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(applications).set(data).where(eq(applications.id, id));
}

// ============ ACADEMIC QUALIFICATIONS ============

export async function addAcademicQualification(
  data: typeof academicQualifications.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(academicQualifications).values(data);
}

export async function getAcademicQualifications(applicationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(academicQualifications)
    .where(eq(academicQualifications.applicationId, applicationId));
}

// ============ PROFESSIONAL QUALIFICATIONS ============

export async function addProfessionalQualification(
  data: typeof professionalQualifications.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(professionalQualifications).values(data);
}

export async function getProfessionalQualifications(applicationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(professionalQualifications)
    .where(eq(professionalQualifications.applicationId, applicationId));
}

// ============ EMPLOYMENT HISTORY ============

export async function addEmploymentHistory(
  data: typeof employmentHistory.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(employmentHistory).values(data);
}

export async function getEmploymentHistory(applicationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(employmentHistory)
    .where(eq(employmentHistory.applicationId, applicationId));
}

// ============ REFEREES ============

export async function addReferee(data: typeof referees.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(referees).values(data);
}

export async function getReferees(applicationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(referees)
    .where(eq(referees.applicationId, applicationId));
}

// ============ SUPPORTING DOCUMENTS ============

export async function addSupportingDocument(
  data: typeof supportingDocuments.$inferInsert
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(supportingDocuments).values(data);
}

export async function getSupportingDocuments(applicationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(supportingDocuments)
    .where(eq(supportingDocuments.applicationId, applicationId));
}

export async function deleteSupportingDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(supportingDocuments).where(eq(supportingDocuments.id, id));
}

// ============ PAYMENTS ============

export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(payments).values(data);
}

export async function getPaymentByReference(reference: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.paystackReference, reference))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getPaymentsByApplicationId(applicationId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(payments)
    .where(eq(payments.applicationId, applicationId))
    .orderBy(desc(payments.createdAt));
}

export async function updatePayment(
  id: number,
  data: Partial<typeof payments.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(payments).set(data).where(eq(payments.id, id));
}

// ============ CERTIFICATES ============

export async function createCertificate(data: typeof certificates.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(certificates).values(data);
}

export async function getCertificatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(certificates)
    .where(eq(certificates.userId, userId));
}

export async function getCertificateByApplicationId(applicationId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(certificates)
    .where(eq(certificates.applicationId, applicationId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ FEE CONFIGURATION ============

export async function getFeeConfiguration(cohortId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(feeConfiguration)
    .where(
      and(
        eq(feeConfiguration.cohortId, cohortId),
        eq(feeConfiguration.isActive, true)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function setFeeConfiguration(data: typeof feeConfiguration.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(feeConfiguration).values(data);
}

/**
 * Initialize default fee configuration (100,000 NGN)
 */
export async function initializeDefaultFees() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Database not available, skipping initialization");
      return;
    }

    // First, check if admin user exists
    const adminEmail = "admin@fellowship.com";
    let existingAdmin;
    
    try {
      existingAdmin = await getUserByEmail(adminEmail);
    } catch (error) {
      console.error("[Database] Error checking admin user:", error);
      existingAdmin = null;
    }
    
    if (!existingAdmin) {
      console.log("[Database] Creating default admin user...");
      try {
        const hashedPassword = await bcrypt.hash("Admin@123", 10);
        
        await db.insert(users).values({
          name: "Admin",
          email: adminEmail,
          password: hashedPassword,
          loginMethod: "email",
          role: "admin",
          lastSignedIn: new Date(),
        });
        
        console.log("[Database] ✓ Admin user created successfully!");
        if (!ENV.isProduction) {
          // During development it's helpful to see the default credentials,
          // but never print passwords or secrets in production logs.
          console.log("   📧 Email: admin@fellowship.com");
          console.log("   🔑 Password: Admin@123");
          console.log("   ⚠️  IMPORTANT: Change this password after first login!");
        } else {
          console.log("   Admin account created (production). Do not log credentials in production.");
        }
      } catch (error) {
        console.error("[Database] Failed to create admin user:", error);
      }
    }

    // First, ensure cohorts exist
    let allCohorts = [];
    
    try {
      allCohorts = await db.select().from(cohorts);
    } catch (error) {
      console.error("[Database] Error fetching cohorts:", error);
      return;
    }
    
    if (allCohorts.length === 0) {
      console.log("[Database] No cohorts found. Creating default cohorts...");
      
      try {
        const currentYear = new Date().getFullYear();
        const defaultCohorts = [
          { 
            name: "March", 
            month: 3, 
            year: currentYear, 
            applicationDeadline: new Date(currentYear, 2, 15), // March 15
            startDate: new Date(currentYear, 2, 20), // March 20
            endDate: new Date(currentYear, 5, 20), // June 20
            capacity: 100,
            status: "open" as const 
          },
          { 
            name: "June", 
            month: 6, 
            year: currentYear, 
            applicationDeadline: new Date(currentYear, 5, 15), // June 15
            startDate: new Date(currentYear, 5, 20), // June 20
          endDate: new Date(currentYear, 8, 20), // September 20
          capacity: 100,
          status: "open" as const 
        },
        { 
          name: "September", 
          month: 9, 
          year: currentYear, 
          applicationDeadline: new Date(currentYear, 8, 15), // Sept 15
          startDate: new Date(currentYear, 8, 20), // Sept 20
          endDate: new Date(currentYear, 11, 20), // Dec 20
          capacity: 100,
          status: "open" as const 
        },
        { 
          name: "December", 
          month: 12, 
          year: currentYear, 
          applicationDeadline: new Date(currentYear, 11, 15), // Dec 15
          startDate: new Date(currentYear, 11, 20), // Dec 20
          endDate: new Date(currentYear + 1, 2, 20), // March 20 next year
          capacity: 100,
          status: "open" as const 
        },
      ];
      
      for (const cohort of defaultCohorts) {
        await db.insert(cohorts).values(cohort);
      }
      
      console.log(`[Database] ✓ Created ${defaultCohorts.length} default cohorts for ${currentYear}`);
      allCohorts = await db.select().from(cohorts);
      } catch (error) {
        console.error("[Database] Failed to create cohorts:", error);
        return;
      }
    }
    
    // Now initialize fees
    try {
      const existingFees = await db.select().from(feeConfiguration).limit(1);
      
      if (existingFees.length === 0) {
        console.log("[Database] Initializing default fee configuration (100,000 NGN)...");
        
        for (const cohort of allCohorts) {
          await db.insert(feeConfiguration).values({
            cohortId: cohort.id,
            amount: "100000",
            currency: "NGN",
            description: "Default application fee for fellowship program",
            isActive: true,
          });
        }
        
        console.log(`[Database] ✓ Default fees (₦100,000) set for ${allCohorts.length} cohort(s)`);
      }
    } catch (error) {
      console.error("[Database] Failed to set fee configuration:", error);
    }
  } catch (error) {
    console.error("[Database] Initialization error:", error);
  }
}