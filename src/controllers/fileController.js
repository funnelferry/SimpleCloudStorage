const fs = require('fs');
const util = require('util');
const {User, File, FileVersion} = require('../models/index')
const Sequelize = require('sequelize');
const sequelize = require('../config/db')
const path = require('path');
// const indexFile = require('../elasticsearch/index')

// Convert fs.unlink into a Promise-based function
const unlink = util.promisify(fs.unlink);

const fileupload = async (req, res) => {
  if (req.file) {
    try {
      const t = await sequelize.transaction();

      // Get the directory path from the URL and ensure it ends with a /
      const directoryPath = req.params[0] ? '/' + req.params[0].replace(/\/?$/, '/') : '/';

      // Fetch the current user
      const user = await User.findOne({ where: { username: req.user.username } });

      // Check if the directory exists
      const directory = directoryPath === '/' ? true : await File.findOne({
        where: {
          userPath: directoryPath,
          fileName: null,
          userId: user.id
        }
      });

      if (!directory) {
        // If the directory does not exist, delete the uploaded file and send an error response
        await unlink(req.file.path);
        return res.status(400).json({ success: false, message: 'Directory does not exist' });
      }

      // Fetch the latest version of the file
      const latestFile = await File.findOne({
        where: {
          userPath: directoryPath + req.file.originalname,
          userId: user.id
        },
        order: [ ['versionNumber', 'DESC'] ]
      });

      const versionNumber = latestFile ? latestFile.versionNumber + 1 : 1;

      let fileInstance;

      // If a previous version of the file exists, create a new record in the FileVersions table
      if (latestFile) {
        await FileVersion.create({
          fileId: latestFile.id,
          serverPath: latestFile.serverPath,
          userPath: latestFile.userPath,
          fileName: latestFile.fileName,
          fileSize: latestFile.fileSize,
          fileType: latestFile.fileType,
          uploadTimestamp: latestFile.uploadTimestamp,
          versionNumber: latestFile.versionNumber,
          userId: user.id
        }, { transaction: t });

        // Update the old file record in the File table
        fileInstance = await latestFile.update({
          serverPath: req.file.path,
          versionNumber: versionNumber,
          uploadTimestamp: new Date()
        }, { transaction: t });
      } else {
        // Create a new File record in the database
        fileInstance = await File.create({
          serverPath: req.file.path,
          userPath: directoryPath + req.file.originalname,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          uploadTimestamp: new Date(),
          versionNumber: versionNumber,
          userId: user.id
        }, { transaction: t });
      }

      await t.commit();

      // await indexFile(fileInstance);

      res.json({ success: true, message: 'File uploaded successfully' });
    } catch (error) {
      console.log(error);
      // If an error occurred, delete the uploaded file
      await unlink(req.file.path);

      res.status(500).json({ success: false, message: 'File upload failed', error: error.message });
    }
  } else {
    res.json({ success: false, message: 'No file uploaded' });
  }
};



const listfiles = async (req, res) => {
  const currentDirectory = req.params[0] ? '/' + req.params[0] + '/' : '/'; // Get the current directory from the URL

  // Fetch the current user
  const user = await User.findOne({ where: { username: req.user.username } });

  // Fetch all files and directories in the current directory for the current user
  const filesAndDirectories = await user.getFiles({
    attributes: { exclude: ['id', 'serverPath'] },
    where: {
      userPath: {
        [Sequelize.Op.like]: currentDirectory + '%'
      }
    }
  });

  // Filter out files and directories that are not directly inside the current directory
  const itemsInCurrentDirectory = filesAndDirectories.filter(item => {
    const relativePath = item.userPath.replace(currentDirectory, '');
    return !relativePath.split('/').slice(1, -1).length; // Check if there are additional directories in the path
  });

  // Send the list of items in the current directory
  res.send(itemsInCurrentDirectory);
};

const createdirectory = async (req, res) => {
  const username = req.user.username;
  const directoryPath = req.params[0] ? '/' + req.params[0] : '/'; // Get the directory path from the URL

  // Fetch the current user
  const user = await User.findOne({ where: { username: req.user.username } });

  // If the directory path ends with a /, send an error response
  if (directoryPath.endsWith('/')) {
    return res.status(400).send({ message: 'URL should not end with a /' });
  }

  // Check if the directory already exists
  const existingDirectory = await File.findOne({
    where: {
      userPath: directoryPath + '/',
      fileName: null,
      userId: user.id
    }
  });

  if (existingDirectory) {
    return res.status(400).send({ message: 'Directory already exists' });
  }

  // If the new directory is not in the root directory, check if the parent directory exists
  if (directoryPath !== '/' && directoryPath.split('/').length > 2) {
    const parentDirectoryPath = path.dirname(directoryPath);
    const searchPath = parentDirectoryPath === '/' ? parentDirectoryPath : parentDirectoryPath + '/';
    const parentDirectory = await File.findOne({
      where: {
        userPath: searchPath,
        fileName: null,
        userId: user.id
      }
    });

    if (!parentDirectory) {
      return res.status(400).send({ message: 'Parent directory does not exist' });
    }
  }

  // Create a new directory record
  await File.create({
    serverPath: 'uploads/' + username + '/',
    userPath: directoryPath + '/',
    fileName: null,
    fileSize: null,
    fileType: null,
    uploadTimestamp: new Date(),
    versionNumber: null,
    userId: user.id
  });

  res.send({ message: 'Directory created' });
};

  
const filedownload = async (req, res) => {
  let directoryPath;

  if (!req.params[0].includes('/')) {
      directoryPath = '/' + req.params[0];
  } else {
      directoryPath = req.params[0]; // Get the directory path from the URL
  }

  console.log(directoryPath);


  // Fetch the current user
  const user = await User.findOne({ where: { username: req.user.username } });

  console.log(directoryPath)

  // Fetch the file record
  const file = await File.findOne({
    where: {
      userPath: directoryPath,
      userId: user.id
    }
  });

  if (!file) {
    return res.status(404).send({ message: 'File not found' });
  }

  if (file.fileName === null) {
    return res.status(400).send({ message: 'Path is a directory' });
  }

  if (fs.existsSync(file.serverPath)) {
    res.sendFile(path.resolve(file.serverPath));
  } else {
    res.status(404).send({ message: 'File not found on server' });
  }
}

const moveItem = async (req, res) => {
  // Check for conflicts at the destination
  const sourcePath = req.body.sourcePath;
  const destinationPath = req.body.destinationPath;

  // Fetch the current user
  const user = await User.findOne({ where: { username: req.user.username } });

  const conflictItem = await File.findOne({
    where: {
      userPath: destinationPath,
      userId: user.id
    }
  });
  
  if (conflictItem) {
    throw new Error('An item with the same name already exists at the destination.');
  }

  // Fetch the item to move
  const itemToMove = await File.findOne({
    where: {
      userPath: sourcePath,
      userId: user.id
    }
  });

  if (!itemToMove) {
    throw new Error('Item to move not found.');
  }

  // Update userPath for the item
  itemToMove.userPath = destinationPath;
  await itemToMove.save();

  // If the item is a directory, update paths for all items inside it
  if (!itemToMove.fileName) {
    const itemsInDirectory = await File.findAll({
      where: {
        userPath: {
          [Sequelize.Op.startsWith]: sourcePath
        },
        userId: user.id
      }
    });

    for (let item of itemsInDirectory) {
      item.userPath = item.userPath.replace(sourcePath, destinationPath);
      await item.save();
    }
  }
};

const rollback = async (req, res) => {
  try {
      const filePath = '/' + req.params.filepath; 
      const targetVersionNumber = parseInt(req.params.versionnumber, 10);

      console.log(filePath)
      console.log(targetVersionNumber)

      // Fetch the current logged-in user
      const user = await User.findOne({ where: { username: req.user.username } });

      // Fetch the target version of the file from FileVersions table
      const targetVersion = await FileVersion.findOne({
          where: {
              userPath: filePath,
              versionNumber: targetVersionNumber
          }
      });

      if (!targetVersion) {
          return res.status(404).send({ message: 'Target version not found' });
      }

      // Check if the logged-in user is the owner of the file
      if (targetVersion.userId !== user.id) {
          return res.status(403).send({ message: 'You are not authorized to rollback this file' });
      }

      const t = await sequelize.transaction();

      // Remove versions greater than targetVersionNumber from File and FileVersions
      await File.destroy({
          where: {
              userPath: filePath,
              versionNumber: {
                  [Sequelize.Op.gt]: targetVersionNumber
              }
          },
          transaction: t
      });
      
      await FileVersion.destroy({
          where: {
              userPath: filePath,
              versionNumber: {
                  [Sequelize.Op.gt]: targetVersionNumber
              }
          },
          transaction: t
      });

      // Create a new entry in File with targetVersion data
      await File.create({
          serverPath: targetVersion.serverPath,
          userPath: targetVersion.userPath,
          fileName: targetVersion.fileName,
          fileSize: targetVersion.fileSize,
          fileType: targetVersion.fileType,
          uploadTimestamp: targetVersion.uploadTimestamp,
          versionNumber: targetVersion.versionNumber,
          userId: targetVersion.userId
      }, { transaction: t });

      await t.commit();

      res.send({ message: 'File successfully rolled back' });
  } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'An error occurred during rollback' });
  }
};

module.exports = {fileupload, listfiles, createdirectory, filedownload, moveItem, rollback};