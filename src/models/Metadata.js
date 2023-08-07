const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');
const File = require('../models/File')

const MetaData = sequelize.define('MetaData', {
  fileId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: File,
      key: 'id'
    }
  },
  tag: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true
  }
});

module.exports = MetaData;
