const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

let sequelize;

// If user explicitly configured PostgreSQL and enabled USE_POSTGRES=true
if (process.env.USE_POSTGRES === "true") {
  const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/proofshield";
  sequelize = new Sequelize(databaseUrl, {
    dialect: "postgres",
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
    },
  });
} else {
  // Built-in zero-config SQLite database: eliminates need for external PostgreSQL installation
  const sqliteStorage = path.join(__dirname, "../../proofshield.sqlite");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: sqliteStorage,
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
    },
  });
}

module.exports = sequelize;
