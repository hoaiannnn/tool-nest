const { execSync } = require("child_process");
const db = require("../src/config/database");

const TABLES = [
    "users",
    "categories",
    "services",
    "usage_logs",
    "payment_transactions",
    "oauth_accounts",
    "auth_tokens",
];

async function main() {
    for (const table of TABLES) {
        const row = await db(table).first();
        if (row) {
            console.log(`[seed] Bảng ${table} đã có dữ liệu -> bỏ qua seed`);
            return;
        }
    }

    console.log("[seed] Cả 7 bảng đều trống -> chạy seed");
    execSync(
        "node --import tsx ./node_modules/knex/bin/cli.js seed:run --knexfile knexfile.js",
        { stdio: "inherit" }
    );
}

main()
    .catch((e) => {
        console.error("[seed] Lỗi:", e.message);
        process.exitCode = 1;
    })
    .finally(() => db.destroy());