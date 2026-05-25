/**
 * @fileoverview AI Service - Google Gemini AI Integration
 * 
 * This service handles all interactions with the Google Gemini AI API.
 * It provides AI-powered features for the Smart Learning Portal including
 * interview question generation, resume analysis, career recommendations,
 * AI-powered chat, and personalized placement roadmaps.
 * 
 * All functions communicate with the Gemini API using carefully crafted prompts
 * and return structured JSON responses. Error handling wraps every API call
 * to gracefully handle failures, rate limits, and malformed responses.
 * 
 * @module services/aiService
 * @requires @google/generative-ai
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ============================================================
// Initialize Google Gemini AI Client
// Uses the API key from environment variables
// ============================================================

/** @type {GoogleGenerativeAI} Gemini AI client instance */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get the Gemini generative model instance with configuration.
 * Uses 'gemini-1.5-flash' for fast, cost-effective responses.
 * 
 * @param {Object} [config={}] - Additional generation config overrides
 * @returns {GenerativeModel} Configured Gemini model instance
 */
const getModel = (config = {}) => {
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.7, // Balance between creativity and consistency
      topP: 0.9, // Nucleus sampling for diverse but relevant output
      topK: 40, // Limits token choices for more focused responses
      maxOutputTokens: 8192, // Maximum response length
      responseMimeType: 'application/json', // Request JSON output format
      ...config // Allow overrides for specific use cases
    }
  });
};

// ============================================================
// AI Service Functions
// ============================================================

/**
 * Generate interview questions for a specific topic using Gemini AI.
 * 
 * Creates a detailed prompt asking the AI to generate structured interview
 * questions with expected answers and preparation tips. The response is
 * parsed from JSON format for direct use in the frontend.
 * 
 * @async
 * @param {string} topic - The subject area for questions (e.g., 'JavaScript', 'System Design')
 * @param {string} [difficulty='medium'] - Difficulty level: 'easy', 'medium', or 'hard'
 * @param {number} [count=5] - Number of questions to generate (1-20)
 * @returns {Promise<Object>} Structured interview questions data
 * @returns {Array<Object>} returns.questions - Array of question objects
 * @returns {string} returns.questions[].question - The interview question
 * @returns {string} returns.questions[].expectedAnswer - Model answer
 * @returns {string} returns.questions[].tips - Preparation tips
 * @returns {string} returns.questions[].difficulty - Question difficulty
 * @throws {Error} If Gemini API call fails or response parsing fails
 * 
 * @example
 * const result = await generateInterviewQuestions('React.js', 'medium', 5);
 * // Returns: { questions: [{ question: '...', expectedAnswer: '...', tips: '...' }, ...] }
 */
const generateInterviewQuestions = async (topic, difficulty = 'medium', count = 5) => {
  try {
    // Get model configured for JSON output
    const model = getModel();

    // Craft a detailed prompt that instructs the AI on:
    // 1. The exact topic and difficulty level
    // 2. The number of questions needed
    // 3. The expected output structure (JSON format)
    // 4. Quality expectations (real interview-level questions)
    const prompt = `
      You are an expert technical interviewer with years of experience at top tech companies.
      
      Generate exactly ${count} interview questions on the topic "${topic}" at "${difficulty}" difficulty level.
      
      Requirements:
      - Questions should be realistic and commonly asked in actual technical interviews
      - For "easy" difficulty: fundamental concepts and definitions
      - For "medium" difficulty: application-based and scenario questions
      - For "hard" difficulty: deep concepts, system design, and optimization problems
      - Include a mix of theoretical and practical questions
      
      Return a JSON object with the following structure:
      {
        "topic": "${topic}",
        "difficulty": "${difficulty}",
        "questions": [
          {
            "id": 1,
            "question": "The interview question text",
            "expectedAnswer": "A comprehensive model answer that a candidate should give",
            "tips": "Key preparation tips and things to remember when answering",
            "category": "A sub-category within the topic (e.g., 'Closures' for JavaScript)",
            "difficulty": "${difficulty}"
          }
        ]
      }
      
      Make the expected answers detailed enough to be educational, and the tips actionable.
    `;

    // Send the prompt to Gemini and await the response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response from the AI
    // The responseMimeType='application/json' config should ensure valid JSON,
    // but we wrap in try-catch for safety
    const parsedData = JSON.parse(text);

    return parsedData;
  } catch (error) {
    // Log the error for debugging while providing a user-friendly message
    console.error('Error generating interview questions:', error.message);
    throw new Error(`Failed to generate interview questions: ${error.message}`);
  }
};

/**
 * Analyze a resume using Gemini AI and provide detailed feedback.
 * 
 * Sends the resume text to Gemini with a comprehensive analysis prompt
 * that evaluates formatting, content quality, keyword optimization,
 * and ATS compatibility. Returns scores and actionable suggestions.
 * 
 * @async
 * @param {string} resumeText - The full text content of the resume to analyze
 * @returns {Promise<Object>} Detailed resume analysis results
 * @returns {Object} returns.scores - Numerical scores (0-100)
 * @returns {number} returns.scores.overall - Overall resume quality score
 * @returns {number} returns.scores.formatting - Document formatting score
 * @returns {number} returns.scores.content - Content quality score
 * @returns {number} returns.scores.keywordMatch - ATS keyword optimization score
 * @returns {Array<string>} returns.strengths - List of resume strong points
 * @returns {Array<string>} returns.improvements - Areas needing improvement
 * @returns {Array<Object>} returns.suggestions - Actionable improvement suggestions
 * @throws {Error} If Gemini API call fails or response parsing fails
 * 
 * @example
 * const analysis = await analyzeResume('John Doe\nSoftware Engineer\n...');
 * // Returns: { scores: { overall: 75, ... }, strengths: [...], improvements: [...] }
 */
const analyzeResume = async (resumeText) => {
  try {
    const model = getModel();

    // Comprehensive resume analysis prompt
    // Covers multiple dimensions of resume quality
    const prompt = `
      You are an expert career counselor and resume reviewer with experience reviewing
      thousands of resumes for top tech companies and placement drives.
      
      Analyze the following resume text and provide a detailed assessment:
      
      --- RESUME START ---
      ${resumeText}
      --- RESUME END ---
      
      Evaluate the resume across these dimensions and return a JSON object:
      {
        "scores": {
          "overall": <0-100 overall quality score>,
          "formatting": <0-100 formatting and structure score>,
          "content": <0-100 content quality and relevance score>,
          "keywordMatch": <0-100 ATS keyword optimization score>,
          "impact": <0-100 quantifiable achievements and impact score>
        },
        "strengths": [
          "Specific strong point 1 with explanation",
          "Specific strong point 2 with explanation"
        ],
        "improvements": [
          "Specific area for improvement 1 with reasoning",
          "Specific area for improvement 2 with reasoning"
        ],
        "suggestions": [
          {
            "section": "Which section of resume this applies to",
            "current": "What it currently says or does",
            "suggested": "What it should say or do instead",
            "reason": "Why this change improves the resume"
          }
        ],
        "missingKeywords": [
          "Important technical keywords that should be added"
        ],
        "atsCompatibility": {
          "score": <0-100>,
          "issues": ["List of ATS compatibility issues if any"]
        },
        "summary": "A brief 2-3 sentence overall assessment of the resume"
      }
      
      Be specific, constructive, and actionable in your feedback.
      Focus on what would make this resume stand out for placement drives and tech interviews.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the structured JSON response
    const parsedData = JSON.parse(text);

    return parsedData;
  } catch (error) {
    console.error('Error analyzing resume:', error.message);
    throw new Error(`Failed to analyze resume: ${error.message}`);
  }
};

/**
 * Get personalized career recommendations based on user profile and performance.
 * 
 * Combines user-provided data (skills, interests, experience) with their
 * platform data (test scores, courses) to generate tailored career path
 * recommendations using Gemini AI.
 * 
 * @async
 * @param {Object} userProfile - The user's profile and performance data
 * @param {string[]} [userProfile.skills] - User's current technical skills
 * @param {string[]} [userProfile.interests] - User's career interests
 * @param {string} [userProfile.experience] - Experience level description
 * @param {Object[]} [userProfile.testResults] - Recent test performance data
 * @param {Object[]} [userProfile.enrolledCourses] - Courses the user is enrolled in
 * @param {string} [userProfile.education] - Education background
 * @returns {Promise<Object>} Personalized career recommendations
 * @returns {Array<Object>} returns.careerPaths - Recommended career paths
 * @returns {Array<Object>} returns.companies - Companies to target
 * @returns {Array<Object>} returns.skillsToLearn - Skills to develop
 * @throws {Error} If Gemini API call fails or response parsing fails
 * 
 * @example
 * const recs = await getCareerRecommendation({
 *   skills: ['JavaScript', 'React', 'Node.js'],
 *   interests: ['Web Development', 'AI'],
 *   experience: 'fresher'
 * });
 */
const getCareerRecommendation = async (userProfile) => {
  try {
    const model = getModel();

    // Build a context-rich prompt using all available user data
    // This makes recommendations more personalized and relevant
    const prompt = `
      You are an expert career counselor specializing in tech placements for fresh graduates
      and MCA/B.Tech students in India. Analyze the following user profile and provide
      personalized career recommendations.
      
      User Profile:
      - Skills: ${userProfile.skills ? userProfile.skills.join(', ') : 'Not specified'}
      - Interests: ${userProfile.interests ? userProfile.interests.join(', ') : 'Not specified'}
      - Experience Level: ${userProfile.experience || 'Fresher'}
      - Education: ${userProfile.education || 'MCA/B.Tech Student'}
      - Test Performance: ${userProfile.testResults ? JSON.stringify(userProfile.testResults.slice(0, 5)) : 'No tests taken yet'}
      - Courses Enrolled: ${userProfile.enrolledCourses ? userProfile.enrolledCourses.map(c => c.title).join(', ') : 'None yet'}
      
      Return a JSON object with the following structure:
      {
        "careerPaths": [
          {
            "title": "Career path title (e.g., Full Stack Developer)",
            "description": "Why this path suits the user based on their profile",
            "matchScore": <0-100 how well this matches the user>,
            "averageSalary": "Expected salary range in INR for freshers",
            "growthProspect": "Short description of career growth potential",
            "requiredSkills": ["Skill 1", "Skill 2"],
            "roadmap": "Brief 3-step roadmap to get started"
          }
        ],
        "companies": [
          {
            "name": "Company Name",
            "type": "Product/Service/Startup",
            "whyGoodFit": "Why this company matches the user's profile",
            "roles": ["Relevant role 1", "Relevant role 2"],
            "preparationTips": "Specific tips for this company's hiring process"
          }
        ],
        "skillsToLearn": [
          {
            "skill": "Skill name",
            "priority": "high/medium/low",
            "reason": "Why this skill is important for the user",
            "resources": "Suggested learning resources",
            "timeToLearn": "Estimated time to achieve proficiency"
          }
        ],
        "immediateActions": [
          "Actionable step 1 to take right now",
          "Actionable step 2 to take right now",
          "Actionable step 3 to take right now"
        ]
      }
      
      Provide at least 3 career paths, 5 companies, and 5 skills to learn.
      Focus on the Indian tech job market and realistic opportunities for the user's level.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsedData = JSON.parse(text);

    return parsedData;
  } catch (error) {
    console.error('Error getting career recommendation:', error.message);
    throw new Error(`Failed to get career recommendations: ${error.message}`);
  }
};

/**
 * Chat with the AI learning and placement assistant.
 * 
 * Provides a conversational AI experience with context awareness.
 * The AI is configured as a knowledgeable learning and placement
 * preparation assistant that can help with study guidance, interview prep,
 * coding concepts, and career advice.
 * 
 * @async
 * @param {string} message - The user's current chat message
 * @param {Array<Object>} [context=[]] - Previous conversation messages for context
 * @param {string} context[].role - 'user' or 'model' indicating who sent the message
 * @param {string} context[].parts - The message text content
 * @returns {Promise<Object>} AI chat response
 * @returns {string} returns.reply - The AI assistant's response text
 * @throws {Error} If Gemini API call fails
 * 
 * @example
 * const response = await chatWithAI('Explain closures in JavaScript', [
 *   { role: 'user', parts: 'I want to learn JavaScript' },
 *   { role: 'model', parts: 'Great! What specific topic...' }
 * ]);
 */
const chatWithAI = async (message, context = []) => {
  try {
    // For chat, we use text output (not JSON) since responses are conversational
    const model = getModel({
      responseMimeType: 'text/plain', // Chat responses are natural text, not JSON
      temperature: 0.8 // Slightly higher temperature for more natural conversation
    });

    // System prompt that defines the AI assistant's personality and expertise
    // This shapes all responses to be educational and placement-focused
    const systemPrompt = `
      You are "SmartLearn AI", an intelligent and friendly learning & placement preparation 
      assistant for the Smart Learning Portal. Your expertise includes:
      
      1. **Technical Concepts**: Programming (JavaScript, Python, Java, C++), Data Structures, 
         Algorithms, System Design, Databases, Web Development, DevOps
      2. **Interview Preparation**: Mock interview tips, common questions, behavioral questions,
         HR round preparation, group discussion tips
      3. **Placement Guidance**: Resume building, aptitude preparation, company-specific tips,
         campus placement strategies
      4. **Career Advice**: Career paths in tech, skill development roadmaps, industry trends
      5. **Study Help**: Explaining concepts, solving doubts, recommending resources
      
      Guidelines for your responses:
      - Be concise but thorough - aim for clarity over verbosity
      - Use examples and analogies when explaining technical concepts
      - When giving code examples, use proper formatting with language indicators
      - Be encouraging and supportive - students may be anxious about placements
      - If asked about non-educational topics, politely redirect to learning/placement topics
      - Always provide actionable advice
      - Use bullet points and structured formatting for readability
    `;

    // Build the conversation history for context-aware responses
    // Include the system prompt as the first message to set the AI's behavior
    const chatHistory = [
      {
        role: 'user',
        parts: [{ text: systemPrompt + '\n\nPlease acknowledge and begin as SmartLearn AI.' }]
      },
      {
        role: 'model',
        parts: [{ text: 'I\'m SmartLearn AI, your learning and placement preparation assistant! I\'m here to help you with technical concepts, interview prep, career guidance, and study support. How can I help you today?' }]
      }
    ];

    // Add previous conversation context if provided
    // This enables multi-turn conversations that feel natural
    if (context && context.length > 0) {
      context.forEach((msg) => {
        chatHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.parts || msg.content || '' }]
        });
      });
    }

    // Start a chat session with the conversation history
    const chat = model.startChat({
      history: chatHistory
    });

    // Send the user's current message and get the AI response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const reply = response.text();

    // Return the response in a consistent format
    return {
      reply: reply,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in AI chat:', error.message);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
};

/**
 * Generate a personalized week-by-week placement preparation roadmap.
 * 
 * Creates a comprehensive, structured study plan based on the user's
 * current skill level, test performance, and career goals. The roadmap
 * includes weekly goals, daily tasks, and recommended resources.
 * 
 * @async
 * @param {Object} userProfile - The user's profile and performance data
 * @param {string[]} [userProfile.skills] - Current skill set
 * @param {Object[]} [userProfile.testResults] - Test performance history
 * @param {string[]} [userProfile.weakTopics] - Topics needing improvement
 * @param {string[]} [userProfile.strongTopics] - Topics user excels at
 * @param {string} [userProfile.targetRole] - Desired job role
 * @param {number} [userProfile.weeksUntilPlacement] - Weeks until placement season
 * @returns {Promise<Object>} Structured placement preparation roadmap
 * @returns {Array<Object>} returns.roadmap - Week-by-week plan
 * @returns {string} returns.roadmap[].week - Week number/label
 * @returns {Array<string>} returns.roadmap[].goals - Weekly goals
 * @returns {Array<Object>} returns.roadmap[].tasks - Daily tasks
 * @returns {Array<string>} returns.roadmap[].resources - Recommended resources
 * @throws {Error} If Gemini API call fails or response parsing fails
 * 
 * @example
 * const plan = await generatePlacementRoadmap({
 *   skills: ['JavaScript', 'HTML/CSS'],
 *   weakTopics: ['Data Structures', 'Algorithms'],
 *   targetRole: 'Frontend Developer',
 *   weeksUntilPlacement: 12
 * });
 */
const generatePlacementRoadmap = async (userProfile) => {
  try {
    const model = getModel();

    // Calculate a reasonable roadmap duration based on user data
    const weeks = userProfile.weeksUntilPlacement || 8;

    const prompt = `
      You are an expert placement preparation coach for Indian engineering students.
      
      Create a detailed, personalized ${weeks}-week placement preparation roadmap 
      based on the following user profile:
      
      User Profile:
      - Current Skills: ${userProfile.skills ? userProfile.skills.join(', ') : 'Basic programming'}
      - Strong Topics: ${userProfile.strongTopics ? userProfile.strongTopics.join(', ') : 'Not assessed yet'}
      - Weak Topics: ${userProfile.weakTopics ? userProfile.weakTopics.join(', ') : 'Not assessed yet'}
      - Target Role: ${userProfile.targetRole || 'Software Developer'}
      - Test Performance: ${userProfile.testResults ? `Average score: ${userProfile.averageScore || 'N/A'}%` : 'No tests taken'}
      - Weeks Available: ${weeks} weeks
      
      Return a JSON object with the following structure:
      {
        "overview": "Brief summary of the roadmap strategy",
        "totalWeeks": ${weeks},
        "dailyHours": <recommended hours per day>,
        "roadmap": [
          {
            "week": 1,
            "theme": "Week theme (e.g., 'Foundation & Assessment')",
            "goals": [
              "Specific goal 1 for this week",
              "Specific goal 2 for this week"
            ],
            "tasks": [
              {
                "day": "Day 1-2",
                "task": "Specific task description",
                "duration": "2 hours",
                "type": "study/practice/project/mock-interview"
              }
            ],
            "resources": [
              {
                "name": "Resource name",
                "type": "video/article/practice/book",
                "url": "URL if applicable or 'Search on platform'",
                "description": "Why this resource is recommended"
              }
            ],
            "milestones": [
              "What the user should be able to do by end of this week"
            ]
          }
        ],
        "tips": [
          "General placement preparation tips",
          "Mental health and stress management advice"
        ],
        "mockSchedule": {
          "description": "Recommended mock interview schedule",
          "frequency": "How often to do mock interviews",
          "platforms": ["Platforms for mock interviews"]
        }
      }
      
      Make the roadmap:
      1. Progressive - build on previous weeks' learnings
      2. Balanced - mix of theory, coding, aptitude, and soft skills
      3. Realistic - achievable for a full-time student
      4. Focused on weak areas while maintaining strong areas
      5. Include specific DSA topics, company-specific preparation
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsedData = JSON.parse(text);

    return parsedData;
  } catch (error) {
    console.error('Error generating placement roadmap:', error.message);
    throw new Error(`Failed to generate placement roadmap: ${error.message}`);
  }
};

// ============================================================
// Export all AI service functions
// These are used by the AI controller (aiController.js)
// ============================================================
module.exports = {
  generateInterviewQuestions,
  analyzeResume,
  getCareerRecommendation,
  chatWithAI,
  generatePlacementRoadmap
};
