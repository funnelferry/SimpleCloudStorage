const User = require('./User');
const File = require('./File');
// const MetaData = require('./Metadata');
const AccessControl = require('./AccessControl');
const FileVersion = require('./FileVersion');
const sequelize = require('../config/db');

// Define relationships
User.hasMany(File, { foreignKey: 'userId' });
File.belongsTo(User, { foreignKey: 'userId' });

// File.hasMany(MetaData);
// MetaData.belongsTo(File);

User.hasMany(AccessControl, {foreignKey: 'userId'});
AccessControl.belongsTo(User, {foreignKey: 'userId'});

File.hasMany(AccessControl, { foreignKey: 'fileId' });
AccessControl.belongsTo(File, { foreignKey: 'fileId' });

File.hasMany(FileVersion, { foreignKey: 'fileId' });
FileVersion.belongsTo(File, { foreignKey: 'fileId' });

User.hasMany(FileVersion, { foreignKey: 'userId' });
FileVersion.belongsTo(User, { foreignKey: 'userId' });

console.log('h')

// sequelize.sync().then(masti => {console.log(masti);});

module.exports = {
  User,
  File,
  FileVersion
};
