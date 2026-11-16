const { DataTypes } = require("sequelize");
const { sequelize } = require("../models");

async function syncColumns() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable("evidence");

    if (!tableInfo.blockchain_chain_id) {
      console.log("Adding column blockchain_chain_id to evidence table...");
      await queryInterface.addColumn("evidence", "blockchain_chain_id", {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }

    if (!tableInfo.blockchain_contract_address) {
      console.log("Adding column blockchain_contract_address to evidence table...");
      await queryInterface.addColumn("evidence", "blockchain_contract_address", {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.blockchain_genesis_hash) {
      console.log("Adding column blockchain_genesis_hash to evidence table...");
      await queryInterface.addColumn("evidence", "blockchain_genesis_hash", {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }

    console.log("✓ Evidence table columns synchronized successfully.");
  } catch (error) {
    console.error("Column sync error:", error.message);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  syncColumns();
}

module.exports = syncColumns;

