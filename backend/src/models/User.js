const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("investigator", "analyst", "court", "admin"),
    allowNull: false,
  },
  walletAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: "users",
});

module.exports = User;
