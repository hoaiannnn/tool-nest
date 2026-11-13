const knex = require("knex");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function connect(database) {
    return knex({
        client: "mssql",
        connection: {
            server: process.env.DB_HOST,
            port: Number(process.env.DB_PORT || 1433),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database,
            options: { encrypt: false, trustServerCertificate: true },
        },
    });
}

async function main() {
    const dbName = process.env.DB_NAME || "ToolNestDB";

    for (let i = 1; i <= 30; i++) {
        const master = connect("master");
        try {
            await master.raw(
                `IF DB_ID('${dbName}') IS NULL CREATE DATABASE [${dbName}] COLLATE Vietnamese_CI_AI`
            );
            await master.destroy();
            console.log(`[init] Database ${dbName} sẵn sàng`);
            break;
        } catch (e) {
            await master.destroy();
            if (i === 30) throw e;
            console.log(`[init] Chờ SQL Server... (${i}/30)`);
            await sleep(2000);
        }
    }
}

main().catch((e) => {
    console.error("[init] Lỗi:", e.message);
    process.exit(1);
});