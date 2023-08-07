const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables from .env file into process.env



const sequelize = new Sequelize(
    process.env.DB_NAME, // Database name
    process.env.DB_USER, // Database user
    process.env.DB_PASSWORD, // Database password
    {
        host: process.env.DB_HOST, // Database host
        dialect: 'postgres', // Use 'postgres' as the database type for PostgreSQL
    }
);

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); // Terminate the application if unable to connect to the database
  }
};

connectDatabase();

module.exports = sequelize;