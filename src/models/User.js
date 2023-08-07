const { Sequelize } = require('sequelize');
const sequelize = require('../config/db'); // Assume that the database connection is exported from this file

const User = sequelize.define('User', {
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  passwordHash: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

module.exports = User;
