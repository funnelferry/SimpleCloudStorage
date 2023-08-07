const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User')

const File = sequelize.define('File', {
  serverPath: {
    type: Sequelize.STRING,
    allowNull: false
  },
  userPath: {
    type: Sequelize.STRING,
    allowNull: false
  },
  fileName: {
    type: Sequelize.STRING,
    allowNull: true
  },
  fileSize: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  fileType: {
    type: Sequelize.STRING,
    allowNull: true
  },
  uploadTimestamp: {
    type: Sequelize.DATE,
    allowNull: false
  },
  versionNumber: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  userId: {
    type: Sequelize.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  }
});

User.hasMany(File, { foreignKey: 'userId' });
File.belongsTo(User, { foreignKey: 'userId' });

module.exports = File;
