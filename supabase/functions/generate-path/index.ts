import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PathRequest {
  user_id: string;
  subject_id: string;
  subject_name: string;
  learning_style: string;
  knowledge_level: string;
  goals: string[];
}

type ModuleData = {
  title: string;
  description: string;
  content_type: string;
  sections: Array<{ title: string; content: string }>;
  questions: Array<{ id: string; text: string; options: string[]; correct_index: number; explanation: string }>;
  xp_reward: number;
  estimated_minutes: number;
};

type SubjectContent = Record<string, ModuleData[]>;

const SUBJECT_CONTENT: Record<string, SubjectContent> = {
  JavaScript: {
    beginner: [
      {
        title: "Variables and Data Types",
        description: "Learn the building blocks of JavaScript: variables, strings, numbers, and booleans",
        content_type: "lesson",
        sections: [
          { title: "What are Variables?", content: "Variables are containers for storing data values. In JavaScript, you can declare variables using let, const, or var.\n\nlet name = 'Alice';  // can be reassigned\nconst age = 25;      // cannot be reassigned\nvar old = true;     // older syntax, avoid in modern code\n\nUse 'const' by default, and 'let' when you need to reassign. Avoid 'var' in modern JavaScript." },
          { title: "Data Types", content: "JavaScript has several primitive data types:\n\n1. String - text data: 'Hello' or \"World\"\n2. Number - integers and decimals: 42, 3.14\n3. Boolean - true or false\n4. undefined - variable declared but not assigned\n5. null - intentionally empty value\n\nYou can check types using typeof:\n\ntypeof 'hello'  // 'string'\ntypeof 42       // 'number'\ntypeof true     // 'boolean'" },
          { title: "Practice: Working with Variables", content: "Try these exercises:\n\n1. Declare a const called 'greeting' with the value 'Hello, World!'\n2. Declare a let called 'counter' with the value 0, then increment it by 1\n3. Create variables to store your name, age, and whether you like JavaScript\n\nRemember: const for values that won't change, let for values that will." },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 20,
      },
      {
        title: "Variables Quiz",
        description: "Test your understanding of JavaScript variables and data types",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "Which keyword declares a variable that cannot be reassigned?", options: ["var", "let", "const", "function"], correct_index: 2, explanation: "const declares a variable that cannot be reassigned after initialization." },
          { id: "q2", text: "What is the output of: typeof null?", options: ["'null'", "'undefined'", "'object'", "'boolean'"], correct_index: 2, explanation: "This is a famous JavaScript quirk - typeof null returns 'object'." },
          { id: "q3", text: "Which is the preferred way to declare variables in modern JavaScript?", options: ["var", "let", "const", "All are equally preferred"], correct_index: 2, explanation: "const is preferred by default. Use let only when you need to reassign." },
          { id: "q4", text: "What value does an uninitialized variable have?", options: ["null", "0", "undefined", "NaN"], correct_index: 2, explanation: "Variables that are declared but not assigned a value have the value undefined." },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "Functions and Scope",
        description: "Understand how to create reusable code with functions and how scope works",
        content_type: "lesson",
        sections: [
          { title: "Function Declarations", content: "Functions are reusable blocks of code:\n\n// Function declaration\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// Arrow function\nconst add = (a, b) => a + b;\n\n// Function expression\nconst multiply = function(a, b) {\n  return a * b;\n};\n\nArrow functions are concise and commonly used in modern JavaScript." },
          { title: "Scope", content: "Scope determines where variables are accessible:\n\n1. Global scope - accessible everywhere\n2. Function scope - accessible within the function\n3. Block scope - accessible within {} (let/const only)\n\nfunction example() {\n  const x = 10;  // function scope\n  if (true) {\n    const y = 20;  // block scope\n    var z = 30;    // function scope (var ignores blocks)\n  }\n  // x is accessible here\n  // y is NOT accessible here\n  // z IS accessible here (var)\n}" },
        ],
        questions: [],
        xp_reward: 20,
        estimated_minutes: 25,
      },
      {
        title: "Functions Quiz",
        description: "Test your knowledge of functions and scope",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is the syntax for an arrow function that adds two numbers?", options: ["function(a,b) { return a+b }", "(a, b) => a + b", "a, b => a + b", "def (a, b) => a + b"], correct_index: 1, explanation: "Arrow functions use the => syntax: (parameters) => expression" },
          { id: "q2", text: "A variable declared with let inside an if block is:", options: ["Accessible everywhere", "Accessible only within the block", "Accessible in the function", "Not accessible at all"], correct_index: 1, explanation: "let and const have block scope." },
          { id: "q3", text: "What does a function return if no return statement is provided?", options: ["0", "null", "undefined", "An error is thrown"], correct_index: 2, explanation: "Functions without a return statement implicitly return undefined." },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "Build a Calculator",
        description: "Apply your knowledge by building a simple calculator using functions",
        content_type: "project",
        sections: [
          { title: "Project Overview", content: "Build a calculator that can perform basic operations: add, subtract, multiply, and divide.\n\nRequirements:\n1. Create functions for each operation\n2. Handle division by zero\n3. Create a function that takes an operator and two numbers\n4. Return meaningful error messages" },
          { title: "Implementation Steps", content: "Step 1: Create operation functions\nconst add = (a, b) => a + b;\nconst subtract = (a, b) => a - b;\nconst multiply = (a, b) => a * b;\nconst divide = (a, b) => {\n  if (b === 0) return 'Error: Division by zero';\n  return a / b;\n};\n\nStep 2: Create a calculator function\nfunction calculate(operator, a, b) {\n  switch(operator) {\n    case '+': return add(a, b);\n    case '-': return subtract(a, b);\n    case '*': return multiply(a, b);\n    case '/': return divide(a, b);\n    default: return 'Unknown operator';\n  }\n}" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 45,
      },
    ],
    intermediate: [
      {
        title: "Closures and Higher-Order Functions",
        description: "Master closures and learn to write higher-order functions",
        content_type: "lesson",
        sections: [
          { title: "Closures", content: "A closure is a function that remembers variables from its outer scope even after the outer function has returned.\n\nfunction createCounter() {\n  let count = 0;\n  return {\n    increment: () => ++count,\n    getCount: () => count,\n  };\n}\n\nconst counter = createCounter();\ncounter.increment(); // 1\ncounter.increment(); // 2" },
          { title: "Higher-Order Functions", content: "Higher-order functions take functions as arguments or return functions:\n\n[1, 2, 3].map(n => n * 2);  // [2, 4, 6]\n[1, 2, 3, 4].filter(n => n > 2);  // [3, 4]\n[1, 2, 3].reduce((sum, n) => sum + n, 0);  // 6" },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "Closures Quiz",
        description: "Test your understanding of closures and higher-order functions",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is a closure?", options: ["A function that closes the program", "A function that remembers its outer scope variables", "A way to close browser tabs", "A type of loop"], correct_index: 1, explanation: "A closure retains access to variables from its enclosing scope." },
          { id: "q2", text: "What does [1,2,3].map(n => n * 2) return?", options: ["[1,2,3]", "[2,4,6]", "[1,4,9]", "6"], correct_index: 1, explanation: "map transforms each element using the provided function." },
          { id: "q3", text: "Which array method combines all elements into a single value?", options: ["map", "filter", "reduce", "forEach"], correct_index: 2, explanation: "reduce combines all array elements into a single value." },
        ],
        xp_reward: 25,
        estimated_minutes: 10,
      },
      {
        title: "Async JavaScript",
        description: "Learn Promises, async/await, and handling asynchronous operations",
        content_type: "lesson",
        sections: [
          { title: "Promises", content: "Promises represent values that may not be available yet:\n\nconst fetchData = new Promise((resolve, reject) => {\n  setTimeout(() => resolve('Data loaded!'), 1000);\n});\n\nfetchData.then(data => console.log(data)).catch(error => console.error(error));" },
          { title: "Async/Await", content: "Async/await makes Promises easier to read:\n\nasync function getData() {\n  try {\n    const response = await fetch('https://api.example.com/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Failed:', error);\n  }\n}\n\nKey points:\n- async before a function makes it return a Promise\n- await pauses execution until the Promise resolves\n- Always use try/catch for error handling" },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "Async Quiz",
        description: "Test your knowledge of async JavaScript",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What does async before a function do?", options: ["Makes it run faster", "Makes it return a Promise", "Makes it synchronous", "Nothing special"], correct_index: 1, explanation: "The async keyword makes a function implicitly return a Promise." },
          { id: "q2", text: "What happens if you use await outside an async function?", options: ["It works fine", "Syntax error", "Returns undefined", "Creates a new thread"], correct_index: 1, explanation: "await can only be used inside async functions." },
          { id: "q3", text: "What are the three states of a Promise?", options: ["start, middle, end", "pending, fulfilled, rejected", "open, closed, error", "loading, success, failure"], correct_index: 1, explanation: "A Promise starts as pending, then becomes either fulfilled or rejected." },
        ],
        xp_reward: 25,
        estimated_minutes: 10,
      },
      {
        title: "Build a Weather App",
        description: "Create a weather app using async/await and API calls",
        content_type: "project",
        sections: [
          { title: "Project Setup", content: "Build a weather app that fetches and displays weather data.\n\nRequirements:\n1. Use async/await for API calls\n2. Handle loading states\n3. Handle errors gracefully\n4. Display temperature, conditions, and forecast" },
          { title: "Implementation", content: "async function getWeather(city) {\n  try {\n    const response = await fetch(`https://api.weather.com/v1/${city}`);\n    if (!response.ok) throw new Error('City not found');\n    const data = await response.json();\n    return {\n      temp: data.main.temp,\n      conditions: data.weather[0].description,\n      humidity: data.main.humidity,\n    };\n  } catch (error) {\n    return { error: error.message };\n  }\n}" },
        ],
        questions: [],
        xp_reward: 40,
        estimated_minutes: 60,
      },
    ],
    advanced: [
      {
        title: "Design Patterns in JavaScript",
        description: "Explore common design patterns and their JavaScript implementations",
        content_type: "lesson",
        sections: [
          { title: "Module Pattern", content: "The Module Pattern encapsulates private state and exposes a public API:\n\nconst UserModule = (() => {\n  const users = [];  // private\n  return {\n    add(user) { users.push(user); },\n    getAll() { return [...users]; },\n    count() { return users.length; },\n  };\n})();" },
          { title: "Observer Pattern", content: "The Observer Pattern allows objects to subscribe and react to events:\n\nclass EventEmitter {\n  #listeners = new Map();\n  on(event, callback) {\n    if (!this.#listeners.has(event)) this.#listeners.set(event, []);\n    this.#listeners.get(event).push(callback);\n  }\n  emit(event, data) {\n    this.#listeners.get(event)?.forEach(cb => cb(data));\n  }\n}" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 35,
      },
      {
        title: "Design Patterns Quiz",
        description: "Test your knowledge of JavaScript design patterns",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is the main benefit of the Module Pattern?", options: ["Faster execution", "Encapsulation of private state", "Easier syntax", "Better error handling"], correct_index: 1, explanation: "The Module Pattern encapsulates private implementation details while exposing a clean public API." },
          { id: "q2", text: "In the Observer Pattern, what does 'emit' do?", options: ["Creates a new observer", "Notifies all subscribers of an event", "Removes an observer", "Pauses notifications"], correct_index: 1, explanation: "emit() notifies all registered listeners that a specific event has occurred." },
          { id: "q3", text: "Which pattern is best for creating a single shared instance?", options: ["Observer", "Module", "Singleton", "Factory"], correct_index: 2, explanation: "The Singleton pattern ensures a class has only one instance." },
        ],
        xp_reward: 30,
        estimated_minutes: 10,
      },
      {
        title: "Build a State Management Library",
        description: "Create a mini Redux-like state management system from scratch",
        content_type: "project",
        sections: [
          { title: "Architecture", content: "Build a state management library with:\n1. A central store holding application state\n2. Actions that describe state changes\n3. A reducer function that handles actions\n4. Subscribers that react to state changes" },
          { title: "Implementation", content: "function createStore(reducer, initialState) {\n  let state = initialState;\n  const listeners = [];\n  return {\n    getState() { return state; },\n    dispatch(action) {\n      state = reducer(state, action);\n      listeners.forEach(fn => fn(state));\n    },\n    subscribe(fn) {\n      listeners.push(fn);\n      return () => listeners.splice(listeners.indexOf(fn), 1);\n    },\n  };\n}" },
        ],
        questions: [],
        xp_reward: 50,
        estimated_minutes: 90,
      },
    ],
  },

  Python: {
    beginner: [
      {
        title: "Python Basics: Variables and Types",
        description: "Learn Python variables, data types, and basic operations",
        content_type: "lesson",
        sections: [
          { title: "Variables in Python", content: "Python is dynamically typed - no need to declare variable types:\n\nname = 'Alice'      # string\nage = 25            # integer\nheight = 5.7        # float\nis_student = True   # boolean\n\nPython uses snake_case by convention for variable names." },
          { title: "Strings and Operations", content: "Python has powerful string operations:\n\ngreeting = 'Hello' + ' ' + 'World'  # concatenation\nrepeated = 'Ha' * 3                   # 'HaHaHa'\nformatted = f'I am {age} years old'   # f-strings\n\nUseful string methods:\n'hello'.upper()       # 'HELLO'\n'  spaces  '.strip()  # 'spaces'\n'hello world'.split() # ['hello', 'world']" },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 20,
      },
      {
        title: "Python Basics Quiz",
        description: "Test your understanding of Python basics",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "How do you create an f-string in Python?", options: ["'Hello {name}'", "f'Hello {name}'", "'Hello %s' % name", "'Hello' + name"], correct_index: 1, explanation: "f-strings are prefixed with 'f' and allow embedding expressions inside curly braces." },
          { id: "q2", text: "What is the output of: type(3.14)?", options: ["<class 'int'>", "<class 'float'>", "<class 'number'>", "<class 'decimal'>"], correct_index: 1, explanation: "3.14 is a floating-point number, so type() returns <class 'float'>." },
          { id: "q3", text: "Which naming convention does Python prefer for variables?", options: ["camelCase", "PascalCase", "snake_case", "kebab-case"], correct_index: 2, explanation: "Python's PEP 8 style guide recommends snake_case for variable and function names." },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "Control Flow and Loops",
        description: "Master if/else statements, for loops, and while loops in Python",
        content_type: "lesson",
        sections: [
          { title: "Conditional Statements", content: "Python uses indentation for code blocks:\n\nscore = 85\nif score >= 90:\n    grade = 'A'\nelif score >= 80:\n    grade = 'B'\nelse:\n    grade = 'F'\n\nNote: Python uses 'elif' instead of 'else if'." },
          { title: "Loops", content: "Python has two main loop types:\n\n# For loop\nfor i in range(5):\n    print(i)  # 0, 1, 2, 3, 4\n\n# While loop\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n\nUse 'break' to exit early and 'continue' to skip an iteration." },
        ],
        questions: [],
        xp_reward: 20,
        estimated_minutes: 25,
      },
      {
        title: "Build a Number Guessing Game",
        description: "Create an interactive number guessing game using Python",
        content_type: "project",
        sections: [
          { title: "Project Overview", content: "Build a number guessing game where:\n1. The computer picks a random number\n2. The player guesses the number\n3. The game gives hints (too high/too low)\n4. Track the number of attempts" },
          { title: "Implementation", content: "import random\n\ndef guessing_game():\n    number = random.randint(1, 100)\n    attempts = 0\n    print('Guess a number between 1 and 100!')\n    while True:\n        guess = int(input('Your guess: '))\n        attempts += 1\n        if guess < number:\n            print('Too low!')\n        elif guess > number:\n            print('Too high!')\n        else:\n            print(f'Correct! You got it in {attempts} attempts!')\n            break" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 45,
      },
    ],
    intermediate: [
      {
        title: "Object-Oriented Programming",
        description: "Learn classes, objects, inheritance, and polymorphism in Python",
        content_type: "lesson",
        sections: [
          { title: "Classes and Objects", content: "Classes are blueprints for creating objects:\n\nclass Dog:\n    def __init__(self, name, breed):\n        self.name = name\n        self.breed = breed\n    \n    def bark(self):\n        return f'{self.name} says Woof!'\n\ndog = Dog('Buddy', 'Golden Retriever')\nprint(dog.bark())" },
          { title: "Inheritance", content: "Inheritance lets you create specialized classes:\n\nclass Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        raise NotImplementedError\n\nclass Cat(Animal):\n    def speak(self):\n        return f'{self.name} says Meow!'\n\nclass Dog(Animal):\n    def speak(self):\n        return f'{self.name} says Woof!'" },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "OOP Quiz",
        description: "Test your understanding of Python OOP concepts",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What does __init__ do in a Python class?", options: ["Destroys the object", "Initializes the object", "Imports a module", "Creates a class variable"], correct_index: 1, explanation: "__init__ is the constructor method that initializes a new object's attributes." },
          { id: "q2", text: "What does 'self' refer to in a Python method?", options: ["The class itself", "The current instance", "The parent class", "A global variable"], correct_index: 1, explanation: "'self' refers to the current instance of the class." },
          { id: "q3", text: "What is polymorphism?", options: ["Having many forms", "Data hiding", "Code reuse", "Variable typing"], correct_index: 0, explanation: "Polymorphism means 'many forms' - different classes can implement the same method differently." },
        ],
        xp_reward: 25,
        estimated_minutes: 10,
      },
      {
        title: "Build a Library Management System",
        description: "Create an OOP-based library system with books, members, and borrowing",
        content_type: "project",
        sections: [
          { title: "Project Overview", content: "Build a library system with:\n1. Book class with title, author, availability\n2. Member class with name, borrowed books\n3. Library class managing the collection\n4. Borrow/return functionality" },
          { title: "Implementation", content: "class Book:\n    def __init__(self, title, author):\n        self.title = title\n        self.author = author\n        self.is_available = True\n\nclass Member:\n    def __init__(self, name):\n        self.name = name\n        self.borrowed = []\n    \n    def borrow(self, book):\n        if book.is_available:\n            book.is_available = False\n            self.borrowed.append(book)\n            return True\n        return False" },
        ],
        questions: [],
        xp_reward: 40,
        estimated_minutes: 60,
      },
    ],
    advanced: [
      {
        title: "Decorators and Metaclasses",
        description: "Master Python's advanced OOP features",
        content_type: "lesson",
        sections: [
          { title: "Decorators", content: "Decorators modify function behavior without changing the function:\n\ndef timer(func):\n    import time\n    def wrapper(*args, **kwargs):\n        start = time.time()\n        result = func(*args, **kwargs)\n        print(f'{func.__name__} took {time.time()-start:.4f}s')\n        return result\n    return wrapper\n\n@timer\ndef slow_function():\n    time.sleep(1)" },
          { title: "Context Managers", content: "Context managers handle setup and teardown:\n\nclass DatabaseConnection:\n    def __init__(self, url):\n        self.url = url\n    def __enter__(self):\n        self.connect()\n        return self\n    def __exit__(self, *args):\n        self.disconnect()" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 35,
      },
      {
        title: "Advanced Python Quiz",
        description: "Test your knowledge of advanced Python features",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What does a decorator do?", options: ["Deletes a function", "Wraps a function to modify its behavior", "Creates a new class", "Handles exceptions"], correct_index: 1, explanation: "A decorator wraps a function, adding behavior without modifying its code." },
          { id: "q2", text: "What is the purpose of __enter__ and __exit__?", options: ["Class initialization and destruction", "Context manager protocol", "Operator overloading", "Iterator protocol"], correct_index: 1, explanation: "__enter__ and __exit__ implement the context manager protocol." },
          { id: "q3", text: "What does @staticmethod do?", options: ["Makes a method async", "Removes the self parameter", "Defines a method that doesn't need instance or class", "Makes a method private"], correct_index: 2, explanation: "@staticmethod defines a method that doesn't receive self or cls." },
        ],
        xp_reward: 30,
        estimated_minutes: 10,
      },
      {
        title: "Build a Plugin System",
        description: "Create an extensible plugin architecture using metaclasses and decorators",
        content_type: "project",
        sections: [
          { title: "Architecture", content: "Build a plugin system that:\n1. Auto-discovers plugins via decorators\n2. Registers plugins in a central registry\n3. Supports plugin dependencies\n4. Enables/disables plugins at runtime" },
          { title: "Implementation", content: "class PluginRegistry:\n    _plugins = {}\n    @classmethod\n    def register(cls, name):\n        def decorator(plugin_class):\n            cls._plugins[name] = plugin_class\n            return plugin_class\n        return decorator\n    @classmethod\n    def get(cls, name):\n        return cls._plugins.get(name)" },
        ],
        questions: [],
        xp_reward: 50,
        estimated_minutes: 90,
      },
    ],
  },

  Mathematics: {
    beginner: [
      {
        title: "Fundamentals of Algebra",
        description: "Learn the basics of algebraic expressions, equations, and variables",
        content_type: "lesson",
        sections: [
          { title: "What is Algebra?", content: "Algebra is about finding unknown values. We use letters (like x, y) to represent numbers we don't know yet.\n\nKey concepts:\n- Variable: a letter representing an unknown value (x, y, z)\n- Expression: a combination of numbers and variables (3x + 2)\n- Equation: a statement that two expressions are equal (3x + 2 = 14)\n- Coefficient: the number multiplied by a variable (3 in 3x)\n- Constant: a fixed number (2 in 3x + 2)" },
          { title: "Solving Simple Equations", content: "The golden rule: whatever you do to one side, do to the other.\n\nExample: Solve 2x + 4 = 10\n\nStep 1: Subtract 4 from both sides\n2x = 6\n\nStep 2: Divide both sides by 2\nx = 3\n\nCheck: 2(3) + 4 = 10  Correct!\n\nAlways check your answer by plugging it back in." },
          { title: "Practice Problems", content: "Try solving these:\n\n1. x + 5 = 12        (Answer: x = 7)\n2. 3x = 15           (Answer: x = 5)\n3. 2x - 3 = 7        (Answer: x = 5)\n4. x/4 = 5           (Answer: x = 20)\n5. 4x + 2 = 18       (Answer: x = 4)\n\nRemember: isolate x by doing the opposite operation to both sides." },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 25,
      },
      {
        title: "Algebra Quiz",
        description: "Test your understanding of basic algebra",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "Solve for x: x + 7 = 15", options: ["x = 7", "x = 8", "x = 22", "x = 15"], correct_index: 1, explanation: "Subtract 7 from both sides: x = 15 - 7 = 8" },
          { id: "q2", text: "Solve for x: 3x = 21", options: ["x = 3", "x = 7", "x = 18", "x = 24"], correct_index: 1, explanation: "Divide both sides by 3: x = 21/3 = 7" },
          { id: "q3", text: "What is a variable?", options: ["A fixed number", "A letter representing an unknown value", "A type of equation", "A mathematical operation"], correct_index: 1, explanation: "A variable is a letter (like x, y) that represents an unknown value." },
          { id: "q4", text: "Solve: 2x - 4 = 10", options: ["x = 3", "x = 5", "x = 7", "x = 14"], correct_index: 2, explanation: "Add 4: 2x = 14. Divide by 2: x = 7" },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "Working with Fractions and Decimals",
        description: "Understand fractions, decimals, and how to convert between them",
        content_type: "lesson",
        sections: [
          { title: "Fractions", content: "A fraction represents a part of a whole:\n\n- Numerator (top): how many parts you have\n- Denominator (bottom): how many equal parts total\n\nAdding fractions with same denominator:\n1/4 + 2/4 = 3/4\n\nAdding with different denominators (find common denominator):\n1/3 + 1/4 = 4/12 + 3/12 = 7/12\n\nMultiplying fractions:\n1/2 x 3/4 = 3/8 (multiply numerators, multiply denominators)" },
          { title: "Decimals", content: "Decimals are another way to write fractions:\n\n0.5 = 1/2\n0.25 = 1/4\n0.75 = 3/4\n0.333... = 1/3\n\nConverting fractions to decimals: divide numerator by denominator\n3/4 = 3 divided by 4 = 0.75\n\nConverting decimals to fractions:\n0.6 = 6/10 = 3/5 (simplify)" },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 20,
      },
      {
        title: "Fractions Quiz",
        description: "Test your understanding of fractions and decimals",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is 1/4 + 1/4?", options: ["1/8", "2/4", "1/2", "2/8"], correct_index: 1, explanation: "Add numerators with same denominator: 1/4 + 1/4 = 2/4 = 1/2" },
          { id: "q2", text: "What is 0.5 as a fraction?", options: ["1/5", "1/4", "1/2", "5/10"], correct_index: 2, explanation: "0.5 = 5/10 = 1/2 (simplified)" },
          { id: "q3", text: "What is 1/3 x 1/2?", options: ["1/5", "1/6", "2/3", "1/2"], correct_index: 1, explanation: "Multiply numerators and denominators: 1x1 / 3x2 = 1/6" },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "Real-World Math Project",
        description: "Apply algebra to solve real-world problems",
        content_type: "project",
        sections: [
          { title: "Budget Calculator", content: "Create a budget calculator:\n\nYou earn $15/hour and work 40 hours/week.\nRent is $1200/month, food is $400/month, transport is $150/month.\n\n1. Write an equation for monthly savings: S = 15(40)(4) - 1200 - 400 - 150\n2. How much do you save each month?\n3. How many months to save $5000?\n4. If rent increases by $100, how does savings change?" },
          { title: "Solution Approach", content: "Monthly income = 15 x 40 x 4 = $2400\nMonthly expenses = 1200 + 400 + 150 = $1750\nMonthly savings = 2400 - 1750 = $650\n\nMonths to save $5000: 5000/650 = 7.7 months\n\nIf rent increases by $100:\nNew savings = 2400 - 1850 = $550\nMonths to save $5000: 5000/550 = 9.1 months" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 40,
      },
    ],
    intermediate: [
      {
        title: "Quadratic Equations",
        description: "Learn to solve quadratic equations using multiple methods",
        content_type: "lesson",
        sections: [
          { title: "What are Quadratic Equations?", content: "A quadratic equation has the form: ax^2 + bx + c = 0\n\nThe highest power of x is 2. They always have two solutions (which may be the same).\n\nMethods to solve:\n1. Factoring: x^2 - 5x + 6 = 0 becomes (x-2)(x-3) = 0, so x = 2 or x = 3\n2. Quadratic formula: x = (-b +/- sqrt(b^2 - 4ac)) / 2a\n3. Completing the square" },
          { title: "The Quadratic Formula", content: "The quadratic formula works for ANY quadratic:\n\nx = (-b +/- sqrt(b^2 - 4ac)) / 2a\n\nThe discriminant (b^2 - 4ac) tells you about the solutions:\n- Positive: two different real solutions\n- Zero: one repeated real solution\n- Negative: no real solutions (complex numbers)\n\nExample: 2x^2 + 5x - 3 = 0\na=2, b=5, c=-3\nx = (-5 +/- sqrt(25+24)) / 4 = (-5 +/- 7) / 4\nx = 1/2 or x = -3" },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "Quadratic Equations Quiz",
        description: "Test your understanding of quadratic equations",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is the standard form of a quadratic equation?", options: ["ax + b = 0", "ax^2 + bx + c = 0", "ax^3 + bx^2 + cx = 0", "y = mx + b"], correct_index: 1, explanation: "The standard form is ax^2 + bx + c = 0, where a, b, c are constants and a is not zero." },
          { id: "q2", text: "If the discriminant is positive, how many real solutions?", options: ["None", "One", "Two", "Infinite"], correct_index: 2, explanation: "A positive discriminant means two different real solutions." },
          { id: "q3", text: "Solve: x^2 - 9 = 0", options: ["x = 3", "x = -3", "x = 3 or x = -3", "x = 9"], correct_index: 2, explanation: "x^2 = 9, so x = sqrt(9) = 3 or x = -sqrt(9) = -3" },
        ],
        xp_reward: 25,
        estimated_minutes: 10,
      },
      {
        title: "Introduction to Calculus",
        description: "Understand limits and the concept of derivatives",
        content_type: "lesson",
        sections: [
          { title: "Limits", content: "A limit describes the value a function approaches as x gets closer to a point:\n\nlim(x->2) of (x^2 - 4)/(x - 2)\n\nDirect substitution gives 0/0 (indeterminate). Factor:\n(x^2 - 4)/(x - 2) = (x+2)(x-2)/(x-2) = x+2\n\nSo lim(x->2) = 4\n\nLimits are the foundation of calculus." },
          { title: "Derivatives", content: "A derivative measures the rate of change - the slope of a function at any point.\n\nPower rule: d/dx(x^n) = n*x^(n-1)\n\nExamples:\nd/dx(x^2) = 2x\nd/dx(x^3) = 3x^2\nd/dx(5) = 0 (constants)\nd/dx(3x^2 + 2x + 1) = 6x + 2\n\nThe derivative tells you how fast the function is changing at each point." },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "Calculus Quiz",
        description: "Test your understanding of basic calculus",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What does a derivative measure?", options: ["Area under a curve", "Rate of change at a point", "The maximum value", "The average value"], correct_index: 1, explanation: "A derivative measures the rate of change - how fast a function is changing at a specific point." },
          { id: "q2", text: "What is the derivative of x^3?", options: ["x^2", "3x^2", "3x", "x^3/3"], correct_index: 1, explanation: "Using the power rule: d/dx(x^n) = n*x^(n-1), so d/dx(x^3) = 3x^2." },
          { id: "q3", text: "What is the derivative of a constant?", options: ["The constant itself", "1", "0", "Undefined"], correct_index: 2, explanation: "A constant doesn't change, so its rate of change (derivative) is 0." },
        ],
        xp_reward: 25,
        estimated_minutes: 10,
      },
      {
        title: "Projectile Motion Project",
        description: "Apply calculus and algebra to model projectile motion",
        content_type: "project",
        sections: [
          { title: "Problem Setup", content: "A ball is thrown upward at 20 m/s from a height of 2m.\n\nUsing h(t) = -4.9t^2 + 20t + 2:\n\n1. Find the maximum height (when velocity = 0)\n2. Find when it hits the ground (h = 0)\n3. Find the velocity at t = 2 seconds\n\nVelocity = dh/dt = -9.8t + 20" },
          { title: "Solution", content: "1. Maximum height: velocity = 0\n   -9.8t + 20 = 0, t = 2.04s\n   h(2.04) = -4.9(4.16) + 20(2.04) + 2 = 22.4m\n\n2. Hits ground: h = 0\n   -4.9t^2 + 20t + 2 = 0\n   Using quadratic formula: t = 4.16s\n\n3. Velocity at t = 2:\n   v(2) = -9.8(2) + 20 = 0.4 m/s (barely rising)" },
        ],
        questions: [],
        xp_reward: 40,
        estimated_minutes: 60,
      },
    ],
    advanced: [
      {
        title: "Integration Techniques",
        description: "Master integration by substitution, parts, and partial fractions",
        content_type: "lesson",
        sections: [
          { title: "Integration by Substitution", content: "Substitution is the reverse of the chain rule:\n\nIntegral of 2x * (x^2 + 1)^3 dx\n\nLet u = x^2 + 1, du = 2x dx\n\n= Integral of u^3 du = u^4/4 + C = (x^2 + 1)^4/4 + C\n\nKey: choose u so that du appears in the integrand." },
          { title: "Integration by Parts", content: "Integration by parts is the reverse of the product rule:\n\nIntegral of u dv = uv - Integral of v du\n\nExample: Integral of x * e^x dx\nu = x, dv = e^x dx\ndu = dx, v = e^x\n\n= x*e^x - Integral of e^x dx = x*e^x - e^x + C" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 35,
      },
      {
        title: "Integration Quiz",
        description: "Test your integration skills",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is the integral of x^2 dx?", options: ["x^2/2", "x^3/3 + C", "2x + C", "x^3 + C"], correct_index: 1, explanation: "Using the power rule for integration: integral of x^n = x^(n+1)/(n+1) + C" },
          { id: "q2", text: "When do you use integration by parts?", options: ["For products of functions", "For composite functions", "For rational functions", "For trigonometric functions"], correct_index: 0, explanation: "Integration by parts is used for products of functions, especially when one is a polynomial." },
          { id: "q3", text: "What is the integral of 1/x dx?", options: ["x^2/2 + C", "ln|x| + C", "1/x^2 + C", "x + C"], correct_index: 1, explanation: "The integral of 1/x is the natural logarithm: ln|x| + C" },
        ],
        xp_reward: 30,
        estimated_minutes: 10,
      },
      {
        title: "Differential Equations Project",
        description: "Solve real-world differential equations",
        content_type: "project",
        sections: [
          { title: "Population Growth Model", content: "Model population growth with the differential equation:\ndP/dt = kP\n\nThis says the rate of change is proportional to the population.\n\nSolution: P(t) = P0 * e^(kt)\n\nGiven: P(0) = 1000, P(5) = 1500\nFind k and predict P(10)." },
          { title: "Solution", content: "P(t) = 1000 * e^(kt)\n1500 = 1000 * e^(5k)\n1.5 = e^(5k)\n5k = ln(1.5) = 0.405\nk = 0.081\n\nP(10) = 1000 * e^(0.81) = 1000 * 2.249 = 2249\n\nThe population doubles roughly every 8.6 years." },
        ],
        questions: [],
        xp_reward: 50,
        estimated_minutes: 90,
      },
    ],
  },

  Physics: {
    beginner: [
      {
        title: "Motion and Forces",
        description: "Understand the basics of motion, velocity, acceleration, and Newton's laws",
        content_type: "lesson",
        sections: [
          { title: "Describing Motion", content: "Key concepts of motion:\n\n- Distance: how far you've traveled (scalar)\n- Displacement: change in position (vector, has direction)\n- Speed: distance/time (scalar)\n- Velocity: displacement/time (vector)\n- Acceleration: change in velocity/time\n\nEquations of motion (constant acceleration):\nv = u + at\ns = ut + 0.5at^2\nv^2 = u^2 + 2as\n\nWhere u = initial velocity, v = final velocity, a = acceleration, s = displacement, t = time" },
          { title: "Newton's Laws", content: "Newton's Three Laws of Motion:\n\n1st Law (Inertia): An object at rest stays at rest, an object in motion stays in motion, unless acted on by an external force.\n\n2nd Law: Force = mass x acceleration (F = ma)\n- More mass needs more force for the same acceleration\n- More force means more acceleration\n\n3rd Law: Every action has an equal and opposite reaction.\n- You push on the ground, the ground pushes back on you\n- That's how you walk!" },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 25,
      },
      {
        title: "Motion Quiz",
        description: "Test your understanding of motion and forces",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is the SI unit of force?", options: ["Joule", "Newton", "Watt", "Pascal"], correct_index: 1, explanation: "The Newton (N) is the SI unit of force. 1 N = 1 kg*m/s^2" },
          { id: "q2", text: "A car accelerates from 0 to 60 m/s in 10 seconds. What is its acceleration?", options: ["6 m/s^2", "60 m/s^2", "0.6 m/s^2", "600 m/s^2"], correct_index: 0, explanation: "a = (v-u)/t = (60-0)/10 = 6 m/s^2" },
          { id: "q3", text: "Which of Newton's laws is F = ma?", options: ["First Law", "Second Law", "Third Law", "Law of Gravitation"], correct_index: 1, explanation: "F = ma is Newton's Second Law, relating force, mass, and acceleration." },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "Energy and Work",
        description: "Learn about kinetic energy, potential energy, and conservation of energy",
        content_type: "lesson",
        sections: [
          { title: "Types of Energy", content: "Kinetic Energy (energy of motion):\nKE = 0.5 * m * v^2\n\nPotential Energy (stored energy):\nGravitational PE = mgh (mass x gravity x height)\n\nWork (energy transferred by force):\nW = F * d * cos(theta)\n\nPower (rate of doing work):\nP = W / t\n\nUnits: Energy and work in Joules (J), Power in Watts (W)" },
          { title: "Conservation of Energy", content: "The Law of Conservation of Energy:\n\nEnergy cannot be created or destroyed, only transformed.\n\nTotal energy before = Total energy after\n\nExample: A ball dropped from height h\nAt top: PE = mgh, KE = 0\nAt bottom: PE = 0, KE = 0.5mv^2\n\nmgh = 0.5mv^2\nv = sqrt(2gh)\n\nThis is one of the most powerful principles in physics!" },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 25,
      },
      {
        title: "Energy Quiz",
        description: "Test your understanding of energy and work",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is the kinetic energy of a 2 kg ball moving at 3 m/s?", options: ["3 J", "6 J", "9 J", "18 J"], correct_index: 2, explanation: "KE = 0.5 * m * v^2 = 0.5 * 2 * 9 = 9 J" },
          { id: "q2", text: "If you double the velocity of an object, what happens to its kinetic energy?", options: ["Doubles", "Triples", "Quadruples", "Stays the same"], correct_index: 2, explanation: "KE = 0.5mv^2. If v doubles, v^2 quadruples, so KE quadruples." },
          { id: "q3", text: "What does the Law of Conservation of Energy state?", options: ["Energy is always increasing", "Energy can be created but not destroyed", "Energy cannot be created or destroyed", "Energy is always lost as heat"], correct_index: 2, explanation: "Energy cannot be created or destroyed, only transformed from one form to another." },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "Projectile Motion Project",
        description: "Calculate the trajectory of a projectile",
        content_type: "project",
        sections: [
          { title: "Problem", content: "A ball is thrown at 20 m/s at 45 degrees from a height of 2m.\n\nCalculate:\n1. Maximum height\n2. Time of flight\n3. Horizontal range\n\nUse: g = 9.8 m/s^2\nHorizontal velocity: vx = v*cos(45) = 14.14 m/s\nVertical velocity: vy = v*sin(45) = 14.14 m/s" },
          { title: "Solution", content: "1. Max height: vy^2/(2g) + h0 = 14.14^2/19.6 + 2 = 10.2 + 2 = 12.2m\n\n2. Time up: vy/g = 14.14/9.8 = 1.44s\n   Time down from max: sqrt(2*12.2/9.8) = 1.58s\n   Total time: 1.44 + 1.58 = 3.02s\n\n3. Range: vx * t = 14.14 * 3.02 = 42.7m" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 45,
      },
    ],
    intermediate: [
      {
        title: "Electricity and Circuits",
        description: "Understand electric charge, current, voltage, and circuit analysis",
        content_type: "lesson",
        sections: [
          { title: "Electric Fundamentals", content: "Key concepts:\n\n- Charge (Q): measured in Coulombs (C)\n- Current (I): flow of charge, I = Q/t, measured in Amps (A)\n- Voltage (V): energy per unit charge, measured in Volts (V)\n- Resistance (R): opposition to current, measured in Ohms\n\nOhm's Law: V = IR\n\nPower: P = VI = I^2R = V^2/R" },
          { title: "Circuit Analysis", content: "Series Circuits:\n- Same current through all components\n- Total resistance: R_total = R1 + R2 + R3\n- Total voltage: V_total = V1 + V2 + V3\n\nParallel Circuits:\n- Same voltage across all branches\n- Total resistance: 1/R_total = 1/R1 + 1/R2 + 1/R3\n- Total current: I_total = I1 + I2 + I3\n\nKirchhoff's Laws help analyze complex circuits." },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "Electricity Quiz",
        description: "Test your understanding of electricity and circuits",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What does Ohm's Law state?", options: ["V = IR", "P = VI", "F = ma", "E = mc^2"], correct_index: 0, explanation: "Ohm's Law: Voltage = Current x Resistance (V = IR)" },
          { id: "q2", text: "Two 10-ohm resistors in series have a total resistance of:", options: ["5 ohms", "10 ohms", "20 ohms", "100 ohms"], correct_index: 2, explanation: "In series, resistances add: R_total = 10 + 10 = 20 ohms" },
          { id: "q3", text: "Two 10-ohm resistors in parallel have a total resistance of:", options: ["5 ohms", "10 ohms", "20 ohms", "100 ohms"], correct_index: 0, explanation: "In parallel: 1/R = 1/10 + 1/10 = 2/10, so R = 5 ohms" },
        ],
        xp_reward: 25,
        estimated_minutes: 10,
      },
      {
        title: "Waves and Optics",
        description: "Learn about wave properties, light, and optical phenomena",
        content_type: "lesson",
        sections: [
          { title: "Wave Properties", content: "Waves carry energy without carrying matter.\n\nKey properties:\n- Wavelength (lambda): distance between successive crests\n- Frequency (f): number of oscillations per second (Hz)\n- Amplitude: maximum displacement from equilibrium\n- Period (T): time for one complete oscillation\n\nWave equation: v = f * lambda\n\nElectromagnetic spectrum (in order of increasing frequency):\nRadio -> Microwave -> Infrared -> Visible -> UV -> X-ray -> Gamma" },
          { title: "Light and Optics", content: "Light behaves as both a wave and a particle (wave-particle duality).\n\nReflection: angle of incidence = angle of reflection\nRefraction: light bends when entering a new medium (Snell's Law)\nn1*sin(theta1) = n2*sin(theta2)\n\nLenses:\n- Convex (converging): focuses light\n- Concave (diverging): spreads light\n\nThin lens equation: 1/f = 1/do + 1/di" },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "Circuit Design Project",
        description: "Design and analyze a practical circuit",
        content_type: "project",
        sections: [
          { title: "Problem", content: "Design a circuit with a 12V battery powering:\n- A 100-ohm resistor (R1) in series with a parallel combination\n- Two 200-ohm resistors (R2, R3) in parallel\n\nCalculate:\n1. Total resistance\n2. Total current\n3. Current through each resistor\n4. Power dissipated in each resistor" },
          { title: "Solution", content: "Parallel section: 1/Rp = 1/200 + 1/200 = 1/100, so Rp = 100 ohms\n\nTotal: R_total = 100 + 100 = 200 ohms\nTotal current: I = V/R = 12/200 = 0.06 A = 60 mA\n\nVoltage across R1: V1 = IR1 = 0.06 * 100 = 6V\nVoltage across parallel: Vp = 12 - 6 = 6V\nCurrent through R2: I2 = 6/200 = 30 mA\nCurrent through R3: I3 = 6/200 = 30 mA\n\nPower R1: P1 = I^2*R = 0.06^2*100 = 0.36W\nPower R2: P2 = 0.03^2*200 = 0.18W" },
        ],
        questions: [],
        xp_reward: 40,
        estimated_minutes: 60,
      },
    ],
    advanced: [
      {
        title: "Electromagnetism",
        description: "Understand Maxwell's equations and electromagnetic induction",
        content_type: "lesson",
        sections: [
          { title: "Electromagnetic Induction", content: "Faraday's Law: A changing magnetic field induces an EMF.\n\nEMF = -d(Phi)/dt\n\nWhere Phi is the magnetic flux (B * A * cos(theta))\n\nLenz's Law: The induced current opposes the change that caused it.\n\nApplications:\n- Electric generators\n- Transformers\n- Induction cooktops\n- Wireless charging" },
          { title: "Maxwell's Equations", content: "Maxwell's four equations unify electricity and magnetism:\n\n1. Gauss's Law (electric): Electric flux = enclosed charge / epsilon_0\n2. Gauss's Law (magnetic): No magnetic monopoles (flux = 0)\n3. Faraday's Law: Changing B creates E\n4. Ampere-Maxwell Law: Current + changing E creates B\n\nThese predict electromagnetic waves traveling at c = 1/sqrt(mu_0 * epsilon_0) = 3x10^8 m/s" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 35,
      },
      {
        title: "Electromagnetism Quiz",
        description: "Test your understanding of electromagnetism",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What does Faraday's Law describe?", options: ["Electric fields from charges", "Magnetic fields from currents", "EMF from changing magnetic flux", "Force between charges"], correct_index: 2, explanation: "Faraday's Law states that a changing magnetic flux induces an EMF." },
          { id: "q2", text: "What does Lenz's Law state?", options: ["Induced current aids the change", "Induced current opposes the change", "No current is induced", "Current flows in any direction"], correct_index: 1, explanation: "Lenz's Law: the induced current opposes the change that caused it (conservation of energy)." },
          { id: "q3", text: "What speed do electromagnetic waves travel at?", options: ["Speed of sound", "Speed of light", "Depends on frequency", "Infinite speed"], correct_index: 1, explanation: "EM waves travel at the speed of light: c = 3 x 10^8 m/s in vacuum." },
        ],
        xp_reward: 30,
        estimated_minutes: 10,
      },
      {
        title: "Electromagnetic Motor Design",
        description: "Apply electromagnetic principles to design a simple motor",
        content_type: "project",
        sections: [
          { title: "Design Challenge", content: "Design a simple DC motor using:\n- A battery (12V)\n- A coil of wire (N turns, area A)\n- A permanent magnet (B = 0.5 T)\n\nCalculate:\n1. Torque on the coil\n2. Angular velocity at equilibrium\n3. Back-EMF at steady state\n\nTorque = N * I * A * B * sin(theta)" },
          { title: "Analysis", content: "For a 100-turn coil with area 0.01 m^2:\n\nMaximum torque = N*I*A*B = 100 * I * 0.01 * 0.5 = 0.5I\n\nWith 12V and 10-ohm coil resistance:\nI = 12/10 = 1.2A\nMax torque = 0.5 * 1.2 = 0.6 N*m\n\nBack-EMF increases with rotation speed until equilibrium:\nV - EMF_back = I*R\nEMF_back = N*B*A*omega" },
        ],
        questions: [],
        xp_reward: 50,
        estimated_minutes: 90,
      },
    ],
  },

  "Data Science": {
    beginner: [
      {
        title: "Introduction to Data Science",
        description: "Learn what data science is, the data pipeline, and basic concepts",
        content_type: "lesson",
        sections: [
          { title: "What is Data Science?", content: "Data science is the field of extracting insights and knowledge from data.\n\nThe Data Science Pipeline:\n1. Define the question\n2. Collect data\n3. Clean and prepare data\n4. Explore and visualize data\n5. Build models\n6. Communicate results\n\nKey skills:\n- Statistics and mathematics\n- Programming (Python, R)\n- Domain knowledge\n- Communication and storytelling" },
          { title: "Types of Data", content: "Data comes in many forms:\n\nStructured: organized in tables (databases, spreadsheets)\nUnstructured: text, images, audio, video\nSemi-structured: JSON, XML, logs\n\nData types:\n- Numerical: continuous (temperature) or discrete (count)\n- Categorical: nominal (colors) or ordinal (ratings)\n- Time series: data collected over time\n- Text: natural language data" },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 20,
      },
      {
        title: "Data Science Basics Quiz",
        description: "Test your understanding of data science fundamentals",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is the first step in the data science pipeline?", options: ["Build a model", "Define the question", "Collect data", "Visualize data"], correct_index: 1, explanation: "Defining the question comes first - it guides all subsequent steps." },
          { id: "q2", text: "Which is an example of structured data?", options: ["A photograph", "A social media post", "A database table", "An audio recording"], correct_index: 2, explanation: "Database tables are structured data - organized in rows and columns." },
          { id: "q3", text: "What is data cleaning?", options: ["Deleting all data", "Fixing or removing incorrect/incomplete data", "Encrypting data", "Visualizing data"], correct_index: 1, explanation: "Data cleaning fixes errors, handles missing values, and ensures data quality." },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "Descriptive Statistics",
        description: "Learn mean, median, mode, standard deviation, and data distributions",
        content_type: "lesson",
        sections: [
          { title: "Measures of Central Tendency", content: "Mean: average of all values (sum / count)\nMedian: middle value when sorted\nMode: most frequently occurring value\n\nWhen to use each:\n- Mean: symmetric distributions, no extreme outliers\n- Median: skewed data or outliers (e.g., income)\n- Mode: categorical data\n\nExample: [2, 4, 4, 4, 5, 5, 7, 9]\nMean = 40/8 = 5\nMedian = (4+5)/2 = 4.5\nMode = 4" },
          { title: "Measures of Spread", content: "Range: max - min\nVariance: average of squared deviations from mean\nStandard Deviation: square root of variance (same units as data)\n\nThe 68-95-99.7 Rule (normal distribution):\n- 68% within 1 standard deviation\n- 95% within 2 standard deviations\n- 99.7% within 3 standard deviations\n\nIQR (Interquartile Range): Q3 - Q1\nUsed for box plots and detecting outliers" },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 25,
      },
      {
        title: "Analyze a Dataset Project",
        description: "Apply descriptive statistics to analyze a real dataset",
        content_type: "project",
        sections: [
          { title: "Dataset Analysis", content: "Given student test scores:\n[72, 85, 90, 65, 78, 92, 88, 73, 95, 67, 81, 76, 89, 71, 83]\n\nCalculate:\n1. Mean, median, and mode\n2. Standard deviation\n3. Create a frequency distribution\n4. Identify any outliers\n5. Describe the distribution shape" },
          { title: "Solution", content: "Sorted: [65, 67, 71, 72, 73, 76, 78, 81, 83, 85, 88, 89, 90, 92, 95]\n\nMean = 1205/15 = 80.3\nMedian = 81 (8th value)\nMode = no repeated values\n\nStd Dev = sqrt(sum((x-80.3)^2)/15) = 9.2\n\nThe distribution is roughly symmetric, centered around 80.\nNo extreme outliers (all within 2 std dev of mean)." },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 45,
      },
    ],
    intermediate: [
      {
        title: "Data Visualization",
        description: "Master charts, plots, and visual storytelling with data",
        content_type: "lesson",
        sections: [
          { title: "Choosing the Right Chart", content: "Bar chart: compare categories\nLine chart: show trends over time\nScatter plot: show relationships between two variables\nHistogram: show distribution of one variable\nBox plot: show distribution and outliers\nHeatmap: show correlation matrix\nPie chart: show proportions (use sparingly)\n\nRules:\n- Label axes clearly\n- Use consistent colors\n- Avoid 3D effects (they distort data)\n- Start y-axis at zero for bar charts" },
          { title: "Python Visualization", content: "Using matplotlib and seaborn:\n\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\n# Bar chart\nplt.bar(categories, values)\n\n# Scatter plot\nplt.scatter(x, y)\n\n# Histogram\nplt.hist(data, bins=20)\n\n# Box plot\nsns.boxplot(data)\n\n# Correlation heatmap\ncorr = df.corr()\nsns.heatmap(corr, annot=True)" },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "Data Visualization Quiz",
        description: "Test your understanding of data visualization",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "Which chart is best for showing trends over time?", options: ["Bar chart", "Pie chart", "Line chart", "Histogram"], correct_index: 2, explanation: "Line charts are ideal for showing trends over time." },
          { id: "q2", text: "What does a box plot show?", options: ["Proportions", "Distribution and outliers", "Trends", "Geographic data"], correct_index: 1, explanation: "Box plots show the distribution (quartiles) and identify outliers." },
          { id: "q3", text: "Why should you avoid 3D charts?", options: ["They are ugly", "They distort data perception", "They are slow to render", "They don't support colors"], correct_index: 1, explanation: "3D effects distort data perception, making it harder to accurately compare values." },
        ],
        xp_reward: 25,
        estimated_minutes: 10,
      },
      {
        title: "Data Cleaning Project",
        description: "Clean and prepare a messy dataset for analysis",
        content_type: "project",
        sections: [
          { title: "The Messy Dataset", content: "Given a dataset with these issues:\n- Missing values in age column (15% missing)\n- Duplicate rows\n- Inconsistent date formats\n- Outliers in salary column\n- Text encoding issues\n\nWrite a Python cleaning pipeline that:\n1. Handles missing values\n2. Removes duplicates\n3. Standardizes dates\n4. Detects and handles outliers\n5. Validates the cleaned data" },
          { title: "Solution Approach", content: "import pandas as pd\n\ndf = pd.read_csv('data.csv')\n\n# Handle missing values\ndf['age'].fillna(df['age'].median(), inplace=True)\n\n# Remove duplicates\ndf.drop_duplicates(inplace=True)\n\n# Standardize dates\ndf['date'] = pd.to_datetime(df['date'], format='mixed')\n\n# Handle outliers (IQR method)\nQ1 = df['salary'].quantile(0.25)\nQ3 = df['salary'].quantile(0.75)\nIQR = Q3 - Q1\ndf = df[(df['salary'] >= Q1-1.5*IQR) & (df['salary'] <= Q3+1.5*IQR)]" },
        ],
        questions: [],
        xp_reward: 40,
        estimated_minutes: 60,
      },
    ],
    advanced: [
      {
        title: "Machine Learning Fundamentals",
        description: "Understand supervised learning, model evaluation, and feature engineering",
        content_type: "lesson",
        sections: [
          { title: "Supervised Learning", content: "Supervised learning uses labeled data to train models:\n\nClassification: predict a category (spam/not spam)\nRegression: predict a number (house price)\n\nKey algorithms:\n- Linear Regression: predict continuous values\n- Logistic Regression: binary classification\n- Decision Trees: rule-based splitting\n- Random Forest: ensemble of trees\n- SVM: find optimal boundary\n\nTraining process:\n1. Split data into train/test sets\n2. Train model on training data\n3. Evaluate on test data\n4. Tune hyperparameters" },
          { title: "Model Evaluation", content: "Classification metrics:\n- Accuracy: correct predictions / total\n- Precision: true positives / predicted positives\n- Recall: true positives / actual positives\n- F1 Score: harmonic mean of precision and recall\n\nRegression metrics:\n- MAE: mean absolute error\n- MSE: mean squared error\n- RMSE: root mean squared error\n- R^2: proportion of variance explained\n\nCross-validation: split data into k folds, train on k-1, test on 1, repeat k times." },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 35,
      },
      {
        title: "ML Fundamentals Quiz",
        description: "Test your understanding of machine learning basics",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is overfitting?", options: ["Model is too simple", "Model memorizes training data, performs poorly on new data", "Model trains too fast", "Model has too few features"], correct_index: 1, explanation: "Overfitting: model memorizes training data instead of learning general patterns." },
          { id: "q2", text: "What does cross-validation help with?", options: ["Faster training", "More reliable performance estimates", "Feature selection", "Data cleaning"], correct_index: 1, explanation: "Cross-validation gives more reliable performance estimates by testing on multiple data splits." },
          { id: "q3", text: "Which metric is best for imbalanced datasets?", options: ["Accuracy", "F1 Score", "Training time", "Model size"], correct_index: 1, explanation: "F1 Score balances precision and recall, making it better for imbalanced datasets where accuracy can be misleading." },
        ],
        xp_reward: 30,
        estimated_minutes: 10,
      },
      {
        title: "Build a Prediction Model",
        description: "Build and evaluate a complete machine learning pipeline",
        content_type: "project",
        sections: [
          { title: "Project", content: "Build a house price prediction model:\n\n1. Load and explore the data\n2. Feature engineering (create new features)\n3. Handle missing values and outliers\n4. Train multiple models (Linear, Random Forest, XGBoost)\n5. Evaluate with cross-validation\n6. Select the best model\n7. Generate predictions on test data" },
          { title: "Implementation", content: "from sklearn.ensemble import RandomForestRegressor\nfrom sklearn.model_selection import cross_val_score\nfrom sklearn.metrics import mean_squared_error\nimport numpy as np\n\n# Feature engineering\ndf['price_per_sqft'] = df['price'] / df['sqft']\ndf['age'] = 2024 - df['year_built']\n\n# Train model\nmodel = RandomForestRegressor(n_estimators=100)\nscores = cross_val_score(model, X_train, y_train, cv=5, scoring='neg_mean_squared_error')\nrmse = np.sqrt(-scores).mean()\n\nprint(f'RMSE: {rmse:.2f}')" },
        ],
        questions: [],
        xp_reward: 50,
        estimated_minutes: 90,
      },
    ],
  },

  "Web Development": {
    beginner: [
      {
        title: "HTML Fundamentals",
        description: "Learn the structure of web pages with HTML elements and attributes",
        content_type: "lesson",
        sections: [
          { title: "HTML Basics", content: "HTML (HyperText Markup Language) structures web content:\n\n<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Main Heading</h1>\n  <p>A paragraph of text.</p>\n  <a href='https://example.com'>A link</a>\n  <img src='photo.jpg' alt='Description'>\n</body>\n</html>\n\nCommon elements: h1-h6, p, a, img, ul/ol/li, div, span" },
          { title: "Forms and Semantic HTML", content: "Forms collect user input:\n<form action='/submit' method='POST'>\n  <label for='name'>Name:</label>\n  <input type='text' id='name' name='name'>\n  <button type='submit'>Submit</button>\n</form>\n\nSemantic HTML gives meaning:\n<header>, <nav>, <main>, <article>, <section>, <footer>\n\nThese help accessibility and SEO." },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 20,
      },
      {
        title: "HTML Quiz",
        description: "Test your understanding of HTML",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correct_index: 0, explanation: "HTML stands for HyperText Markup Language." },
          { id: "q2", text: "Which element creates a hyperlink?", options: ["<link>", "<a>", "<href>", "<url>"], correct_index: 1, explanation: "The <a> (anchor) element creates hyperlinks with the href attribute." },
          { id: "q3", text: "What is semantic HTML?", options: ["HTML with more tags", "HTML that describes meaning", "HTML with CSS", "HTML5 only"], correct_index: 1, explanation: "Semantic HTML uses elements that describe their meaning (header, nav, article) rather than just presentation." },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "CSS Styling",
        description: "Style web pages with CSS selectors, properties, and layouts",
        content_type: "lesson",
        sections: [
          { title: "CSS Basics", content: "CSS (Cascading Style Sheets) controls how HTML looks:\n\nselector {\n  property: value;\n}\n\nh1 {\n  color: blue;\n  font-size: 24px;\n  margin-bottom: 16px;\n}\n\nSelectors:\n- Element: h1, p, div\n- Class: .classname\n- ID: #unique-id\n- Descendant: .parent .child\n- Pseudo: :hover, :first-child" },
          { title: "Layout with Flexbox", content: "Flexbox makes layout easy:\n\n.container {\n  display: flex;\n  justify-content: center;  /* horizontal */\n  align-items: center;      /* vertical */\n  gap: 16px;               /* space between items */\n}\n\n.item {\n  flex: 1;  /* grow equally */\n}\n\nCommon patterns:\n- Center anything: flex + justify-content + align-items\n- Navigation bar: flex + justify-content: space-between\n- Card grid: flex-wrap + gap" },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 25,
      },
      {
        title: "Build a Personal Webpage",
        description: "Create a personal webpage using HTML and CSS",
        content_type: "project",
        sections: [
          { title: "Project", content: "Build a personal webpage with:\n1. Header with your name and navigation\n2. About section with a photo and bio\n3. Skills section with a list\n4. Projects section with cards\n5. Contact form\n6. Footer with social links\n\nUse semantic HTML and CSS flexbox for layout." },
          { title: "Structure", content: "<!DOCTYPE html>\n<html>\n<head>\n  <link rel='stylesheet' href='style.css'>\n</head>\n<body>\n  <header>\n    <nav>...</nav>\n  </header>\n  <main>\n    <section id='about'>...</section>\n    <section id='projects'>...</section>\n    <section id='contact'>...</section>\n  </main>\n  <footer>...</footer>\n</body>\n</html>" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 45,
      },
    ],
    intermediate: [
      {
        title: "JavaScript for the Web",
        description: "Learn DOM manipulation, event handling, and dynamic web pages",
        content_type: "lesson",
        sections: [
          { title: "DOM Manipulation", content: "The DOM lets JavaScript interact with HTML:\n\n// Select elements\nconst el = document.querySelector('.my-class');\nconst all = document.querySelectorAll('p');\n\n// Modify content\nel.textContent = 'New text';\nel.innerHTML = '<strong>Bold</strong> text';\n\n// Modify styles\nel.style.color = 'red';\nel.classList.add('active');\nel.classList.remove('hidden');\n\n// Create elements\nconst newEl = document.createElement('div');\nnewEl.textContent = 'Hello!';\ndocument.body.appendChild(newEl);" },
          { title: "Event Handling", content: "Events make pages interactive:\n\nbutton.addEventListener('click', (e) => {\n  console.log('Clicked!', e.target);\n});\n\ninput.addEventListener('input', (e) => {\n  console.log('Value:', e.target.value);\n});\n\n// Event delegation (efficient)\ndocument.querySelector('.list').addEventListener('click', (e) => {\n  if (e.target.matches('.item')) {\n    handleClick(e.target);\n  }\n});" },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "Web JS Quiz",
        description: "Test your understanding of web JavaScript",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is the DOM?", options: ["Document Object Model", "Data Output Module", "Direct Object Mapping", "Document Oriented Middleware"], correct_index: 0, explanation: "The DOM (Document Object Model) represents the page as a tree of objects." },
          { id: "q2", text: "What does querySelector do?", options: ["Creates an element", "Finds the first matching element", "Selects all elements", "Removes an element"], correct_index: 1, explanation: "querySelector returns the first element matching a CSS selector." },
          { id: "q3", text: "What is event delegation?", options: ["Adding events to every element", "Handling events on a parent for its children", "Removing all events", "Creating custom events"], correct_index: 1, explanation: "Event delegation: one listener on a parent handles events from its children via event bubbling." },
        ],
        xp_reward: 25,
        estimated_minutes: 10,
      },
      {
        title: "Build an Interactive Todo App",
        description: "Create a fully interactive todo application",
        content_type: "project",
        sections: [
          { title: "Requirements", content: "Build a todo app with:\n1. Add new todos\n2. Mark todos as complete\n3. Delete todos\n4. Filter: all/active/completed\n5. Count of remaining items\n6. Local storage persistence\n\nUse HTML, CSS, and vanilla JavaScript." },
          { title: "Key Code", content: "const form = document.querySelector('#todo-form');\nconst input = document.querySelector('#todo-input');\nconst list = document.querySelector('#todo-list');\n\nform.addEventListener('submit', (e) => {\n  e.preventDefault();\n  const text = input.value.trim();\n  if (!text) return;\n  addTodo(text);\n  input.value = '';\n  saveTodos();\n});\n\nfunction addTodo(text) {\n  const li = document.createElement('li');\n  li.innerHTML = `\n    <input type='checkbox'>\n    <span>${text}</span>\n    <button class='delete'>X</button>\n  `;\n  list.appendChild(li);\n}" },
        ],
        questions: [],
        xp_reward: 40,
        estimated_minutes: 60,
      },
    ],
    advanced: [
      {
        title: "Responsive Design and Performance",
        description: "Master responsive design, CSS Grid, and web performance optimization",
        content_type: "lesson",
        sections: [
          { title: "Responsive Design", content: "Make sites work on all screen sizes:\n\n/* Mobile first */\n.container {\n  padding: 16px;\n}\n\n/* Tablet */\n@media (min-width: 768px) {\n  .container {\n    padding: 24px;\n    max-width: 720px;\n  }\n}\n\n/* Desktop */\n@media (min-width: 1024px) {\n  .container {\n    max-width: 1200px;\n  }\n}\n\nCSS Grid for complex layouts:\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n  gap: 24px;\n}" },
          { title: "Performance", content: "Key performance optimizations:\n\n1. Minimize HTTP requests (bundle CSS/JS)\n2. Optimize images (WebP, lazy loading)\n3. Minify CSS and JavaScript\n4. Use CDN for static assets\n5. Enable browser caching\n6. Critical CSS inline\n7. Defer non-critical JavaScript\n\nMeasure with:\n- Lighthouse (Chrome DevTools)\n- WebPageTest\n- Core Web Vitals: LCP, FID, CLS" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 35,
      },
      {
        title: "Web Performance Quiz",
        description: "Test your understanding of web performance",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is lazy loading?", options: ["Loading everything at once", "Loading resources only when needed", "Loading in the background", "Caching resources"], correct_index: 1, explanation: "Lazy loading defers loading resources until they're needed (e.g., images load when they scroll into view)." },
          { id: "q2", text: "What does CSS Grid provide that Flexbox doesn't?", options: ["Faster rendering", "Two-dimensional layout control", "Better browser support", "Smaller file sizes"], correct_index: 1, explanation: "CSS Grid provides 2D layout control (rows AND columns), while Flexbox is primarily 1D." },
          { id: "q3", text: "What is a Core Web Vital?", options: ["A CSS property", "A user experience metric", "A JavaScript framework", "A server technology"], correct_index: 1, explanation: "Core Web Vitals (LCP, FID, CLS) are metrics that measure real-world user experience." },
        ],
        xp_reward: 30,
        estimated_minutes: 10,
      },
      {
        title: "Build a Portfolio Website",
        description: "Create a responsive, performant portfolio website",
        content_type: "project",
        sections: [
          { title: "Requirements", content: "Build a portfolio with:\n1. Responsive design (mobile-first)\n2. CSS Grid for project layout\n3. Lazy-loaded images\n4. Smooth scroll navigation\n5. Dark mode toggle\n6. Contact form with validation\n7. Lighthouse score > 90" },
          { title: "Performance Checklist", content: "1. Inline critical CSS\n2. Defer non-critical JS: <script defer src='app.js'>\n3. Lazy load images: <img loading='lazy'>\n4. Use WebP images with fallback\n5. Minify CSS/JS for production\n6. Add meta viewport tag\n7. Use semantic HTML for accessibility\n8. Test on mobile, tablet, desktop" },
        ],
        questions: [],
        xp_reward: 50,
        estimated_minutes: 90,
      },
    ],
  },

  "Machine Learning": {
    beginner: [
      {
        title: "What is Machine Learning?",
        description: "Understand the fundamentals of ML, types of learning, and real-world applications",
        content_type: "lesson",
        sections: [
          { title: "ML Fundamentals", content: "Machine Learning is teaching computers to learn from data without explicit programming.\n\nThree types of learning:\n\n1. Supervised: Learn from labeled examples\n   - Classification: spam detection, image recognition\n   - Regression: price prediction, weather forecasting\n\n2. Unsupervised: Find patterns in unlabeled data\n   - Clustering: customer segmentation\n   - Dimensionality reduction: data compression\n\n3. Reinforcement: Learn through trial and reward\n   - Game playing, robotics, recommendation systems" },
          { title: "The ML Workflow", content: "Steps to build an ML model:\n\n1. Define the problem clearly\n2. Collect and prepare data\n3. Choose a model/algorithm\n4. Train the model on data\n5. Evaluate performance\n6. Tune hyperparameters\n7. Deploy and monitor\n\nKey principle: garbage in = garbage out\nThe quality of your data determines the quality of your model." },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 20,
      },
      {
        title: "ML Basics Quiz",
        description: "Test your understanding of machine learning fundamentals",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What type of learning uses labeled data?", options: ["Unsupervised", "Supervised", "Reinforcement", "Self-supervised"], correct_index: 1, explanation: "Supervised learning trains on labeled data (input-output pairs)." },
          { id: "q2", text: "What is clustering?", options: ["Predicting a number", "Grouping similar data points", "Classifying images", "Optimizing a reward"], correct_index: 1, explanation: "Clustering groups similar data points together without predefined labels." },
          { id: "q3", text: "What does 'garbage in, garbage out' mean in ML?", options: ["Models produce garbage", "Bad data leads to bad models", "ML is unreliable", "Data should be thrown away"], correct_index: 1, explanation: "The quality of your training data directly determines the quality of your model's output." },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "Linear Regression",
        description: "Learn the simplest ML algorithm: predicting continuous values with linear regression",
        content_type: "lesson",
        sections: [
          { title: "How Linear Regression Works", content: "Linear regression finds the best line through data points:\n\ny = mx + b\n\nWhere:\ny = predicted value\nm = slope (weight/coefficient)\nx = input feature\nb = y-intercept (bias)\n\nThe algorithm finds m and b that minimize the error:\nCost = (1/n) * sum((y_actual - y_predicted)^2)\n\nThis is called Mean Squared Error (MSE)." },
          { title: "Implementing Linear Regression", content: "Using Python and scikit-learn:\n\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.model_selection import train_test_split\n\n# Split data\nX_train, X_test, y_train, y_test = train_test_split(\n  X, y, test_size=0.2\n)\n\n# Train model\nmodel = LinearRegression()\nmodel.fit(X_train, y_train)\n\n# Predict\npredictions = model.predict(X_test)\n\n# Evaluate\nfrom sklearn.metrics import r2_score, mean_squared_error\nprint(f'R^2: {r2_score(y_test, predictions):.3f}')\nprint(f'RMSE: {mean_squared_error(y_test, predictions, squared=False):.3f}')" },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 25,
      },
      {
        title: "Build a Price Predictor",
        description: "Build a linear regression model to predict prices",
        content_type: "project",
        sections: [
          { title: "Project", content: "Build a simple price prediction model:\n\nDataset: House features (sqft, bedrooms, age) and prices\n\n1. Load and explore the data\n2. Visualize relationships\n3. Split into train/test\n4. Train a linear regression model\n5. Evaluate with R^2 and RMSE\n6. Make predictions on new data" },
          { title: "Implementation", content: "import pandas as pd\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.model_selection import train_test_split\n\ndf = pd.read_csv('houses.csv')\n\nX = df[['sqft', 'bedrooms', 'age']]\ny = df['price']\n\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\n\nmodel = LinearRegression()\nmodel.fit(X_train, y_train)\n\nprint(f'Coefficients: {model.coef_}')\nprint(f'Intercept: {model.intercept_:.2f}')\nprint(f'R^2: {model.score(X_test, y_test):.3f}')" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 45,
      },
    ],
    intermediate: [
      {
        title: "Classification Algorithms",
        description: "Learn decision trees, random forests, and logistic regression for classification",
        content_type: "lesson",
        sections: [
          { title: "Classification Methods", content: "Classification predicts categories:\n\nLogistic Regression:\n- Predicts probability (0 to 1) using sigmoid function\n- Good for binary classification\n- Output: P(class) = 1 / (1 + e^(-z))\n\nDecision Trees:\n- Split data based on feature values\n- Easy to interpret\n- Prone to overfitting\n\nRandom Forest:\n- Ensemble of decision trees\n- Each tree trained on random subset\n- Vote for final prediction\n- Reduces overfitting significantly" },
          { title: "Evaluation Metrics", content: "Confusion Matrix:\n              Predicted +    Predicted -\nActual +      TP             FN\nActual -      FP             TN\n\nAccuracy = (TP + TN) / Total\nPrecision = TP / (TP + FP)\nRecall = TP / (TP + FN)\nF1 = 2 * (Precision * Recall) / (Precision + Recall)\n\nWhen to use which:\n- Balanced data: Accuracy\n- Medical diagnosis: Recall (don't miss positives)\n- Spam filter: Precision (don't flag good email)" },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "Classification Quiz",
        description: "Test your understanding of classification",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What is overfitting?", options: ["Model too simple", "Model memorizes training data", "Model trains fast", "Model has few features"], correct_index: 1, explanation: "Overfitting: model memorizes training data instead of learning general patterns." },
          { id: "q2", text: "How does Random Forest reduce overfitting?", options: ["Using fewer trees", "Ensemble of trees with random subsets", "Using deeper trees", "Removing features"], correct_index: 1, explanation: "Random Forest uses many trees trained on random subsets, averaging their predictions to reduce overfitting." },
          { id: "q3", text: "When should you prioritize recall over precision?", options: ["Spam filtering", "Medical diagnosis", "Product recommendations", "Search ranking"], correct_index: 1, explanation: "In medical diagnosis, recall is critical - you don't want to miss any true positives (diseases)." },
        ],
        xp_reward: 25,
        estimated_minutes: 10,
      },
      {
        title: "Build a Spam Classifier",
        description: "Build and evaluate a text classification model",
        content_type: "project",
        sections: [
          { title: "Project", content: "Build an email spam classifier:\n\n1. Load email dataset\n2. Preprocess text (lowercase, remove punctuation, tokenize)\n3. Convert text to features (TF-IDF)\n4. Train multiple classifiers\n5. Compare performance\n6. Select best model" },
          { title: "Implementation", content: "from sklearn.feature_extraction.text import TfidfVectorizer\nfrom sklearn.naive_bayes import MultinomialNB\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import classification_report\n\nvectorizer = TfidfVectorizer(max_features=5000)\nX = vectorizer.fit_transform(emails['text'])\n\nX_train, X_test, y_train, y_test = train_test_split(X, emails['label'], test_size=0.2)\n\n# Naive Bayes\nnb = MultinomialNB()\nnb.fit(X_train, y_train)\nprint('Naive Bayes:', classification_report(y_test, nb.predict(X_test)))\n\n# Random Forest\nrf = RandomForestClassifier(n_estimators=100)\nrf.fit(X_train, y_train)\nprint('Random Forest:', classification_report(y_test, rf.predict(X_test)))" },
        ],
        questions: [],
        xp_reward: 40,
        estimated_minutes: 60,
      },
    ],
    advanced: [
      {
        title: "Neural Networks and Deep Learning",
        description: "Understand neural network architecture, backpropagation, and training",
        content_type: "lesson",
        sections: [
          { title: "Neural Network Basics", content: "A neural network is layers of connected neurons:\n\nInput Layer -> Hidden Layer(s) -> Output Layer\n\nEach connection has a weight.\nEach neuron applies: output = activation(sum(inputs * weights) + bias)\n\nCommon activations:\n- ReLU: max(0, x) - most popular for hidden layers\n- Sigmoid: 1/(1+e^(-x)) - for binary output\n- Softmax: for multi-class output\n\nBackpropagation:\n1. Forward pass: make prediction\n2. Calculate loss (error)\n3. Backward pass: compute gradients\n4. Update weights: w = w - lr * gradient" },
          { title: "Training Best Practices", content: "Key techniques for training neural networks:\n\n1. Learning rate: start small (0.001), use schedulers\n2. Batch size: 32-256, larger = more stable but slower\n3. Regularization: dropout, L2, early stopping\n4. Data augmentation: flip, rotate, crop images\n5. Batch normalization: stabilize training\n6. Transfer learning: use pretrained models\n\nCommon architectures:\n- CNN: images (ResNet, VGG)\n- RNN/LSTM: sequences (text, time series)\n- Transformer: NLP (BERT, GPT)" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 35,
      },
      {
        title: "Deep Learning Quiz",
        description: "Test your understanding of neural networks",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What does backpropagation compute?", options: ["Forward pass output", "Gradients of the loss", "New training data", "Activation values"], correct_index: 1, explanation: "Backpropagation computes gradients of the loss with respect to each weight, enabling weight updates." },
          { id: "q2", text: "What is the most popular activation for hidden layers?", options: ["Sigmoid", "Tanh", "ReLU", "Softmax"], correct_index: 2, explanation: "ReLU (max(0, x)) is the most popular activation for hidden layers due to simplicity and effectiveness." },
          { id: "q3", text: "What does dropout do?", options: ["Adds more neurons", "Randomly disables neurons during training", "Increases learning rate", "Reduces input size"], correct_index: 1, explanation: "Dropout randomly disables neurons during training, preventing co-adaptation and reducing overfitting." },
        ],
        xp_reward: 30,
        estimated_minutes: 10,
      },
      {
        title: "Build an Image Classifier",
        description: "Build a CNN image classifier using transfer learning",
        content_type: "project",
        sections: [
          { title: "Project", content: "Build an image classifier using transfer learning:\n\n1. Load a pretrained model (ResNet50)\n2. Freeze base layers\n3. Add custom classification head\n4. Fine-tune on your dataset\n5. Evaluate performance\n6. Deploy for inference" },
          { title: "Implementation", content: "import tensorflow as tf\nfrom tensorflow.keras.applications import ResNet50\nfrom tensorflow.keras import layers, models\n\nbase_model = ResNet50(weights='imagenet', include_top=False)\nbase_model.trainable = False  # Freeze\n\nmodel = models.Sequential([\n  base_model,\n  layers.GlobalAveragePooling2D(),\n  layers.Dense(256, activation='relu'),\n  layers.Dropout(0.5),\n  layers.Dense(num_classes, activation='softmax')\n])\n\nmodel.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])\nmodel.fit(train_data, epochs=10, validation_data=val_data)" },
        ],
        questions: [],
        xp_reward: 50,
        estimated_minutes: 90,
      },
    ],
  },

  "English Writing": {
    beginner: [
      {
        title: "Sentence Structure Basics",
        description: "Learn the fundamentals of constructing clear, grammatical sentences",
        content_type: "lesson",
        sections: [
          { title: "Parts of a Sentence", content: "Every sentence needs:\n\nSubject: who or what the sentence is about\nVerb: what the subject does or is\n\nComplete sentence: 'The cat sat on the mat.'\nFragment: 'Sat on the mat.' (missing subject)\n\nSentence types:\n- Simple: one independent clause\n- Compound: two independent clauses joined by and/but/or\n- Complex: independent + dependent clause\n- Compound-complex: two independent + dependent" },
          { title: "Common Grammar Rules", content: "Subject-verb agreement:\n- Singular subject, singular verb: 'She writes.'\n- Plural subject, plural verb: 'They write.'\n\nPronoun rules:\n- Subject pronouns: I, he, she, they (do the action)\n- Object pronouns: me, him, her, them (receive the action)\n\nTrick: Remove the other person:\n'He and I went' (not 'Him and I went')\n'Gave it to her and me' (not 'her and I')\n\nComma rules:\n- Separate items in a list\n- After introductory phrases\n- Before coordinating conjunctions in compound sentences" },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 20,
      },
      {
        title: "Grammar Quiz",
        description: "Test your understanding of basic grammar",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "Which sentence is correct?", options: ["Me and him went to the store.", "He and I went to the store.", "Him and I went to the store.", "I and he went to the store."], correct_index: 1, explanation: "Use subject pronouns (I, he) when the pronoun is the subject." },
          { id: "q2", text: "What does every sentence need?", options: ["An adjective and adverb", "A subject and verb", "A preposition", "A conjunction"], correct_index: 1, explanation: "Every complete sentence needs a subject (who/what) and a verb (action/state)." },
          { id: "q3", text: "Which is a sentence fragment?", options: ["The dog ran quickly.", "Running through the park.", "She likes pizza.", "We went home."], correct_index: 1, explanation: "'Running through the park' is a fragment - it has no subject." },
        ],
        xp_reward: 20,
        estimated_minutes: 10,
      },
      {
        title: "Paragraph Writing",
        description: "Learn to write well-structured paragraphs with topic sentences and supporting details",
        content_type: "lesson",
        sections: [
          { title: "Paragraph Structure", content: "A good paragraph has:\n\n1. Topic sentence: states the main idea\n2. Supporting sentences: provide evidence, examples, details\n3. Concluding sentence: wraps up or transitions\n\nExample:\n'Reading fiction improves empathy. When readers immerse themselves in characters' lives, they practice understanding different perspectives. Studies show that regular fiction readers score higher on empathy tests. This suggests that stories help us connect with others.'\n\nNotice: topic sentence first, then evidence, then conclusion." },
          { title: "Coherence and Flow", content: "Make paragraphs flow smoothly:\n\nTransition words:\n- Addition: also, furthermore, moreover\n- Contrast: however, nevertheless, on the other hand\n- Cause/effect: therefore, consequently, as a result\n- Example: for instance, specifically, to illustrate\n- Conclusion: in summary, ultimately, in conclusion\n\nPronoun references:\n'John studied hard. He passed the exam.'\n(He refers back to John)\n\nRepetition of key terms:\nUse the same key words to maintain focus." },
        ],
        questions: [],
        xp_reward: 15,
        estimated_minutes: 25,
      },
      {
        title: "Write a Descriptive Paragraph",
        description: "Practice writing a vivid, well-structured descriptive paragraph",
        content_type: "project",
        sections: [
          { title: "Assignment", content: "Write a descriptive paragraph about a place you know well.\n\nRequirements:\n1. Clear topic sentence\n2. At least 3 sensory details (sight, sound, smell, touch, taste)\n3. At least 5 supporting sentences\n4. A concluding sentence\n5. Use at least 2 transition words\n\nFocus on showing, not telling:\n- Telling: 'The beach was nice.'\n- Showing: 'Warm sand squeezed between my toes as waves crashed against the shore, filling the air with salt spray.'" },
          { title: "Self-Review Checklist", content: "Review your paragraph:\n\n1. Does the topic sentence state the main idea?\n2. Do all supporting sentences relate to the topic?\n3. Are there sensory details that help the reader see, hear, feel?\n4. Do transitions connect ideas smoothly?\n5. Does the concluding sentence wrap up effectively?\n6. Is every sentence grammatically correct?\n7. Are there varied sentence structures?\n8. Is the paragraph between 5-8 sentences?" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 45,
      },
    ],
    intermediate: [
      {
        title: "Essay Structure and Thesis Statements",
        description: "Master the five-paragraph essay and crafting strong thesis statements",
        content_type: "lesson",
        sections: [
          { title: "Thesis Statements", content: "A thesis statement is the central argument of your essay:\n\nCharacteristics of a strong thesis:\n- Specific: not vague or broad\n- Arguable: someone could disagree\n- Clear: one sentence, easy to understand\n- Roadmap: previews your main points\n\nWeak: 'Social media is bad.'\nStrong: 'Social media undermines meaningful relationships by replacing face-to-face interaction with superficial digital connections.'\n\nThe strong thesis is specific, arguable, and previews the argument." },
          { title: "Five-Paragraph Essay", content: "Structure:\n\n1. Introduction\n   - Hook (engaging opening)\n   - Context (background information)\n   - Thesis statement\n\n2-4. Body Paragraphs (one main point each)\n   - Topic sentence (supports thesis)\n   - Evidence/examples\n   - Analysis (explain how evidence supports thesis)\n   - Transition to next point\n\n5. Conclusion\n   - Restate thesis (differently)\n   - Summarize key points\n   - End with significance or call to action" },
        ],
        questions: [],
        xp_reward: 25,
        estimated_minutes: 30,
      },
      {
        title: "Essay Structure Quiz",
        description: "Test your understanding of essay writing",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "What makes a strong thesis statement?", options: ["Vague and broad", "Specific and arguable", "A question", "A fact everyone agrees with"], correct_index: 1, explanation: "A strong thesis is specific (not vague) and arguable (someone could reasonably disagree)." },
          { id: "q2", text: "What should a body paragraph's topic sentence do?", options: ["Introduce a new topic", "Support the thesis", "Summarize the essay", "Provide a conclusion"], correct_index: 1, explanation: "Each topic sentence should directly support the thesis statement." },
          { id: "q3", text: "What goes in the introduction?", options: ["Evidence and analysis", "Hook, context, and thesis", "Summary of points", "Counterarguments"], correct_index: 1, explanation: "The introduction contains a hook, context, and the thesis statement." },
        ],
        xp_reward: 25,
        estimated_minutes: 10,
      },
      {
        title: "Write a Persuasive Essay",
        description: "Write a complete persuasive essay on a topic of your choice",
        content_type: "project",
        sections: [
          { title: "Assignment", content: "Write a persuasive essay (500-700 words) on one of these topics:\n\n1. Should college be free?\n2. Is remote learning as effective as in-person?\n3. Should social media have age restrictions?\n\nRequirements:\n- Strong thesis statement\n- Three body paragraphs with evidence\n- Address at least one counterargument\n- Clear introduction and conclusion\n- Proper transitions between paragraphs" },
          { title: "Writing Process", content: "1. Choose your topic and position\n2. Write your thesis statement\n3. List 3 supporting arguments\n4. Identify one counterargument and your rebuttal\n5. Draft each paragraph\n6. Review for coherence and flow\n7. Check grammar and spelling\n8. Revise for clarity and impact" },
        ],
        questions: [],
        xp_reward: 40,
        estimated_minutes: 60,
      },
    ],
    advanced: [
      {
        title: "Advanced Rhetoric and Style",
        description: "Master rhetorical devices, tone control, and sophisticated writing techniques",
        content_type: "lesson",
        sections: [
          { title: "Rhetorical Devices", content: "Powerful techniques for persuasive writing:\n\nEthos: establish credibility\n'I have studied this topic for 20 years...'\n\nPathos: appeal to emotion\n'Imagine a child going hungry tonight...'\n\nLogos: appeal to logic\n'Three studies confirm that this approach reduces costs by 40%.'\n\nOther devices:\n- Anaphora: repeat opening words ('We shall fight on the beaches...')\n- Antithesis: contrast ideas in parallel ('One small step for man, one giant leap for mankind')\n- Chiasmus: reverse order ('Ask not what your country can do for you...')" },
          { title: "Style and Voice", content: "Developing your writing voice:\n\nSentence variety:\n- Mix short and long sentences\n- Short for impact: 'The results were clear.'\n- Long for complexity: 'Although the initial data seemed promising, further analysis revealed significant inconsistencies.'\n\nActive vs Passive voice:\n- Active: 'The team completed the project.' (stronger)\n- Passive: 'The project was completed.' (weaker, but useful when actor is unknown)\n\nConcision:\n- Wordy: 'Due to the fact that' -> 'Because'\n- Wordy: 'In order to' -> 'To'\n- Wordy: 'At this point in time' -> 'Now'" },
        ],
        questions: [],
        xp_reward: 30,
        estimated_minutes: 35,
      },
      {
        title: "Rhetoric Quiz",
        description: "Test your understanding of rhetorical devices",
        content_type: "quiz",
        sections: [],
        questions: [
          { id: "q1", text: "Which rhetorical appeal uses credibility?", options: ["Pathos", "Logos", "Ethos", "Kairos"], correct_index: 2, explanation: "Ethos appeals to credibility and authority of the speaker." },
          { id: "q2", text: "What is anaphora?", options: ["Repeating the first word of successive clauses", "Contrasting ideas", "Exaggeration", "Understatement"], correct_index: 0, explanation: "Anaphora repeats the opening word/phrase of successive clauses for emphasis." },
          { id: "q3", text: "When should you use passive voice?", options: ["Always", "When the actor is unknown or unimportant", "For stronger writing", "Never"], correct_index: 1, explanation: "Passive voice is useful when the actor is unknown, unimportant, or when you want to emphasize the action over the actor." },
        ],
        xp_reward: 30,
        estimated_minutes: 10,
      },
      {
        title: "Write a Rhetorical Analysis",
        description: "Analyze a famous speech using rhetorical principles",
        content_type: "project",
        sections: [
          { title: "Assignment", content: "Write a rhetorical analysis (800-1000 words) of a famous speech.\n\nAnalyze:\n1. The speaker's use of ethos, pathos, and logos\n2. At least 3 specific rhetorical devices\n3. How the structure supports the argument\n4. The effectiveness of the speech\n5. The historical context and audience\n\nStructure your analysis with:\n- Introduction with thesis about the speech's effectiveness\n- Body paragraphs analyzing specific techniques\n- Conclusion evaluating overall impact" },
          { title: "Analysis Framework", content: "For each rhetorical device you identify:\n\n1. Quote the specific passage\n2. Name the device (anaphora, antithesis, etc.)\n3. Explain how it works\n4. Analyze why the speaker chose it\n5. Evaluate its effectiveness on the audience\n\nExample: 'King uses anaphora when he repeats \"I have a dream\" eight times. This repetition builds emotional momentum and makes his vision of equality feel inevitable and powerful.'" },
        ],
        questions: [],
        xp_reward: 50,
        estimated_minutes: 90,
      },
    ],
  },
};

function getContentForSubject(subjectName: string, level: string): ModuleData[] | null {
  const subjectContent = SUBJECT_CONTENT[subjectName];
  if (!subjectContent) return null;
  return subjectContent[level] ?? subjectContent["beginner"] ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { user_id, subject_id, subject_name, knowledge_level }: PathRequest = await req.json();

    const content = getContentForSubject(subject_name, knowledge_level);
    if (!content) {
      return new Response(
        JSON.stringify({ error: "No content available for this subject/level combination" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: path, error: pathError } = await supabaseClient
      .from("learning_paths")
      .insert({
        user_id,
        subject_id,
        title: `${subject_name} Learning Path`,
        description: `Personalized ${subject_name} curriculum for ${knowledge_level} level learners`,
        difficulty: knowledge_level,
        estimated_hours: knowledge_level === "beginner" ? 40 : knowledge_level === "intermediate" ? 25 : 15,
      })
      .select()
      .single();

    if (pathError || !path) {
      return new Response(
        JSON.stringify({ error: "Failed to create learning path" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const modules = content.map((item, index) => ({
      learning_path_id: path.id,
      title: item.title,
      description: item.description,
      module_order: index,
      content_type: item.content_type,
      content: { sections: item.sections },
      xp_reward: item.xp_reward,
      estimated_minutes: item.estimated_minutes,
    }));

    const { data: insertedModules, error: modulesError } = await supabaseClient
      .from("modules")
      .insert(modules)
      .select();

    if (modulesError || !insertedModules) {
      return new Response(
        JSON.stringify({ error: "Failed to create modules" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const quizModules = content.filter(item => item.content_type === "quiz" && item.questions.length > 0);
    for (const quizContent of quizModules) {
      const moduleIndex = content.indexOf(quizContent);
      const module = insertedModules[moduleIndex];

      await supabaseClient.from("assessments").insert({
        module_id: module.id,
        title: quizContent.title,
        description: quizContent.description,
        questions: quizContent.questions,
        passing_score: 70,
        time_limit_minutes: 15,
      });
    }

    if (insertedModules.length > 0) {
      await supabaseClient.from("user_progress").insert({
        user_id,
        module_id: insertedModules[0].id,
        status: "in_progress",
      });
    }

    return new Response(
      JSON.stringify({ path, modules: insertedModules, message: "Learning path generated successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
