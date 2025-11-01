import { COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  async authenticateRequest(req: Request): Promise<User> {
    // Parse cookies
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);

    if (!sessionCookie) {
      throw ForbiddenError("No session cookie");
    }

    // JWT verification for email/password login with retry logic
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret");
        const { payload } = await jwtVerify(sessionCookie, secret);
        
        if (payload.userId && typeof payload.userId === "number") {
          const user = await db.getUserById(payload.userId);
          if (user) {
            return user;
          }
        }
        throw ForbiddenError("User not found");
      } catch (error: any) {
        lastError = error;
        
        // Only retry on connection errors, not authentication errors
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message?.includes('network')) {
          console.warn(`[Auth] Database connection error (attempt ${attempt}/${maxRetries}):`, error.message);
          
          if (attempt < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
            continue;
          }
        }
        
        // If it's an authentication error or max retries exceeded, throw immediately
        console.error("[Auth] JWT verification failed:", error);
        throw ForbiddenError("Invalid session");
      }
    }

    throw ForbiddenError("Authentication failed after retries");
  }
}

export const sdk = new SDKServer();
