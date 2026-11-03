require("dotenv").config();

module.exports = {
  development: {
    client: "mssql",
    connection: {
      server: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 1433,
      user: process.env.DB_USER || "sa",
      password: process.env.DB_PASSWORD || "ToolNest@2026",
      database: process.env.DB_NAME || "ToolNestDB",
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    },
    migrations: {
      directory: "./src/db/migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
  },
};