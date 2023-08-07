const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sequelize = require('./config/db.js');
require('dotenv').config('../.env');

// Import your routers
const userRouter = require('./routes/userRoutes');
const fileRouter = require('./routes/fileRoutes');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
// app.use(express.static(path.join(__dirname, 'public')));

// Mount your routers
app.use('/user', userRouter);
app.use('/file', fileRouter);

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Sync models with the database and start the server
sequelize.sync()
  .then(() => {
    app.listen(3000, () => {
      console.log('App is listening on port 3000');
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });
