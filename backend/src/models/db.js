const { Sequelize } = require("sequelize");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/proofshield";

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

module.exports = sequelize;
