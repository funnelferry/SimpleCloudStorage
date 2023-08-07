const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

const indexFile = async (file) => {
  await client.index({
    index: 'files',
    body: {
      userPath: file.userPath,
      fileName: file.fileName,
      fileType: file.fileType,
      uploadTimestamp: file.uploadTimestamp
      // Add any other relevant fields
    }
  });
};

module.exports = indexFile;