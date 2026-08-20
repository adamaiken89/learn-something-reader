import type { SearchResult } from '../../bun/search';
import type { CourseStats, GlobalStats } from '../../bun/stats';
import type {
  Bookmark,
  Course,
  Highlight,
  ModuleMeta,
  Note,
  QuizQuestion,
  Section,
} from '../../bun/types';

const courses: Course[] = [
  {
    id: 'intro-programming',
    course: 'CS101',
    displayName: 'Introduction to Programming',
    timeBudgetHours: 20,
    targetLevel: 'beginner',
    domain: 'Computer Science',
    prerequisites: [],
    learningObjectives: [
      'Understand variables, data types, and control flow',
      'Write functions and use basic data structures',
      'Debug and test simple programs',
    ],
    modules: [
      {
        id: '01-getting-started',
        name: 'Getting Started',
        timeHours: 2,
        prerequisites: [],
        topics: ['setup', 'basics'],
      },
      {
        id: '02-variables',
        name: 'Variables & Types',
        timeHours: 4,
        prerequisites: ['01-getting-started'],
        topics: ['variables', 'types'],
      },
      {
        id: '03-control-flow',
        name: 'Control Flow',
        timeHours: 4,
        prerequisites: ['02-variables'],
        topics: ['if', 'loops'],
      },
      {
        id: '04-functions',
        name: 'Functions',
        timeHours: 5,
        prerequisites: ['03-control-flow'],
        topics: ['functions', 'scope'],
      },
    ],
  },
  {
    id: 'advanced-algorithms',
    course: 'CS301',
    displayName: 'Advanced Algorithms',
    timeBudgetHours: 40,
    targetLevel: 'advanced',
    domain: 'Computer Science',
    prerequisites: ['intro-programming'],
    learningObjectives: [
      'Analyze algorithm complexity using Big-O notation',
      'Implement sorting, searching, and graph algorithms',
      'Apply dynamic programming to optimization problems',
      'Understand NP-completeness and approximation algorithms',
    ],
    modules: [
      {
        id: '01-complexity',
        name: 'Complexity Analysis',
        timeHours: 3,
        prerequisites: [],
        topics: ['big-o', 'asymptotic'],
      },
      {
        id: '02-sorting',
        name: 'Sorting Algorithms',
        timeHours: 5,
        prerequisites: ['01-complexity'],
        topics: ['quicksort', 'mergesort'],
      },
      {
        id: '03-graphs',
        name: 'Graph Algorithms',
        timeHours: 8,
        prerequisites: ['02-sorting'],
        topics: ['bfs', 'dfs', 'dijkstra'],
      },
      {
        id: '04-dp',
        name: 'Dynamic Programming',
        timeHours: 10,
        prerequisites: ['03-graphs'],
        topics: ['memoization', 'tabulation'],
      },
    ],
  },
];

function getModules(courseId: string): ModuleMeta[] {
  const c = courses.find((c) => c.id === courseId);
  return c ? c.modules : [];
}

const LESSON_MARKDOWN = `# Getting Started

Welcome to Introduction to Programming! This section covers the fundamental concepts you need to begin writing code.

## What is Programming?

Programming is the art of instructing a computer to perform tasks by writing instructions in a language the computer can understand. At its core, programming involves breaking down complex problems into small, manageable steps.

Computers execute instructions billions of times per second. They are incredibly fast but also very literal — they do exactly what you tell them, nothing more. This precision is both the power and the challenge of programming.

A simple example:

\`\`\`javascript
console.log("Hello, world!");
\`\`\`

This single line tells the computer to display text on the screen. Every program, no matter how complex, is built from such simple instructions.

## Setting Up Your Environment

Before writing code, you need a development environment. Here are the essential tools:

- **Code editor**: Visual Studio Code is recommended for beginners
- **Runtime**: Node.js for JavaScript, Python interpreter for Python
- **Version control**: Git for tracking changes to your code
- **Terminal**: Command-line interface for running programs

Installation steps:

1. Download Visual Studio Code from code.visualstudio.com
2. Install Node.js from nodejs.org (LTS version recommended)
3. Open your terminal and verify the installation:

\`\`\`bash
node --version
npm --version
\`\`\`

4. Install Git from git-scm.com and configure it:

\`\`\`bash
git --version
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
\`\`\`

With these tools installed, you are ready to start coding. Take time to familiarize yourself with the editor interface — learn keyboard shortcuts, explore the extensions panel, and open the integrated terminal.

## Your First Program

Every programming journey begins with a "Hello, world!" program. Create a new file called \`hello.js\` and add the following code:

\`\`\`javascript
function greet(name) {
  return "Hello, " + name + "!";
}

const message = greet("Programmer");
console.log(message);

const numbers = [1, 2, 3, 4, 5];
console.log("Sum:", numbers.reduce((a, b) => a + b, 0));
\`\`\`

To run this program, navigate to your file's directory in the terminal and type:

\`\`\`bash
node hello.js
\`\`\`

You should see the output:

\`\`\`
Hello, Programmer!
Sum: 15
\`\`\`

Congratulations — you have written and executed your first program! This simple example demonstrates functions, variables, arrays, and method calls.

## Understanding Program Flow

Programs execute from top to bottom, line by line. This is called **sequential execution**. However, you can control the flow using several mechanisms:

### Conditional Execution

\`\`\`javascript
const temperature = 25;

if (temperature > 30) {
  console.log("It is hot outside!");
} else if (temperature > 20) {
  console.log("It is warm outside.");
} else {
  console.log("It is cool outside.");
}
\`\`\`

### Loops

Loops allow you to repeat code multiple times. The two most common are \`for\` and \`while\`:

\`\`\`javascript
// For loop — iterate a known number of times
for (let i = 0; i < 5; i++) {
  console.log("Count:", i);
}

// While loop — iterate while a condition is true
let counter = 0;
while (counter < 5) {
  console.log("Counter:", counter);
  counter++;
}
\`\`\`

### Functions

Functions encapsulate reusable logic. They take inputs (parameters) and return outputs:

\`\`\`javascript
function add(a, b) {
  return a + b;
}

function isEven(number) {
  return number % 2 === 0;
}

console.log(add(3, 4));     // 7
console.log(isEven(10));    // true
console.log(isEven(7));     // false
\`\`\`

Understanding these building blocks is essential. Every complex program is composed of these fundamental patterns: sequence, condition, loop, and function calls.

## Working with Data

Programming revolves around data. Here are the common data types in JavaScript:

| Type | Example | Description |
|------|---------|-------------|
| Number | \`42\`, \`3.14\` | Integer and floating-point values |
| String | \`"hello"\` | Text data enclosed in quotes |
| Boolean | \`true\`, \`false\` | Logical true/false values |
| Array | \`[1, 2, 3]\` | Ordered collection of values |
| Object | \`{name: "Alice"}\` | Key-value pairs |

Variables store data for later use:

\`\`\`javascript
let score = 100;
const playerName = "Alice";
var isGameOver = false;

// Arrays
let fruits = ["apple", "banana", "cherry"];
fruits.push("date");
console.log(fruits.length);  // 4
console.log(fruits[0]);      // "apple"

// Objects
let person = {
  name: "Bob",
  age: 30,
  isStudent: false
};
console.log(person.name);    // "Bob"
\`\`\`

Choosing the right data structure for your problem is a key skill. Arrays are great for ordered lists. Objects work well for structured records. Sets store unique values, and Maps provide key-value pairs with any data type as keys.

In the next section, we will explore how these data structures combine with control flow to build real applications. Practice writing small programs that manipulate data using loops and conditionals. The more you practice, the more natural these concepts become.

## Debugging Techniques

Bugs are inevitable in programming. Learning to debug effectively is as important as learning to write code. Here are essential debugging techniques:

### Console Logging

The simplest debugging technique is adding \`console.log()\` statements to inspect values:

\`\`\`javascript
function calculateTotal(items) {
  console.log("Items received:", items);
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    console.log("Processing item:", items[i]);
    total += items.price;
    console.log("Running total:", total);
  }
  console.log("Final total:", total);
  return total;
}
\`\`\`

### Reading Error Messages

Error messages tell you exactly what went wrong and where. Pay attention to:

1. **Error type**: \`ReferenceError\`, \`TypeError\`, \`SyntaxError\`
2. **Error message**: Description of what failed
3. **Stack trace**: Line numbers showing where the error occurred

\`\`\`
ReferenceError: x is not defined
    at file.js:5:13
    at main (file.js:10:3)
\`\`\`

### Using the Debugger

Modern code editors include built-in debuggers that let you:

- Set breakpoints to pause execution at specific lines
- Step through code line by line
- Inspect variable values at each step
- Watch expressions change over time

Set a breakpoint by clicking in the gutter next to a line number, then run your program in debug mode. The debugger will pause at each breakpoint and show you the current state.

Mastering these debugging techniques will save you countless hours. Every programmer spends more time debugging than writing new code, so invest in learning these skills early.

## Best Practices

Writing code that works is only half the battle. Writing code that is readable, maintainable, and robust is what separates novice programmers from professionals.

### Naming Conventions

Use descriptive names for variables and functions:

\`\`\`javascript
// Bad
let x = 5;
function d(a, b) { return a - b; }

// Good
let itemCount = 5;
function calculateDiscount(price, rate) { return price - (price * rate); }
\`\`\`

### Code Organization

Organize your code logically:

- Group related functions together
- Keep functions small and focused on a single task
- Use comments sparingly — code should be self-documenting
- Follow the DRY principle (Don't Repeat Yourself)

\`\`\`javascript
// Well-organized code
function validateInput(input) {
  return input !== null && input !== undefined && input.length > 0;
}

function formatOutput(result) {
  return "Result: " + result.toFixed(2);
}

function processUserData(data) {
  if (!validateInput(data)) {
    throw new Error("Invalid input");
  }
  const processed = transformData(data);
  return formatOutput(processed);
}
\`\`\`

### Error Handling

Always handle potential errors gracefully:

\`\`\`javascript
function readFile(path) {
  try {
    const content = fs.readFileSync(path, "utf-8");
    return content;
  } catch (error) {
    console.error("Failed to read file:", error.message);
    return null;
  }
}
\`\`\`

### Testing

Write tests for your code to catch regressions early:

\`\`\`javascript
function add(a, b) {
  return a + b;
}

function testAdd() {
  console.assert(add(2, 3) === 5, "2 + 3 should equal 5");
  console.assert(add(-1, 1) === 0, "-1 + 1 should equal 0");
  console.assert(add(0, 0) === 0, "0 + 0 should equal 0");
  console.log("All tests passed!");
}
\`\`\`

Following these practices will make your code easier to understand, debug, and extend. Remember that code is read far more often than it is written — optimize for readability.

This concludes the introduction to programming fundamentals. Practice writing small programs that combine variables, conditionals, loops, and functions. In the next module, we will dive deeper into variables and data types.
`;

const SECTIONS: Section[] = [
  { id: 'getting-started', heading: 'Getting Started', level: 1, parentID: null },
  {
    id: 'what-is-programming',
    heading: 'What is Programming?',
    level: 2,
    parentID: 'getting-started',
  },
  {
    id: 'setting-up-your-environment',
    heading: 'Setting Up Your Environment',
    level: 2,
    parentID: 'getting-started',
  },
  {
    id: 'your-first-program',
    heading: 'Your First Program',
    level: 2,
    parentID: 'getting-started',
  },
  {
    id: 'understanding-program-flow',
    heading: 'Understanding Program Flow',
    level: 2,
    parentID: null,
  },
  {
    id: 'conditional-execution',
    heading: 'Conditional Execution',
    level: 3,
    parentID: 'understanding-program-flow',
  },
  { id: 'loops', heading: 'Loops', level: 3, parentID: 'understanding-program-flow' },
  { id: 'functions', heading: 'Functions', level: 3, parentID: 'understanding-program-flow' },
  { id: 'working-with-data', heading: 'Working with Data', level: 2, parentID: null },
  { id: 'debugging-techniques', heading: 'Debugging Techniques', level: 2, parentID: null },
  { id: 'console-logging', heading: 'Console Logging', level: 3, parentID: 'debugging-techniques' },
  {
    id: 'reading-error-messages',
    heading: 'Reading Error Messages',
    level: 3,
    parentID: 'debugging-techniques',
  },
  {
    id: 'using-the-debugger',
    heading: 'Using the Debugger',
    level: 3,
    parentID: 'debugging-techniques',
  },
  { id: 'best-practices', heading: 'Best Practices', level: 2, parentID: null },
  { id: 'naming-conventions', heading: 'Naming Conventions', level: 3, parentID: 'best-practices' },
  { id: 'code-organization', heading: 'Code Organization', level: 3, parentID: 'best-practices' },
  { id: 'error-handling', heading: 'Error Handling', level: 3, parentID: 'best-practices' },
  { id: 'testing', heading: 'Testing', level: 3, parentID: 'best-practices' },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'What is the correct way to declare a constant variable in JavaScript?',
    options: {
      a: 'let x = 5',
      b: 'const x = 5',
      c: 'var x = 5',
      d: 'int x = 5',
    },
    answer: 'b',
    explanation:
      'The `const` keyword declares a constant variable whose value cannot be reassigned.',
    difficulty: 1,
    tags: ['variables', 'javascript'],
  },
  {
    id: 'q2',
    question: 'Which loop structure guarantees at least one execution of the loop body?',
    options: {
      a: 'for loop',
      b: 'while loop',
      c: 'do-while loop',
      d: 'All of the above',
    },
    answer: 'c',
    explanation:
      'A do-while loop executes the body first, then checks the condition, guaranteeing at least one execution.',
    difficulty: 2,
    tags: ['control-flow', 'loops'],
  },
  {
    id: 'q3',
    question: 'What does the DRY principle stand for?',
    options: {
      a: "Don't Run Yesterday's code",
      b: "Don't Repeat Yourself",
      c: 'Do Return Your variable',
      d: 'Debug Runtime Yields',
    },
    answer: 'b',
    explanation:
      "DRY stands for Don't Repeat Yourself — a principle that promotes code reuse to avoid duplication.",
    difficulty: 1,
    tags: ['best-practices'],
  },
  {
    id: 'q4',
    question: 'What is the time complexity of binary search on a sorted array of n elements?',
    options: {
      a: 'O(n)',
      b: 'O(log n)',
      c: 'O(n log n)',
      d: 'O(n²)',
    },
    answer: 'b',
    explanation:
      'Binary search divides the search space in half each iteration, resulting in O(log n) time complexity.',
    difficulty: 3,
    tags: ['algorithms', 'complexity'],
  },
  {
    id: 'q5',
    question: 'Which data structure uses a Last-In-First-Out (LIFO) principle?',
    options: {
      a: 'Queue',
      b: 'Stack',
      c: 'Array',
      d: 'Tree',
    },
    answer: 'b',
    explanation:
      'A stack follows LIFO — the last element added is the first element removed, like a stack of plates.',
    difficulty: 2,
    tags: ['data-structures'],
  },
];

function getLesson(_courseId: string, _moduleId: string) {
  return {
    content: LESSON_MARKDOWN,
    h1: 'Getting Started',
    meta: [],
    sections: SECTIONS,
    bodyContent: LESSON_MARKDOWN.replace(/^# .*\n+/, ''),
  };
}

function getQuiz(_courseId: string, _moduleId: string): QuizQuestion[] {
  return QUIZ_QUESTIONS;
}

function getSections(_courseId: string, _moduleId: string): Section[] {
  return SECTIONS;
}

function getCourseStats(courseId: string): CourseStats {
  return {
    courseID: courseId,
    totalModules: 4,
    completedModules: 1,
    avgQuizScore: 85,
    quizAttempts: 2,
    srsDueCount: 0,
    srsTotalCards: 0,
    moduleSrsDue: {},
    totalStudyMinutes: 120,
    streak: 3,
    recentSessions: [
      { date: '2026-07-03T10:00:00Z', type: 'reading', durationMinutes: 30 },
      { date: '2026-07-02T14:00:00Z', type: 'quiz', durationMinutes: 15, score: 4, total: 5 },
    ],
  };
}

function getGlobalStats(): GlobalStats {
  return {
    totalCourses: 2,
    totalModules: 8,
    totalCompletedModules: 2,
    totalStudyMinutes: 240,
    streak: 3,
    totalSrsDueCount: 5,
    courseSummaries: [
      {
        courseID: 'intro-programming',
        courseName: 'Introduction to Programming',
        completed: 1,
        total: 4,
        lastStudied: '2026-07-03T10:00:00Z',
        srsDueCount: 3,
        srsTotalCards: 12,
      },
      {
        courseID: 'advanced-algorithms',
        courseName: 'Advanced Algorithms',
        completed: 1,
        total: 4,
        lastStudied: '2026-07-01T09:00:00Z',
        srsDueCount: 2,
        srsTotalCards: 10,
      },
    ],
  };
}

function getSearchResults(): SearchResult[] {
  return [
    {
      type: 'lesson',
      courseID: 'intro-programming',
      courseName: 'Introduction to Programming',
      moduleID: '01-getting-started',
      moduleName: 'Getting Started',
      sectionID: 'what-is-programming',
      sectionTitle: 'What is Programming',
      snippet: 'Programming is the art of instructing a computer to perform tasks',
    },
    {
      type: 'lesson',
      courseID: 'intro-programming',
      courseName: 'Introduction to Programming',
      moduleID: '02-variables',
      moduleName: 'Variables & Types',
      sectionID: undefined,
      sectionTitle: undefined,
      snippet: 'Variables store data for later use in your programs',
    },
  ];
}

function getMockHighlight(): Highlight {
  return {
    id: 'mock-highlight-1',
    courseID: 'intro-programming',
    moduleID: '01-getting-started',
    selectedText: 'Programming is the art of instructing a computer',
    startOffset: 100,
    endOffset: 150,
    color: '#FFD700',
    createdAt: new Date().toISOString(),
  };
}

function getMockBookmark(): Bookmark {
  return {
    id: 'mock-bookmark-1',
    courseID: 'intro-programming',
    moduleID: '01-getting-started',
    sectionID: 'what-is-programming',
    title: 'Programming Definition',
    scrollPosition: 500,
    createdAt: new Date().toISOString(),
  };
}

function getMockNote(): Note {
  return {
    id: 'mock-note-1',
    courseID: 'intro-programming',
    moduleID: '01-getting-started',
    highlightID: null,
    sectionID: 'what-is-programming',
    content: 'Review this section — important foundational concept.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export {
  courses,
  getModules,
  getLesson,
  getQuiz,
  getSections,
  getCourseStats,
  getGlobalStats,
  getSearchResults,
  getMockHighlight,
  getMockBookmark,
  getMockNote,
};
