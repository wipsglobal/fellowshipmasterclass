import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local if it exists
config({ path: resolve(process.cwd(), ".env.local") });

import express from "express";
import { createServer } from "http";
import net from "net";
import dns from "dns";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeDefaultFees } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Initialize default fees before starting server with error handling.
  // If DATABASE_URL is not configured, skip DB initialization to avoid crashing
  // during deployments where the DB is configured via platform env vars.
  if (!process.env.DATABASE_URL) {
    console.warn("[Server] DATABASE_URL not set — skipping database initialization (initializeDefaultFees)");
  } else {
    // Before attempting DB initialization, verify the DB hostname resolves.
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      const hostname = dbUrl.hostname;
      // Try DNS lookup with a short timeout.
      const lookupPromise = dns.promises.lookup(hostname);
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("DNS lookup timeout")), 3000));
      await Promise.race([lookupPromise, timeout]);
    } catch (err) {
      console.warn(`[Server] Database host DNS lookup failed or timed out (${err?.message}). Skipping database initialization.`);
      // Continue startup without DB initialization
    }
    try {
      await initializeDefaultFees();
    } catch (error) {
      console.error("[Server] Failed to initialize default fees:", error);
      console.log("[Server] Continuing server startup anyway...");
    }
  }
  
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
