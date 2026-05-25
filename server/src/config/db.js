/**
 * ============================================================
 * Database Configuration - MongoDB Connection Setup
 * ============================================================
 * 
 * This module handles the connection to MongoDB Atlas using Mongoose.
 * It exports a single async function `connectDB` that establishes
 * the database connection with proper error handling.
 * 
 * Mongoose is an ODM (Object Data Modeling) library for MongoDB
 * that provides schema validation, type casting, and query building.
 * 
 * @module config/db
 * @requires mongoose
 * ============================================================
 */

const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using the connection string from environment variables.
 * 
 * This function:
 * 1. Disables strict query mode (allows filtering by fields not in schema)
 * 2. Connects to the MongoDB Atlas cluster
 * 3. Logs the connection host on success
 * 4. Exits the process on connection failure (fail-fast approach)
 * 
 * @async
 * @function connectDB
 * @returns {Promise<void>} Resolves when connection is established
 * @throws {Error} Logs error and exits process with code 1 on failure
 * 
 * @example
 * const connectDB = require('./config/db');
 * await connectDB();
 */
const connectDB = async (retries = 3) => {
  try {
    // Disable strict query mode - allows queries to filter by fields
    // that are not defined in the schema. This prevents errors when
    // querying with dynamic or optional fields.
    mongoose.set('strictQuery', false);

    // Attempt to connect to MongoDB Atlas
    // The MONGODB_URI should be in the format:
    // mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      connectTimeoutMS: 10000,
    });

    // Log successful connection with the host name
    // conn.connection.host gives us the cluster hostname
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

  } catch (error) {
    // Log the error details for debugging
    console.error(`❌ MongoDB Connection Error (attempt ${4 - retries}/3):`, error.message);

    if (retries > 1) {
      console.log(`🔄 Retrying in 5 seconds... (${retries - 1} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }

    // All retries exhausted — exit the process
    // MongoDB Atlas must allow connections from this server's IP.
    // Fix: Go to MongoDB Atlas → Network Access → Add 0.0.0.0/0
    console.error('💀 All MongoDB connection attempts failed. Exiting...');
    process.exit(1);
  }
};

// ============================================================
// Event Listeners for MongoDB Connection
// ============================================================
// These listeners help monitor the connection state throughout
// the application lifecycle, not just during initial connection.

/**
 * Fires when the connection is lost after initial establishment.
 * This can happen due to network issues or MongoDB Atlas maintenance.
 */
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

/**
 * Fires when Mongoose successfully reconnects to MongoDB
 * after a disconnection event.
 */
mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully');
});

/**
 * Fires when a connection error occurs after initial connection.
 * Unlike the catch block above, this handles errors during runtime.
 */
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB runtime error:', err.message);
});

// Export the connectDB function for use in server.js
module.exports = connectDB;
