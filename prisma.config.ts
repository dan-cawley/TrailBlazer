import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js uses .env.local for developer-specific secrets. Load it for Prisma
// commands as well so migrations use the same DATABASE_URL as the application.
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
