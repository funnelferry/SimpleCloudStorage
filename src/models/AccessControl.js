const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');
const File = require('./File')
const User = require('./User')

const AccessControl = sequelize.define('AccessControl', {
  fileId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: File,
      key: 'id'
    }
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: User,  // 'Users' would also work
      key: 'id'
    }
  }
});

module.exports = AccessControl;
