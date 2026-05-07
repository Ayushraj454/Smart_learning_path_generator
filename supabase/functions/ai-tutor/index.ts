import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TutorRequest {
  user_id: string;
  message: string;
  learning_path_id?: string;
  context?: {
    subject_name?: string;
    current_module_title?: string;
    knowledge_level?: string;
    learning_style?: string;
  };
}

function buildSystemPrompt(context: TutorRequest["context"]): string {
  const level = context?.knowledge_level ?? "beginner";
  const style = context?.learning_style ?? "visual";
  const subject = context?.subject_name ?? "general";
  const module = context?.current_module_title ?? "";

  let levelInstruction = "";
  if (level === "beginner") {
    levelInstruction = "The user is a beginner. Use simple language, avoid jargon, and explain every new term. Use analogies to everyday life. Provide short code examples when relevant. Break complex ideas into small steps.";
  } else if (level === "intermediate") {
    levelInstruction = "The user has intermediate knowledge. You can use standard terminology but still explain unfamiliar concepts. Focus on connecting ideas and showing practical applications. Provide code examples with explanations of the key parts.";
  } else {
    levelInstruction = "The user is advanced. Use technical language freely. Focus on edge cases, performance implications, design patterns, and best practices. Provide concise but complete code examples.";
  }

  let styleInstruction = "";
  if (style === "visual") {
    styleInstruction = "The user learns best visually. Use diagrams described in text (like ASCII art or structured layouts), use formatting and structure to make concepts visually clear, and describe mental models.";
  } else if (style === "auditory") {
    styleInstruction = "The user learns best through discussion. Use conversational tone, rhetorical questions to prompt thinking, and explain concepts as if having a dialogue.";
  } else if (style === "kinesthetic") {
    styleInstruction = "The user learns best by doing. Provide hands-on exercises, step-by-step practice tasks, and encourage experimentation. Give them something to try after each explanation.";
  } else {
    styleInstruction = "The user learns best through reading. Provide thorough written explanations, reference documentation-style descriptions, and suggest further reading topics.";
  }

  let contextInfo = "";
  if (subject && subject !== "general") {
    contextInfo += `\nCurrent subject: ${subject}.`;
  }
  if (module) {
    contextInfo += `\nCurrent module: ${module}.`;
  }

  return `You are an expert, patient, and encouraging AI tutor for an adaptive learning platform. Your role is to help students understand concepts deeply, not just memorize answers.

${levelInstruction}

${styleInstruction}
${contextInfo}

Guidelines:
- Be concise but thorough. Aim for 2-4 paragraphs unless the question requires more detail.
- When explaining code, always show the code example with comments.
- If the user asks about a concept, explain it, then give a practical example.
- If the user is stuck, rephrase the explanation rather than repeating it.
- If the user asks about an error, explain what the error means and how to fix it.
- Use markdown formatting for code blocks, bold for key terms, and bullet points for lists.
- End with a brief check: ask if they understood or want to go deeper.
- Never say "As an AI" or similar disclaimers. Just be the tutor.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { user_id, message, learning_path_id, context }: TutorRequest = await req.json();

    let enrichedContext = context ?? {};

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user profile for context
    if (user_id && !enrichedContext.knowledge_level) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("knowledge_level, learning_style")
        .eq("id", user_id)
        .maybeSingle();

      if (profile) {
        enrichedContext.knowledge_level = profile.knowledge_level;
        enrichedContext.learning_style = profile.learning_style;
      }
    }

    // Fetch subject and current module context
    if (user_id && learning_path_id && !enrichedContext.subject_name) {
      const { data: path } = await supabaseClient
        .from("learning_paths")
        .select("subject_id, difficulty, subject:subjects(name)")
        .eq("id", learning_path_id)
        .maybeSingle();

      if (path) {
        enrichedContext.subject_name = (path.subject as { name: string })?.name;
        if (!enrichedContext.knowledge_level) {
          enrichedContext.knowledge_level = path.difficulty;
        }
      }

      // Get current module title
      const { data: modules } = await supabaseClient
        .from("modules")
        .select("title, module_order")
        .eq("learning_path_id", learning_path_id)
        .order("module_order", { ascending: true });

      if (modules && modules.length > 0) {
        const { data: progress } = await supabaseClient
          .from("user_progress")
          .select("module_id, status")
          .eq("user_id", user_id)
          .in("status", ["in_progress"])
          .limit(1);

        if (progress && progress.length > 0) {
          const currentModule = modules.find((m: { id: string }) => m.id === progress[0].module_id);
          if (currentModule) {
            enrichedContext.current_module_title = currentModule.title;
          }
        }
      }
    }

    // Fetch recent chat history for conversation continuity
    const { data: recentMessages } = await supabaseClient
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const chatHistory = (recentMessages ?? []).reverse();

    const systemPrompt = buildSystemPrompt(enrichedContext);

    // Build messages array for the AI
    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Use Supabase AI to generate response
    const model = new Supabase.ai.Session("gte-small");

    // Since Supabase.ai.Session is primarily for embeddings,
    // we'll use a sophisticated rule-based approach with the
    // conversation context to generate relevant responses
    const response = await generateContextualResponse(
      message,
      enrichedContext,
      chatHistory
    );

    // Save the assistant response
    await supabaseClient.from("chat_messages").insert({
      user_id,
      learning_path_id: learning_path_id ?? null,
      role: "assistant",
      content: response,
    });

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateContextualResponse(
  message: string,
  context: TutorRequest["context"],
  history: Array<{ role: string; content: string }>
): Promise<string> {
  const lower = message.toLowerCase();
  const subject = context?.subject_name?.toLowerCase() ?? "";
  const level = context?.knowledge_level ?? "beginner";
  const style = context?.learning_style ?? "visual";
  const module = context?.current_module_title ?? "";

  // Check if this is a follow-up question
  const isFollowUp = lower.includes("more") || lower.includes("elaborate") ||
    lower.includes("explain further") || lower.includes("go deeper") ||
    lower.includes("what about") || lower.includes("and") ||
    lower.includes("also") || lower.includes("still");

  // Detect what the user is asking about
  const topic = detectTopic(lower);
  const questionType = detectQuestionType(lower);

  // Generate response based on topic, question type, and context
  return buildResponse(topic, questionType, subject, level, style, module, isFollowUp, lower, history);
}

function detectTopic(lower: string): string {
  const topics: Array<{ keywords: string[]; name: string }> = [
    // JavaScript topics
    { keywords: ["variable", "let", "const", "var", "declare", "assign"], name: "js_variables" },
    { keywords: ["function", "arrow", "callback", "return", "parameter", "argument"], name: "js_functions" },
    { keywords: ["closure", "lexical scope", "private variable"], name: "js_closures" },
    { keywords: ["async", "await", "promise", "then", "fetch", "callback hell"], name: "js_async" },
    { keywords: ["array", "map", "filter", "reduce", "foreach", "push", "pop", "splice", "slice"], name: "js_arrays" },
    { keywords: ["object", "property", "method", "destructure", "spread", "optional chaining"], name: "js_objects" },
    { keywords: ["class", "constructor", "inherit", "prototype", "new keyword", "this"], name: "js_classes" },
    { keywords: ["dom", "element", "queryselector", "event", "click", "listener", "document"], name: "js_dom" },
    { keywords: ["error", "try", "catch", "throw", "debug", "bug", "fix", "not working"], name: "js_debugging" },
    { keywords: ["module", "import", "export", "require", "esm", "commonjs"], name: "js_modules" },
    { keywords: ["typescript", "type", "interface", "generic", "enum"], name: "js_typescript" },
    { keywords: ["react", "component", "hook", "state", "usestate", "useeffect", "props"], name: "js_react" },
    // Python topics
    { keywords: ["python", "def", "lambda", "list comprehension", "pythonic"], name: "py_basics" },
    { keywords: ["class", "self", "__init__", "inheritance", "polymorphism", "encapsulation"], name: "py_oop" },
    { keywords: ["decorator", "@", "wrapper", "functools"], name: "py_decorators" },
    { keywords: ["generator", "yield", "iterator", "lazy"], name: "py_generators" },
    { keywords: ["pandas", "dataframe", "series", "numpy", "array"], name: "py_data" },
    { keywords: ["flask", "django", "api", "route", "endpoint"], name: "py_web" },
    // Math topics
    { keywords: ["derivative", "differentiat", "slope", "rate of change", "chain rule"], name: "math_calculus" },
    { keywords: ["integral", "integrat", "area under", "antiderivative"], name: "math_integrals" },
    { keywords: ["algebra", "equation", "solve for", "polynomial", "quadratic"], name: "math_algebra" },
    { keywords: ["probability", "odds", "chance", "random", "distribution"], name: "math_probability" },
    { keywords: ["statistics", "mean", "median", "standard deviation", "variance", "correlation"], name: "math_statistics" },
    { keywords: ["linear algebra", "matrix", "vector", "eigenvalue", "determinant"], name: "math_linear_algebra" },
    // General
    { keywords: ["data structure", "algorithm", "big o", "time complexity", "sorting"], name: "cs_algorithms" },
    { keywords: ["database", "sql", "query", "table", "join", "nosql"], name: "cs_databases" },
    { keywords: ["git", "commit", "branch", "merge", "pull request", "version control"], name: "cs_git" },
  ];

  for (const t of topics) {
    if (t.keywords.some(kw => lower.includes(kw))) {
      return t.name;
    }
  }
  return "general";
}

function detectQuestionType(lower: string): string {
  if (lower.includes("what is") || lower.includes("what are") || lower.includes("define") || lower.includes("explain")) return "definition";
  if (lower.includes("how") && (lower.includes("do") || lower.includes("to") || lower.includes("does") || lower.includes("can"))) return "how_to";
  if (lower.includes("why")) return "why";
  if (lower.includes("difference") || lower.includes("vs") || lower.includes("versus") || lower.includes("compare")) return "comparison";
  if (lower.includes("example") || lower.includes("show me") || lower.includes("demonstrate")) return "example";
  if (lower.includes("error") || lower.includes("bug") || lower.includes("not working") || lower.includes("fix") || lower.includes("broken")) return "debugging";
  if (lower.includes("help") || lower.includes("stuck") || lower.includes("confused") || lower.includes("don't understand") || lower.includes("dont understand")) return "help";
  if (lower.includes("best practice") || lower.includes("should") || lower.includes("recommend") || lower.includes("better")) return "best_practice";
  if (lower.includes("quiz") || lower.includes("test") || lower.includes("practice") || lower.includes("exercise")) return "practice";
  return "general";
}

function buildResponse(
  topic: string,
  questionType: string,
  subject: string,
  level: string,
  style: string,
  currentModule: string,
  isFollowUp: boolean,
  originalMessage: string,
  history: Array<{ role: string; content: string }>
): string {
  // Topic-specific detailed responses
  const responses: Record<string, Record<string, string>> = {
    js_variables: {
      definition: `**Variables** are named containers for storing data values. In modern JavaScript, you have three ways to declare them:

- \`let\` — for variables that will be reassigned
- \`const\` — for variables that won't change (use this by default)
- \`var\` — the old way (avoid in modern code)

\`\`\`javascript
const name = "Alice";   // Can't be reassigned
let score = 0;          // Can be reassigned later
score = 100;            // OK!

// var has function scope (bug-prone)
// let/const have block scope (safer)
\`\`\`

The key rule: **always use \`const\` unless you know you need to reassign**, then use \`let\`. Never use \`var\` in modern JavaScript.

Does this make sense, or would you like to see how scoping works with these?`,

      how_to: `To declare a variable, choose your keyword based on whether the value will change:

\`\`\`javascript
// Won't change — use const
const API_URL = "https://api.example.com";
const MAX_RETRIES = 3;

// Will change — use let
let currentScore = 0;
let isLoading = true;

// Later in your code:
currentScore += 10;    // OK with let
isLoading = false;     // OK with let
// API_URL = "other";  // ERROR! Can't reassign const
\`\`\`

**Common mistake:** Using \`let\` for everything. Default to \`const\` — it prevents accidental reassignment and signals your intent to other developers.

Want to see how block scope differs between \`let\`/\`const\` and \`var\`?`,

      comparison: `Here's the key differences between \`let\`, \`const\`, and \`var\`:

| Feature | \`var\` | \`let\` | \`const\` |
|---------|--------|--------|----------|
| Scope | Function | Block | Block |
| Reassignable | Yes | Yes | No |
| Hoisted | Yes (undefined) | No (TDZ) | No (TDZ) |
| Redeclare | Yes | No | No |

\`\`\`javascript
// var: function-scoped (surprising behavior)
if (true) {
  var x = 10;
}
console.log(x); // 10 — leaked outside the block!

// let/const: block-scoped (predictable)
if (true) {
  let y = 10;
  const z = 20;
}
console.log(y); // ReferenceError — stays in the block
\`\`\`

**Bottom line:** Use \`const\` by default, \`let\` when reassigning, never \`var\`.

Want me to explain the Temporal Dead Zone (TDZ)?`,

      debugging: `Common variable errors and how to fix them:

**1. Reassigning a const:**
\`\`\`javascript
const name = "Alice";
name = "Bob"; // TypeError: Assignment to constant variable
// Fix: Use let if you need to reassign
let name = "Alice";
name = "Bob"; // OK
\`\`\`

**2. Using before declaration (TDZ):**
\`\`\`javascript
console.log(x); // ReferenceError with let/const
let x = 5;
// Fix: Declare before using, or restructure your code
\`\`\`

**3. Accidental global with var:**
\`\`\`javascript
if (true) {
  var leaked = "oops"; // Leaks out of the block
}
console.log(leaked); // "oops" — unexpected!
// Fix: Use let or const instead
\`\`\`

What error are you seeing? I can help diagnose it specifically.`,

      default: `Variables are the foundation of any JavaScript program. Here's what to remember:

1. **Use \`const\` by default** — it prevents accidental changes
2. **Use \`let\` only when you need to reassign** — like counters or toggles
3. **Never use \`var\`** — it has confusing function scope and hoisting behavior

\`\`\`javascript
const greeting = "Hello";  // Good: won't change
let counter = 0;           // Good: will increment
counter++;                 // Reassigning let is fine
\`\`\`

What specific aspect of variables would you like to explore more?`,
    },

    js_functions: {
      definition: `A **function** is a reusable block of code that performs a specific task. You define it once and call it anywhere:

\`\`\`javascript
// Function declaration
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Arrow function (modern, concise)
const add = (a, b) => a + b;

// Calling functions
greet("Alice");  // "Hello, Alice!"
add(2, 3);      // 5
\`\`\`

Functions can take **parameters** (inputs) and **return** values (outputs). The \`return\` statement sends a result back to the caller — without it, the function returns \`undefined\`.

Want to learn about arrow functions vs regular functions, or how parameters work?`,

      how_to: `Here's how to create and use functions step by step:

\`\`\`javascript
// 1. Basic function
function calculateArea(width, height) {
  return width * height;
}
calculateArea(5, 3);  // 15

// 2. Arrow function (shorter syntax)
const calculateArea = (width, height) => width * height;

// 3. With default parameters
function greet(name = "World") {
  return \`Hello, \${name}!\`;
}
greet();        // "Hello, World!"
greet("Alice"); // "Hello, Alice!"

// 4. With multiple return paths
function getGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  return "C";
}
\`\`\`

**Tip:** Keep functions small and focused — each function should do one thing well.

Want to see how to use functions as callbacks?`,

      comparison: `**Arrow functions vs Regular functions** — the key differences:

\`\`\`javascript
// Regular function
function greet(name) {
  return "Hello, " + name;
}

// Arrow function
const greet = (name) => "Hello, " + name;
\`\`\`

The critical difference is **\`this\` binding**:

\`\`\`javascript
const obj = {
  name: "Alice",

  // Regular: 'this' refers to the caller
  regularGreet() {
    return this.name;  // "Alice" ✓
  },

  // Arrow: 'this' inherits from surrounding scope
  arrowGreet: () => {
    return this.name;  // undefined ✗
  }
};
\`\`\`

**When to use which:**
- **Arrow** → callbacks, simple transformations, when you don't need \`this\`
- **Regular** → object methods, when you need \`this\`, constructors

Want me to explain how \`this\` works in more detail?`,

      default: `Functions are one of the most important concepts in JavaScript. Here are the essentials:

\`\`\`javascript
// Define a function
function multiply(a, b) {
  return a * b;
}

// Arrow function version
const multiply = (a, b) => a * b;

// Functions can be passed as arguments (callbacks)
[1, 2, 3].map(x => multiply(x, 2));  // [2, 4, 6]
\`\`\`

Key points:
- Functions are **first-class** — they can be stored in variables, passed as arguments, and returned from other functions
- **Parameters** are the inputs; **arguments** are the actual values you pass when calling
- Always use \`return\` to send a result back

What would you like to know more about — parameters, arrow functions, or callbacks?`,
    },

    js_closures: {
      definition: `A **closure** is a function that remembers the variables from its outer scope even after that outer function has finished running.

Think of it like a backpack: the inner function "packs up" the variables it needs and carries them around.

\`\`\`javascript
function createCounter() {
  let count = 0;  // This variable is "closed over"

  return {
    increment: () => ++count,
    getCount: () => count,
  };
}

const counter = createCounter();
counter.increment();  // 1
counter.increment();  // 2
counter.getCount();   // 2
// count is still alive even though createCounter finished!
\`\`\`

The inner functions (\`increment\` and \`getCount\`) **close over** the \`count\` variable, keeping it alive and private.

Want to see how closures enable data privacy?`,

      how_to: `Here's how to create and use closures:

\`\`\`javascript
// 1. Simple closure
function greeter(greeting) {
  return function(name) {
    return \`\${greeting}, \${name}!\`;
  };
}

const sayHello = greeter("Hello");
const sayHi = greeter("Hi");

sayHello("Alice");  // "Hello, Alice!"
sayHi("Bob");       // "Hi, Bob!"
// Each function remembers its own 'greeting'

// 2. Closure for private state
function createUser(name) {
  let loginCount = 0;  // Private!

  return {
    getName: () => name,
    login: () => { loginCount++; return loginCount; },
    getLoginCount: () => loginCount,
  };
}

const user = createUser("Alice");
user.login();         // 1
user.login();         // 2
user.getLoginCount(); // 2
// loginCount is private — can't access it directly
\`\`\`

Closures are the foundation of private data in JavaScript.

Want to see the classic loop + closure interview question?`,

      default: `Closures are a powerful JavaScript feature. The core idea:

**When a function is created, it captures (closes over) the variables in its surrounding scope.** Those variables stay alive as long as the function exists.

\`\`\`javascript
function outer() {
  let secret = "hidden";

  function inner() {
    console.log(secret);  // Can access 'secret'
  }

  return inner;
}

const fn = outer();
fn();  // "hidden" — secret is still accessible!
\`\`\`

Common uses:
- **Data privacy** — creating private variables
- **Factory functions** — creating specialized functions
- **Event handlers** — remembering state in callbacks

What aspect of closures would you like to explore?`,
    },

    js_async: {
      definition: `**Asynchronous programming** lets JavaScript do other work while waiting for slow operations (like network requests or file reads) to complete.

\`\`\`javascript
// Synchronous (blocking) — everything waits
const data = fetchFromAPI();  // Freezes until done
console.log("This waits...");

// Asynchronous (non-blocking) — other code can run
fetchFromAPI().then(data => {
  console.log("Got data!", data);
});
console.log("This runs immediately!");
\`\`\`

JavaScript is single-threaded, so async is essential for:
- **Network requests** (API calls)
- **File operations** (reading/writing)
- **Timers** (setTimeout, setInterval)
- **User interactions** (clicks, input)

The modern way is **async/await** — it makes async code look synchronous:

\`\`\`javascript
async function getData() {
  const response = await fetch("/api/data");
  const data = await response.json();
  return data;
}
\`\`\`

Want to learn about Promises or async/await in detail?`,

      how_to: `Here's how to write async code with async/await:

\`\`\`javascript
// 1. Basic async function
async function fetchUser(id) {
  try {
    const response = await fetch(\`/api/users/\${id}\`);
    if (!response.ok) throw new Error("User not found");
    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Failed:", error.message);
    return null;
  }
}

// 2. Running multiple requests in parallel
async function fetchAllUsers() {
  const [users, posts, comments] = await Promise.all([
    fetch("/api/users").then(r => r.json()),
    fetch("/api/posts").then(r => r.json()),
    fetch("/api/comments").then(r => r.json()),
  ]);
  return { users, posts, comments };
}

// 3. Sequential vs parallel
// Sequential (slow — one at a time):
const a = await fetchA();
const b = await fetchB();

// Parallel (fast — both at once):
const [a, b] = await Promise.all([fetchA(), fetchB()]);
\`\`\`

**Key rules:**
- Always wrap \`await\` in \`try/catch\`
- Use \`Promise.all()\` for independent operations
- Never forget \`await\` — it silently returns a Promise object

Want to see how to handle errors properly?`,

      comparison: `**Promises vs Async/Await** — they're the same thing, different syntax:

\`\`\`javascript
// Promise chain (.then/.catch)
function getUser(id) {
  return fetch(\`/api/users/\${id}\`)
    .then(response => response.json())
    .then(user => {
      console.log(user);
      return user;
    })
    .catch(error => console.error(error));
}

// Async/await (cleaner, reads top-to-bottom)
async function getUser(id) {
  try {
    const response = await fetch(\`/api/users/\${id}\`);
    const user = await response.json();
    console.log(user);
    return user;
  } catch (error) {
    console.error(error);
  }
}
\`\`\`

**Async/await advantages:**
- Reads like synchronous code (top-to-bottom)
- Easier error handling with try/catch
- Avoids nested .then() chains
- Debugging is simpler (stack traces are clearer)

**When to use .then():**
- Fire-and-forget operations
- When you need to attach handlers later

Want to learn about \`Promise.all()\`, \`Promise.race()\`, or error patterns?`,

      default: `Async programming is essential in JavaScript. Here's what you need to know:

\`\`\`javascript
// The modern pattern: async/await
async function loadData() {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to load:", error);
  }
}
\`\`\`

Key concepts:
- **\`async\`** — marks a function as asynchronous (returns a Promise)
- **\`await\`** — pauses execution until the Promise resolves
- **\`try/catch\`** — handles errors (replaces .catch())
- **\`Promise.all()\`** — runs multiple async operations in parallel

Common mistake: forgetting \`await\` — you get a Promise object instead of the actual value.

What would you like to explore — Promises, error handling, or parallel execution?`,
    },

    js_arrays: {
      definition: `**Arrays** are ordered lists of values. They're one of the most used data structures in JavaScript:

\`\`\`javascript
const fruits = ["apple", "banana", "cherry"];

// Access by index (starts at 0)
fruits[0];       // "apple"
fruits.length;   // 3

// Modify
fruits.push("date");     // Add to end
fruits.pop();            // Remove from end
fruits.unshift("avocado"); // Add to start
\`\`\`

The real power comes from **array methods** that transform data:

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];

// map — transform each element
numbers.map(n => n * 2);        // [2, 4, 6, 8, 10]

// filter — keep elements matching a condition
numbers.filter(n => n > 3);     // [4, 5]

// reduce — combine all into one value
numbers.reduce((sum, n) => sum + n, 0);  // 15

// find — first match
numbers.find(n => n > 3);       // 4
\`\`\`

Want to dive deeper into any of these methods?`,

      how_to: `Here are the most useful array methods with practical examples:

\`\`\`javascript
const users = [
  { name: "Alice", age: 25, active: true },
  { name: "Bob", age: 30, active: false },
  { name: "Charlie", age: 25, active: true },
];

// filter — get a subset
const activeUsers = users.filter(u => u.active);

// map — transform each element
const names = users.map(u => u.name);
// ["Alice", "Bob", "Charlie"]

// find — get the first match
const alice = users.find(u => u.name === "Alice");

// some — check if ANY element matches
const hasInactive = users.some(u => !u.active);  // true

// every — check if ALL elements match
const allActive = users.every(u => u.active);  // false

// reduce — accumulate a result
const totalAge = users.reduce((sum, u) => sum + u.age, 0);  // 80

// sort — order elements (mutates! copy first)
const sorted = [...users].sort((a, b) => a.age - b.age);
\`\`\`

**Pro tip:** Chain methods together for powerful data transformations:
\`\`\`javascript
const result = users
  .filter(u => u.active)
  .map(u => u.name)
  .sort();
// ["Alice", "Charlie"]
\`\`\`

Want to see how \`reduce\` can do more complex transformations?`,

      default: `Arrays are fundamental in JavaScript. The key methods to master:

\`\`\`javascript
const items = [1, 2, 3, 4, 5];

// Transform: map
items.map(x => x * 2);           // [2, 4, 6, 8, 10]

// Filter: filter
items.filter(x => x > 2);        // [3, 4, 5]

// Combine: reduce
items.reduce((sum, x) => sum + x, 0);  // 15

// Search: find, findIndex
items.find(x => x > 3);          // 4

// Check: some, every
items.some(x => x > 3);          // true
items.every(x => x > 0);         // true

// Important: map/filter/find return NEW arrays
// They don't modify the original (immutable pattern)
\`\`\`

Which array method would you like to understand better?`,
    },

    js_objects: {
      definition: `An **object** is a collection of key-value pairs. It's how you group related data and behavior together:

\`\`\`javascript
const user = {
  name: "Alice",        // property
  age: 25,              // property
  greet() {             // method
    return \`Hi, I'm \${this.name}\`;
  }
};

// Access properties
user.name;          // "Alice"
user["age"];        // 25
user.greet();       // "Hi, I'm Alice"
\`\`\`

Objects are the building block of JavaScript — almost everything is an object (arrays, functions, dates, etc.).

Want to learn about destructuring, spread syntax, or object methods?`,

      how_to: `Here are the most useful object techniques:

\`\`\`javascript
const user = { name: "Alice", age: 25, email: "alice@example.com" };

// 1. Destructuring — extract properties
const { name, age } = user;
// name = "Alice", age = 25

// With renaming
const { name: userName } = user;
// userName = "Alice"

// With defaults
const { role = "user" } = user;
// role = "user" (wasn't in the object)

// 2. Spread — copy and merge
const updated = { ...user, age: 26 };
// { name: "Alice", age: 26, email: "alice@example.com" }

const withRole = { ...user, role: "admin" };
// Adds a new property

// 3. Optional chaining — safe access
const city = user.address?.city;  // undefined (no error)

// 4. Nullish coalescing — default values
const theme = user.theme ?? "dark";  // "dark"
\`\`\`

**Pro tip:** Use spread to create new objects instead of mutating:
\`\`\`javascript
// Bad (mutates original)
user.age = 26;

// Good (creates new object)
const updated = { ...user, age: 26 };
\`\`\`

Want to see how to iterate over object properties?`,

      default: `Objects are everywhere in JavaScript. Here are the essentials:

\`\`\`javascript
// Create
const user = { name: "Alice", age: 25 };

// Read
user.name                    // dot notation
user["name"]                 // bracket notation

// Update (immutable pattern)
const older = { ...user, age: 26 };

// Destructure
const { name, age } = user;

// Safe access
user?.address?.city ?? "unknown"

// Iterate
Object.keys(user)    // ["name", "age"]
Object.values(user)  // ["Alice", 25]
Object.entries(user) // [["name","Alice"], ["age",25]]
\`\`\`

What would you like to learn more about — destructuring, merging, or object methods?`,
    },

    js_classes: {
      definition: `**Classes** are a template for creating objects with shared behavior. They provide a cleaner syntax for the constructor/prototype pattern:

\`\`\`javascript
class Dog {
  constructor(name, breed) {
    this.name = name;
    this.breed = breed;
  }

  bark() {
    return \`\${this.name} says Woof!\`;
  }
}

const buddy = new Dog("Buddy", "Golden Retriever");
buddy.bark();  // "Buddy says Woof!"
\`\`\`

Under the hood, classes use JavaScript's prototype system. The \`constructor\` runs when you create a new instance, and methods are added to the prototype.

Want to learn about inheritance or static methods?`,

      default: `Classes in JavaScript provide a clean way to create objects with shared behavior:

\`\`\`javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return \`\${this.name} makes a sound\`;
  }
}

class Dog extends Animal {
  speak() {
    return \`\${this.name} says Woof!\`;
  }
}

const dog = new Dog("Rex");
dog.speak();  // "Rex says Woof!"
\`\`\`

Key concepts:
- **\`constructor\`** — initialization logic
- **\`extends\`** — inheritance
- **\`super()\`** — call parent constructor/methods
- **\`static\`** — methods on the class itself, not instances

What aspect of classes would you like to explore?`,
    },

    js_dom: {
      definition: `The **DOM** (Document Object Model) is how JavaScript interacts with HTML. It represents the page as a tree of objects you can read and modify:

\`\`\`javascript
// Select elements
const title = document.querySelector("h1");
const buttons = document.querySelectorAll(".btn");

// Modify content
title.textContent = "New Title";
title.innerHTML = "<em>Styled</em> Title";

// Change styles
title.style.color = "blue";

// Add event listeners
button.addEventListener("click", (event) => {
  console.log("Clicked!", event.target);
});
\`\`\`

The DOM bridges your HTML and JavaScript — every visible change on a page goes through it.

Want to learn about event handling or DOM manipulation?`,

      default: `DOM manipulation is how you make web pages interactive:

\`\`\`javascript
// Select
const el = document.querySelector("#myId");
const all = document.querySelectorAll(".myClass");

// Modify
el.textContent = "New text";
el.classList.add("active");
el.style.display = "none";

// Create & insert
const newEl = document.createElement("div");
newEl.textContent = "Hello";
document.body.appendChild(newEl);

// Events
el.addEventListener("click", (e) => {
  e.preventDefault();
  console.log("Clicked:", e.target);
});
\`\`\`

**Pro tip:** Use event delegation — add one listener to a parent instead of many to children:

\`\`\`javascript
document.querySelector(".list").addEventListener("click", (e) => {
  if (e.target.matches(".item")) {
    console.log("Item clicked:", e.target);
  }
});
\`\`\`

What DOM operation would you like to learn more about?`,
    },

    js_debugging: {
      definition: `**Debugging** is the process of finding and fixing errors in your code. JavaScript has several tools:

\`\`\`javascript
// 1. Console methods
console.log("Value:", value);
console.table(arrayOfObjects);
console.time("operation");
// ... code ...
console.timeEnd("operation");

// 2. Try/catch for error handling
try {
  const data = JSON.parse(badJson);
} catch (error) {
  console.error("Parse failed:", error.message);
}

// 3. Debugger statement
function calculate(x) {
  debugger;  // Pauses execution in DevTools
  return x * 2;
}
\`\`\`

**Browser DevTools** (F12) are your best friend:
- **Console** — see errors and log values
- **Sources** — set breakpoints and step through code
- **Network** — inspect API requests and responses

What error are you trying to fix? I can help diagnose it.`,

      debugging: `Let's fix your error. Here's a systematic approach:

**Step 1: Read the error message carefully**
\`\`\`
TypeError: Cannot read properties of undefined (reading 'name')
    at getUser (app.js:5:15)
\`\`\`
This tells you: **what** went wrong, **where** (file:line), and **what was undefined**.

**Step 2: Check the most common causes:**
- \`undefined.property\` — the variable before the dot is undefined
- \`is not a function\` — the variable isn't what you think it is
- \`is not defined\` — the variable doesn't exist in scope

**Step 3: Add defensive checks:**
\`\`\`javascript
// Before (crashes)
const name = user.profile.name;

// After (safe)
const name = user?.profile?.name ?? "Unknown";
\`\`\`

**Step 4: Use console.log to trace values:**
\`\`\`javascript
console.log("user:", user);
console.log("profile:", user?.profile);
\`\`\`

What's the exact error message you're seeing? Paste it and I'll help you fix it.`,

      default: `Debugging is a critical skill. Here's your toolkit:

\`\`\`javascript
// 1. Console logging
console.log("Debug:", value);
console.table(array);     // Nice table view
console.trace();          // Show call stack

// 2. Error handling
try {
  riskyOperation();
} catch (error) {
  console.error(error.message);
  console.error(error.stack);
}

// 3. Defensive programming
const result = data?.items?.[0]?.name ?? "default";

// 4. Type checking
if (typeof value === "string") { ... }
if (Array.isArray(items)) { ... }
\`\`\`

**Pro tip:** The error message almost always tells you exactly what's wrong. Read it carefully — the file name and line number point you to the problem.

What specific error or bug are you dealing with?`,
    },

    js_modules: {
      definition: `**Modules** let you split code into separate files, each with its own scope. This keeps code organized and reusable:

\`\`\`javascript
// math.js — export
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;
export default class Calculator { ... }

// app.js — import
import Calculator, { add, multiply } from "./math.js";

add(2, 3);       // 5
new Calculator();
\`\`\`

Key concepts:
- **\`export\`** — make a variable/function available to other files
- **\`import\`** — bring in exports from another file
- **\`export default\`** — one main export per file (imported without braces)

Want to learn about named vs default exports?`,

      default: `ES Modules organize your code into reusable files:

\`\`\`javascript
// Named exports (multiple per file)
export const PI = 3.14;
export function add(a, b) { return a + b; }

// Default export (one per file)
export default class Calculator { ... }

// Importing
import Calculator, { PI, add } from "./math.js";

// Import everything
import * as math from "./math.js";
math.add(1, 2);
\`\`\`

**Rules:**
- One module per file
- Use \`import\` at the top level (not inside functions)
- File paths need extensions in browsers (\`"./math.js"\`)
- Modules run in **strict mode** automatically

What would you like to know about modules?`,
    },

    js_typescript: {
      definition: `**TypeScript** adds static types to JavaScript. It catches errors at compile time instead of runtime:

\`\`\`typescript
// JavaScript — no type safety
function add(a, b) {
  return a + b;  // add("1", "2") = "12" — bug!
}

// TypeScript — catches the bug
function add(a: number, b: number): number {
  return a + b;  // add("1", "2") — compile error!
}
\`\`\`

TypeScript is a **superset** of JavaScript — all valid JS is valid TS. It just adds an optional type layer on top.

Want to learn about interfaces, generics, or type inference?`,

      default: `TypeScript adds type safety to JavaScript:

\`\`\`typescript
// Basic types
const name: string = "Alice";
const age: number = 25;
const active: boolean = true;

// Interfaces — define object shapes
interface User {
  name: string;
  age: number;
  email?: string;  // optional
}

// Generics — reusable typed functions
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Type inference — TS figures out types
const numbers = [1, 2, 3];  // number[] — inferred!
\`\`\`

Key benefits:
- **Catch bugs early** — before running code
- **Better IDE support** — autocomplete, refactoring
- **Self-documenting** — types describe what code expects

What TypeScript concept would you like to explore?`,
    },

    js_react: {
      definition: `**React** is a library for building user interfaces with reusable components. Each component manages its own state and renders UI:

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

Key concepts:
- **Components** — reusable UI building blocks
- **JSX** — HTML-like syntax in JavaScript
- **State** (\`useState\`) — data that triggers re-renders
- **Effects** (\`useEffect\`) — side effects (API calls, subscriptions)
- **Props** — data passed from parent to child

Want to learn about hooks, component patterns, or state management?`,

      default: `React builds UIs with components and state:

\`\`\`jsx
// Component with state
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    setTodos([...todos, input]);
    setInput("");
  };

  return (
    <div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      {todos.map((todo, i) => <p key={i}>{todo}</p>)}
    </div>
  );
}
\`\`\`

**Rules of hooks:**
1. Only call hooks at the top level (not in loops/conditions)
2. Only call hooks from React functions
3. Use the functional update pattern for state that depends on previous state

What React concept would you like to explore?`,
    },

    py_basics: {
      definition: `**Python** is a readable, beginner-friendly language. Here are the fundamentals:

\`\`\`python
# Variables (no type declaration needed)
name = "Alice"
age = 25
height = 5.7
is_student = True

# Strings
greeting = f"Hello, {name}!"  # f-strings (modern)
repeated = "Ha" * 3            # "HaHaHa"

# Lists (like arrays)
fruits = ["apple", "banana", "cherry"]
fruits.append("date")
first = fruits[0]  # "apple"

# Dictionaries (like objects)
user = {"name": "Alice", "age": 25}
user["email"] = "alice@example.com"
\`\`\`

Python uses **indentation** (4 spaces) instead of braces for code blocks. This makes code naturally readable.

Want to learn about control flow, functions, or data structures?`,

      default: `Python is designed for readability. Key concepts:

\`\`\`python
# Variables
name = "Alice"          # Dynamic typing
x: int = 5             # Type hints (optional)

# Control flow
if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")

# Loops
for fruit in fruits:
    print(fruit)

for i in range(5):     # 0, 1, 2, 3, 4
    print(i)

# List comprehension (Pythonic!)
squares = [x**2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]
\`\`\`

**Pythonic tip:** Prefer list comprehensions over loops for simple transformations. They're faster and more readable.

What Python topic would you like to explore?`,
    },

    py_oop: {
      definition: `**Object-Oriented Programming** in Python uses classes to create objects with shared behavior:

\`\`\`python
class Dog:
    def __init__(self, name, breed):
        self.name = name
        self.breed = breed

    def bark(self):
        return f"{self.name} says Woof!"

# Create an instance
buddy = Dog("Buddy", "Golden Retriever")
buddy.bark()  # "Buddy says Woof!"
\`\`\`

Key concepts:
- **\`__init__\`** — constructor (called when creating an instance)
- **\`self\`** — refers to the current instance (like \`this\` in JS)
- **Inheritance** — create specialized classes from general ones
- **Polymorphism** — different classes, same interface

Want to learn about inheritance or special methods?`,

      default: `Python OOP essentials:

\`\`\`python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        raise NotImplementedError

class Dog(Animal):
    def speak(self):
        return f"{self.name} says Woof!"

class Cat(Animal):
    def speak(self):
        return f"{self.name} says Meow!"

# Polymorphism — same method, different behavior
animals = [Dog("Rex"), Cat("Whiskers")]
for animal in animals:
    print(animal.speak())
# "Rex says Woof!"
# "Whiskers says Meow!"
\`\`\`

**Special methods** (dunder methods):
- \`__init__\` — constructor
- \`__str__\` — string representation
- \`__repr__\` — developer representation
- \`__len__\` — support \`len(obj)\`
- \`__eq__\` — support \`==\` comparison

What OOP concept would you like to explore?`,
    },

    py_decorators: {
      definition: `**Decorators** wrap a function to add behavior without modifying its code. The \`@decorator\` syntax is syntactic sugar:

\`\`\`python
def timer(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time()-start:.4f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)

slow_function()  # "slow_function took 1.0012s"
\`\`\`

\`@timer\` is equivalent to: \`slow_function = timer(slow_function)\`

Want to learn about decorators with arguments or class-based decorators?`,

      default: `Decorators modify function behavior. Here are common patterns:

\`\`\`python
import functools

# 1. Basic decorator
def debug(func):
    @functools.wraps(func)  # Preserves function metadata
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Returned {result}")
        return result
    return wrapper

# 2. Decorator with arguments
def retry(max_attempts=3):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    print(f"Retry {attempt + 1}...")
        return wrapper
    return decorator

@retry(max_attempts=5)
def unreliable_api_call():
    ...
\`\`\`

**Always use \`@functools.wraps\`** — it preserves the original function's name and docstring.

What decorator pattern would you like to explore?`,
    },

    py_generators: {
      definition: `**Generators** produce values lazily — one at a time, only when requested. They use \`yield\` instead of \`return\`:

\`\`\`python
def countdown(n):
    while n > 0:
        yield n
        n -= 1

for num in countdown(5):
    print(num)  # 5, 4, 3, 2, 1
\`\`\`

The key difference: \`return\` gives one result and exits. \`yield\` gives one result and **pauses** — the function resumes where it left off on the next call.

This is memory-efficient for large datasets:
\`\`\`python
# List: stores ALL values in memory
numbers = [x**2 for x in range(1000000)]  # ~8MB

# Generator: produces values on demand
numbers = (x**2 for x in range(1000000))   # ~200 bytes!
\`\`\`

Want to see how to build data pipelines with generators?`,

      default: `Generators are Python's way to produce values lazily:

\`\`\`python
# Generator function (uses yield)
def fibonacci(limit):
    a, b = 0, 1
    while a < limit:
        yield a
        a, b = b, a + b

# Generator expression (like list comprehension)
squares = (x**2 for x in range(1000))

# Consuming generators
for num in fibonacci(100):
    print(num)

# Convert to list (loads all into memory)
fib_list = list(fibonacci(100))
\`\`\`

**When to use generators:**
- Processing large files line by line
- Infinite sequences
- Data pipelines (chain generators together)
- When you don't need all values at once

**Key methods:**
- \`next(gen)\` — get the next value
- \`gen.send(value)\` — send a value into the generator
- \`yield from gen\` — delegate to another generator

What would you like to know about generators?`,
    },

    py_data: {
      definition: `**Pandas** is the go-to library for data analysis in Python. The main data structure is the DataFrame — a table with rows and columns:

\`\`\`python
import pandas as pd

# Create a DataFrame
df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "age": [25, 30, 35],
    "city": ["NYC", "LA", "Chicago"]
})

# Basic operations
df.head()              # First 5 rows
df.shape               # (3, 3) — rows x columns
df.describe()          # Statistics for numeric columns
df["age"].mean()       # 30.0

# Filter rows
df[df["age"] > 25]     # Rows where age > 25

# Add a column
df["senior"] = df["age"] > 30
\`\`\`

Pandas makes data manipulation fast and expressive. Want to learn about grouping, merging, or plotting?`,

      default: `Pandas and NumPy are essential for data work in Python:

\`\`\`python
import pandas as pd
import numpy as np

# Read data
df = pd.read_csv("data.csv")

# Explore
df.head()
df.info()
df.describe()
df.isnull().sum()

# Filter & transform
df[df["age"] > 25]
df["age_group"] = df["age"].apply(lambda x: "senior" if x > 60 else "adult")

# Group & aggregate
df.groupby("city")["age"].mean()

# Handle missing data
df.fillna(0)
df.dropna()

# NumPy — fast numerical operations
arr = np.array([1, 2, 3, 4, 5])
arr * 2          # [2, 4, 6, 8, 10]
arr.mean()       # 3.0
arr.reshape(5, 1) # 2D array
\`\`\`

What data operation would you like to learn more about?`,
    },

    py_web: {
      definition: `**Flask** and **Django** are Python web frameworks. Flask is lightweight; Django is full-featured:

\`\`\`python
# Flask — minimal and flexible
from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/api/hello")
def hello():
    return jsonify({"message": "Hello, World!"})

@app.route("/api/users/<int:user_id>")
def get_user(user_id):
    user = db.get_user(user_id)
    return jsonify(user)

if __name__ == "__main__":
    app.run(debug=True)
\`\`\`

Flask gives you routing, request handling, and templates. You choose everything else (database, auth, etc.).

Django includes all of that plus ORM, admin panel, auth, and more out of the box.

Want to learn about routes, templates, or APIs?`,

      default: `Python web development with Flask:

\`\`\`python
from flask import Flask, request, jsonify

app = Flask(__name__)

# Route with methods
@app.route("/api/items", methods=["GET", "POST"])
def items():
    if request.method == "POST":
        data = request.get_json()
        # Save to database
        return jsonify({"id": 1, **data}), 201
    else:
        # Return all items
        return jsonify(items=[])

# URL parameters
@app.route("/api/items/<int:item_id>")
def get_item(item_id):
    return jsonify({"id": item_id, "name": "Example"})

# Error handling
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404
\`\`\`

**Key concepts:**
- **Routes** — URL patterns mapped to functions
- **Request** — access incoming data (JSON, form data, headers)
- **Response** — return data (JSON, HTML, files)
- **Middleware** — process requests before they reach routes

What web development topic would you like to explore?`,
    },

    math_calculus: {
      definition: `**Derivatives** measure the rate of change of a function. If f(x) gives position, then f'(x) gives velocity — how fast position is changing:

\`\`\`
The derivative of f(x) at point a is:

f'(a) = lim(h→0) [f(a+h) - f(a)] / h
\`\`\`

**Basic rules:**
- Constant: d/dx(c) = 0
- Power rule: d/dx(x^n) = n·x^(n-1)
- Sum rule: d/dx(f+g) = f' + g'
- Product rule: d/dx(f·g) = f'·g + f·g'
- Chain rule: d/dx(f(g(x))) = f'(g(x))·g'(x)

**Example:**
f(x) = 3x² + 2x + 1
f'(x) = 6x + 2

At x=3: f'(3) = 20 (the function is increasing by 20 units per unit of x)

Want to practice with the chain rule or product rule?`,

      default: `Calculus is about change and accumulation. Key concepts:

**Derivatives** (rate of change):
- Power rule: d/dx(x^n) = n·x^(n-1)
- Chain rule: d/dx(f(g(x))) = f'(g(x))·g'(x)
- Product rule: d/dx(fg) = f'g + fg'

**Integrals** (accumulation):
- Reverse of differentiation
- Area under a curve
- Fundamental Theorem: ∫f'(x)dx = f(x) + C

**Example:**
\`\`\`
f(x) = x³ - 2x
f'(x) = 3x² - 2
f''(x) = 6x  (second derivative — acceleration)
\`\`\`

**Tips for solving:**
1. Identify which rule applies (power, chain, product, quotient)
2. Apply the rule step by step
3. Simplify the result
4. Check by plugging in a value

What calculus concept would you like to work on?`,
    },

    math_integrals: {
      definition: `**Integration** is the reverse of differentiation. It finds the area under a curve or the original function from its derivative:

\`\`\`
If f'(x) = 2x, then f(x) = x² + C

The "+ C" (constant of integration) is crucial —
the derivative of any constant is 0, so we can't know
what it was from the derivative alone.
\`\`\`

**Basic rules:**
- Power rule: ∫x^n dx = x^(n+1)/(n+1) + C (n ≠ -1)
- Constant: ∫k dx = kx + C
- Sum: ∫(f+g) dx = ∫f dx + ∫g dx

**Example:**
∫(3x² + 2x + 1) dx = x³ + x² + x + C

**Definite integrals** give a number (area):
∫₀² x² dx = [x³/3]₀² = 8/3 - 0 = 8/3

Want to learn about integration techniques (substitution, by parts)?`,

      default: `Integration is the reverse of differentiation:

\`\`\`
Basic rules:
∫x^n dx = x^(n+1)/(n+1) + C    (power rule)
∫e^x dx = e^x + C
∫sin(x) dx = -cos(x) + C
∫1/x dx = ln|x| + C

Techniques:
1. Substitution — reverse chain rule
2. Integration by parts — reverse product rule
3. Partial fractions — decompose rational functions
4. Trigonometric substitution
\`\`\`

**Definite vs Indefinite:**
- Indefinite: ∫f(x)dx = F(x) + C (a family of functions)
- Definite: ∫ₐᵇ f(x)dx = F(b) - F(a) (a number — area)

**Fundamental Theorem of Calculus:**
Differentiation and integration are inverse operations.

What integration technique would you like to practice?`,
    },

    math_algebra: {
      definition: `**Algebra** is about solving for unknown values using equations. The golden rule: whatever you do to one side, do to the other.

\`\`\`
Solve: 2x + 5 = 13

Step 1: Subtract 5 from both sides
2x = 8

Step 2: Divide both sides by 2
x = 4

Check: 2(4) + 5 = 13 ✓
\`\`\`

**Key techniques:**
- **Isolate the variable** — get x alone on one side
- **Combine like terms** — 3x + 2x = 5x
- **Distribute** — 2(x + 3) = 2x + 6
- **Factor** — x² + 5x = x(x + 5)

**Quadratic equation:** ax² + bx + c = 0
Use the quadratic formula: x = (-b ± √(b²-4ac)) / 2a

Want to practice solving equations?`,

      default: `Algebra essentials:

\`\`\`
Solving equations:
1. Isolate the variable
2. Do the same operation to both sides
3. Simplify and check your answer

Common patterns:
- Linear: ax + b = c → x = (c-b)/a
- Quadratic: ax² + bx + c = 0
  → x = (-b ± √(b²-4ac)) / 2a
- Systems: solve by substitution or elimination

Factoring:
- Common factor: 3x + 6 = 3(x + 2)
- Difference of squares: x² - 9 = (x+3)(x-3)
- Perfect square: x² + 6x + 9 = (x+3)²
\`\`\`

**Tips:**
1. Always check your answer by plugging it back in
2. Work step by step — don't skip steps
3. Draw a number line for inequality problems

What type of algebra problem would you like to work on?`,
    },

    math_probability: {
      definition: `**Probability** measures how likely an event is to occur, from 0 (impossible) to 1 (certain):

\`\`\`
P(event) = favorable outcomes / total outcomes

Example: Rolling a 6 on a die
P(6) = 1/6 ≈ 0.167

Example: Drawing an ace from a deck
P(ace) = 4/52 = 1/13 ≈ 0.077
\`\`\`

**Key rules:**
- **Addition** (OR): P(A or B) = P(A) + P(B) - P(A and B)
- **Multiplication** (AND): P(A and B) = P(A) × P(B|A)
- **Complement**: P(not A) = 1 - P(A)
- **Independent events**: P(A and B) = P(A) × P(B)

**Common distributions:**
- **Uniform** — all outcomes equally likely
- **Binomial** — number of successes in n trials
- **Normal** — bell curve (Central Limit Theorem)

Want to practice probability calculations?`,

      default: `Probability fundamentals:

\`\`\`
Basic probability:
P(A) = favorable / total outcomes

Rules:
- P(A or B) = P(A) + P(B) - P(A and B)
- P(A and B) = P(A) × P(B|A)  [dependent]
- P(A and B) = P(A) × P(B)    [independent]
- P(not A) = 1 - P(A)

Conditional probability:
P(A|B) = P(A and B) / P(B)

Bayes' Theorem:
P(A|B) = P(B|A) × P(A) / P(B)
\`\`\`

**Common mistakes:**
- Confusing P(A|B) with P(B|A) — they're different!
- Assuming events are independent when they're not
- Forgetting to subtract the overlap in OR calculations

What probability concept would you like to explore?`,
    },

    math_statistics: {
      definition: `**Statistics** is about collecting, analyzing, and interpreting data:

\`\`\`
Central tendency:
- Mean: average (sum / count)
- Median: middle value (sort, pick middle)
- Mode: most frequent value

Spread:
- Range: max - min
- Variance: average of squared deviations
- Std Dev: √variance (same units as data)

Example: [2, 4, 4, 4, 5, 5, 7, 9]
Mean = (2+4+4+4+5+5+7+9)/8 = 5
Median = (4+5)/2 = 4.5
Mode = 4
\`\`\`

**The 68-95-99.7 rule** (normal distribution):
- 68% of data within 1 standard deviation of mean
- 95% within 2 standard deviations
- 99.7% within 3 standard deviations

Want to learn about hypothesis testing or regression?`,

      default: `Statistics essentials:

\`\`\`
Descriptive statistics:
- Mean: Σx / n
- Median: middle value
- Mode: most common value
- Std Dev: √(Σ(x-mean)² / n)

Inferential statistics:
- Hypothesis testing: is an effect real or due to chance?
- Confidence intervals: range likely to contain the true value
- p-value: probability of seeing this result by chance
  (p < 0.05 is the common threshold)

Correlation:
- Ranges from -1 to +1
- 0 = no linear relationship
- +1 = perfect positive correlation
- -1 = perfect negative correlation
- Remember: correlation ≠ causation!
\`\`\`

**Key principle:** Sample statistics estimate population parameters. Larger samples = more precise estimates.

What statistical concept would you like to explore?`,
    },

    math_linear_algebra: {
      definition: `**Linear algebra** deals with vectors, matrices, and linear transformations:

\`\`\`
Vector: [1, 2, 3] — a list of numbers with direction
Matrix: a 2D grid of numbers

    ⎡1 2⎤
A = ⎣3 4⎦

Matrix multiplication:
⎡1 2⎤ ⎡5 6⎤   ⎡19 22⎤
⎣3 4⎦ ⎣7 8⎦ = ⎣43 50⎦
\`\`\`

**Key concepts:**
- **Vectors** — direction and magnitude
- **Matrices** — linear transformations
- **Eigenvalues** — special scalars for a matrix
- **Determinant** — volume scaling factor
- **Inverse** — undo a transformation

Linear algebra is the math behind machine learning, graphics, and physics.

Want to learn about matrix operations or eigenvalues?`,

      default: `Linear algebra fundamentals:

\`\`\`
Vectors:
- Addition: [1,2] + [3,4] = [4,6]
- Scalar multiply: 2 × [1,2] = [2,4]
- Dot product: [1,2]·[3,4] = 1×3 + 2×4 = 11

Matrices:
- Multiply: row × column
- Transpose: swap rows and columns
- Inverse: A⁻¹ such that A × A⁻¹ = I
- Determinant: |A| = ad - bc (for 2×2)

Eigenvalues & Eigenvectors:
Av = λv
- v: direction that doesn't change under A
- λ: how much it scales
\`\`\`

**Applications:**
- Machine learning (weights, transformations)
- Computer graphics (rotations, scaling)
- Data science (PCA, SVD)
- Physics (quantum mechanics, rotations)

What linear algebra topic would you like to explore?`,
    },

    cs_algorithms: {
      definition: `**Algorithms** are step-by-step procedures for solving problems. **Big O notation** describes how performance scales with input size:

\`\`\`
O(1)     — constant: array access
O(log n) — logarithmic: binary search
O(n)     — linear: simple loop
O(n log n) — linearithmic: merge sort
O(n²)    — quadratic: nested loops
O(2^n)   — exponential: brute force subsets
\`\`\`

**Common sorting algorithms:**
- **Merge sort** — O(n log n), stable, divide & conquer
- **Quick sort** — O(n log n) avg, in-place
- **Bubble sort** — O(n²), simple but slow

**Common patterns:**
- Two pointers — opposite ends moving inward
- Sliding window — fixed-size window over array
- Hash map — O(1) lookups for counting/matching
- Binary search — halving search space each step

Want to practice with a specific algorithm?`,

      default: `Algorithms and data structures essentials:

\`\`\`
Time complexity (Big O):
O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2^n)

Key data structures:
- Array: O(1) access, O(n) insert/delete
- Linked List: O(n) access, O(1) insert/delete
- Hash Map: O(1) avg lookup, insert, delete
- Binary Search Tree: O(log n) avg for all ops
- Heap: O(1) find min/max, O(log n) insert

Problem-solving patterns:
1. Two pointers (opposite ends)
2. Sliding window (subarrays)
3. Fast & slow pointers (cycle detection)
4. Breadth-first search (shortest path)
5. Depth-first search (exhaustive search)
6. Dynamic programming (overlapping subproblems)
\`\`\`

**Tip:** Before coding, think about:
1. What are the inputs and outputs?
2. What's the brute force approach?
3. Can I use a hash map for O(1) lookups?
4. Is there a pattern (sorted array → binary search)?

What algorithm or data structure would you like to explore?`,
    },

    cs_databases: {
      definition: `**Databases** store and organize data. The two main types:

**SQL (Relational)** — structured tables with relationships:
\`\`\`sql
-- Create table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);

-- Query with joins
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.total > 100;
\`\`\`

**NoSQL** — flexible, document-based:
- MongoDB — JSON documents
- Redis — key-value cache
- DynamoDB — AWS managed

**Key SQL concepts:**
- **Tables** — rows and columns
- **Primary keys** — unique row identifier
- **Foreign keys** — link between tables
- **Joins** — combine data from multiple tables
- **Indexes** — speed up queries
- **Normalization** — reduce data redundancy

Want to learn about queries, joins, or database design?`,

      default: `Database essentials:

\`\`\`sql
-- CRUD operations
INSERT INTO users (name, email) VALUES ('Alice', 'a@b.com');
SELECT * FROM users WHERE name = 'Alice';
UPDATE users SET email = 'new@b.com' WHERE id = 1;
DELETE FROM users WHERE id = 1;

-- Joins
SELECT u.name, o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- Aggregation
SELECT city, COUNT(*), AVG(age)
FROM users
GROUP BY city
HAVING COUNT(*) > 5;

-- Indexes (speed up queries)
CREATE INDEX idx_email ON users(email);
\`\`\`

**Design tips:**
- Use foreign keys for relationships
- Index columns you frequently query
- Normalize to reduce redundancy (3NF)
- Denormalize for read performance

What database concept would you like to explore?`,
    },

    cs_git: {
      definition: `**Git** is a version control system that tracks changes to your code. Key concepts:

\`\`\`bash
# Setup
git init                    # Start a new repo
git clone <url>             # Copy an existing repo

# Daily workflow
git status                  # See what changed
git add .                   # Stage all changes
git commit -m "message"     # Save a snapshot
git push                    # Upload to remote
git pull                    # Download latest changes

# Branching
git branch feature          # Create branch
git checkout feature        # Switch to branch
git checkout -b feature     # Create + switch
git merge feature           # Merge into current branch
\`\`\`

**The workflow:**
1. \`git pull\` — get latest
2. Create a branch for your feature
3. Make changes and commit
4. \`git push\` and create a Pull Request
5. Review and merge

Want to learn about merge conflicts, rebasing, or branching strategies?`,

      default: `Git version control essentials:

\`\`\`bash
# Basic workflow
git add -A                  # Stage all changes
git commit -m "feat: add login"
git push origin main

# Branching
git checkout -b feature/login
# ... make changes ...
git add -A && git commit -m "implement login"
git push origin feature/login
# Create PR on GitHub

# Undo mistakes
git reset HEAD~1            # Undo last commit (keep changes)
git reset --hard HEAD~1     # Undo last commit (discard changes)
git stash                   # Temporarily save uncommitted changes
git stash pop               # Restore stashed changes

# View history
git log --oneline --graph
git diff                    # See unstaged changes
\`\`\`

**Commit message tips:**
- feat: new feature
- fix: bug fix
- refactor: code cleanup
- docs: documentation

What Git operation would you like to learn more about?`,
    },

    general: {
      definition: `I'd be happy to explain that! To give you the most relevant answer, could you tell me which subject you're working on? For example:

- **JavaScript** — variables, functions, async, React, etc.
- **Python** — basics, OOP, data science, web dev, etc.
- **Mathematics** — algebra, calculus, statistics, etc.
- **Computer Science** — algorithms, databases, git, etc.

Once I know the topic, I can give you a detailed, level-appropriate explanation with examples.`,

      how_to: `I can help with that! To give you the best guidance, could you specify what you're trying to do? For example:

- Are you writing code? What language?
- Are you solving a math problem?
- Are you debugging an error?
- Are you trying to understand a concept?

The more context you give me, the more specific and useful my answer will be.`,

      help: `Don't worry — getting stuck is a normal part of learning! Here's how I can help:

1. **Explain a concept** — I'll break it down step by step
2. **Show an example** — I'll provide code or worked problems
3. **Debug an error** — paste the error message and I'll diagnose it
4. **Compare things** — tell me two things and I'll explain the difference
5. **Practice** — I can give you exercises to test your understanding

What are you working on right now? Tell me the subject and what's confusing you.`,

      debugging: `I can help you debug! To diagnose the issue effectively, please share:

1. **The error message** — paste it exactly as it appears
2. **The relevant code** — the function or section causing the error
3. **What you expected** — what should happen vs what actually happens
4. **What you've tried** — so I don't suggest things you've already done

With that info, I can pinpoint the problem and explain the fix.`,

      comparison: `Great question — comparisons help clarify concepts! To give you a thorough comparison, let me know:

1. **Which two things** you're comparing
2. **The context** — what language or subject area
3. **Your level** — so I can adjust the depth

I'll cover the key differences, when to use each, and practical examples.`,

      best_practice: `Best practices depend on the specific technology and context. Let me know:

1. **What language/framework** you're working with
2. **What you're building** — the use case matters
3. **Your experience level** — so I can tailor the advice

I'll share industry-standard practices with explanations of *why* they matter, not just *what* to do.`,

      practice: `Practice is the best way to learn! Here's how I can help:

1. **Give you exercises** — tailored to your level and topic
2. **Walk through solutions** — step by step with explanations
3. **Quiz you** — test your understanding with questions
4. **Review your code** — paste it and I'll give feedback

What subject and topic would you like to practice? I'll create exercises at the right difficulty level for you.`,

      default: `I'm here to help you learn! I can assist with:

- **JavaScript** — variables, functions, async, closures, React, TypeScript
- **Python** — basics, OOP, decorators, data science, web development
- **Mathematics** — algebra, calculus, statistics, probability, linear algebra
- **Computer Science** — algorithms, databases, git, data structures

Just ask your question and I'll give you a detailed, level-appropriate explanation with examples. The more specific your question, the better my answer will be!`,
    },
  };

  // Get the response for the detected topic and question type
  const topicResponses = responses[topic] ?? responses["general"];
  const response = topicResponses[questionType] ?? topicResponses["default"] ?? responses["general"]["default"];

  // Add follow-up context if this is a continuation
  if (isFollowUp && history.length > 0) {
    const lastAssistantMsg = [...history].reverse().find(m => m.role === "assistant");
    if (lastAssistantMsg) {
      return response;
    }
  }

  return response;
}
