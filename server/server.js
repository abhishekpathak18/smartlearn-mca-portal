/**
 * ============================================================
 * Server Entry Point - Smart Learning & Placement Portal
 * ============================================================
 * 
 * This is the main entry point for the backend application.
 * It handles:
 * 1. Loading environment variables from .env file
 * 2. Connecting to the MongoDB database
 * 3. Starting the Express HTTP server
 * 4. Handling unhandled promise rejections (graceful shutdown)
 * 5. Handling uncaught exceptions (emergency shutdown)
 * 
 * Start the server:
 *   Development: npm run dev    (with nodemon for auto-restart)
 *   Production:  npm start      (standard node execution)
 * 
 * @module server
 * @requires dotenv
 * @requires ./src/app
 * @requires ./src/config/db
 * ============================================================
 */

// ============================================================
// Step 1: Load Environment Variables
// ============================================================
// dotenv.config() reads the .env file and loads all key-value
// pairs into process.env. This MUST be called before importing
// any module that uses environment variables (like db.js, gemini.js).

const dotenv = require('dotenv');
dotenv.config();

// ============================================================
// Step 2: Import Application and Database Connection
// ============================================================
// Import AFTER dotenv.config() so environment variables are available

const app = require('./src/app');
const connectDB = require('./src/config/db');

// ============================================================
// Step 3: Define Server Port
// ============================================================
// Use the PORT from environment variables, or default to 5000

const PORT = process.env.PORT || 5000;

// ============================================================
// Step 4: Start the Server
// ============================================================
// We use an async IIFE (Immediately Invoked Function Expression)
// to use async/await at the top level.
// 
// The startup sequence is:
// 1. Connect to MongoDB (must succeed before accepting requests)
// 2. Start the HTTP server on the specified port
// 3. Log server information

/**
 * Application startup function.
 * Connects to the database and starts the Express server.
 * 
 * @async
 * @function startServer
 */
const startServer = async () => {
  try {
    // ========================================================
    // Connect to MongoDB
    // ========================================================
    // This must complete before we start accepting HTTP requests
    // to ensure all route handlers can access the database.
    // If connection fails, connectDB() exits the process.
    await connectDB();

    // ========================================================
    // Start HTTP Server
    // ========================================================
    // app.listen() starts the Express server and returns
    // an http.Server instance that we store for graceful shutdown.
    const server = app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════════');
      console.log('🚀 Smart Learning & Placement Portal API Server');
      console.log('═══════════════════════════════════════════════════');
      console.log(`📡 Server running on port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🖥️  Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log('═══════════════════════════════════════════════════');
    });

    // ========================================================
    // Handle Unhandled Promise Rejections
    // ========================================================
    // This catches any promise rejections that weren't caught
    // with a .catch() or try/catch block. This is a safety net
    // to prevent the server from silently failing.
    // 
    // Common causes:
    // - Database connection drops
    // - External API failures (Gemini, Resend)
    // - File system errors
    //
    // We perform a graceful shutdown:
    // 1. Log the error
    // 2. Close the HTTP server (stop accepting new connections)
    // 3. Wait for existing connections to complete
    // 4. Exit the process

    process.on('unhandledRejection', (reason, promise) => {
      console.error('═══════════════════════════════════════════');
      console.error('❌ UNHANDLED PROMISE REJECTION');
      console.error('═══════════════════════════════════════════');
      console.error('Reason:', reason);
      console.error('═══════════════════════════════════════════');

      // Graceful shutdown: close server before exiting
      // This allows in-flight requests to complete
      server.close(() => {
        console.log('🛑 Server closed due to unhandled promise rejection');
        process.exit(1);
      });

      // Force exit after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    });

    // ========================================================
    // Handle Uncaught Exceptions
    // ========================================================
    // This catches synchronous errors that weren't wrapped in
    // try/catch. These are serious errors that indicate a bug
    // in the code. We MUST exit immediately because the app
    // is in an undefined state.
    //
    // Common causes:
    // - Reference errors (undefined variables)
    // - Type errors (calling non-functions)
    // - Syntax errors in required modules

    process.on('uncaughtException', (error) => {
      console.error('═══════════════════════════════════════════');
      console.error('💀 UNCAUGHT EXCEPTION');
      console.error('═══════════════════════════════════════════');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('═══════════════════════════════════════════');

      // Exit immediately - the app is in an unknown state
      // A process manager like PM2 will restart the application
      process.exit(1);
    });

    // ========================================================
    // Handle SIGTERM Signal (Graceful Shutdown)
    // ========================================================
    // SIGTERM is sent by process managers (PM2, Docker, Heroku)
    // when they want the app to shut down gracefully.
    // We close the HTTP server and let existing requests complete.

    process.on('SIGTERM', () => {
      console.log('📥 SIGTERM received. Performing graceful shutdown...');
      server.close(() => {
        console.log('🛑 Server closed gracefully');
        process.exit(0);
      });
    });

  } catch (error) {
    // ========================================================
    // Startup Error Handling
    // ========================================================
    // If anything goes wrong during startup (DB connection, etc.)
    // log the error and exit.
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// ============================================================
// Execute the Startup Function
// ============================================================
startServer();
