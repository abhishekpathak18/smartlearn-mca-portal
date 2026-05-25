/**
 * AI CONTROLLER - Smart Learning & Placement Portal
 * Gemini-powered with bulletproof local fallback.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Safe Gemini initialization - wrapped so init errors don't crash server
let genAI = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (e) {
  console.log('[AI] Gemini init failed, will use local fallback');
}

// Safe model getter - returns null if unavailable
const getGeminiModel = () => {
  try {
    if (!genAI) return null;
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  } catch {
    return null;
  }
};

// Call Gemini safely - returns null on any error
const callGemini = async (prompt) => {
  try {
    const model = getGeminiModel();
    if (!model) return null;
    const result = await model.generateContent(prompt);
    const text = result?.response?.text();
    return text && text.trim().length > 5 ? text : null;
  } catch (e) {
    console.log('[AI] Gemini call failed:', e.message?.substring(0, 80));
    return null;
  }
};

// ─── Local Interview Question Bank ───────────────────────────────────────────
const LOCAL_QUESTIONS = {
  javascript: [
    { question: 'What is the difference between `var`, `let`, and `const`?', modelAnswer: '`var` is function-scoped and hoisted. `let` and `const` are block-scoped. `const` cannot be reassigned after declaration, while `let` can.', keyPoints: ['Scope differences', 'Hoisting behavior', 'Temporal dead zone for let/const'], followUp: 'Can you explain temporal dead zone?', difficulty: 'easy' },
    { question: 'Explain closures in JavaScript with an example.', modelAnswer: 'A closure is a function that retains access to its outer lexical scope even after the outer function has returned. Used for data privacy and module patterns.', keyPoints: ['Lexical scoping', 'Data privacy', 'Module pattern'], followUp: 'How are closures used in React hooks?', difficulty: 'medium' },
    { question: 'What is the event loop in JavaScript?', modelAnswer: 'JavaScript is single-threaded. The event loop continuously checks the call stack and callback queue. When the stack is empty, it pushes callbacks from the queue to be executed.', keyPoints: ['Call stack', 'Callback queue', 'Microtask queue priority'], followUp: 'Explain the difference between microtasks and macrotasks.', difficulty: 'medium' },
    { question: 'What is Promise and async/await?', modelAnswer: 'Promises represent eventual completion/failure of async ops. async/await is syntactic sugar over Promises making async code look synchronous.', keyPoints: ['Promise states: pending, fulfilled, rejected', 'Chaining .then()/.catch()', 'Error handling with try/catch'], followUp: 'How do you handle multiple parallel promises?', difficulty: 'medium' },
    { question: 'What is prototypal inheritance?', modelAnswer: 'Objects in JS inherit from other objects through the prototype chain. Every object has __proto__ pointing to its prototype. Methods on the prototype are shared across all instances.', keyPoints: ['Prototype chain', 'Object.create()', 'ES6 Class syntax'], followUp: 'How does this differ from classical inheritance?', difficulty: 'hard' },
  ],
  react: [
    { question: 'What is the difference between state and props in React?', modelAnswer: 'Props are read-only inputs passed from parent to child. State is mutable data managed within a component that triggers re-renders when changed.', keyPoints: ['Unidirectional data flow', 'Immutability of props', 'useState hook'], followUp: 'When would you lift state up?', difficulty: 'easy' },
    { question: 'Explain the React component lifecycle with hooks.', modelAnswer: 'With hooks: useEffect replaces lifecycle methods. No dependency array = runs every render. [] = componentDidMount. [dep] = runs when dep changes. Cleanup function = componentWillUnmount.', keyPoints: ['useEffect dependency array', 'Cleanup functions', 'Mounting vs updating'], followUp: 'How does useEffect compare to componentDidMount?', difficulty: 'medium' },
    { question: 'What are React Hooks? Name the most important ones.', modelAnswer: 'Hooks let you use state and lifecycle features in functional components. Key hooks: useState (state), useEffect (side effects), useContext (context), useRef (DOM refs), useMemo/useCallback (optimization).', keyPoints: ['Rules of hooks - only call at top level', 'Custom hooks', 'Dependency arrays'], followUp: 'How would you create a custom hook?', difficulty: 'medium' },
    { question: 'What is Virtual DOM and how does reconciliation work?', modelAnswer: 'Virtual DOM is a lightweight JS object copy of the real DOM. React diffs the old and new virtual DOMs (reconciliation) and only updates changed parts in the actual DOM using a diffing algorithm.', keyPoints: ['Diffing algorithm', 'Key prop importance', 'Batch updates'], followUp: 'What is the key prop and why is it important?', difficulty: 'easy' },
    { question: 'What is the Context API and when would you use it?', modelAnswer: 'Context API provides a way to share data between components without prop drilling. Use for: theme, language, authentication state. For complex state, consider Redux or Zustand.', keyPoints: ['createContext', 'Provider and Consumer', 'useContext hook'], followUp: 'When would you choose Redux over Context?', difficulty: 'medium' },
  ],
  dsa: [
    { question: 'Explain Binary Search and its time complexity.', modelAnswer: 'Binary search works on sorted arrays. It repeatedly divides the search space in half, comparing target with middle element. Time: O(log n), Space: O(1).', keyPoints: ['Must be sorted', 'O(log n) time', 'Iterative vs recursive'], followUp: 'Can you implement it recursively?', difficulty: 'easy' },
    { question: 'What is the difference between a stack and a queue?', modelAnswer: 'Stack is LIFO (Last In First Out) - like browser back button. Queue is FIFO (First In First Out) - like print queue. Both have O(1) push/pop operations.', keyPoints: ['LIFO vs FIFO', 'Real-world use cases', 'Array vs linked list implementation'], followUp: 'Where are stacks used in compilers?', difficulty: 'easy' },
    { question: 'Explain Quick Sort and its time complexity.', modelAnswer: 'QuickSort selects a pivot, partitions array so elements < pivot go left, > go right, then recursively sorts sub-arrays. Average: O(n log n), Worst (bad pivot): O(n²).', keyPoints: ['Pivot selection strategies', 'In-place sorting', 'Average vs worst case'], followUp: 'How do you avoid the worst case?', difficulty: 'medium' },
    { question: 'What is dynamic programming? Explain with an example.', modelAnswer: 'DP solves problems by breaking into subproblems and storing results (memoization/tabulation) to avoid redundant computation. Example: Fibonacci - without DP it is O(2^n), with DP it is O(n).', keyPoints: ['Overlapping subproblems', 'Optimal substructure', 'Memoization vs tabulation'], followUp: 'Solve the Knapsack problem using DP.', difficulty: 'medium' },
    { question: 'What is the difference between BFS and DFS?', modelAnswer: 'BFS (Breadth First Search) explores level by level using a queue. DFS (Depth First Search) explores as deep as possible using a stack/recursion. BFS finds shortest path, DFS uses less memory for dense graphs.', keyPoints: ['BFS uses queue, DFS uses stack', 'Time O(V+E) for both', 'Use cases differ'], followUp: 'When would you use BFS over DFS?', difficulty: 'medium' },
  ],
  python: [
    { question: 'What are Python decorators?', modelAnswer: 'Decorators are functions that wrap other functions to extend behavior without modifying them. They use the @ symbol. Examples: @property, @staticmethod, @login_required in Flask.', keyPoints: ['Higher-order functions', '@functools.wraps preserves metadata', 'Class decorators'], followUp: 'How would you write a timing decorator?', difficulty: 'medium' },
    { question: 'Explain list, tuple, set, and dictionary in Python.', modelAnswer: 'List: ordered, mutable, allows duplicates []. Tuple: ordered, immutable (). Set: unordered, no duplicates {}. Dict: key-value pairs, ordered in Python 3.7+ {}.', keyPoints: ['Mutability differences', 'When to use each', 'Time complexity of operations'], followUp: 'When would you choose a tuple over a list?', difficulty: 'easy' },
    { question: 'What is GIL in Python?', modelAnswer: 'Global Interpreter Lock prevents multiple threads from executing Python bytecode simultaneously. Makes CPython thread-safe but limits CPU-bound multi-threading performance. Solution: use multiprocessing for CPU tasks.', keyPoints: ['CPython specific', 'I/O bound vs CPU bound', 'Multiprocessing solution'], followUp: 'How does asyncio help with I/O-bound tasks?', difficulty: 'hard' },
  ],
  sql: [
    { question: 'What is the difference between INNER JOIN and LEFT JOIN?', modelAnswer: 'INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from left table plus matched rows from right (NULLs for non-matches on the right).', keyPoints: ['NULL handling', 'Row count difference', 'FULL OUTER JOIN'], followUp: 'When would you use a FULL OUTER JOIN?', difficulty: 'easy' },
    { question: 'What are indexes in SQL and when should you use them?', modelAnswer: 'Indexes speed up SELECT queries by creating a data structure (B-tree) on columns. Use on frequently queried, filtered, or joined columns. Downside: slows INSERT/UPDATE/DELETE and uses disk space.', keyPoints: ['B-tree structure', 'Composite indexes', 'Index trade-offs'], followUp: 'What is a covering index?', difficulty: 'medium' },
    { question: 'Explain normalization and its forms.', modelAnswer: '1NF: Atomic values, no repeating groups. 2NF: 1NF + no partial dependencies. 3NF: 2NF + no transitive dependencies. BCNF: Stricter 3NF. Goal: eliminate redundancy and anomalies.', keyPoints: ['1NF, 2NF, 3NF', 'Functional dependencies', 'When to denormalize'], followUp: 'When would you denormalize a database?', difficulty: 'medium' },
  ],
  node: [
    { question: 'What is Node.js and how does it handle concurrency?', modelAnswer: 'Node.js is a JavaScript runtime built on V8 engine using an event-driven, non-blocking I/O model. Single thread handles multiple requests via the event loop without blocking on I/O operations.', keyPoints: ['Event loop', 'Non-blocking I/O', 'Callback/Promise/async-await'], followUp: 'What types of tasks is Node.js NOT good for?', difficulty: 'easy' },
    { question: 'What is middleware in Express.js?', modelAnswer: 'Middleware are functions that execute during request-response cycle. They access req, res, and next. Used for: authentication, logging, parsing, error handling, CORS. Order matters.', keyPoints: ['req, res, next parameters', 'Order of execution', 'Error middleware (4 params)'], followUp: 'How do you create custom middleware?', difficulty: 'easy' },
  ],
  default: [
    { question: 'Tell me about yourself and your technical background.', modelAnswer: 'Structure: Education → Projects → Skills → Goal. Example: "I am an MCA student at Chandigarh University. I have built [projects] using [tech stack]. I am skilled in [technologies] and looking to contribute to [type of role]."', keyPoints: ['2-minute rule', 'Specific technologies', 'Align with role requirements'], followUp: 'What was your most challenging project?', difficulty: 'easy' },
    { question: 'What is object-oriented programming? Explain its four pillars.', modelAnswer: 'OOP models real-world entities as objects. 4 pillars: 1) Encapsulation: hiding internal state 2) Inheritance: reusing code from parent class 3) Polymorphism: one interface, many forms 4) Abstraction: hiding complexity.', keyPoints: ['All four pillars with real examples', 'Advantages over procedural', 'OOP languages'], followUp: 'How does inheritance differ from composition?', difficulty: 'easy' },
    { question: 'What is REST API? Explain HTTP methods.', modelAnswer: 'REST is an architectural style for building APIs using HTTP. Methods: GET (fetch data), POST (create), PUT (replace), PATCH (partial update), DELETE (remove). Stateless, uses JSON, proper status codes.', keyPoints: ['Statelessness principle', 'HTTP status codes (200,201,400,401,404,500)', 'REST vs GraphQL'], followUp: 'What is the difference between PUT and PATCH?', difficulty: 'easy' },
    { question: 'What is DBMS? Explain ACID properties.', modelAnswer: 'DBMS manages databases. ACID: Atomicity (all or nothing), Consistency (valid state always), Isolation (transactions independent), Durability (committed data persists). Essential for reliable transactions.', keyPoints: ['Each ACID property', 'Transaction example', 'SQL vs NoSQL ACID compliance'], followUp: 'How does MongoDB handle ACID properties?', difficulty: 'medium' },
    { question: 'Explain the difference between process and thread.', modelAnswer: 'Process: independent program with own memory space. Thread: lightweight unit within a process sharing memory. Processes are isolated (crash in one doesn\'t affect others). Threads share memory (faster but need synchronization).', keyPoints: ['Memory isolation', 'Context switching cost', 'Deadlock in threads'], followUp: 'What is a deadlock and how do you prevent it?', difficulty: 'medium' },
    { question: 'What is the OSI model?', modelAnswer: '7 layers: 1) Physical 2) Data Link 3) Network (IP) 4) Transport (TCP/UDP) 5) Session 6) Presentation 7) Application (HTTP, FTP, SMTP). Mnemonic: Please Do Not Throw Sausage Pizza Away.', keyPoints: ['All 7 layers and protocols', 'TCP vs UDP', 'HTTP is at Application layer'], followUp: 'What happens when you type a URL in a browser?', difficulty: 'medium' },
  ]
};

// ─── Smart Chat Rules ─────────────────────────────────────────────────────────
const CHAT_RULES = [
  {
    patterns: ['tcs', 'infosys', 'wipro', 'accenture', 'cognizant', 'company interview', 'campus placement', 'off campus'],
    response: `**TCS / Infosys / Wipro Interview Preparation** 🏢

**Selection Process:**

**1️⃣ Online Test (Aptitude)**
• Quantitative Aptitude (45 min)
• Logical Reasoning (30 min)
• Verbal Ability (20 min)
• Coding - 1-2 problems (30 min)

**2️⃣ Technical Interview (TR)**
• OOP concepts (mandatory)
• Your primary language (Java/Python/C++)
• DBMS - SQL queries
• Projects from your resume
• Basic DSA

**3️⃣ HR Round**
• "Tell me about yourself"
• Why this company?
• Strengths & weaknesses
• Salary expectations

**📚 Preparation Resources:**
• IndiaBix / PrepInsta for aptitude
• GeeksForGeeks for technical
• LeetCode Easy problems for coding

**Timeline:** Start 4-6 weeks before placements begin. Consistency is key! 💪`
  },
  {
    patterns: ['dsa', 'data structure', 'algorithm', 'leetcode', 'coding problems', 'competitive programming'],
    response: `**DSA Preparation Roadmap** 🚀

**Phase 1: Foundation (Week 1-2)**
• Arrays & Strings - Two pointers, sliding window
• Searching - Linear, Binary search
• Sorting - Bubble, Selection, Merge, Quick sort

**Phase 2: Core Data Structures (Week 3-4)**
• Linked Lists - Singly, Doubly, Circular
• Stacks & Queues - Using arrays and linked lists
• Trees - BFS, DFS, BST operations
• Hashing - HashMap, HashSet

**Phase 3: Advanced (Week 5-6)**
• Graphs - BFS, DFS, Dijkstra, Floyd-Warshall
• Dynamic Programming - Memoization, Tabulation
• Tries, Heaps, Segment Trees (bonus)

**🎯 Target:**
• 100+ LeetCode problems before placements
• 50 Easy + 40 Medium + 10 Hard

**Daily Plan:**
🌅 Morning: 1 aptitude topic (30 min)
☀️ Day: 2-3 LeetCode problems
🌙 Evening: Concept revision`
  },
  {
    patterns: ['resume', 'cv', 'curriculum vitae', 'resume format', 'ats'],
    response: `**Resume Building Guide** 📄

**Structure (1 page for freshers):**

1. **Header**: Name | Phone | Email | LinkedIn | GitHub
2. **Education**: University, Degree, CGPA (if ≥ 7.0), Year
3. **Technical Skills**: Languages, Frameworks, Tools, Databases
4. **Projects** *(Most Important!)*: 2-3 strong projects
5. **Experience**: Internships, part-time roles
6. **Achievements**: Hackathons, certifications, rankings

**✅ Project Description Formula:**
*"Built [project] using [tech] that [impact/metric]"*

Example: *"Built a full-stack e-commerce app using MERN stack handling 500+ products with Stripe payment integration, reducing checkout time by 30%."*

**ATS Optimization Tips:**
• Use keywords from the job description
• Avoid tables, images, headers/footers
• Use standard section names
• Save as PDF

**❌ Common Mistakes:**
• Generic objective: "Seeking a challenging position..."
• No quantifiable results
• Spelling/grammar errors
• Too many or too few details (target 400-600 words)`
  },
  {
    patterns: ['roadmap', '30 day', '60 day', 'preparation plan', 'study plan', 'how to prepare', 'placement preparation'],
    response: `**30-Day Placement Roadmap** 📅

**Week 1: Foundation**
• Day 1-3: Arrays, Strings, Basic Math
• Day 4-5: Aptitude - Numbers, Percentages, Ratios
• Day 6-7: OOP concepts - all 4 pillars with examples

**Week 2: Core CS Subjects**
• Day 8-10: DBMS - Normalization, SQL queries, Transactions
• Day 11-12: OS - Processes, Threads, Scheduling, Deadlock
• Day 13-14: Computer Networks - TCP/IP, HTTP, DNS, OSI Model

**Week 3: Data Structures**
• Day 15-17: Linked Lists, Stacks, Queues
• Day 18-20: Trees (BFS/DFS), Graphs basics
• Day 21: Binary Search, Sorting algorithms

**Week 4: Mock & Polish**
• Day 22-24: Dynamic Programming basics
• Day 25-27: Mock interviews with peers
• Day 28-29: Resume finalization, HR prep
• Day 30: Company-specific research

**⏰ Daily Schedule:**
🌅 8-9 AM: Aptitude practice (20-30 questions)
🌞 2-5 PM: DSA on LeetCode (2-3 problems)
🌙 7-9 PM: Core subject revision

*Consistency beats intensity. Study daily!* 💡`
  },
  {
    patterns: ['system design', 'scalable', 'architecture', 'microservices', 'load balancer'],
    response: `**System Design Basics** 🏗️

**Key Concepts to Learn:**

**Scalability:**
• Horizontal scaling (more servers) vs Vertical scaling (bigger server)
• Load balancers distribute traffic
• Stateless services scale better

**Storage:**
• SQL (structured, ACID) vs NoSQL (flexible, scalable)
• Caching with Redis - reduces DB load by 90%+
• CDN for static assets (images, JS, CSS)

**Communication:**
• REST vs GraphQL vs gRPC
• Message queues (RabbitMQ/Kafka) for async processing
• WebSockets for real-time features

**Common Interview Questions:**
• Design URL shortener (TinyURL/bit.ly)
• Design Twitter/WhatsApp
• Design Netflix streaming
• Design ride-sharing (Uber)

**Answer Framework:**
1. Clarify requirements (functional + non-functional)
2. Estimate scale (users, requests/second, storage)
3. Design high-level architecture
4. Design database schema
5. Identify bottlenecks and scale

*For MCA freshers: focus on basic concepts only*`
  },
  {
    patterns: ['nervous', 'anxiety', 'scared', 'afraid', 'confident', 'stress', 'interview fear'],
    response: `**Overcoming Interview Nervousness** 🧘

**Before the Interview:**
• Prepare thoroughly (preparation = confidence)
• Good sleep the night before (8 hours)
• Light meal 1-2 hours before
• Arrive 15 minutes early
• 4-7-8 breathing technique (in 4 sec, hold 7, out 8)

**During the Interview:**
• Remember: Interviewers WANT you to succeed
• Think aloud - share your reasoning process
• If you don't know: "I am not certain, but my approach would be..."
• Ask clarifying questions - shows analytical thinking
• Speak slowly and clearly

**Mindset Shift:**
> It is not an interrogation. It is a conversation between two professionals exploring a mutual fit.

**Practice Methods:**
• Mock interviews with friends (weekly)
• Record yourself answering questions
• Practice in front of mirror
• Use Pramp.com for free peer mock interviews

You have prepared for this. Trust your preparation! 🌟`
  },
  {
    patterns: ['mca', 'master of computer', 'chandigarh university', 'bca', 'btech', 'b.tech', 'engineering student'],
    response: `**MCA/BTech Placement Guide** 🎓

**Key Technical Skills Required:**
• Programming: Java / Python / C++ (pick one, master it)
• Web Dev: HTML, CSS, JavaScript + one framework
• Database: SQL (mandatory) + one NoSQL
• DSA: Arrays, Trees, Graphs, DP
• Core CS: OOP, DBMS, OS, Computer Networks

**Portfolio Projects (Must Have):**
1. Full-stack web application (MERN/Spring Boot)
2. REST API with authentication
3. One project with database integration

**Companies Recruiting MCA Freshers:**
• Service-based: TCS (3.5-4 LPA), Infosys (3.6 LPA), Wipro (3.5 LPA), Cognizant, HCL
• Mid-tier: Capgemini (4 LPA), Tech Mahindra, Mphasis
• Product-based: Amazon, Zoho, Paytm (requires stronger DSA)

**Timeline:**
• Semester 3: Build projects, learn DSA basics
• Semester 4: Campus placement season

**Your Advantage:**
MCA with strong projects + aptitude + communication = 4-6 LPA offer guaranteed 🎯`
  },
  {
    patterns: ['hello', 'hi ', 'hey', 'good morning', 'good afternoon', 'good evening', 'start', 'help me'],
    response: `Hello! 👋 Welcome to **SmartLearn AI Assistant**!

I am your personal placement preparation coach. Here is what I can help you with:

🎯 **Interview Prep** - TCS, Infosys, Wipro, Amazon and more
📚 **DSA Roadmap** - From basics to advanced
📄 **Resume Review** - ATS tips and best practices
🗺️ **Study Plans** - 30-day and 60-day roadmaps
💻 **Concepts** - OOP, DBMS, OS, Networking, Web Dev
🏗️ **System Design** - Scalability and architecture basics
💪 **Confidence Tips** - Beat interview anxiety

Just type your question or click one of the quick prompts below! I am here 24/7 to help you land your dream job! 🚀`
  },
];

const getSmartResponse = (message) => {
  const lower = (message || '').toLowerCase();
  for (const rule of CHAT_RULES) {
    if (rule.patterns.some(p => lower.includes(p))) {
      return rule.response;
    }
  }
  // Generic intelligent response
  return `**SmartLearn AI** 🤖\n\nGreat question about: *"${message}"*\n\nHere are key placement preparation tips:\n\n**Technical Skills:**\n• Practice coding daily on LeetCode (target: 100+ problems)\n• Master one language deeply (Java/Python/JavaScript)\n• Build 2-3 full-stack projects for your portfolio\n• Learn core CS: OOP, DBMS, OS, CN\n\n**Aptitude Preparation:**\n• Practice 20-30 questions daily (IndiaBix/PrepInsta)\n• Focus on: Quantitative, Logical Reasoning, Verbal\n• Time yourself - speed matters in online tests\n\n**Interview Skills:**\n• Practice speaking answers aloud\n• Research company culture before interview\n• Use STAR format for behavioral questions\n• Review all your projects thoroughly\n\n**Try asking me:**\n• "How to prepare for TCS interview?"\n• "Give me a 30-day DSA roadmap"\n• "How to write a good resume?"\n\nKeep learning and stay consistent! 💪`;
};

const getLocalQuestions = (topic, count) => {
  const lower = (topic || '').toLowerCase();
  let bank = LOCAL_QUESTIONS.default;
  for (const key of Object.keys(LOCAL_QUESTIONS)) {
    if (key !== 'default' && lower.includes(key)) { bank = LOCAL_QUESTIONS[key]; break; }
  }
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((q, i) => ({ ...q, id: i + 1, topic }));
};

// ─── Controller Functions ─────────────────────────────────────────────────────

const generateInterviewQuestions = async (req, res) => {
  try {
    const { topic, difficulty = 'medium', count = 5 } = req.body;
    if (!topic) return res.status(400).json({ success: false, error: 'Please provide a topic' });
    const questionCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 10);

    // Try Gemini
    const geminiPrompt = `Generate ${questionCount} ${difficulty}-level interview questions on "${topic}" for MCA/BTech students. Return ONLY a valid JSON array with no markdown: [{"question":"...","modelAnswer":"...","keyPoints":["...","...","..."],"followUp":"...","difficulty":"${difficulty}"}]`;
    const geminiText = await callGemini(geminiPrompt);
    let questions = [];

    if (geminiText) {
      try {
        const clean = geminiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) {
          questions = parsed.map((q, i) => ({ ...q, id: i + 1, topic }));
        }
      } catch { questions = []; }
    }

    if (questions.length === 0) {
      questions = getLocalQuestions(topic, questionCount);
    }

    // Save to DB
    try {
      const Interview = require('../models/Interview');
      await Interview.create({ user: req.user.id, topic, difficulty, questions, generatedAt: new Date() });
    } catch {}

    return res.status(200).json({
      success: true,
      message: `Generated ${questions.length} ${difficulty} questions for "${topic}"`,
      data: { topic, difficulty, count: questions.length, questions, source: geminiText ? 'ai' : 'curated' }
    });
  } catch (error) {
    console.error('[AI] Interview questions error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to generate questions. Please try again.' });
  }
};

const chatWithAI = async (req, res) => {
  // Extract message - support both field names from frontend
  const message = req.body?.message;
  const history = req.body?.conversationHistory || req.body?.context || [];

  // Validate
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Please provide a message' });
  }

  // Try Gemini (non-blocking - any failure falls through)
  const systemPrompt = 'You are SmartLearn AI, an expert placement prep assistant for MCA/BTech students in India. Help with: technical interviews, DSA, resume, career guidance, company prep (TCS/Infosys/Wipro/Amazon), OOP, DBMS, OS, CN, aptitude. Be concise, practical, encouraging. Use bullet points and emojis.';
  let fullPrompt = systemPrompt + '\n\n';
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-4).forEach(m => {
      if (m && m.role && m.content) {
        fullPrompt += `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}\n`;
      }
    });
  }
  fullPrompt += `Student: ${message.trim()}\n\nAI:`;

  const geminiReply = await callGemini(fullPrompt);

  if (geminiReply) {
    return res.status(200).json({
      success: true,
      data: { reply: geminiReply, source: 'ai', timestamp: new Date().toISOString() }
    });
  }

  // Local fallback — always works
  const reply = getSmartResponse(message);
  return res.status(200).json({
    success: true,
    data: { reply, source: 'curated', timestamp: new Date().toISOString() }
  });
};

const analyzeResume = async (req, res) => {
  try {
    const { resumeText, targetRole } = req.body;
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ success: false, error: 'Please provide resume text (minimum 50 characters)' });
    }

    let analysis;
    const geminiPrompt = `Analyze this resume${targetRole ? ` for "${targetRole}" role` : ''}. Return ONLY valid JSON (no markdown): {"overallScore":7,"summary":"...","strengths":["...","..."],"improvements":["...","..."],"missingSections":["..."],"atsScore":6,"atsTips":["...","..."],"suggestions":[{"section":"...","suggestion":"..."}],"keywords":["...","..."]}

Resume text:
${resumeText.substring(0, 3000)}`;
    const geminiText = await callGemini(geminiPrompt);

    if (geminiText) {
      try {
        const clean = geminiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        analysis = JSON.parse(clean);
      } catch { analysis = null; }
    }

    if (!analysis) {
      const wordCount = resumeText.split(/\s+/).length;
      const hasEmail = /[\w.-]+@[\w.-]+/.test(resumeText);
      const hasPhone = /\d{10}|\+91/.test(resumeText);
      const hasGithub = /github/i.test(resumeText);
      const hasLinkedin = /linkedin/i.test(resumeText);
      const hasProjects = /project/i.test(resumeText);
      const hasSkills = /skill/i.test(resumeText);
      let score = 50;
      if (hasEmail) score += 5; if (hasPhone) score += 5; if (hasGithub) score += 10;
      if (hasLinkedin) score += 5; if (hasProjects) score += 15; if (hasSkills) score += 10;
      if (wordCount > 300) score += 5; if (wordCount < 150) score -= 10;
      analysis = {
        overallScore: Math.min(Math.round(score / 10), 10),
        summary: `Your resume has ${wordCount} words. ${score >= 80 ? 'Good overall structure.' : 'Needs some improvements to stand out.'}`,
        strengths: [hasProjects && 'Includes project section', hasSkills && 'Technical skills listed', hasGithub && 'GitHub profile mentioned'].filter(Boolean),
        improvements: [!hasGithub && 'Add GitHub profile URL', !hasLinkedin && 'Add LinkedIn profile URL', wordCount < 200 && 'Add more detail to projects with metrics'].filter(Boolean),
        missingSections: [!hasProjects && 'Projects', !hasSkills && 'Skills', !hasEmail && 'Contact Email'].filter(Boolean),
        atsScore: Math.min(Math.round(score / 12), 10),
        atsTips: ['Use standard section headings (Education, Skills, Projects)', 'Avoid tables, images, text boxes', 'Include keywords from job description', 'Save as PDF (not Word)'],
        suggestions: [{ section: 'Projects', suggestion: 'Quantify impact: "Reduced load time by 40%" or "Handles 1000+ users"' }, { section: 'Skills', suggestion: 'Group by category: Languages | Frameworks | Tools | Databases' }],
        keywords: ['React', 'Node.js', 'MongoDB', 'Java', 'Python', 'SQL', 'REST API', 'Git', 'Docker', 'AWS']
      };
    }

    try {
      const Resume = require('../models/Resume');
      await Resume.create({
        user: req.user.id,
        originalText: resumeText.substring(0, 5000),
        fileName: 'uploaded',
        analysis: {
          overallScore: analysis.overallScore || 0,
          strengths: analysis.strengths || [],
          improvements: analysis.improvements || [],
          suggestions: analysis.atsTips || [],
          keywordMatch: (analysis.atsScore || 0) * 10,
          formattingScore: (analysis.overallScore || 0) * 10,
          contentScore: (analysis.overallScore || 0) * 10
        }
      });
    } catch {}

    return res.status(200).json({ success: true, message: 'Resume analyzed successfully', data: { analysis, targetRole: targetRole || 'General Software Developer' } });
  } catch (error) {
    console.error('[AI] Resume analysis error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to analyze resume.' });
  }
};

const getCareerRecommendation = async (req, res) => {
  try {
    const skills = req.body?.skills || [];
    const interests = req.body?.interests || [];
    const experience = req.body?.experience || 'fresher';
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide your skills as an array' });
    }
    const geminiPrompt = `Career recommendations for MCA/BTech fresher: Skills: ${skills.join(', ')}, Interests: ${interests.join(', ')}, Level: ${experience}. Return ONLY valid JSON: {"primaryCareerPaths":[{"role":"...","description":"...","matchScore":85,"reasonsForMatch":["..."],"requiredSkills":["..."],"salaryRange":"4-7 LPA"}],"skillGaps":[{"skill":"...","importance":"High","resources":["..."]}],"learningPath":[{"phase":"Month 1","topics":["..."],"goals":["..."]}],"certifications":["..."],"industryInsights":"..."}`;
    const geminiText = await callGemini(geminiPrompt);
    let recommendations;
    if (geminiText) {
      try {
        const clean = geminiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        recommendations = JSON.parse(clean);
      } catch { recommendations = null; }
    }
    if (!recommendations) {
      const hasWeb = skills.some(s => /react|node|html|css|javascript|js|next/i.test(s));
      const hasData = skills.some(s => /python|ml|ai|data|sql|analytics/i.test(s));
      recommendations = {
        primaryCareerPaths: [
          { role: hasWeb ? 'Full Stack Developer' : hasData ? 'Data Analyst' : 'Software Developer', description: 'High-demand role in Indian IT sector with strong growth', matchScore: 85, reasonsForMatch: ['Strong alignment with your skills', 'High market demand 2024'], requiredSkills: skills.slice(0, 3), salaryRange: '4-8 LPA (fresher)' },
          { role: 'Backend Developer', description: 'Build APIs, databases, and server logic', matchScore: 78, reasonsForMatch: ['Growing demand', 'Good salary trajectory'], requiredSkills: ['Node.js/Java', 'SQL/MongoDB', 'REST APIs'], salaryRange: '4-7 LPA (fresher)' },
          { role: 'Software Test Engineer', description: 'Automation and manual testing', matchScore: 70, reasonsForMatch: ['High openings', 'Good entry point'], requiredSkills: ['Selenium/Cypress', 'JIRA', 'Test planning'], salaryRange: '3-5 LPA (fresher)' }
        ],
        skillGaps: [{ skill: 'DSA & Algorithms', importance: 'High', resources: ['LeetCode', 'GeeksForGeeks', 'Striver Sheet'] }, { skill: 'System Design Basics', importance: 'Medium', resources: ['Grokking System Design', 'High Scalability blog'] }, { skill: 'Cloud Basics (AWS/GCP)', importance: 'Medium', resources: ['AWS Free Tier', 'Google Cloud Skills Boost'] }],
        learningPath: [{ phase: 'Month 1: Core Skills', topics: ['DSA Fundamentals', 'SQL basics', 'Git/GitHub'], goals: ['Solve 30 LeetCode Easy', 'Complete one SQL course'] }, { phase: 'Month 2: Framework Deep Dive', topics: skills.slice(0, 2), goals: ['Build 1 complete project', 'Deploy on cloud'] }],
        certifications: ['AWS Cloud Practitioner (free prep)', 'MongoDB University (free)', 'Google IT Automation with Python (Coursera)'],
        industryInsights: 'Indian IT market has 3.5+ lakh openings for freshers in 2024. MERN stack, Java Spring Boot, and Python developers are in highest demand. MCA fresher packages: 3.5-8 LPA depending on company and skills.'
      };
    }
    return res.status(200).json({ success: true, message: 'Career recommendations generated', data: { recommendations, basedOn: { skills, interests, experience } } });
  } catch (error) {
    console.error('[AI] Career recommendation error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to generate recommendations.' });
  }
};

const getPlacementRoadmap = async (req, res) => {
  try {
    // Support both GET (query params) and POST (body)
    const body = req.body || {};
    const query = req.query || {};
    const skills = body.skills || query.skills || [];
    const targetCompanies = body.targetCompanies || query.targetCompanies || [];
    const weeksAvailable = parseInt(body.weeksAvailable || query.weeks || 12, 10);
    const currentLevel = body.currentLevel || query.level || 'beginner';
    const weeks = Math.min(Math.max(isNaN(weeksAvailable) ? 12 : weeksAvailable, 4), 52);

    const roadmap = {
      overview: `A ${weeks}-week structured placement preparation plan targeting ${Array.isArray(targetCompanies) && targetCompanies.length > 0 ? targetCompanies.join(', ') : 'top IT companies (TCS, Infosys, Wipro, Amazon)'}.`,
      phases: [
        {
          phase: 'Phase 1: Foundation', duration: `Weeks 1-${Math.floor(weeks / 3)}`,
          focus: 'Core CS concepts + Aptitude basics',
          weeklyPlan: [
            { week: 1, topics: ['Arrays & Strings', 'Basic Math', 'Time Complexity'], dailyHours: 3, practiceProblems: '5 LeetCode Easy + 20 Aptitude', resources: ['GeeksForGeeks', 'IndiaBix'] },
            { week: 2, topics: ['OOP All 4 Pillars', 'DBMS Basics', 'Linked Lists'], dailyHours: 4, practiceProblems: '5 LeetCode Easy + 20 Aptitude', resources: ['JavaTpoint OOP', 'W3Schools SQL'] }
          ]
        },
        {
          phase: 'Phase 2: Core Skills', duration: `Weeks ${Math.floor(weeks / 3) + 1}-${Math.floor(weeks * 2 / 3)}`,
          focus: 'Advanced DSA + Company-specific prep',
          weeklyPlan: [
            { week: Math.floor(weeks / 3) + 1, topics: ['Binary Search', 'Recursion', 'Trees'], dailyHours: 4, practiceProblems: '3 LeetCode Medium + 30 Aptitude', resources: ['LeetCode Binary Search tag', 'CS50'] }
          ]
        },
        {
          phase: 'Phase 3: Mock & Polish', duration: `Weeks ${Math.floor(weeks * 2 / 3) + 1}-${weeks}`,
          focus: 'Full mock tests + HR prep + Resume',
          weeklyPlan: [
            { week: Math.floor(weeks * 2 / 3) + 1, topics: ['Full Mock Tests', 'HR Questions', 'Resume Polish'], dailyHours: 6, practiceProblems: '1 full mock test daily', resources: ['Pramp.com', 'InterviewBit'] }
          ]
        }
      ],
      projectSuggestions: [
        { title: 'Full-Stack Web Application', description: 'E-commerce or Learning portal using MERN stack', skills: ['React', 'Node.js', 'MongoDB', 'Express'], duration: '2-3 weeks', githubVisible: true },
        { title: 'REST API with Authentication', description: 'Secure API with JWT auth, CRUD, and role-based access', skills: ['Express.js', 'MongoDB', 'JWT', 'Mongoose'], duration: '1 week', githubVisible: true },
        { title: 'Data Analytics Dashboard', description: 'Visualize data with charts and filters', skills: ['Python', 'Pandas', 'Matplotlib/Chart.js'], duration: '1 week', githubVisible: true }
      ],
      companySpecificTips: [
        { company: 'TCS', cutoff: '60% throughout', focusAreas: ['Aptitude (strong)', 'Basic coding', 'Communication'], process: 'Online test → Technical → HR', avgPackage: '3.5-4 LPA' },
        { company: 'Infosys', cutoff: '60% throughout', focusAreas: ['Aptitude', 'Verbal', 'Pseudocode'], process: 'Online test → HR', avgPackage: '3.6 LPA' },
        { company: 'Wipro', cutoff: '60% throughout', focusAreas: ['Aptitude', 'Coding (1-2 easy)', 'Spoken English'], process: 'Online test → Technical → HR', avgPackage: '3.5-4 LPA' },
        { company: 'Amazon', cutoff: 'No specific %', focusAreas: ['Strong DSA (Medium-Hard)', 'System Design basics', 'Leadership Principles'], process: 'OA → 4-5 rounds', avgPackage: '18-35 LPA' }
      ],
      dailyRoutine: {
        morning: '8-9 AM: 20 aptitude questions (Quantitative + Logical)',
        afternoon: '2-5 PM: 2-3 DSA problems on LeetCode',
        evening: '7-9 PM: Core subject revision (rotate: OOP → DBMS → OS → CN)'
      },
      keyMilestones: [
        `Week ${Math.floor(weeks / 4)}: Complete basic Arrays & Strings DSA`,
        `Week ${Math.floor(weeks / 2)}: 60+ LeetCode problems solved`,
        `Week ${weeks - 2}: Resume finalized with 2+ projects`,
        `Week ${weeks}: 2 full mock interviews completed`
      ]
    };

    return res.status(200).json({ success: true, message: 'Placement roadmap generated', data: { roadmap, preparedFor: { skills, targetCompanies, weeksAvailable: weeks, currentLevel } } });
  } catch (error) {
    console.error('[AI] Placement roadmap error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to generate roadmap.' });
  }
};

module.exports = { generateInterviewQuestions, analyzeResume, getCareerRecommendation, chatWithAI, getPlacementRoadmap };
