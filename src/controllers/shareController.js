const File = require('../models/File');
const User = require('../models/User');
const AccessControl = require('../models/AccessControl');
const Sequelize = require('sequelize');
const sequelize = require('../config/db')
const fs = require('fs')
const path = require('path')

const shareFile = async (req, res) => {
    try {
        // Retrieve file path and user(s) from the request body
        const { filePath, usersToShareWith } = req.body;

        // Fetch the current logged-in user
        const loggedInUser = await User.findOne({ where: { username: req.user.username } });

        // Fetch the file based on the provided path
        const file = await File.findOne({ where: { userPath: filePath, userId: loggedInUser.id} });

        if (!file) {
            return res.status(404).send({ message: 'File not found' });
        }

        // // Check if the logged-in user is the owner of the file
        // if (file.userId !== loggedInUser.id) {
        //     return res.status(403).send({ message: 'You are not authorized to share this file' });
        // }

        // For each user in usersToShareWith, create an entry in the AccessControl table
        for (let username of usersToShareWith) {
            const user = await User.findOne({ where: { username } });
            if (user) {
                await AccessControl.create({
                    fileId: file.id,
                    userId: user.id
                });
            }
        }

        res.send({ message: 'File shared successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'An error occurred while sharing the file' });
    }
};

const listSharedFiles = async (req, res) => {
    const currentDirectory = req.params[0] ? '/' + req.params[0] + '/' : '/'; // Get the current directory from the URL
  
    // Fetch the current user
    const user = await User.findOne({ where: { username: req.user.username } });
  
    // Fetch all access control entries for the user
    const accessEntries = await AccessControl.findAll({
      where: { userId: user.id }
    });
  
    // Extract file IDs from the access entries
    const sharedFileIds = accessEntries.map(entry => entry.fileId);
  
    // Fetch files that the user has access to
    const sharedFiles = await File.findAll({
      attributes: { exclude: ['id', 'serverPath'] },
      where: {
        id: { [Sequelize.Op.in]: sharedFileIds },
        userPath: {
          [Sequelize.Op.like]: currentDirectory + '%'
        }
      }
    });
  
    res.send(sharedFiles);
  };

  const filedownloadshared = async (req, res) => {
    let directoryPath;
    if (!req.params[0].includes('/')) {
      directoryPath = '/' + req.params[0];
    } else {
      directoryPath = req.params[0];
    }
  
    // Fetch the current user
    const user = await User.findOne({ where: { username: req.user.username } });
  
    // Fetch the file record
    const file = await File.findOne({ where: { userPath: directoryPath } });
  
    if (!file) {
      return res.status(404).send({ message: 'File not found' });
    }
  
    if (file.fileName === null) {
      return res.status(400).send({ message: 'Path is a directory' });
    }
  
    // Check if the file is owned by the user or if the user has access to it
    if (file.userId !== user.id) {
      const hasAccess = await AccessControl.findOne({
        where: {
          fileId: file.id,
          userId: user.id
        }
      });
  
      if (!hasAccess) {
        return res.status(403).send({ message: 'Access denied' });
      }
    }
  
    if (fs.existsSync(file.serverPath)) {
      res.sendFile(path.resolve(file.serverPath));
    } else {
      res.status(404).send({ message: 'File not found on server' });
    }
  };

module.exports = {shareFile, filedownloadshared, listSharedFiles};

