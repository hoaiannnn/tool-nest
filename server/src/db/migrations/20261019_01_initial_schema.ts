import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. Bảng categories (5 danh mục công cụ)
  await knex.schema.createTable("categories", (table) => {
    table.increments("id").primary();
    table.string("slug", 50).notNullable().unique();
    table.specificType("name", "NVARCHAR(100) COLLATE Vietnamese_CI_AI").notNullable();
    table.string("icon", 50).notNullable();
    table.integer("sort_order").notNullable().defaultTo(0);
  });

  // 2. Bảng services (Các công cụ online)
  await knex.schema.createTable("services", (table) => {
    table.increments("id").primary();
    table
      .integer("category_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("categories")
      .onDelete("NO ACTION");
    table.string("slug", 100).notNullable().unique();
    table.specificType("name", "NVARCHAR(150) COLLATE Vietnamese_CI_AI").notNullable();
    table.specificType("short_desc", "NVARCHAR(500) COLLATE Vietnamese_CI_AI").notNullable();
    table.string("thumbnail_url", 500).nullable();
    table.string("status", 20).notNullable().defaultTo("ready"); // 'ready' | 'soon'
    table.boolean("is_visible").notNullable().defaultTo(true);
    table.integer("credit_cost").notNullable().defaultTo(0);
    table.integer("usage_count").notNullable().defaultTo(0);
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table.datetime("updated_at").notNullable().defaultTo(knex.fn.now());

    // Index phục vụ Lọc (Filter) và Sắp xếp (Sort) nhanh
    table.index(["category_id", "is_visible", "status"], "IX_services_filter");
    table.index(["usage_count"], "IX_services_usage_count");
  });

  // 3. Bảng users (Dùng chung cho cả user và admin)
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("email", 255).notNullable().unique();
    table.string("password_hash", 255).nullable(); // NULL nếu đăng nhập qua Google lần đầu
    table.specificType("full_name", "NVARCHAR(150) COLLATE Vietnamese_CI_AI").notNullable();
    table.smallint("birth_year").nullable();
    table.string("phone", 20).nullable();
    table.specificType("address", "NVARCHAR(300) COLLATE Vietnamese_CI_AI").nullable();
    table.string("role", 20).notNullable().defaultTo("user"); // 'user' | 'admin'
    table.string("status", 20).notNullable().defaultTo("active"); // 'active' | 'locked'
    table.boolean("is_email_verified").notNullable().defaultTo(false);
    table.integer("credits").notNullable().defaultTo(10);
    table.string("plan_type", 20).notNullable().defaultTo("free"); // 'free' | 'premium'
    table.datetime("plan_expires_at").nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table.datetime("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["role", "status"], "IX_users_role_status");
  });

  // 4. Bảng usage_logs (Lịch sử sử dụng công cụ)
  await knex.schema.createTable("usage_logs", (table) => {
    table.bigIncrements("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("service_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("services")
      .onDelete("CASCADE");
    table.specificType("input_summary", "NVARCHAR(300) COLLATE Vietnamese_CI_AI").notNullable();
    table.string("status", 20).notNullable().defaultTo("success"); // 'success' | 'failed'
    table.integer("duration_ms").notNullable().defaultTo(0);
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["user_id", "created_at"], "IX_usage_logs_user_date");
    table.index(["service_id"], "IX_usage_logs_service");
  });

  // 5. Bảng oauth_accounts (Liên kết tài khoản Google)
  await knex.schema.createTable("oauth_accounts", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("provider", 30).notNullable(); // 'google'
    table.string("provider_uid", 255).notNullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());

    table.unique(["provider", "provider_uid"], { indexName: "UQ_oauth_provider_uid" });
  });

  // 6. Bảng auth_tokens (Token xác thực email & đặt lại mật khẩu)
  await knex.schema.createTable("auth_tokens", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("token_hash", 255).notNullable().index("IX_auth_tokens_hash");
    table.string("type", 30).notNullable(); // 'verify_email' | 'reset_password'
    table.datetime("expires_at").notNullable();
    table.datetime("used_at").nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
  });

  // 7. Bảng payment_transactions (Giao dịch thanh toán VNPay/MoMo)
  await knex.schema.createTable("payment_transactions", (table) => {
    table.increments("id").primary();
    table.string("order_code", 64).notNullable().unique();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("NO ACTION");
    table.string("package_code", 50).notNullable();
    table.bigInteger("amount_vnd").notNullable();
    table.integer("credits_granted").notNullable().defaultTo(0);
    table.string("provider", 30).notNullable(); // 'vnpay' | 'momo'
    table.string("provider_trans_id", 100).nullable();
    table.string("status", 20).notNullable().defaultTo("pending"); // 'pending' | 'paid' | 'failed'
    table.datetime("paid_at").nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());

    table.index(["user_id", "status"], "IX_payments_user_status");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Xóa theo thứ tự ngược lại để không bị vướng khóa ngoại (Foreign Key)
  await knex.schema.dropTableIfExists("payment_transactions");
  await knex.schema.dropTableIfExists("auth_tokens");
  await knex.schema.dropTableIfExists("oauth_accounts");
  await knex.schema.dropTableIfExists("usage_logs");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("services");
  await knex.schema.dropTableIfExists("categories");
}