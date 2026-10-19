import type { Knex } from "knex";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "mssql",
    connection: {
      server: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 1433,
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "1",
      database: process.env.DB_NAME || "ToolNestDB",
      options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
      },
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "./src/db/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./src/db/seeds",
      extension: "ts",
    },
  },
};

export default config;