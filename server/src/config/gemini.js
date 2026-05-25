/**
 * ============================================================
 * Google Gemini AI Configuration
 * ============================================================
 * 
 * This module initializes and configures the Google Generative AI
 * (Gemini) client for use throughout the application.
 * 
 * Gemini is Google's multimodal AI model used in this project for:
 * - AI-powered quiz/test question generation
 * - Resume analysis and improvement suggestions
 * - Personalized learning recommendations
 * - Interview question generation
 * - Course content summarization
 * 
 * We use the 'gemini-1.5-flash' model which offers a good balance
 * of speed, capability, and cost-effectiveness for our use cases.
 * 
 * @module config/gemini
 * @requires @google/generative-ai
 * ============================================================
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ============================================================
// Initialize the Google Generative AI client
// ============================================================
// The GoogleGenerativeAI class is the main entry point for
// interacting with Google's AI models. It requires an API key
// obtained from Google AI Studio (https://aistudio.google.com).

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================================
// Configure the Gemini Model
// ============================================================
// We use 'gemini-1.5-flash' because:
// 1. It's optimized for speed (lower latency than gemini-1.5-pro)
// 2. It handles text generation tasks efficiently
// 3. It's cost-effective for high-volume educational content generation
// 4. It supports large context windows (up to 1M tokens)

const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash' 
});

// ============================================================
// Configuration Constants
// ============================================================

/**
 * Maximum number of retry attempts for failed API calls.
 * Retries help handle transient network errors and rate limiting.
 */
const MAX_RETRIES = 3;

/**
 * Base delay in milliseconds between retry attempts.
 * Each retry doubles this delay (exponential backoff):
 * - 1st retry: 1000ms (1 second)
 * - 2nd retry: 2000ms (2 seconds)
 * - 3rd retry: 4000ms (4 seconds)
 */
const BASE_DELAY_MS = 1000;

/**
 * Utility function to pause execution for a specified duration.
 * Used for implementing delays between retry attempts.
 * 
 * @param {number} ms - Number of milliseconds to sleep
 * @returns {Promise<void>} Resolves after the specified delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates AI content using the Gemini model with retry logic.
 * 
 * This is the main helper function used throughout the application
 * to interact with Google's Gemini AI. It handles:
 * - Sending prompts to the AI model
 * - Extracting text from the response
 * - Retrying on transient failures with exponential backoff
 * - Proper error logging and propagation
 * 
 * @async
 * @function generateContent
 * @param {string} prompt - The text prompt to send to the AI model.
 *   This should be a well-structured prompt with clear instructions
 *   for the type of content you want generated.
 * @returns {Promise<string>} The generated text response from the AI model.
 * @throws {Error} Throws an error if all retry attempts fail.
 * 
 * @example
 * // Generate quiz questions
 * const { generateContent } = require('./config/gemini');
 * const questions = await generateContent(
 *   'Generate 5 MCQ questions about JavaScript closures in JSON format'
 * );
 * 
 * @example
 * // Analyze a resume
 * const analysis = await generateContent(
 *   `Analyze this resume and provide improvement suggestions: ${resumeText}`
 * );
 */
const generateContent = async (prompt) => {
  // Track the last error for final error reporting
  let lastError;

  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Send the prompt to the Gemini model
      // The generateContent method accepts a string prompt
      // and returns a GenerateContentResponse object
      const result = await model.generateContent(prompt);

      // Extract the response object from the result
      const response = result.response;

      // Extract the text content from the response
      // The text() method returns the generated text as a string
      const text = response.text();

      // Log success in development mode for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`🤖 Gemini AI: Content generated successfully (attempt ${attempt})`);
        console.log(`📝 Prompt length: ${prompt.length} chars | Response length: ${text.length} chars`);
      }

      return text;

    } catch (error) {
      // Store the error for potential final throw
      lastError = error;

      // Log the retry attempt with error details
      console.error(
        `⚠️  Gemini AI Error (attempt ${attempt}/${MAX_RETRIES}):`,
        error.message
      );

      // If we haven't exhausted all retries, wait before trying again
      if (attempt < MAX_RETRIES) {
        // Calculate delay with exponential backoff
        // Formula: baseDelay * 2^(attempt-1)
        // This gradually increases wait time to avoid overwhelming the API
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        
        console.log(`⏳ Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted - throw the final error
  console.error('❌ Gemini AI: All retry attempts failed');
  throw new Error(`Gemini AI generation failed after ${MAX_RETRIES} attempts: ${lastError.message}`);
};

// ============================================================
// Export the model instance and helper function
// ============================================================
// - model: Direct access to the Gemini model for advanced use cases
//   (streaming, chat sessions, multi-turn conversations)
// - generateContent: Simplified helper for single-prompt text generation
//   with built-in retry logic (recommended for most use cases)

module.exports = { model, generateContent };
