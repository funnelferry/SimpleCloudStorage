const File = require('../models/File')
const AccessControl = require('../models/AccessControl')

const PUBLIC_USER_ID = 0;

const hasAccess = async (userId, filePath) => {
  // Base case: If we've reached the root directory
  if (filePath === '/') {
    return false;
  }

  // Check if the user has direct access to the current filePath
  const file = await File.findOne({ where: { userPath: filePath } });
  if (file) {
    // Check if the file is public
    const publicAccess = await AccessControl.findOne({ where: { fileId: file.id, userId: PUBLIC_USER_ID } });
    if (publicAccess) {
      return true;  // The file is public
    }

    // Check for specific user access
    const userAccess = await AccessControl.findOne({ where: { fileId: file.id, userId: userId } });
    if (userAccess) {
      return true;  // The user has direct access to the file
    }
  }

  // Recursively check the parent directory
  const parentDirectoryPath = path.dirname(filePath);
  return hasAccess(userId, parentDirectoryPath);
};
