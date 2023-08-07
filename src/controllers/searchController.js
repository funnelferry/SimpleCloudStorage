const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });
const User = require('../models/User')

const searchFiles = async (req, res) => {
    const query = req.body.query;

    // Fetch the current user
    const user = await User.findOne({ where: { username: req.user.username } }); // Assuming req.user.username is how you access the logged-in user.

    const { body } = await client.search({
        index: 'files',
        body: {
            query: {
                bool: {
                    must: {
                        multi_match: {
                            query: query,
                            fields: ['fileName']
                        }
                    },
                    filter: {
                        term: { userId: user.id }
                    }
                }
            }
        }
    });

    const results = body.hits.hits.map(hit => hit._source);
    res.json(results);
};

module.exports = searchFiles;
