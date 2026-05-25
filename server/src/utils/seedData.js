/**
 * ============================================================================
 * SEED DATA SCRIPT - Smart Learning & Placement Preparation Portal
 * ============================================================================
 * Run: npm run seed  OR  node src/utils/seedData.js
 * Creates demo users, courses, tests, results, notifications, analytics
 * ============================================================================
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Course = require('../models/Course');
const Test = require('../models/Test');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const Analytics = require('../models/Analytics');
const ActivityLog = require('../models/ActivityLog');

// ─── USERS ──────────────────────────────────────────────────────────────────
const users = [
  { name: 'Admin User', email: 'admin@smartlearn.com', password: 'admin123', role: 'admin', phone: '9876543210', university: 'Chandigarh University', department: 'MCA', semester: 4, skills: ['Node.js', 'React', 'MongoDB', 'Python'], bio: 'Platform administrator.' },
  { name: 'Rahul Sharma', email: 'rahul@student.com', password: 'student123', role: 'student', phone: '9876543211', university: 'Chandigarh University', department: 'MCA', semester: 3, skills: ['JavaScript', 'React', 'HTML', 'CSS'], bio: 'MCA student passionate about web development.' },
  { name: 'Priya Patel', email: 'priya@student.com', password: 'student123', role: 'student', phone: '9876543212', university: 'Chandigarh University', department: 'MCA', semester: 3, skills: ['Python', 'Data Science', 'SQL'], bio: 'Aspiring data scientist.' },
  { name: 'Amit Kumar', email: 'amit@student.com', password: 'student123', role: 'student', phone: '9876543213', university: 'Chandigarh University', department: 'MCA', semester: 4, skills: ['Java', 'Spring Boot', 'MySQL'], bio: 'Backend developer focused on Java.' },
  { name: 'Sneha Singh', email: 'sneha@student.com', password: 'student123', role: 'student', phone: '9876543214', university: 'Chandigarh University', department: 'MCA', semester: 2, skills: ['Python', 'Flask', 'ML'], bio: 'AI enthusiast.' },
  { name: 'Vikram Mehra', email: 'vikram@student.com', password: 'student123', role: 'student', phone: '9876543215', university: 'Chandigarh University', department: 'MCA', semester: 5, skills: ['Cloud', 'AWS', 'DevOps'], bio: 'Cloud computing professional.' },
  { name: 'Anjali Gupta', email: 'anjali@student.com', password: 'student123', role: 'student', phone: '9876543216', university: 'Chandigarh University', department: 'MCA', semester: 3, skills: ['React', 'Node.js', 'MongoDB'], bio: 'Full-stack developer.' },
  { name: 'Rohan Verma', email: 'rohan@student.com', password: 'student123', role: 'student', phone: '9876543217', university: 'Chandigarh University', department: 'MCA', semester: 4, skills: ['DSA', 'C++', 'Competitive Programming'], bio: 'Competitive programmer.' },
  { name: 'Kavya Reddy', email: 'kavya@student.com', password: 'student123', role: 'student', phone: '9876543218', university: 'Chandigarh University', department: 'MCA', semester: 2, skills: ['SQL', 'Database Design'], bio: 'Database specialist.' },
  { name: 'Arjun Nair', email: 'arjun@student.com', password: 'student123', role: 'student', phone: '9876543219', university: 'Chandigarh University', department: 'MCA', semester: 5, skills: ['Android', 'Flutter', 'React Native'], bio: 'Mobile app developer.' },
  { name: 'Deepika Joshi', email: 'deepika@student.com', password: 'student123', role: 'student', phone: '9876543220', university: 'Chandigarh University', department: 'MCA', semester: 6, skills: ['System Design', 'Architecture'], bio: 'Software architect aspirant.' },
];

// ─── COURSES ─────────────────────────────────────────────────────────────────
const courses = [
  {
    title: 'Complete JavaScript Mastery',
    description: 'Master JavaScript from basics to advanced concepts including ES6+, async/await, closures, prototypes, and modern JavaScript patterns used in industry.',
    category: 'programming',
    instructor: 'Dr. Rajesh Kumar',
    duration: 40,
    level: 'beginner',
    tags: ['javascript', 'es6', 'web'],
    rating: 4.8,
    totalRatings: 245,
    modules: [
      { title: 'JavaScript Fundamentals', description: 'Variables, data types, operators', videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', duration: 120, order: 1 },
      { title: 'Functions & Scope', description: 'Function declarations, closures, scope chain', videoUrl: 'https://www.youtube.com/watch?v=jS4aFq5-91M', duration: 150, order: 2 },
      { title: 'ES6+ Features', description: 'Arrow functions, destructuring, spread operator', videoUrl: 'https://www.youtube.com/watch?v=NCwa_xi0Uuc', duration: 180, order: 3 },
      { title: 'Async JavaScript', description: 'Promises, async/await, fetch API', videoUrl: 'https://www.youtube.com/watch?v=PoRJizFvM7s', duration: 200, order: 4 },
    ],
    isPublished: true,
  },
  {
    title: 'React.js Complete Guide',
    description: 'Build modern web applications with React 18. Covers hooks, context, Redux, React Router, and real-world project building.',
    category: 'web-dev',
    instructor: 'Prof. Anita Sharma',
    duration: 50,
    level: 'intermediate',
    tags: ['react', 'frontend', 'hooks'],
    rating: 4.9,
    totalRatings: 312,
    modules: [
      { title: 'React Basics', description: 'JSX, components, props, state', videoUrl: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8', duration: 150, order: 1 },
      { title: 'React Hooks', description: 'useState, useEffect, custom hooks', videoUrl: 'https://www.youtube.com/watch?v=TNhaISOUy6Q', duration: 180, order: 2 },
      { title: 'State Management', description: 'Context API and Redux Toolkit', videoUrl: 'https://www.youtube.com/watch?v=5yEG6GhoJBs', duration: 200, order: 3 },
    ],
    isPublished: true,
  },
  {
    title: 'Data Structures & Algorithms',
    description: 'Master DSA for technical interviews at FAANG companies. Covers arrays, linked lists, trees, graphs, dynamic programming, and more.',
    category: 'dsa',
    instructor: 'Dr. Pradeep Gupta',
    duration: 60,
    level: 'intermediate',
    tags: ['dsa', 'algorithms', 'interview'],
    rating: 4.7,
    totalRatings: 428,
    modules: [
      { title: 'Arrays & Strings', description: 'Array operations, two pointers, sliding window', videoUrl: 'https://www.youtube.com/watch?v=RBSGKlAvoiM', duration: 180, order: 1 },
      { title: 'Linked Lists', description: 'Singly, doubly linked lists, operations', videoUrl: 'https://www.youtube.com/watch?v=WwfhLC16bis', duration: 150, order: 2 },
      { title: 'Trees & Graphs', description: 'Binary trees, BST, BFS, DFS', videoUrl: 'https://www.youtube.com/watch?v=fAAZixBzIAI', duration: 240, order: 3 },
      { title: 'Dynamic Programming', description: 'Memoization, tabulation, classic problems', videoUrl: 'https://www.youtube.com/watch?v=oBt53YbR9Kk', duration: 300, order: 4 },
    ],
    isPublished: true,
  },
  {
    title: 'Node.js & Express Backend',
    description: 'Build scalable REST APIs with Node.js, Express, MongoDB. Authentication, authorization, file uploads, and deployment.',
    category: 'web-dev',
    instructor: 'Arun Patel',
    duration: 45,
    level: 'intermediate',
    tags: ['nodejs', 'express', 'backend', 'api'],
    rating: 4.6,
    totalRatings: 189,
    modules: [
      { title: 'Node.js Core', description: 'Modules, events, file system', videoUrl: 'https://www.youtube.com/watch?v=TlB_eWDSMt4', duration: 160, order: 1 },
      { title: 'Express Framework', description: 'Routing, middleware, error handling', videoUrl: 'https://www.youtube.com/watch?v=L72fhGm1tfE', duration: 180, order: 2 },
      { title: 'REST API Design', description: 'CRUD, authentication, JWT', videoUrl: 'https://www.youtube.com/watch?v=pKd0Rpw7O48', duration: 200, order: 3 },
    ],
    isPublished: true,
  },
  {
    title: 'Python for Data Science',
    description: 'Learn Python, NumPy, Pandas, Matplotlib, and Scikit-learn for data analysis and machine learning. Hands-on projects included.',
    category: 'ai-ml',
    instructor: 'Dr. Meera Krishnan',
    duration: 55,
    level: 'beginner',
    tags: ['python', 'data-science', 'pandas', 'numpy'],
    rating: 4.8,
    totalRatings: 356,
    modules: [
      { title: 'Python Basics', description: 'Syntax, data types, control flow', videoUrl: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', duration: 200, order: 1 },
      { title: 'NumPy & Pandas', description: 'Arrays, DataFrames, data manipulation', videoUrl: 'https://www.youtube.com/watch?v=vmEHCJofslg', duration: 240, order: 2 },
      { title: 'Data Visualization', description: 'Matplotlib, Seaborn charts', videoUrl: 'https://www.youtube.com/watch?v=a9UrKTVEeZA', duration: 180, order: 3 },
    ],
    isPublished: true,
  },
  {
    title: 'Database Design with MySQL',
    description: 'Master relational databases, SQL queries, normalization, indexing, transactions and stored procedures for enterprise applications.',
    category: 'database',
    instructor: 'Prof. Suresh Verma',
    duration: 35,
    level: 'beginner',
    tags: ['sql', 'mysql', 'database'],
    rating: 4.5,
    totalRatings: 201,
    modules: [
      { title: 'SQL Basics', description: 'SELECT, INSERT, UPDATE, DELETE', videoUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', duration: 180, order: 1 },
      { title: 'Joins & Subqueries', description: 'INNER, LEFT, RIGHT joins, subqueries', videoUrl: 'https://www.youtube.com/watch?v=9yeOJ0ZMUYw', duration: 200, order: 2 },
      { title: 'Database Design', description: 'Normalization, ER diagrams, constraints', videoUrl: 'https://www.youtube.com/watch?v=-WEpWH1NHGU', duration: 160, order: 3 },
    ],
    isPublished: true,
  },
  {
    title: 'Machine Learning Fundamentals',
    description: 'Understand core ML algorithms: regression, classification, clustering, neural networks. Build real-world ML models from scratch.',
    category: 'ai-ml',
    instructor: 'Dr. Rakesh Singh',
    duration: 65,
    level: 'intermediate',
    tags: ['ml', 'ai', 'scikit-learn'],
    rating: 4.7,
    totalRatings: 278,
    modules: [
      { title: 'Supervised Learning', description: 'Linear regression, logistic regression, SVM', videoUrl: 'https://www.youtube.com/watch?v=NWONeJKn6kc', duration: 250, order: 1 },
      { title: 'Unsupervised Learning', description: 'K-means clustering, PCA', videoUrl: 'https://www.youtube.com/watch?v=IUn8k5zSI6g', duration: 200, order: 2 },
      { title: 'Neural Networks', description: 'Perceptron, backpropagation, deep learning basics', videoUrl: 'https://www.youtube.com/watch?v=aircAruvnKk', duration: 300, order: 3 },
    ],
    isPublished: true,
  },
  {
    title: 'Aptitude & Logical Reasoning',
    description: 'Crack placement aptitude tests with this comprehensive guide covering quantitative aptitude, logical reasoning, verbal ability, and puzzles.',
    category: 'aptitude',
    instructor: 'Kiran Mathur',
    duration: 30,
    level: 'beginner',
    tags: ['aptitude', 'placement', 'reasoning'],
    rating: 4.6,
    totalRatings: 534,
    modules: [
      { title: 'Quantitative Aptitude', description: 'Numbers, percentages, ratios, time & work', videoUrl: 'https://www.youtube.com/watch?v=RzluMSBZ5o4', duration: 240, order: 1 },
      { title: 'Logical Reasoning', description: 'Syllogisms, blood relations, puzzles', videoUrl: 'https://www.youtube.com/watch?v=1oFPMb5Xqss', duration: 180, order: 2 },
    ],
    isPublished: true,
  },
];

// ─── TESTS ───────────────────────────────────────────────────────────────────
const tests = [
  {
    title: 'JavaScript Fundamentals Quiz',
    description: 'Test your JavaScript knowledge covering variables, functions, closures, and ES6+ features.',
    category: 'javascript',
    type: 'quiz',
    duration: 30,
    totalMarks: 20,
    passingMarks: 12,
    questions: [
      { question: 'What is the output of typeof null in JavaScript?', options: ['null', 'undefined', 'object', 'string'], correctAnswer: 2, explanation: 'typeof null returns "object" — this is a historical bug in JavaScript.', difficulty: 'easy', marks: 2 },
      { question: 'Which method is used to add an element at the end of an array?', options: ['push()', 'pop()', 'shift()', 'unshift()'], correctAnswer: 0, explanation: 'push() adds elements to the end of an array.', difficulty: 'easy', marks: 2 },
      { question: 'What does the "===" operator check?', options: ['Value only', 'Type only', 'Both value and type', 'Neither'], correctAnswer: 2, explanation: '=== is the strict equality operator that checks both value and type.', difficulty: 'easy', marks: 2 },
      { question: 'What is a closure in JavaScript?', options: ['A function with no parameters', 'A function that has access to variables from its outer scope', 'A way to close browser tabs', 'An error handling mechanism'], correctAnswer: 1, explanation: 'A closure is a function that remembers variables from its outer lexical scope even when executed outside that scope.', difficulty: 'medium', marks: 2 },
      { question: 'Which of the following is NOT a JavaScript data type?', options: ['Boolean', 'Float', 'Symbol', 'BigInt'], correctAnswer: 1, explanation: 'Float is not a JavaScript data type. JavaScript has Number for all numeric values.', difficulty: 'medium', marks: 2 },
      { question: 'What is the purpose of the "async" keyword?', options: ['Makes the function run faster', 'Makes the function return a Promise', 'Blocks the event loop', 'Creates a web worker'], correctAnswer: 1, explanation: 'The async keyword makes a function return a Promise automatically.', difficulty: 'medium', marks: 2 },
      { question: 'What does Array.prototype.map() return?', options: ['The original array', 'A new array with transformed elements', 'undefined', 'An object'], correctAnswer: 1, explanation: 'map() creates a new array with the results of calling a function on every element.', difficulty: 'easy', marks: 2 },
      { question: 'What is event delegation?', options: ['Assigning events to child elements', 'Handling events on a parent element for its children', 'Creating custom events', 'Removing event listeners'], correctAnswer: 1, explanation: 'Event delegation is a technique to handle events on a parent element using bubbling.', difficulty: 'hard', marks: 2 },
      { question: 'What is the difference between let and var?', options: ['No difference', 'let is block-scoped, var is function-scoped', 'var is block-scoped, let is function-scoped', 'let cannot be reassigned'], correctAnswer: 1, explanation: 'let is block-scoped while var is function-scoped. let also prevents hoisting issues.', difficulty: 'medium', marks: 2 },
      { question: 'Which method converts a JSON string to a JavaScript object?', options: ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.decode()'], correctAnswer: 1, explanation: 'JSON.parse() converts a JSON string to a JavaScript object.', difficulty: 'easy', marks: 2 },
    ],
    isPublished: true,
  },
  {
    title: 'DSA Mock Test - Arrays & Strings',
    description: 'Practice data structures and algorithms problems covering arrays, strings, and basic problem-solving patterns.',
    category: 'dsa',
    type: 'mock-test',
    duration: 45,
    totalMarks: 30,
    passingMarks: 18,
    questions: [
      { question: 'What is the time complexity of accessing an element in an array by index?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correctAnswer: 2, explanation: 'Array access by index is O(1) — constant time, as the memory address can be computed directly.', difficulty: 'easy', marks: 3 },
      { question: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], correctAnswer: 2, explanation: 'Merge Sort has O(n log n) average-case complexity, which is optimal for comparison-based sorting.', difficulty: 'medium', marks: 3 },
      { question: 'What data structure uses LIFO (Last In, First Out)?', options: ['Queue', 'Stack', 'Linked List', 'Tree'], correctAnswer: 1, explanation: 'A Stack uses LIFO — the last element pushed is the first to be popped.', difficulty: 'easy', marks: 3 },
      { question: 'What is the time complexity of Binary Search?', options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctAnswer: 2, explanation: 'Binary Search divides the search space in half each time, resulting in O(log n) time.', difficulty: 'easy', marks: 3 },
      { question: 'Which data structure is used for BFS traversal of a graph?', options: ['Stack', 'Queue', 'Heap', 'Array'], correctAnswer: 1, explanation: 'BFS uses a Queue (FIFO) to explore nodes level by level.', difficulty: 'medium', marks: 3 },
      { question: 'What is the space complexity of Quick Sort in the worst case?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 2, explanation: 'Quick Sort uses O(n) space in the worst case due to the recursive call stack.', difficulty: 'hard', marks: 3 },
      { question: 'Which algorithm is used to find the shortest path in an unweighted graph?', options: ['DFS', 'BFS', 'Dijkstra', 'Bellman-Ford'], correctAnswer: 1, explanation: 'BFS finds the shortest path in an unweighted graph by exploring nodes level by level.', difficulty: 'medium', marks: 3 },
      { question: 'What is a hash collision?', options: ['When two different keys produce the same hash value', 'When a hash table is full', 'When deletion fails', 'When lookup fails'], correctAnswer: 0, explanation: 'A hash collision occurs when two different keys map to the same hash value/bucket.', difficulty: 'medium', marks: 3 },
      { question: 'Which tree traversal visits the root node last?', options: ['Preorder', 'Inorder', 'Postorder', 'Level order'], correctAnswer: 2, explanation: 'Postorder traversal visits: Left, Right, Root — root is last.', difficulty: 'easy', marks: 3 },
      { question: 'What is dynamic programming?', options: ['Programming using dynamic variables', 'Breaking problems into subproblems and storing results', 'Using dynamic memory allocation', 'Runtime code modification'], correctAnswer: 1, explanation: 'Dynamic Programming breaks problems into overlapping subproblems and stores results to avoid recomputation (memoization/tabulation).', difficulty: 'medium', marks: 3 },
    ],
    isPublished: true,
  },
  {
    title: 'Python Programming Quiz',
    description: 'Test your Python knowledge from basics to intermediate concepts including OOP, decorators, generators, and common libraries.',
    category: 'python',
    type: 'quiz',
    duration: 25,
    totalMarks: 20,
    passingMarks: 12,
    questions: [
      { question: 'What is the output of print(type([]))?', options: ["<class 'tuple'>", "<class 'list'>", "<class 'dict'>", "<class 'set'>"], correctAnswer: 1, explanation: '[] creates an empty list, so type([]) is <class list>.', difficulty: 'easy', marks: 2 },
      { question: 'Which keyword is used to define a generator function?', options: ['return', 'yield', 'generate', 'async'], correctAnswer: 1, explanation: 'yield is used in generator functions to yield values one at a time.', difficulty: 'medium', marks: 2 },
      { question: 'What does the __init__ method do in Python?', options: ['Initializes class variables', 'Deletes an object', 'Creates a class', 'Imports modules'], correctAnswer: 0, explanation: '__init__ is the constructor method called when an object is created to initialize its attributes.', difficulty: 'easy', marks: 2 },
      { question: 'What is list comprehension?', options: ['A way to loop through lists', 'A concise way to create lists based on existing iterables', 'A method to sort lists', 'A way to merge lists'], correctAnswer: 1, explanation: 'List comprehension provides a concise way to create lists: [expr for item in iterable if condition].', difficulty: 'medium', marks: 2 },
      { question: 'Which Python library is used for data manipulation?', options: ['NumPy', 'Matplotlib', 'Pandas', 'Seaborn'], correctAnswer: 2, explanation: 'Pandas is the primary library for data manipulation with DataFrames and Series.', difficulty: 'easy', marks: 2 },
      { question: 'What is a decorator in Python?', options: ['A design pattern', 'A function that wraps another function to extend its behavior', 'A way to style code', 'A type of class'], correctAnswer: 1, explanation: 'A decorator is a function that takes another function as input and extends its behavior without modifying it.', difficulty: 'hard', marks: 2 },
      { question: 'What does * args in a function definition mean?', options: ['Exactly one argument', 'Variable number of positional arguments', 'Keyword arguments only', 'No arguments allowed'], correctAnswer: 1, explanation: '*args allows a function to accept any number of positional arguments as a tuple.', difficulty: 'medium', marks: 2 },
      { question: 'What is the difference between a tuple and a list in Python?', options: ['Tuples are faster to iterate', 'Tuples are immutable, lists are mutable', 'Lists can have mixed types, tuples cannot', 'No difference'], correctAnswer: 1, explanation: 'Tuples are immutable (cannot be changed after creation) while lists are mutable.', difficulty: 'easy', marks: 2 },
      { question: 'Which method is used to remove whitespace from the beginning and end of a string?', options: ['trim()', 'strip()', 'clean()', 'remove()'], correctAnswer: 1, explanation: 'strip() removes leading and trailing whitespace from a string.', difficulty: 'easy', marks: 2 },
      { question: 'What is a lambda function?', options: ['A named function', 'An anonymous single-expression function', 'A class method', 'An async function'], correctAnswer: 1, explanation: 'Lambda functions are anonymous functions defined with the lambda keyword for single expressions.', difficulty: 'medium', marks: 2 },
    ],
    isPublished: true,
  },
  {
    title: 'SQL Database Quiz',
    description: 'Test your knowledge of SQL queries, joins, normalization, and database concepts essential for technical interviews.',
    category: 'database',
    type: 'quiz',
    duration: 30,
    totalMarks: 20,
    passingMarks: 12,
    questions: [
      { question: 'Which SQL clause is used to filter records?', options: ['ORDER BY', 'GROUP BY', 'WHERE', 'HAVING'], correctAnswer: 2, explanation: 'WHERE is used to filter rows based on conditions before grouping.', difficulty: 'easy', marks: 2 },
      { question: 'What does INNER JOIN do?', options: ['Returns all rows from both tables', 'Returns only matching rows from both tables', 'Returns all rows from left table', 'Returns all rows from right table'], correctAnswer: 1, explanation: 'INNER JOIN returns only the rows that have matching values in both tables.', difficulty: 'easy', marks: 2 },
      { question: 'What is the purpose of PRIMARY KEY?', options: ['To link two tables', 'To uniquely identify each row in a table', 'To index the table', 'To store null values'], correctAnswer: 1, explanation: 'PRIMARY KEY uniquely identifies each record in a database table.', difficulty: 'easy', marks: 2 },
      { question: 'What does GROUP BY do in SQL?', options: ['Sorts data', 'Filters data', 'Groups rows with same values into summary rows', 'Joins tables'], correctAnswer: 2, explanation: 'GROUP BY groups rows that have the same values in specified columns into aggregate rows.', difficulty: 'medium', marks: 2 },
      { question: 'What is FOREIGN KEY?', options: ['A key from another country', 'A key that references PRIMARY KEY of another table', 'An encrypted key', 'A backup key'], correctAnswer: 1, explanation: 'FOREIGN KEY creates a referential link between two tables by referencing the PRIMARY KEY of another table.', difficulty: 'medium', marks: 2 },
      { question: 'What is the difference between CHAR and VARCHAR?', options: ['No difference', 'CHAR is fixed-length, VARCHAR is variable-length', 'VARCHAR is fixed-length, CHAR is variable-length', 'CHAR is for numbers'], correctAnswer: 1, explanation: 'CHAR stores fixed-length strings (padded with spaces), VARCHAR stores variable-length strings.', difficulty: 'medium', marks: 2 },
      { question: 'Which aggregate function counts non-NULL values?', options: ['SUM()', 'AVG()', 'COUNT()', 'MAX()'], correctAnswer: 2, explanation: 'COUNT(column) counts non-NULL values in the column. COUNT(*) counts all rows.', difficulty: 'easy', marks: 2 },
      { question: 'What is normalization in databases?', options: ['Speeding up queries', 'Organizing data to reduce redundancy', 'Adding indexes', 'Encrypting data'], correctAnswer: 1, explanation: 'Normalization is the process of organizing a database to reduce data redundancy and improve data integrity.', difficulty: 'medium', marks: 2 },
      { question: 'What is an INDEX in SQL?', options: ['A row number', 'A data structure for faster data retrieval', 'A foreign key', 'A table alias'], correctAnswer: 1, explanation: 'An INDEX creates a data structure that improves the speed of data retrieval operations.', difficulty: 'medium', marks: 2 },
      { question: 'What does the HAVING clause do?', options: ['Filters rows before grouping', 'Filters grouped results', 'Joins tables', 'Sorts results'], correctAnswer: 1, explanation: 'HAVING filters groups created by GROUP BY, similar to WHERE but for aggregated data.', difficulty: 'hard', marks: 2 },
    ],
    isPublished: true,
  },
  {
    title: 'Aptitude Test - Quantitative',
    description: 'Practice quantitative aptitude questions for placement exams: percentages, ratios, time-work, profit-loss, and more.',
    category: 'aptitude',
    type: 'mock-test',
    duration: 40,
    totalMarks: 25,
    passingMarks: 15,
    questions: [
      { question: 'If 20% of a number is 50, what is the number?', options: ['200', '250', '150', '300'], correctAnswer: 1, explanation: '20% of x = 50 → x = 50/0.20 = 250', difficulty: 'easy', marks: 2 },
      { question: 'A train 200m long travels at 60 km/h. How long does it take to pass a pole?', options: ['10 sec', '12 sec', '15 sec', '8 sec'], correctAnswer: 1, explanation: 'Speed = 60 km/h = 50/3 m/s. Time = 200 / (50/3) = 12 seconds.', difficulty: 'medium', marks: 3 },
      { question: 'If A can do a work in 10 days and B in 15 days, how many days to do it together?', options: ['5 days', '6 days', '7 days', '8 days'], correctAnswer: 1, explanation: 'Combined rate = 1/10 + 1/15 = 5/30 = 1/6. Together: 6 days.', difficulty: 'medium', marks: 3 },
      { question: 'A shopkeeper sells an item at 20% profit. If cost is Rs. 500, what is selling price?', options: ['Rs. 550', 'Rs. 600', 'Rs. 650', 'Rs. 700'], correctAnswer: 1, explanation: 'SP = CP × (1 + profit%) = 500 × 1.20 = Rs. 600', difficulty: 'easy', marks: 2 },
      { question: 'What is the simple interest on Rs. 2000 at 5% p.a. for 3 years?', options: ['Rs. 200', 'Rs. 250', 'Rs. 300', 'Rs. 350'], correctAnswer: 2, explanation: 'SI = P × R × T / 100 = 2000 × 5 × 3 / 100 = Rs. 300', difficulty: 'easy', marks: 2 },
      { question: 'Find the LCM of 12 and 18.', options: ['36', '48', '24', '54'], correctAnswer: 0, explanation: 'LCM(12, 18): 12 = 2²×3, 18 = 2×3². LCM = 2²×3² = 36', difficulty: 'easy', marks: 2 },
      { question: 'If the ratio of A:B = 3:4 and B:C = 2:3, find A:C.', options: ['1:2', '3:6', '1:2', '6:12'], correctAnswer: 0, explanation: 'A:B = 3:4, B:C = 2:3. Multiply: A:B:C = 6:8:12 = 3:4:6. A:C = 1:2', difficulty: 'hard', marks: 3 },
      { question: 'A man walks 3km in 1 hour. How far does he walk in 2.5 hours?', options: ['6km', '7.5km', '8km', '5km'], correctAnswer: 1, explanation: 'Speed = 3 km/h. Distance = 3 × 2.5 = 7.5 km', difficulty: 'easy', marks: 2 },
      { question: 'What is 15% of 80?', options: ['10', '12', '14', '16'], correctAnswer: 1, explanation: '15% of 80 = 0.15 × 80 = 12', difficulty: 'easy', marks: 2 },
      { question: 'If P is 25% more than Q, by what percentage is Q less than P?', options: ['20%', '25%', '15%', '30%'], correctAnswer: 0, explanation: 'P = 1.25Q. Q is less than P by (P-Q)/P × 100 = 0.25/1.25 × 100 = 20%', difficulty: 'medium', marks: 4 },
    ],
    isPublished: true,
  },
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
const notificationTemplates = [
  { title: 'Welcome to SmartLearn! 🎉', message: 'Your journey to placement success starts here. Explore courses and take mock tests.', type: 'success' },
  { title: 'New Course Available', message: 'Data Structures & Algorithms course has been updated with new content.', type: 'info' },
  { title: 'Test Reminder', message: 'You have not completed the JavaScript Fundamentals quiz yet. Complete it today!', type: 'warning' },
  { title: 'Achievement Unlocked!', message: 'You scored above 80% in the DSA test. Keep up the excellent work!', type: 'success' },
  { title: 'Placement Alert', message: 'TCS campus drive registration is open. Check placement recommendations.', type: 'alert' },
];

// ─── MAIN SEED FUNCTION ───────────────────────────────────────────────────────
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Test.deleteMany({}),
      Result.deleteMany({}),
      Notification.deleteMany({}),
      Analytics.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    // Seed Users (passwords will be hashed by model pre-save hook)
    console.log('👤 Seeding users...');
    const createdUsers = await User.create(users);
    const adminUser = createdUsers[0];
    const studentUsers = createdUsers.slice(1);
    console.log(`   ✅ Created ${createdUsers.length} users`);

    // Seed Courses
    console.log('📚 Seeding courses...');
    const coursesWithMeta = courses.map(course => ({
      ...course,
      createdBy: adminUser._id,
      enrolledStudents: studentUsers.slice(0, Math.floor(Math.random() * 6) + 3).map(u => u._id),
    }));
    const createdCourses = await Course.create(coursesWithMeta);
    console.log(`   ✅ Created ${createdCourses.length} courses`);

    // Seed Tests
    console.log('📝 Seeding tests...');
    const testsWithMeta = tests.map(test => ({ ...test, createdBy: adminUser._id }));
    const createdTests = await Test.create(testsWithMeta);
    console.log(`   ✅ Created ${createdTests.length} tests`);

    // Seed Results
    console.log('📊 Seeding results...');
    const results = [];
    for (const student of studentUsers.slice(0, 6)) {
      for (const test of createdTests.slice(0, 4)) {
        const answers = test.questions.map((q, index) => {
          const isCorrect = Math.random() > 0.35;
          return {
            questionIndex: index,
            selectedAnswer: isCorrect ? q.correctAnswer : (q.correctAnswer + 1) % 4,
            isCorrect,
          };
        });
        const score = answers.reduce((sum, a, idx) => sum + (a.isCorrect ? test.questions[idx].marks : 0), 0);
        results.push({
          user: student._id,
          test: test._id,
          answers,
          score,
          totalMarks: test.totalMarks,
          percentage: Math.round((score / test.totalMarks) * 100),
          timeTaken: Math.floor(Math.random() * 1200) + 300,
          submittedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
      }
    }
    await Result.create(results);
    console.log(`   ✅ Created ${results.length} results`);

    // Seed Notifications
    console.log('🔔 Seeding notifications...');
    const notifications = [];
    for (const student of studentUsers) {
      for (const tmpl of notificationTemplates) {
        notifications.push({
          user: student._id,
          ...tmpl,
          isRead: Math.random() > 0.5,
          createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        });
      }
    }
    await Notification.create(notifications);
    console.log(`   ✅ Created ${notifications.length} notifications`);

    // Seed Analytics
    console.log('📈 Seeding analytics...');
    const analyticsData = [];
    for (const student of studentUsers.slice(0, 5)) {
      for (let i = 0; i < 30; i++) {
        analyticsData.push({
          user: student._id,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          testsCompleted: Math.floor(Math.random() * 3),
          averageScore: Math.floor(Math.random() * 35) + 60,
          coursesProgress: createdCourses.slice(0, 3).map(c => ({
            course: c._id,
            progress: Math.min(100, Math.floor(Math.random() * 30) + Math.max(0, (30 - i) * 2)),
          })),
          timeSpent: Math.floor(Math.random() * 90) + 30,
          streakDays: Math.max(0, 15 - i),
          strongTopics: ['JavaScript', 'React', 'SQL'].slice(0, Math.floor(Math.random() * 3) + 1),
          weakTopics: ['DSA', 'System Design'].slice(0, Math.floor(Math.random() * 2) + 1),
        });
      }
    }
    await Analytics.create(analyticsData);
    console.log(`   ✅ Created ${analyticsData.length} analytics records`);

    // Seed Activity Logs
    console.log('📋 Seeding activity logs...');
    const actions = ['LOGIN', 'VIEW_COURSE', 'START_TEST', 'SUBMIT_TEST', 'VIEW_RESULTS', 'UPDATE_PROFILE', 'ENROLL_COURSE', 'AI_INTERVIEW', 'AI_RESUME'];
    const activityLogs = [];
    for (const user of createdUsers) {
      for (let i = 0; i < 5; i++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        activityLogs.push({
          user: user._id,
          action,
          details: `User performed ${action.toLowerCase().replace(/_/g, ' ')} action`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
      }
    }
    await ActivityLog.create(activityLogs);
    console.log(`   ✅ Created ${activityLogs.length} activity logs`);

    console.log('\n🎉 ============================================');
    console.log('   DATABASE SEEDED SUCCESSFULLY!');
    console.log('   ============================================');
    console.log(`   👤 Users: ${createdUsers.length} (1 admin + ${studentUsers.length} students)`);
    console.log(`   📚 Courses: ${createdCourses.length}`);
    console.log(`   📝 Tests: ${createdTests.length}`);
    console.log(`   📊 Results: ${results.length}`);
    console.log(`   🔔 Notifications: ${notifications.length}`);
    console.log(`   📈 Analytics: ${analyticsData.length}`);
    console.log(`   📋 Activity Logs: ${activityLogs.length}`);
    console.log('\n   ─── LOGIN CREDENTIALS ───');
    console.log('   👑 Admin:   admin@smartlearn.com / admin123');
    console.log('   👤 Student: rahul@student.com / student123');
    console.log('   ============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();
