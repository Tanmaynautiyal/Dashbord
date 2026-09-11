from datetime import datetime, timezone, date as date_type
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID, uuid4
import random
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.quiz import DailyQuiz, DailyQuizQuestion
from app.models.content import LearningTopic

# List of supported topic categories
TOPIC_OPTIONS = [
    {"key": "daily", "title": "✨ Today's Daily Challenge", "category": "daily", "icon": "sparkles"},
    {"key": "python", "title": "🐍 Python & FastAPI", "category": "backend", "icon": "code"},
    {"key": "react", "title": "⚛️ React & Frontend Architecture", "category": "frontend", "icon": "layout"},
    {"key": "typescript", "title": "📘 TypeScript & JavaScript", "category": "frontend", "icon": "file-code"},
    {"key": "security", "title": "🛡️ Web Security & OWASP", "category": "security", "icon": "shield"},
    {"key": "ai", "title": "🤖 AI, LLMs & Modern RAG", "category": "ai", "icon": "cpu"},
    {"key": "devops", "title": "🐳 DevOps, Docker & K8s", "category": "devops", "icon": "terminal"},
    {"key": "database", "title": "🗄️ PostgreSQL & Databases", "category": "database", "icon": "database"},
    {"key": "system_design", "title": "🏗️ System Design & Distributed Systems", "category": "architecture", "icon": "server"},
]

DIFFICULTY_OPTIONS = [
    {"key": "Beginner", "label": "Beginner", "badgeColor": "emerald", "desc": "Syntax, core concepts & basics"},
    {"key": "Intermediate", "label": "Intermediate", "badgeColor": "amber", "desc": "Practical patterns & best practices"},
    {"key": "Hard", "label": "Hard", "badgeColor": "rose", "desc": "Deep internals, concurrency & edge cases"},
]

# Daily topic rotation sequence
DAILY_ROTATION_KEYS = ["security", "ai", "python", "typescript", "react", "database", "devops", "system_design"]

# Curated question banks organized by [topic_key][difficulty]
QUESTION_BANKS: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
    "python": {
        "Beginner": [
            {
                "question_text": "Which of the following correctly declares a variable in Python?",
                "options": ["x = 5", "int x = 5", "var x = 5", "let x = 5"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is the return type of the expression: type(3.14)?",
                "options": ["<class 'int'>", "<class 'float'>", "<class 'number'>", "<class 'double'>"],
                "correct_option_index": 1,
            },
            {
                "question_text": "How do you add an element to the end of a list in Python?",
                "options": ["list.push(item)", "list.add(item)", "list.append(item)", "list.insert_end(item)"],
                "correct_option_index": 2,
            },
            {
                "question_text": "Which built-in Python data structure stores unique elements in an unordered collection?",
                "options": ["list", "tuple", "dict", "set"],
                "correct_option_index": 3,
            },
            {
                "question_text": "What is the difference between a list and a tuple in Python?",
                "options": ["Lists are immutable, tuples are mutable", "Lists are mutable, tuples are immutable", "Tuples cannot hold strings", "Lists can only hold numbers"],
                "correct_option_index": 1,
            },
        ],
        "Intermediate": [
            {
                "question_text": "What is the primary difference between a Python generator function and a regular function?",
                "options": ["Generators use `yield` to stream values lazily without storing the entire sequence in memory", "Generators run in a separate OS thread automatically", "Generators can only return integers", "Generators cannot accept parameters"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What does the `@dataclass` decorator in Python's standard library provide automatically?",
                "options": ["Database migrations", "Standard methods like `__init__`, `__repr__`, and `__eq__` based on typed attributes", "Automatic async execution", "Automatic serialization to XML"],
                "correct_option_index": 1,
            },
            {
                "question_text": "In FastAPI, what is the recommended way to inject a database session into a route handler?",
                "options": ["Creating a global database session variable", "Using the `Depends()` dependency injection mechanism", "Reading raw SQL strings from query params", "Opening a new socket manually inside the route"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is the purpose of `__slots__` in a Python class definition?",
                "options": ["To restrict dynamic attribute creation and significantly reduce per-instance memory overhead", "To enable multi-threading", "To define database primary keys", "To automatically export attributes to JSON"],
                "correct_option_index": 0,
            },
            {
                "question_text": "How does `dict.get(key, default)` behave differently from `dict[key]` when `key` does not exist?",
                "options": ["`get` raises a KeyError, `[]` returns None", "`get` returns the default value (or None) without raising KeyError", "`get` creates the key with the default value in the dict", "`get` only works for integer keys"],
                "correct_option_index": 1,
            },
        ],
        "Hard": [
            {
                "question_text": "How does the Python Global Interpreter Lock (GIL) affect CPU-bound vs I/O-bound multi-threaded programs?",
                "options": ["It prevents multi-threading for both CPU and I/O tasks", "It limits CPU-bound execution to one core at a time, but releases during I/O operations", "It runs CPU tasks across multiple cores automatically", "It has no impact on CPython"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What happens under the hood when `await asyncio.gather(*tasks)` is executed in Python's event loop?",
                "options": ["It starts a new OS process for each task", "It registers callbacks on all coroutines, running them concurrently on the cooperative event loop until all complete", "It executes them sequentially synchronously", "It compiles the tasks to C++ binary"],
                "correct_option_index": 1,
            },
            {
                "question_text": "In Python descriptor protocol, what differentiates a 'data descriptor' from a 'non-data descriptor'?",
                "options": ["A data descriptor defines `__set__` and/or `__delete__`, taking precedence over the instance's `__dict__`", "A data descriptor can only store float values", "A non-data descriptor cannot have a `__get__` method", "There is no difference in lookup order"],
                "correct_option_index": 0,
            },
            {
                "question_text": "Why can calling a synchronous blocking function (e.g. `time.sleep`) inside an `async def` FastAPI endpoint freeze the entire worker?",
                "options": ["Because FastAPI crashes on sleep", "Because it blocks the single-threaded cooperative event loop, preventing all other concurrent requests from progressing", "Because Python threads auto-terminate after 100ms", "It only affects the single requesting client"],
                "correct_option_index": 1,
            },
            {
                "question_text": "How does Python's cyclic garbage collector detect and clean up circular references that reference counting alone cannot resolve?",
                "options": ["By restarting the interpreter", "By tracking container objects via generation lists and finding unreachable isolated reference cycles", "By freeing all objects older than 10 minutes", "By disabling circular references at syntax compile time"],
                "correct_option_index": 1,
            },
        ],
    },
    "react": {
        "Beginner": [
            {
                "question_text": "What is JSX in React?",
                "options": ["A new programming language that replaces JavaScript", "A syntax extension for JavaScript that looks similar to HTML", "A database query language", "A CSS preprocessor"],
                "correct_option_index": 1,
            },
            {
                "question_text": "Which React hook is used to manage local component state in functional components?",
                "options": ["useContext", "useReducer", "useState", "useEffect"],
                "correct_option_index": 2,
            },
            {
                "question_text": "Why must list items in React have a unique `key` prop?",
                "options": ["To apply CSS styles", "To help React identify which items have changed, been added, or removed during reconciliation", "To sort the array in alphabetical order", "To enable browser caching"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is the correct way to update state based on previous state in `useState`?",
                "options": ["setCount(count + 1)", "setCount(prev => prev + 1)", "count = count + 1", "this.state.count++"],
                "correct_option_index": 1,
            },
            {
                "question_text": "When does the callback inside `useEffect(fn, [])` with an empty dependency array execute?",
                "options": ["On every single re-render", "Only once after the initial component mount", "Before the DOM is rendered", "Whenever any state changes"],
                "correct_option_index": 1,
            },
        ],
        "Intermediate": [
            {
                "question_text": "What is the primary use case for React's `useMemo` hook?",
                "options": ["To memoize expensive calculation results so they aren't recomputed on every render", "To perform network API calls", "To trigger re-renders when props change", "To replace Redux"],
                "correct_option_index": 0,
            },
            {
                "question_text": "Why should you return a cleanup function from inside `useEffect`?",
                "options": ["To speed up component compilation", "To clear timers, cancel subscriptions, or remove event listeners before re-running or unmounting", "To reset all component state to null", "To delete the virtual DOM tree"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is the difference between `useCallback(fn, deps)` and `useMemo(fn, deps)`?",
                "options": ["`useCallback` caches the function instance itself; `useMemo` caches the return value of invoking the function", "`useCallback` only works with async functions", "`useMemo` cannot accept dependency arrays", "They are 100% identical aliases"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What problem does the React Context API solve?",
                "options": ["Prop drilling (passing props down through multiple layers of intermediate components)", "Slow CSS animations", "Server-side database connection pooling", "Automatic TypeScript typing"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is the purpose of React Error Boundaries?",
                "options": ["To catch JavaScript errors anywhere in the child component tree and display a fallback UI", "To catch compile-time syntax errors", "To validate form input values", "To prevent 404 HTTP errors from API servers"],
                "correct_option_index": 0,
            },
        ],
        "Hard": [
            {
                "question_text": "In React 18 Concurrent Mode, what does `useTransition()` allow developers to do?",
                "options": ["Animate CSS opacity", "Mark state updates as non-urgent transitions so the UI remains responsive to urgent user input", "Synchronously block the browser thread", "Switch between dark and light mode"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What causes a 'Hydration Mismatch' error in SSR frameworks like Next.js?",
                "options": ["Database server is down", "The initial HTML rendered by the server differs from the initial client-side React render tree", "The user is disconnected from WiFi", "CSS files failed to bundle"],
                "correct_option_index": 1,
            },
            {
                "question_text": "How does React Fiber differ from the legacy stack reconciler?",
                "options": ["Fiber can pause, abort, or prioritize work across frames via cooperative scheduling", "Fiber compiles directly to WebAssembly", "Fiber eliminates the Virtual DOM entirely", "Fiber only supports class components"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is the exact timing difference between `useLayoutEffect` and `useEffect`?",
                "options": ["`useLayoutEffect` runs synchronously after DOM mutations but BEFORE the browser paints; `useEffect` runs asynchronously after paint", "`useLayoutEffect` runs on the server; `useEffect` runs on the client", "`useEffect` runs before the DOM is created", "`useLayoutEffect` cannot access DOM refs"],
                "correct_option_index": 0,
            },
            {
                "question_text": "Why does mutating an object directly in React state (e.g. `user.name = 'Bob'; setUser(user)`) fail to trigger a re-render?",
                "options": ["React checks shallow reference equality (`Object.is`) on state and sees the identical object pointer", "React only allows primitive strings in state", "React state is read-only at the browser hardware level", "The browser prevents object property mutations"],
                "correct_option_index": 0,
            },
        ],
    },
    "typescript": {
        "Beginner": [
            {
                "question_text": "What is the primary benefit of TypeScript over plain JavaScript?",
                "options": ["It adds compile-time static type checking to catch errors early", "It runs directly in CPU hardware without an engine", "It replaces HTML and CSS", "It makes JavaScript syntax backwards-incompatible"],
                "correct_option_index": 0,
            },
            {
                "question_text": "Which TypeScript type represents a value that could be either a string or a number?",
                "options": ["string & number", "string | number", "string + number", "Union<string, number>"],
                "correct_option_index": 1,
            },
            {
                "question_text": "How do you mark an interface property as optional in TypeScript?",
                "options": ["`name!: string`", "`optional name: string`", "`name?: string`", "`name~: string`"],
                "correct_option_index": 2,
            },
            {
                "question_text": "What is the output of compiling TypeScript files (`tsc`)?",
                "options": ["A binary executable (.exe)", "Standard JavaScript (.js) files with types stripped", "WebAssembly (.wasm)", "Java bytecode (.class)"],
                "correct_option_index": 1,
            },
            {
                "question_text": "Which keyword is used to declare an immutable variable in modern JavaScript/TypeScript?",
                "options": ["var", "let", "const", "static"],
                "correct_option_index": 2,
            },
        ],
        "Intermediate": [
            {
                "question_text": "What is the difference between `unknown` and `any` in TypeScript?",
                "options": ["`unknown` is type-safe: you must perform type narrowing/checking before operating on it; `any` turns off all type checking", "`any` is safer than `unknown`", "`unknown` can only hold primitive numbers", "They are identical in modern TypeScript"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is a 'Discriminated Union' in TypeScript?",
                "options": ["A union of types sharing a common literal property (e.g. `kind: 'circle' | 'square'`) that TypeScript uses to narrow types", "A union that throws errors at runtime", "A generic type with more than 5 parameters", "A deprecated feature from TS 2.0"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What does the utility type `Pick<T, K>` do?",
                "options": ["Removes keys from T", "Constructs a new type by picking the set of keys K from type T", "Makes all properties optional", "Makes all properties read-only"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is the purpose of the `keyof` operator in TypeScript?",
                "options": ["Returns an array of values at runtime", "Produces a string or numeric literal union of an object type's keys", "Generates cryptographic public keys", "Deletes a key from an object"],
                "correct_option_index": 1,
            },
            {
                "question_text": "In the JavaScript Event Loop, what takes precedence in task execution order?",
                "options": ["Macrotasks (setTimeout) execute before Microtasks (Promise.then)", "Microtasks (Promise callbacks, queueMicrotask) execute before the next macrotask", "All tasks execute in purely random order", "Network fetch callbacks bypass the event loop entirely"],
                "correct_option_index": 1,
            },
        ],
        "Hard": [
            {
                "question_text": "What does the `infer` keyword enable inside a TypeScript conditional type?",
                "options": ["Automatic type coercion at runtime", "Deducing and extracting an unknown type variable from within another type during conditional evaluation", "Preventing null pointer exceptions", "Disabling strict null checks"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is 'Distributive Conditional Typing' in TypeScript?",
                "options": ["When conditional types automatically distribute over union types if the checked type is a bare type parameter", "Distributing code across cloud servers", "Splitting arrays into chunks", "Converting objects into tuples"],
                "correct_option_index": 0,
            },
            {
                "question_text": "How do 'Branded Types' (Nominal Typing) prevent accidental substitution of primitives with identical shapes (e.g. `UserId` vs `OrderId`)?",
                "options": ["By attaching a phantom unique literal property (`type UserId = string & { readonly __brand: unique symbol }`)", "By using Java-style classes with private constructors", "By adding runtime prefix checks to all strings", "TypeScript does not allow differentiating primitive types"],
                "correct_option_index": 0,
            },
            {
                "question_text": "In TypeScript function parameter types, why are parameters contravariant while return types are covariant?",
                "options": ["A function expecting a broader type can safely accept a function that requires a narrower type without runtime errors", "Because TypeScript developers preferred reverse alphabetical order", "Because JavaScript engines cannot evaluate function returns", "Parameter types are always invariant in all languages"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is the behavior of the `satisfies` operator introduced in TypeScript 4.9?",
                "options": ["It validates that an expression matches a type without widening or altering the expression's inferred specific literal type", "It casts any value to `any`", "It runs runtime schema validation via Zod", "It asserts that a promise is resolved"],
                "correct_option_index": 0,
            },
        ],
    },
    "security": {
        "Beginner": [
            {
                "question_text": "Which protocol secures web traffic by encrypting communication between browser and server?",
                "options": ["FTP", "HTTP", "HTTPS (SSL/TLS)", "Telnet"],
                "correct_option_index": 2,
            },
            {
                "question_text": "Why should you never store user passwords in plain text in a database?",
                "options": ["It takes up too much disk space", "If the database is leaked, all user accounts and credentials are instantly compromised", "Plain text slows down SQL queries", "Modern databases reject plain text strings"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What does SQL Injection (SQLi) exploit?",
                "options": ["Unsanitized user input concatenated directly into database queries", "Expired SSL certificates", "CSS stylesheet errors", "Slow internet connections"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is Phishing?",
                "options": ["Searching a database for duplicate rows", "A social engineering attack that tricks users into revealing credentials through deceptive communications", "Automated unit testing", "Compressing image files for web optimization"],
                "correct_option_index": 1,
            },
            {
                "question_text": "Which cookie flag ensures that a cookie is only sent over encrypted HTTPS connections?",
                "options": ["HttpOnly", "Secure", "SameSite", "Path"],
                "correct_option_index": 1,
            },
        ],
        "Intermediate": [
            {
                "question_text": "Which cookie attribute prevents client-side JavaScript from accessing authentication cookies, mitigating token theft via XSS?",
                "options": ["SameSite=Strict", "Secure", "HttpOnly", "Domain"],
                "correct_option_index": 2,
            },
            {
                "question_text": "What is the recommended modern hashing algorithm for storing passwords securely against GPU cracking?",
                "options": ["MD5 with salt", "SHA-256 with 1 iteration", "Argon2id or bcrypt with adaptive work factor", "Base64 encoding"],
                "correct_option_index": 2,
            },
            {
                "question_text": "In Cross-Site Request Forgery (CSRF), how does the `SameSite=Lax` or `Strict` cookie attribute help defend the application?",
                "options": ["It encrypts the cookie payload", "It instructs browsers not to send the cookie on cross-site requests initiated by untrusted origins", "It forces the user to log in again every 5 minutes", "It blocks all GET requests"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What does a Content Security Policy (CSP) HTTP header do?",
                "options": ["Restricts the sources from which scripts, styles, and other resources can be loaded and executed", "Enforces database backups", "Checks the syntax of JavaScript code", "Monitors server CPU usage"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What does the `Strict-Transport-Security` (HSTS) header instruct browsers to do?",
                "options": ["Always connect to the site using HTTPS, automatically upgrading any HTTP links and rejecting invalid certificates", "Disable all cookies", "Enable developer tools", "Cache API responses for 1 year"],
                "correct_option_index": 0,
            },
        ],
        "Hard": [
            {
                "question_text": "Why must cryptographic secret comparisons (e.g. HMAC or API tokens) use constant-time comparison (`hmac.compare_digest`) instead of standard `==`?",
                "options": ["`==` throws syntax errors on binary data", "Standard `==` short-circuits on the first mismatched byte, creating a timing side-channel attack vector that leaks secret bytes", "`==` converts strings to uppercase", "Constant-time comparison is 100x faster than `==`"],
                "correct_option_index": 1,
            },
            {
                "question_text": "How can an attacker exploit Server-Side Request Forgery (SSRF) in a cloud environment (e.g. AWS EC2)?",
                "options": ["By forcing the server to send HTTP requests to internal cloud metadata endpoints (`http://169.254.169.254/`) to steal IAM credentials", "By overloading the client's browser CPU", "By reading the user's local cookies", "By modifying HTML headers on the client"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What causes Regular Expression Denial of Service (ReDoS)?",
                "options": ["A database timeout during regex indexing", "Catastrophic backtracking in poorly structured regex patterns when evaluating non-matching input, causing exponential polynomial CPU execution time", "A network socket error", "Memory leakage in CSS selectors"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is the security risk of configuring `Access-Control-Allow-Origin: *` while simultaneously setting `Access-Control-Allow-Credentials: true`?",
                "options": ["Browsers reject this combination by specification, but reflecting incoming `Origin` headers dynamically permits any malicious website to read authenticated API responses", "It crashes the web server instantly", "It converts all POST requests into GET requests", "It invalidates SSL certificates"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What vulnerability does JavaScript Prototype Pollution introduce in Node.js backend applications?",
                "options": ["Modifying `Object.prototype` via recursive merge/clone of untrusted input can inject or override properties on all objects, leading to auth bypass or RCE", "It leaks memory by keeping unused variables in closures", "It prevents garbage collection on DOM nodes", "It breaks TypeScript type checking at compile time"],
                "correct_option_index": 0,
            },
        ],
    },
    "ai": {
        "Beginner": [
            {
                "question_text": "What is an LLM in artificial intelligence?",
                "options": ["Low Latency Memory", "Large Language Model", "Linear Logic Machine", "Logical Learning Module"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is a 'token' in the context of Large Language Models?",
                "options": ["A cryptocurrency coin", "A chunk of text (characters or sub-words) that the model processes as a discrete input unit", "A hardware GPU chip", "An API authentication password"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is 'Hallucination' in LLMs?",
                "options": ["When the model generates plausible-sounding but factually incorrect or fabricated information", "When the model runs out of GPU memory", "When the model takes longer than 10 seconds to respond", "When the model outputs text in a different language"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What does lowering the 'temperature' parameter in an LLM API call accomplish?",
                "options": ["Makes the output more deterministic, focused, and consistent", "Cools down the server hardware", "Increases creative randomness and unpredictability", "Doubles the maximum context window size"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is 'Prompt Engineering'?",
                "options": ["Writing machine code for GPUs", "The practice of designing, structuring, and optimizing input prompts to guide LLMs toward desired outputs", "Building physical server racks for AI data centers", "Training neural network weights from scratch"],
                "correct_option_index": 1,
            },
        ],
        "Intermediate": [
            {
                "question_text": "What is the core architecture pattern of Retrieval-Augmented Generation (RAG)?",
                "options": ["Retraining an entire LLM from scratch with private data", "Retrieving relevant context from a vector database and injecting it into the prompt before generation", "Running multiple LLMs sequentially without context", "Quantizing model weights into 4-bit precision"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What does an embedding model convert text into?",
                "options": ["A compressed ZIP file", "A high-dimensional dense vector representing semantic meaning", "A relational SQL schema", "An abstract syntax tree"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is 'Few-Shot Prompting'?",
                "options": ["Prompting the model only 3 times per hour", "Providing a small number of input-output demonstration examples inside the prompt to guide formatting and reasoning", "Calling 5 different models simultaneously", "Limiting response length to under 50 tokens"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is the primary function of LLM 'Tool Calling' / 'Function Calling'?",
                "options": ["Allowing the model to output structured arguments to invoke external APIs, search tools, or databases", "Running Python scripts directly on the model's neural layers", "Rewriting user prompts automatically", "Translating code into machine binary"],
                "correct_option_index": 0,
            },
            {
                "question_text": "Why do RAG pipelines chunk large documents with an overlap window (e.g. 500 tokens with 50-token overlap)?",
                "options": ["To double storage revenue", "To preserve semantic context and sentence continuity across chunk boundaries", "To bypass API rate limits", "To increase prompt temperature"],
                "correct_option_index": 1,
            },
        ],
        "Hard": [
            {
                "question_text": "What is the 'Lost in the Middle' phenomenon observed in long-context LLMs?",
                "options": ["Models frequently fail to retrieve or reason over information positioned in the middle of a very long prompt compared to the beginning or end", "Models crash if context length exceeds 10,000 tokens", "Embeddings lose precision during vector normalization", "GPU attention caches corrupt during middle layers"],
                "correct_option_index": 0,
            },
            {
                "question_text": "In advanced RAG, how does a Cross-Encoder Reranker differ from a Bi-Encoder vector search?",
                "options": ["Bi-Encoders independently embed query and doc into vectors for fast cosine lookup; Cross-Encoders evaluate full cross-attention over query+doc pairs for high-precision re-ranking", "Bi-Encoders are 100x slower than Cross-Encoders", "Cross-Encoders only work with images", "Bi-Encoders do not use neural networks"],
                "correct_option_index": 0,
            },
            {
                "question_text": "How does Hypothetical Document Embeddings (HyDE) improve dense retrieval accuracy?",
                "options": ["By asking the LLM to generate a hypothetical answer first, then embedding that answer to retrieve semantically similar real documents", "By encrypting document chunks with AES-256", "By removing all stopwords before vectorization", "By deleting half of the documents randomly"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is the memory bottleneck when serving long-context LLM inference at scale?",
                "options": ["The quadratic or linear growth of the Key-Value (KV) Cache stored in GPU VRAM across attention layers", "Hard drive read speeds", "Network router bandwidth", "CPU cache line false sharing"],
                "correct_option_index": 0,
            },
            {
                "question_text": "In autonomous multi-agent systems, what is an 'Agent Deadlock / Infinite Loop' and how is it mitigated?",
                "options": ["Agents repeatedly query each other with unproductive re-prompts; mitigated via strict step recursion limits, timeout guards, and structured stop conditions", "The GPU shuts down due to overheating", "The vector database locks all tables for exclusive writing", "Tokens are consumed faster than network bandwidth allows"],
                "correct_option_index": 0,
            },
        ],
    },
    "devops": {
        "Beginner": [
            {
                "question_text": "What is the main difference between a Docker container and a Virtual Machine (VM)?",
                "options": ["Containers share the host OS kernel and are lightweight; VMs package a full guest OS with virtualized hardware", "VMs are always faster to start than containers", "Containers cannot run Linux", "There is no difference"],
                "correct_option_index": 0,
            },
            {
                "question_text": "Which Dockerfile instruction specifies the base image for a build?",
                "options": ["RUN", "FROM", "BASE", "IMAGE"],
                "correct_option_index": 1,
            },
            {
                "question_text": "Which command builds a Docker image from a Dockerfile in the current directory with tag `myapp:latest`?",
                "options": ["docker build -t myapp:latest .", "docker compile myapp:latest", "docker make myapp", "docker image new myapp"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is CI/CD in modern software development?",
                "options": ["Continuous Integration and Continuous Deployment / Delivery", "Computer Interface and Core Drivers", "Cloud Infrastructure and Container Design", "Centralized Indexing and Custom Data"],
                "correct_option_index": 0,
            },
            {
                "question_text": "How do you map container port 80 to host port 8080 when running `docker run`?",
                "options": ["-p 8080:80", "-p 80:8080", "--ports 8080=80", "-m 8080->80"],
                "correct_option_index": 0,
            },
        ],
        "Intermediate": [
            {
                "question_text": "What is the primary benefit of Docker Multi-Stage builds?",
                "options": ["Running multiple containers in parallel on a single core", "Separating build tools/compilers from the final runtime image, resulting in dramatically smaller and more secure production images", "Enabling multi-threaded compilation in Python", "Automatically provisioning AWS EC2 instances"],
                "correct_option_index": 1,
            },
            {
                "question_text": "In Kubernetes, what is a Pod?",
                "options": ["A physical hardware server blade", "The smallest deployable computing unit in Kubernetes, encapsulating one or more co-located containers sharing storage and network", "A container registry repository", "A master node controller"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is the difference between a Kubernetes 'Liveness Probe' and a 'Readiness Probe'?",
                "options": ["Liveness determines if the container must be restarted; Readiness determines if the container is ready to accept incoming traffic", "Liveness checks memory; Readiness checks disk space", "Readiness probe restarts the pod; Liveness probe does nothing", "They are exact synonyms"],
                "correct_option_index": 0,
            },
            {
                "question_text": "Why should sensitive production credentials NEVER be hardcoded into a Dockerfile?",
                "options": ["Dockerfiles do not support strings", "Image layers are cached and inspectable by anyone with read access to the image, permanently exposing credentials in the image history", "It prevents containers from booting on ARM processors", "Docker images automatically encrypt all files on build"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What does a Blue-Green deployment strategy achieve?",
                "options": ["Zero-downtime releases by switching live traffic from the old environment (Blue) to an identical new environment (Green) after verification", "Deploying code only on alternating days", "Color-coding container logs in Kibana", "Running half the database on SQLite"],
                "correct_option_index": 0,
            },
        ],
        "Hard": [
            {
                "question_text": "In Kubernetes, how does `kube-proxy` route Service ClusterIP traffic to backend Pods under iptables/IPVS mode?",
                "options": ["By acting as a user-space proxy copying every network packet through the kernel", "By programming kernel netfilter iptables / IPVS rules that perform DNAT directly on incoming packets without user-space context switches", "By modifying the pod's `/etc/hosts` file on every request", "By running an internal NGINX container on each pod"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What happens when a container exceeds its defined Kubernetes `resources.limits.memory`?",
                "options": ["The Linux kernel OOM killer terminates the container with exit code 137 (OOMKilled)", "The container automatically borrows memory from adjacent pods", "The CPU slows down to 10% speed to preserve memory", "Kubernetes silently swaps the excess memory to disk"],
                "correct_option_index": 0,
            },
            {
                "question_text": "Why is pinning Docker base images by immutable SHA-256 digest (`node@sha256:...`) preferred in secure production pipelines over tags like `:latest` or `:18-alpine`?",
                "options": ["Digests guarantee exact byte-for-byte reproducibility and prevent supply chain tag mutability attacks", "Digests download 50% faster than tags", "Tags can only be pulled once per day from Docker Hub", "Digests enable automatic container rootless mode"],
                "correct_option_index": 0,
            },
            {
                "question_text": "How does a Canary deployment differ from a Rolling Update in Kubernetes?",
                "options": ["Canary routes a small percentage of real user traffic to the new version to measure errors and latency before full rollout; Rolling updates incrementally replace pods regardless of application metrics", "Canary requires manual approval for every single pod", "Rolling updates do not support Docker images", "Canary can only run on staging clusters"],
                "correct_option_index": 0,
            },
            {
                "question_text": "In Kubernetes networking (CNI), what problem does CoreDNS resolve for pods communicating via Service names?",
                "options": ["Internal cluster service discovery by resolving `<service-name>.<namespace>.svc.cluster.local` to the Service's ClusterIP", "Encrypting all pod-to-pod network packets with TLS", "Load balancing external public internet traffic", "Backing up persistent volume claims"],
                "correct_option_index": 0,
            },
        ],
    },
    "database": {
        "Beginner": [
            {
                "question_text": "What is a Primary Key in a relational database table?",
                "options": ["A column that contains encrypted passwords", "A unique identifier for each row in the table that cannot contain NULL values", "The first column defined in the CREATE TABLE statement", "A foreign key pointing to another database"],
                "correct_option_index": 1,
            },
            {
                "question_text": "Which SQL clause is used to filter records based on a specified condition?",
                "options": ["GROUP BY", "ORDER BY", "WHERE", "LIMIT"],
                "correct_option_index": 2,
            },
            {
                "question_text": "What does a Foreign Key establish between two relational tables?",
                "options": ["An encrypted network tunnel", "A referential integrity constraint linking a column to the primary key of another table", "Automatic table partitioning", "A backup replica"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is the difference between `DELETE FROM users;` and `DROP TABLE users;`?",
                "options": ["`DELETE` removes rows while keeping the table structure intact; `DROP` destroys the entire table schema and data", "`DELETE` is permanent, `DROP` can be undone with CTRL+Z", "`DROP` only deletes empty rows", "They are identical commands"],
                "correct_option_index": 0,
            },
            {
                "question_text": "Which SQL aggregate function calculates the total number of rows matching a query?",
                "options": ["SUM()", "TOTAL()", "COUNT()", "AVG()"],
                "correct_option_index": 2,
            },
        ],
        "Intermediate": [
            {
                "question_text": "What does the 'A' in ACID transaction properties stand for, and what does it guarantee?",
                "options": ["Asynchronous: transactions run in background threads", "Atomicity: all operations succeed completely or the entire transaction is rolled back with zero changes", "Availability: database is accessible 99.999% of the time", "Authorization: only admin users can commit"],
                "correct_option_index": 1,
            },
            {
                "question_text": "Why does adding a B-Tree index on a frequently queried column speed up `SELECT ... WHERE email = ?` but potentially slow down `INSERT` operations?",
                "options": ["Because indexes convert tables to text files", "Because the B-Tree structure enables fast logarithmic O(log N) lookups, but must be rebalanced and written on each insert/update", "Because indexes consume all available RAM on writes", "Because B-Trees only work on read-only databases"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What does PostgreSQL's `EXPLAIN ANALYZE` command provide that standard `EXPLAIN` does not?",
                "options": ["It generates unit tests", "It actually executes the query and reports real measured execution times and row counts alongside the planner's estimates", "It rewrites the query into Python", "It automatically adds missing indexes"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is the difference between an `INNER JOIN` and a `LEFT JOIN`?",
                "options": ["`INNER JOIN` only returns rows where there is a match in both tables; `LEFT JOIN` returns all rows from the left table plus matched rows from the right", "`INNER JOIN` returns more rows than `LEFT JOIN`", "`LEFT JOIN` sorts data from left to right", "They produce the exact same result set"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What problem does database Connection Pooling (e.g. PgBouncer or SQLAlchemy pool) solve?",
                "options": ["Overhead of repeatedly establishing costly TCP and SSL connections and authenticating processes for every short-lived query", "Encrypting database disk storage", "Preventing SQL injection attacks", "Formatting SQL queries with proper indentation"],
                "correct_option_index": 0,
            },
        ],
        "Hard": [
            {
                "question_text": "How does PostgreSQL's Multi-Version Concurrency Control (MVCC) ensure readers do not block writers and writers do not block readers?",
                "options": ["By locking the entire table for each transaction", "By keeping multiple tuple versions with `xmin` / `xmax` transaction IDs, so queries view a consistent snapshot corresponding to transaction start", "By converting all writes into asynchronous background jobs", "By running read queries on SQLite in-memory mirrors"],
                "correct_option_index": 1,
            },
            {
                "question_text": "In PostgreSQL, what is 'Table Bloat' and why is `VACUUM` necessary?",
                "options": ["Tables taking more than 1GB of disk space", "Dead tuples left behind after `UPDATE` and `DELETE` operations remain on disk until `VACUUM` reclaims their space for future writes", "Indexes being created with too many columns", "A corrupted database header"],
                "correct_option_index": 1,
            },
            {
                "question_text": "Under the SQL standard isolation levels, what is a 'Phantom Read' and which isolation level prevents it?",
                "options": ["A query sees rows deleted by uncommitted transactions; prevented by Read Uncommitted", "A transaction re-executes a range query and discovers new rows inserted and committed by another transaction; prevented by Serializable isolation", "A query reading corrupted disk sectors; prevented by fsync", "A deadlock between two queries; prevented by auto-rollback"],
                "correct_option_index": 1,
            },
            {
                "question_text": "What is the key structural trade-off between a PostgreSQL B-Tree index and a BRIN (Block Range Index)?",
                "options": ["BRIN indexes are dramatically smaller because they summarize min/max values for ranges of physical pages, ideal for naturally ordered append-only time-series data", "BRIN indexes are 100x slower for every use case", "B-Tree indexes cannot index numbers", "BRIN indexes require rebuilding after every query"],
                "correct_option_index": 0,
            },
            {
                "question_text": "How does PostgreSQL handle distributed vector similarity search with the `pgvector` HNSW (Hierarchical Navigable Small World) index compared to IVFFlat?",
                "options": ["HNSW builds a multi-layer graph with higher query recall and faster search without requiring periodic training, at the expense of higher build time and memory", "IVFFlat is always superior in recall and memory to HNSW", "HNSW only supports binary vectors", "pgvector does not support cosine similarity"],
                "correct_option_index": 0,
            },
        ],
    },
    "system_design": {
        "Beginner": [
            {
                "question_text": "What is the primary difference between Vertical Scaling and Horizontal Scaling?",
                "options": ["Vertical scaling adds more CPU/RAM to an existing single machine; Horizontal scaling adds more machines/nodes to the pool", "Horizontal scaling is always cheaper", "Vertical scaling means adding more databases", "They are identical concepts"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is the role of a Load Balancer in a distributed system?",
                "options": ["Distributing incoming network traffic evenly across a group of backend backend servers to ensure high availability and responsiveness", "Compressing database backups", "Compiling frontend code", "Encrypting hard drives"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is Latency vs Throughput?",
                "options": ["Latency is the time taken to process a single request; Throughput is the rate of requests processed per unit of time", "Latency is the number of servers; Throughput is internet speed", "Throughput is request time; Latency is total users", "They mean the exact same metric"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is a Content Delivery Network (CDN)?",
                "options": ["A geographically distributed network of proxy edge servers that cache static assets close to end users to reduce latency", "A high-speed database cluster", "A server that compiles TypeScript", "A type of firewall router"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What does HTTP status code 429 indicate?",
                "options": ["Internal Server Error", "Too Many Requests (Rate limit exceeded)", "Unauthorized", "Not Found"],
                "correct_option_index": 1,
            },
        ],
        "Intermediate": [
            {
                "question_text": "What is Consistent Hashing and why is it used in distributed caching (e.g. Memcached, DynamoDB)?",
                "options": ["A hashing scheme where adding or removing a cache node only requires remapping K/N keys rather than all keys across nodes", "A way to encrypt passwords in Redis", "A method to verify file checksums", "A technique to sort arrays in O(N)"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is the primary benefit of decoupling microservices using asynchronous Message Queues (e.g. Kafka, RabbitMQ)?",
                "options": ["Producers and consumers can operate independently at different rates without blocking each other during spikes or downstream failures", "Message queues eliminate the need for databases", "Queues make HTTP requests 100% synchronous", "Queues guarantee zero CPU usage"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is the 'Token Bucket' algorithm used for in system design?",
                "options": ["API Rate Limiting to regulate traffic bursts and sustain continuous request flows smoothly", "Database indexing", "Cryptographic key exchange", "Memory allocation for garbage collectors"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is the difference between Write-Through and Write-Back caching strategies?",
                "options": ["Write-Through writes to cache and DB synchronously; Write-Back writes to cache immediately and updates DB asynchronously later", "Write-Back writes to DB first, then cache", "Write-Through only caches read requests", "They have identical durability guarantees"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What problem does the Circuit Breaker pattern solve in distributed microservices?",
                "options": ["It prevents cascading failures by temporarily failing fast when a downstream dependency is unhealthy, allowing it time to recover", "It stops power surges in data centers", "It automatically restarts the server operating system", "It encrypts network cables"],
                "correct_option_index": 0,
            },
        ],
        "Hard": [
            {
                "question_text": "In the CAP Theorem, what must a distributed data store trade off during a network partition (P)?",
                "options": ["It must choose between Consistency (returning the most recent write or an error) and Availability (every non-failing node returning a response)", "It must choose between Security and Speed", "It must shut down all database servers", "Partition tolerance can always be avoided by using faster fiber cables"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is a 'Cache Stampede' (Thundering Herd problem) and how is it effectively prevented?",
                "options": ["When a popular cached key expires and hundreds of concurrent requests simultaneously hit the database; prevented via mutex locking, early background recomputation, or probabilistic early expiration (XFetch)", "When a Redis cluster runs out of memory", "When a database index becomes corrupted", "When network bandwidth drops below 1 Mbps"],
                "correct_option_index": 0,
            },
            {
                "question_text": "In microservices architectures, how does the Saga Pattern manage distributed transactions without two-phase commit (2PC)?",
                "options": ["By executing a series of local transactions in each service, coordinating compensating transactions to undo changes if any step fails", "By locking all global databases until the user logs out", "By running all microservices inside a single monolithic process", "By ignoring database errors completely"],
                "correct_option_index": 0,
            },
            {
                "question_text": "How do Conflict-Free Replicated Data Types (CRDTs) achieve strong eventual consistency in collaborative, multi-master distributed systems?",
                "options": ["Their mathematical state update operations are commutative, associative, and idempotent, allowing replicas to converge without central coordination or locks", "By electing a single primary leader that rejects all offline writes", "By storing all edits in a centralized MySQL server", "By discarding conflicting writes from older timestamps"],
                "correct_option_index": 0,
            },
            {
                "question_text": "What is the primary trade-off of using LSM-Trees (Log-Structured Merge-Trees, e.g. RocksDB/Cassandra) over B-Trees (Postgres)?",
                "options": ["LSM-Trees optimize for high write throughput by appending sequentially to a memtable and flushing SSTables, at the cost of read amplification and background compaction overhead", "LSM-Trees are strictly faster for all read queries than B-Trees", "LSM-Trees cannot persist data to disk", "LSM-Trees only support in-memory key-value lookups"],
                "correct_option_index": 0,
            },
        ],
    },
}


def get_quiz_metadata() -> Dict[str, Any]:
    """Returns supported topics and difficulties for UI selection."""
    return {
        "topics": TOPIC_OPTIONS,
        "difficulties": DIFFICULTY_OPTIONS,
    }


def get_or_create_custom_quiz(
    db: Session,
    topic_key: Optional[str] = "daily",
    difficulty: Optional[str] = None,
    target_date: Optional[date_type] = None,
) -> Tuple[DailyQuiz, str, str]:
    """
    Retrieves or generates a quiz according to the user's choice of topic and difficulty.
    If topic_key == 'daily' or None, resolves to today's rotating topic.
    Returns (quiz, topic_title, difficulty_level).
    """
    if target_date is None:
        target_date = datetime.now(timezone.utc).date()

    # Resolve daily rotation if requested
    if not topic_key or topic_key == "daily":
        day_seed = target_date.toordinal()
        resolved_key = DAILY_ROTATION_KEYS[day_seed % len(DAILY_ROTATION_KEYS)]
    else:
        resolved_key = topic_key.lower().strip()
        if resolved_key not in QUESTION_BANKS:
            resolved_key = "python"

    # Resolve difficulty
    valid_difficulties = ["Beginner", "Intermediate", "Hard"]
    resolved_difficulty = difficulty if difficulty in valid_difficulties else "Intermediate"

    # Find matching option title
    topic_meta = next((t for t in TOPIC_OPTIONS if t["key"] == resolved_key), None)
    topic_title = topic_meta["title"] if topic_meta else f"{resolved_key.title()} Challenge"

    # Unique tag for topic + difficulty
    quiz_lookup_title = f"{topic_title} — {resolved_difficulty}"

    # Check if a learning topic exists for this
    topic_obj = db.scalar(
        select(LearningTopic).where(LearningTopic.title == quiz_lookup_title)
    )
    if not topic_obj:
        topic_obj = LearningTopic(
            id=uuid4(),
            title=quiz_lookup_title,
            description=f"{resolved_difficulty} level quiz covering {topic_title}",
            difficulty_level=resolved_difficulty,
        )
        db.add(topic_obj)
        db.flush()

    # Look for existing quiz for this topic_id for today
    start_of_day = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0, tzinfo=timezone.utc)
    end_of_day = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59, tzinfo=timezone.utc)

    existing_quiz = db.scalar(
        select(DailyQuiz)
        .where(DailyQuiz.topic_id == topic_obj.id)
        .where(DailyQuiz.date >= start_of_day)
        .where(DailyQuiz.date <= end_of_day)
        .order_by(DailyQuiz.created_at.desc())
    )
    if existing_quiz and existing_quiz.questions:
        return existing_quiz, topic_title, resolved_difficulty

    # Create new quiz
    new_quiz = DailyQuiz(
        id=uuid4(),
        topic_id=topic_obj.id,
        date=datetime(target_date.year, target_date.month, target_date.day, 12, 0, 0, tzinfo=timezone.utc),
    )
    db.add(new_quiz)
    db.flush()

    # Get questions from pool for (resolved_key, resolved_difficulty)
    topic_pool = QUESTION_BANKS.get(resolved_key, QUESTION_BANKS["python"])
    q_list = topic_pool.get(resolved_difficulty, topic_pool["Intermediate"])

    for q_data in q_list:
        q_obj = DailyQuizQuestion(
            id=uuid4(),
            quiz_id=new_quiz.id,
            question_text=q_data["question_text"],
            options=q_data["options"],
            correct_option_index=q_data["correct_option_index"],
        )
        db.add(q_obj)

    db.commit()
    db.refresh(new_quiz)
    return new_quiz, topic_title, resolved_difficulty


def get_shuffled_quiz_questions(
    questions: List[DailyQuizQuestion],
    user_id: Optional[UUID] = None,
    shuffle_seed: Optional[int] = None,
) -> List[DailyQuizQuestion]:
    """
    Returns the list of quiz questions shuffled for the user.
    Each user gets a uniquely shuffled question order, or on-demand via shuffle_seed.
    """
    if not questions:
        return []

    shuffled = list(questions)
    seed_val = f"{user_id}_{shuffle_seed}" if shuffle_seed is not None else str(user_id or uuid4())
    rng = random.Random(seed_val)
    rng.shuffle(shuffled)
    return shuffled
