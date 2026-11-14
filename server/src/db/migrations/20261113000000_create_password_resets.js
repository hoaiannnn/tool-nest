exports.up = async (knex) => {
    await knex.schema.createTable("password_resets", (t) => {
        t.increments("id").primary();
        t.integer("user_id")
            .notNullable()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        t.string("token_hash", 64).notNullable().index();
        t.datetime("expires_at").notNullable();
        t.datetime("used_at").nullable();
        t.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists("password_resets");
};