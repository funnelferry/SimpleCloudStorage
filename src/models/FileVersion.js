const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');
const File = require('../models/File')
const User = require('../models/User')

const FileVersion = sequelize.define('FileVersion', {
  fileId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: File,
      key: 'id'
    }
  },
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

module.exports = FileVersion;
