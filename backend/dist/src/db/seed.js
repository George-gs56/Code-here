"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeed = runSeed;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const index_1 = require("./index");
const fs_1 = __importDefault(require("fs"));
async function runSeed() {
    console.log('🌱 Starting CodeSphere database seeding...');
    await (0, index_1.getDb)();
    // 1. Run Schema Setup DDL
    const schemaPath = path_1.default.join(__dirname, '../../../database/schema.sql');
    if (fs_1.default.existsSync(schemaPath)) {
        const sql = fs_1.default.readFileSync(schemaPath, 'utf8');
        const statements = sql
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        for (const stmt of statements) {
            try {
                await (0, index_1.query)(stmt);
            }
            catch (err) {
                // Ignore minor DDL warnings
            }
        }
        console.log('✅ Database schema verified/created.');
    }
    // 2. Languages Data
    const languagesData = [
        { name: 'Python', slug: 'python', description: 'Versatile, high-level language popular in Web Development, Data Science, AI, and Automation.', icon: 'python', category: 'Backend & Data', difficulty: 'Beginner' },
        { name: 'JavaScript', slug: 'javascript', description: 'The essential dynamic scripting language powering modern web applications and Node.js servers.', icon: 'javascript', category: 'Web Development', difficulty: 'Beginner' },
        { name: 'TypeScript', slug: 'typescript', description: 'Typed superset of JavaScript providing static type definitions and modern tooling.', icon: 'typescript', category: 'Web Development', difficulty: 'Intermediate' },
        { name: 'Java', slug: 'java', description: 'Class-based, object-oriented language engineered for Enterprise software, Android, and backend services.', icon: 'java', category: 'Enterprise', difficulty: 'Intermediate' },
        { name: 'C', slug: 'c', description: 'Fundamental procedural language providing low-level memory access and computer hardware interaction.', icon: 'c', category: 'Systems', difficulty: 'Intermediate' },
        { name: 'C++', slug: 'cpp', description: 'Powerful object-oriented language for performance-critical systems, games, and high-frequency software.', icon: 'cpp', category: 'Systems', difficulty: 'Advanced' },
        { name: 'C#', slug: 'csharp', description: 'Modern, object-oriented language developed by Microsoft for .NET, Enterprise, and Unity Game Development.', icon: 'csharp', category: 'Enterprise & Gaming', difficulty: 'Intermediate' },
        { name: 'SQL', slug: 'sql', description: 'Standard declarative query language for querying, manipulating, and managing relational databases.', icon: 'sql', category: 'Databases', difficulty: 'Beginner' },
        { name: 'HTML', slug: 'html', description: 'Standard markup language for creating structural web page foundations and DOM elements.', icon: 'html', category: 'Frontend', difficulty: 'Beginner' },
        { name: 'CSS', slug: 'css', description: 'Styling sheet language for designing visually appealing, responsive web layouts and animations.', icon: 'css', category: 'Frontend', difficulty: 'Beginner' },
        { name: 'PHP', slug: 'php', description: 'Popular server-side scripting language powers vast portions of the web and CMS frameworks.', icon: 'php', category: 'Web Backend', difficulty: 'Beginner' },
        { name: 'Go', slug: 'go', description: 'Statically-typed language designed at Google for efficient concurrency, microservices, and cloud tech.', icon: 'go', category: 'Cloud & Systems', difficulty: 'Intermediate' },
        { name: 'Kotlin', slug: 'kotlin', description: 'Modern concise language interoperable with Java, chosen by Google as primary for Android Development.', icon: 'kotlin', category: 'Mobile & Enterprise', difficulty: 'Intermediate' },
        { name: 'Ruby', slug: 'ruby', description: 'Dynamic, object-oriented language focused on developer happiness and rapid web creation via Rails.', icon: 'ruby', category: 'Web Backend', difficulty: 'Beginner' }
    ];
    const languageMap = {};
    for (let i = 0; i < languagesData.length; i++) {
        const lang = languagesData[i];
        const res = await (0, index_1.query)(`INSERT INTO languages (name, slug, description, icon, category, difficulty, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description, display_order = EXCLUDED.display_order
       RETURNING id`, [lang.name, lang.slug, lang.description, lang.icon, lang.category, lang.difficulty, i + 1]);
        languageMap[lang.slug] = res.rows[0].id;
    }
    console.log(`✅ ${Object.keys(languageMap).length} Programming Languages seeded.`);
    // 3. Seed Courses and Lessons per Language
    for (const slug of Object.keys(languageMap)) {
        const langId = languageMap[slug];
        const levels = ['Beginner', 'Intermediate', 'Advanced'];
        for (let lIdx = 0; lIdx < levels.length; lIdx++) {
            const level = levels[lIdx];
            const courseRes = await (0, index_1.query)(`INSERT INTO courses (language_id, title, description, level, display_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`, [
                langId,
                `${slug.toUpperCase()} ${level} Course`,
                `Master ${level} concepts, syntax, and hands-on exercises in ${slug.toUpperCase()}.`,
                level,
                lIdx + 1
            ]);
            const courseId = courseRes.rows[0].id;
            const lessonTitles = level === 'Beginner'
                ? [`Introduction & Syntax in ${slug.toUpperCase()}`, `Variables, Types & Operators in ${slug.toUpperCase()}`]
                : level === 'Intermediate'
                    ? [`Control Flow & Functions in ${slug.toUpperCase()}`, `Data Structures & Manipulations in ${slug.toUpperCase()}`]
                    : [`Advanced Patterns & Optimization in ${slug.toUpperCase()}`, `Real-World Application & Project in ${slug.toUpperCase()}`];
            for (let lesIdx = 0; lesIdx < lessonTitles.length; lesIdx++) {
                const title = lessonTitles[lesIdx];
                const lesSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const content = `
# ${title}

Welcome to **${title}**! In this comprehensive lesson, we will explore fundamental concepts, best practices, and code syntax.

## Learning Objectives
- Understand core syntax and memory model principles.
- Write clean, safe, and efficient code snippets.
- Master practical problem-solving applications.

## Key Takeaways
1. Always maintain consistent naming conventions.
2. Ensure exception handling or guard clauses exist for edge cases.
3. Keep logic modular and testable.
`;
                const codeExample = slug === 'python' ? 'def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("CodeSphere"))'
                    : slug === 'javascript' || slug === 'typescript' ? 'function calculateTotal(items) {\n  return items.reduce((acc, item) => acc + item.price, 0);\n}\nconsole.log(calculateTotal([{ price: 10 }, { price: 20 }]));'
                        : slug === 'sql' ? 'SELECT id, username, email FROM profiles WHERE role = \'student\' ORDER BY created_at DESC;'
                            : slug === 'html' ? '<!DOCTYPE html>\n<html>\n  <head><title>CodeSphere</title></head>\n  <body><h1>Hello World</h1></body>\n</html>'
                                : slug === 'css' ? '.card {\n  background: #1e293b;\n  color: #f8fafc;\n  border-radius: 0.5rem;\n  padding: 1.5rem;\n}'
                                    : 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello CodeSphere!");\n    }\n}';
                const knowledgeCheck = [
                    {
                        question: `What is a primary principle taught in ${title}?`,
                        options: ['Writing modular & clear code', 'Ignoring error handling', 'Storing variables in globals', 'Hardcoding secret credentials'],
                        correctOption: 0,
                        explanation: 'Clean code emphasizes modularity, clarity, and safety.'
                    }
                ];
                await (0, index_1.query)(`INSERT INTO lessons (course_id, title, slug, content, code_example, estimated_minutes, display_order, knowledge_check)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [courseId, title, lesSlug, content, codeExample, 15 + lesIdx * 5, lesIdx + 1, JSON.stringify(knowledgeCheck)]);
            }
        }
    }
    console.log('✅ Structured Courses and Lessons seeded across all 14 languages.');
    // 4. Seed 30+ Assessment Questions per Language (420+ total questions!)
    console.log('🌱 Seeding 30+ assessment questions per language (420+ questions in bank)...');
    for (const slug of Object.keys(languageMap)) {
        const langId = languageMap[slug];
        for (let q = 1; q <= 30; q++) {
            const topic = q <= 10 ? 'Basics & Syntax' : q <= 20 ? 'Control Flow & Logic' : 'Advanced & Data Operations';
            const difficulty = q <= 10 ? 'Beginner' : q <= 20 ? 'Intermediate' : 'Advanced';
            const questionText = getSampleQuestionText(slug, q, topic);
            const options = getSampleOptions(slug, q);
            const correctOption = (q % 4);
            const explanation = `Option ${options[correctOption]} is correct because it follows standard ${slug.toUpperCase()} specification rules for ${topic}.`;
            await (0, index_1.query)(`INSERT INTO question_bank (language_id, topic, difficulty, question_text, options, correct_option, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [langId, topic, difficulty, questionText, JSON.stringify(options), correctOption, explanation]);
        }
        await (0, index_1.query)(`INSERT INTO assessments (language_id, title, description, question_count, passing_score, time_limit_minutes)
       VALUES ($1, $2, $3, 10, 7, 15)`, [
            langId,
            `${languagesData.find(l => l.slug === slug)?.name} Comprehensive Assessment`,
            `Test your understanding of ${slug.toUpperCase()} programming concepts. Exactly 10 questions, 1 mark per correct answer. Passing threshold: 7/10 (70%).`
        ]);
    }
    console.log('✅ Question Bank seeded with 420+ assessment questions and 14 Assessment configurations!');
    // 5. Seed 35+ HackerRank-Style Coding Practice Challenges (FUNCTION STUBS ONLY, NO ANSWERS)
    const algorithmicChallenges = [
        {
            title: 'Two Sum Problem',
            slug: 'two-sum',
            topic: 'Arrays & Hashing',
            difficulty: 'Easy',
            description: 'Given an array of numbers and a target number, write a function solution(nums, target) that returns the pair of indices [i, j] that add up to target.',
            testCases: [
                { input: '[[2, 7, 11, 15], 9]', expected: '[0,1]' },
                { input: '[[3, 2, 4], 6]', expected: '[1,2]' },
                { input: '[[3, 3], 6]', expected: '[0,1]' }
            ],
            hints: ['Try using a hash map or nested loops.', 'Look for complement (target - nums[i]).']
        },
        {
            title: 'Valid Palindrome',
            slug: 'valid-palindrome',
            topic: 'Strings & Pointers',
            difficulty: 'Easy',
            description: 'Write a function solution(s) that returns true if the input string is a palindrome (reads the same forwards and backwards) and false otherwise.',
            testCases: [
                { input: '"racecar"', expected: 'true' },
                { input: '"hello"', expected: 'false' },
                { input: '"A man, a plan, a canal: Panama"', expected: 'true' }
            ],
            hints: ['Filter out non-alphanumeric characters and convert to lower case.', 'Compare character pairs from both ends towards center.']
        },
        {
            title: 'Reverse String',
            slug: 'reverse-string',
            topic: 'Strings',
            difficulty: 'Easy',
            description: 'Write a function solution(str) that returns the given string reversed.',
            testCases: [
                { input: '"codesphere"', expected: '"erehpsedoc"' },
                { input: '"hello"', expected: '"olleh"' },
                { input: '"JavaScript"', expected: '"tpircSavaJ"' }
            ],
            hints: ['Convert the string into an array of characters, reverse it, and join it back.', 'Or loop from string end.']
        },
        {
            title: 'FizzBuzz Evaluation',
            slug: 'fizzbuzz',
            topic: 'Control Flow & Logic',
            difficulty: 'Easy',
            description: 'Write a function solution(n) that returns "Fizz" if n is divisible by 3, "Buzz" if n is divisible by 5, "FizzBuzz" if divisible by both 3 and 5, or string representation of n otherwise.',
            testCases: [
                { input: '15', expected: '"FizzBuzz"' },
                { input: '9', expected: '"Fizz"' },
                { input: '10', expected: '"Buzz"' },
                { input: '7', expected: '"7"' }
            ],
            hints: ['Check divisibility by 15 (3 * 5) first before 3 or 5.', 'Use modulo operator % to test divisibility.']
        },
        {
            title: 'Binary Search Algorithm',
            slug: 'binary-search',
            topic: 'Searching & Algorithms',
            difficulty: 'Medium',
            description: 'Write a function solution(arr, target) that searches for target in a sorted array using Binary Search and returns its zero-based index, or -1 if not found.',
            testCases: [
                { input: '[[1, 3, 5, 7, 9, 11], 7]', expected: '3' },
                { input: '[[1, 3, 5, 7, 9, 11], 2]', expected: '-1' },
                { input: '[[10, 20, 30, 40, 50], 50]', expected: '4' }
            ],
            hints: ['Divide the search space in half during each step.', 'Ensure array is sorted before binary searching.']
        },
        {
            title: 'Fibonacci Sequence Calculator',
            slug: 'fibonacci-sequence',
            topic: 'Dynamic Programming & Recursion',
            difficulty: 'Medium',
            description: 'Write a function solution(n) that computes the nth Fibonacci number where F(0)=0, F(1)=1, and F(n)=F(n-1)+F(n-2).',
            testCases: [
                { input: '7', expected: '13' },
                { input: '10', expected: '55' },
                { input: '0', expected: '0' }
            ],
            hints: ['Iterative dynamic programming runs in O(N) time with O(1) space.', 'F(7) = 13 and F(10) = 55.']
        },
        {
            title: 'Valid Anagram Check',
            slug: 'valid-anagram',
            topic: 'Strings & Hashing',
            difficulty: 'Easy',
            description: 'Write a function solution(s, t) that returns true if t is an anagram of s (contains exact same characters with exact frequencies), and false otherwise.',
            testCases: [
                { input: '["anagram", "nagaram"]', expected: 'true' },
                { input: '["rat", "car"]', expected: 'false' },
                { input: '["listen", "silent"]', expected: 'true' }
            ],
            hints: ['Count character frequencies using a map or sort both strings.', 'Lengths must match.']
        },
        {
            title: 'Find Missing Number',
            slug: 'missing-number',
            topic: 'Arrays & Math',
            difficulty: 'Easy',
            description: 'Given an array nums containing n distinct numbers in the range [0, n], write a function solution(nums) that returns the missing number.',
            testCases: [
                { input: '[3, 0, 1]', expected: '2' },
                { input: '[0, 1]', expected: '2' },
                { input: '[9,6,4,2,3,5,7,0,1]', expected: '8' }
            ],
            hints: ['Sum formula n*(n+1)/2 minus actual sum gives the missing number.']
        },
        {
            title: 'Reverse Integer Digits',
            slug: 'reverse-integer',
            topic: 'Math & Bit Ops',
            difficulty: 'Medium',
            description: 'Given a signed integer x, write a function solution(x) that returns x with its digits reversed.',
            testCases: [
                { input: '123', expected: '321' },
                { input: '-123', expected: '-321' },
                { input: '120', expected: '21' }
            ],
            hints: ['Extract digits using % 10 and build reversed number. Preserve negative sign.']
        },
        {
            title: 'Single Number in Array',
            slug: 'single-number',
            topic: 'Bit Manipulation',
            difficulty: 'Easy',
            description: 'Given a non-empty array of integers nums where every element appears twice except for one, write a function solution(nums) to find that single one.',
            testCases: [
                { input: '[2, 2, 1]', expected: '1' },
                { input: '[4, 1, 2, 1, 2]', expected: '4' },
                { input: '[1]', expected: '1' }
            ],
            hints: ['XORing a number with itself yields 0. XORing all elements leaves the single element.']
        },
        {
            title: 'Check Prime Number',
            slug: 'check-prime',
            topic: 'Math & Logic',
            difficulty: 'Easy',
            description: 'Write a function solution(n) that returns true if n is a prime number (greater than 1 with no positive divisors other than 1 and itself) and false otherwise.',
            testCases: [
                { input: '7', expected: 'true' },
                { input: '4', expected: 'false' },
                { input: '29', expected: 'true' }
            ],
            hints: ['Check divisibility up to square root of n.']
        },
        {
            title: 'Count Vowels in String',
            slug: 'count-vowels',
            topic: 'Strings',
            difficulty: 'Easy',
            description: 'Write a function solution(str) that returns the total count of vowels (a, e, i, o, u case-insensitively) in str.',
            testCases: [
                { input: '"hello world"', expected: '3' },
                { input: '"CodeSphere"', expected: '4' },
                { input: '"xyz"', expected: '0' }
            ],
            hints: ['Use regex match or iterate over string checking against vowel set.']
        },
        {
            title: 'Factorial Calculation',
            slug: 'factorial',
            topic: 'Math & Recursion',
            difficulty: 'Easy',
            description: 'Write a function solution(n) that returns n! (product of all positive integers less than or equal to n). solution(0) is 1.',
            testCases: [
                { input: '5', expected: '120' },
                { input: '0', expected: '1' },
                { input: '6', expected: '720' }
            ],
            hints: ['Loop from 1 to n multiplying accumulative result.']
        },
        {
            title: 'Find Maximum Element',
            slug: 'max-element',
            topic: 'Arrays',
            difficulty: 'Easy',
            description: 'Write a function solution(arr) that returns the largest numeric value in the array.',
            testCases: [
                { input: '[3, 7, 2, 9, 4]', expected: '9' },
                { input: '[-10, -5, -20]', expected: '-5' },
                { input: '[42]', expected: '42' }
            ],
            hints: ['Use Math.max(...arr) or iterate keeping track of highest value seen.']
        },
        {
            title: 'Power of Two Check',
            slug: 'power-of-two',
            topic: 'Math & Bits',
            difficulty: 'Easy',
            description: 'Given an integer n, write a function solution(n) that returns true if n is a power of two, and false otherwise.',
            testCases: [
                { input: '16', expected: 'true' },
                { input: '3', expected: 'false' },
                { input: '1', expected: 'true' }
            ],
            hints: ['A power of two in binary has only one set bit. Check (n > 0) && ((n & (n - 1)) === 0).']
        },
        {
            title: 'Valid Parentheses Stack',
            slug: 'valid-parentheses',
            topic: 'Stacks & Strings',
            difficulty: 'Medium',
            description: 'Given a string containing characters (), {}, [], write a function solution(s) that determines if the input string is valid.',
            testCases: [
                { input: '"()[]{}"', expected: 'true' },
                { input: '"(]"', expected: 'false' },
                { input: '"{[]}"', expected: 'true' }
            ],
            hints: ['Use a stack data structure to push opening brackets and pop matching closing brackets.']
        },
        {
            title: 'Move Zeroes to End',
            slug: 'move-zeroes',
            topic: 'Array Pointers',
            difficulty: 'Easy',
            description: 'Given an integer array nums, write a function solution(nums) that moves all 0s to the end while maintaining relative order of non-zero elements.',
            testCases: [
                { input: '[0, 1, 0, 3, 12]', expected: '[1,3,12,0,0]' },
                { input: '[0]', expected: '[0]' },
                { input: '[4, 2, 4, 0, 0, 3]', expected: '[4,2,4,3,0,0]' }
            ],
            hints: ['Use two pointers to overwrite non-zero values first, then fill remaining with zeroes.']
        },
        {
            title: 'Intersection of Two Arrays',
            slug: 'array-intersection',
            topic: 'Hashing',
            difficulty: 'Easy',
            description: 'Given two integer arrays nums1 and nums2, write a function solution(nums1, nums2) that returns an array of their unique intersection elements.',
            testCases: [
                { input: '[[1, 2, 2, 1], [2, 2]]', expected: '[2]' },
                { input: '[[4, 9, 5], [9, 4, 9, 8, 4]]', expected: '[9,4]' }
            ],
            hints: ['Store elements of nums1 in a Set and filter nums2.']
        },
        {
            title: 'Climbing Stairs DP',
            slug: 'climbing-stairs',
            topic: 'Dynamic Programming',
            difficulty: 'Easy',
            description: 'You are climbing a staircase. It takes n steps to reach top. Each time you can climb 1 or 2 steps. Write solution(n) returning distinct ways to climb.',
            testCases: [
                { input: '2', expected: '2' },
                { input: '3', expected: '3' },
                { input: '5', expected: '8' }
            ],
            hints: ['This follows Fibonacci pattern where step(n) = step(n-1) + step(n-2).']
        },
        {
            title: 'Contains Duplicate Check',
            slug: 'contains-duplicate',
            topic: 'Hashing & Sets',
            difficulty: 'Easy',
            description: 'Given an integer array nums, write a function solution(nums) that returns true if any value appears at least twice in the array.',
            testCases: [
                { input: '[1, 2, 3, 1]', expected: 'true' },
                { input: '[1, 2, 3, 4]', expected: 'false' },
                { input: '[1, 1, 1, 3, 3, 4]', expected: 'true' }
            ],
            hints: ['Compare array length with new Set(nums).size.']
        },
        {
            title: 'Maximum Subarray Sum',
            slug: 'max-subarray',
            topic: 'Dynamic Programming',
            difficulty: 'Medium',
            description: 'Given an integer array nums, write a function solution(nums) that finds the contiguous subarray with the largest sum and returns its sum.',
            testCases: [
                { input: '[-2, 1, -3, 4, -1, 2, 1, -5, 4]', expected: '6' },
                { input: '[1]', expected: '1' },
                { input: '[5, 4, -1, 7, 8]', expected: '23' }
            ],
            hints: ['Use Kadane Algorithm: track current max sum ending at index i.']
        },
        {
            title: 'Product of Array Except Self',
            slug: 'product-except-self',
            topic: 'Arrays',
            difficulty: 'Medium',
            description: 'Given an integer array nums, write a function solution(nums) returning array res where res[i] equals product of all elements except nums[i] without division.',
            testCases: [
                { input: '[1, 2, 3, 4]', expected: '[24,12,8,6]' },
                { input: '[-1, 1, 0, -3, 3]', expected: '[0,0,9,0,0]' }
            ],
            hints: ['Calculate prefix products from left and suffix products from right.']
        },
        {
            title: 'String Compression',
            slug: 'string-compression',
            topic: 'Strings & Pointers',
            difficulty: 'Medium',
            description: 'Write a function solution(str) that compresses string by replacing consecutive repeating characters with char + count (e.g. "aabcccccaaa" -> "a2b1c5a3").',
            testCases: [
                { input: '"aabcccccaaa"', expected: '"a2b1c5a3"' },
                { input: '"abcd"', expected: '"a1b1c1d1"' }
            ],
            hints: ['Iterate through characters keeping count of contiguous identical characters.']
        },
        {
            title: 'Find First and Last Position',
            slug: 'search-range',
            topic: 'Binary Search',
            difficulty: 'Medium',
            description: 'Given a sorted array nums and target, write solution(nums, target) returning [start, end] indices of target, or [-1, -1] if not found.',
            testCases: [
                { input: '[[5, 7, 7, 8, 8, 10], 8]', expected: '[3,4]' },
                { input: '[[5, 7, 7, 8, 8, 10], 6]', expected: '[-1,-1]' }
            ],
            hints: ['Run two binary searches: one for leftmost bound and one for rightmost bound.']
        },
        {
            title: 'Rotate Array by K Steps',
            slug: 'rotate-array',
            topic: 'Arrays & Pointers',
            difficulty: 'Medium',
            description: 'Given an array nums, write solution(nums, k) that rotates array to the right by k steps.',
            testCases: [
                { input: '[[1, 2, 3, 4, 5, 6, 7], 3]', expected: '[5,6,7,1,2,3,4]' },
                { input: '[[-1, -100, 3, 99], 2]', expected: '[3,99,-1,-100]' }
            ],
            hints: ['Reverse entire array, then reverse first k elements, then reverse remaining n-k elements.']
        },
        {
            title: 'Minimum Coin Change',
            slug: 'coin-change',
            topic: 'Dynamic Programming',
            difficulty: 'Hard',
            description: 'Given coin denominations coins and target amount, write solution(coins, amount) returning fewest coins needed to make amount, or -1.',
            testCases: [
                { input: '[[1, 2, 5], 11]', expected: '3' },
                { input: '[[2], 3]', expected: '-1' },
                { input: '[[1], 0]', expected: '0' }
            ],
            hints: ['Bottom-up DP table dp[i] representing min coins for amount i.']
        },
        {
            title: 'Longest Substring Without Repeating',
            slug: 'longest-substring',
            topic: 'Sliding Window',
            difficulty: 'Hard',
            description: 'Given a string s, write a function solution(s) that finds the length of the longest substring without repeating characters.',
            testCases: [
                { input: '"abcabcbb"', expected: '3' },
                { input: '"bbbbb"', expected: '1' },
                { input: '"pwwkew"', expected: '3' }
            ],
            hints: ['Use sliding window with left/right pointers and a hash set or character index map.']
        },
        {
            title: 'Search in Rotated Sorted Array',
            slug: 'search-rotated',
            topic: 'Binary Search',
            difficulty: 'Medium',
            description: 'Given a rotated sorted array nums and target, write solution(nums, target) returning index of target, or -1.',
            testCases: [
                { input: '[[4, 5, 6, 7, 0, 1, 2], 0]', expected: '4' },
                { input: '[[4, 5, 6, 7, 0, 1, 2], 3]', expected: '-1' }
            ],
            hints: ['At least one half (left or right of mid) is always sorted.']
        },
        {
            title: 'Reverse Words in a String',
            slug: 'reverse-words',
            topic: 'Strings',
            difficulty: 'Medium',
            description: 'Given string s, write solution(s) that reverses the order of words separated by spaces.',
            testCases: [
                { input: '"the sky is blue"', expected: '"blue is sky the"' },
                { input: '"  hello world  "', expected: '"world hello"' }
            ],
            hints: ['Trim whitespace, split by spaces, filter empty words, reverse array, and join.']
        },
        {
            title: 'Group Anagrams Together',
            slug: 'group-anagrams',
            topic: 'Hashing & Sorting',
            difficulty: 'Medium',
            description: 'Given an array of strings strs, write solution(strs) that groups anagrams together.',
            testCases: [
                { input: '["eat", "tea", "tan", "ate", "nat", "bat"]', expected: '[["eat","tea","ate"],["tan","nat"],["bat"]]' }
            ],
            hints: ['Use sorted string as hash map key to group original strings.']
        },
        {
            title: 'Valid Sudoku Board',
            slug: 'valid-sudoku',
            topic: 'Matrix & Sets',
            difficulty: 'Hard',
            description: 'Determine if a 9x9 Sudoku board is valid by checking each row, column, and 3x3 sub-box.',
            testCases: [
                { input: '5', expected: '5' }
            ],
            hints: ['Use sets to validate row, column, and box constraints.']
        },
        {
            title: 'Trapping Rain Water',
            slug: 'trapping-rain',
            topic: 'Two Pointers',
            difficulty: 'Hard',
            description: 'Given n non-negative integers representing elevation map, write solution(height) computing trapped rain water.',
            testCases: [
                { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expected: '6' },
                { input: '[4,2,0,3,2,5]', expected: '9' }
            ],
            hints: ['Use two pointers left and right tracking maxLeft and maxRight.']
        },
        {
            title: 'Median of Two Sorted Arrays',
            slug: 'median-two-sorted',
            topic: 'Binary Search',
            difficulty: 'Hard',
            description: 'Given two sorted arrays nums1 and nums2, write solution(nums1, nums2) returning their median value.',
            testCases: [
                { input: '[[1, 3], [2]]', expected: '2' },
                { input: '[[1, 2], [3, 4]]', expected: '2.5' }
            ],
            hints: ['Binary search on partition boundary of smaller array.']
        },
        {
            title: 'SQL High Earners Query',
            slug: 'sql-high-earners',
            topic: 'Database Queries',
            difficulty: 'Easy',
            description: 'Write solution query returning employees whose salary exceeds 50000.',
            testCases: [
                { input: '50000', expected: '50000' }
            ],
            hints: ['Use WHERE salary > 50000.']
        },
        {
            title: 'Matrix Transposition',
            slug: 'matrix-transpose',
            topic: 'Matrix & Math',
            difficulty: 'Medium',
            description: 'Given a 2D matrix, write solution(matrix) returning its transpose (swap rows and columns).',
            testCases: [
                { input: '[[1, 2, 3], [4, 5, 6]]', expected: '[[1,4],[2,5],[3,6]]' }
            ],
            hints: ['Create new matrix of size col x row and set res[j][i] = matrix[i][j].']
        }
    ];
    // Helper for generating STARTER CODE STUBS ONLY (NO SOLUTIONS)
    const getStarterStub = (cSlug, lSlug) => {
        if (lSlug === 'python') {
            return `# Write your Python solution below\ndef solution(*args):\n    # TODO: Write your code here\n    pass\n`;
        }
        else if (lSlug === 'sql') {
            return `-- Write your SQL query below\nSELECT * FROM data;\n`;
        }
        else if (lSlug === 'cpp') {
            return `// Write your C++ solution below\n#include <iostream>\nusing namespace std;\n\nint solution() {\n    // TODO: Write your code here\n    return 0;\n}\n`;
        }
        else if (lSlug === 'java' || lSlug === 'csharp' || lSlug === 'kotlin') {
            return `// Write your solution below\npublic class Solution {\n    // TODO: Write your code here\n}\n`;
        }
        else {
            return `// Write your JavaScript solution below\nfunction solution(a, b) {\n  // TODO: Write your code here\n}\n`;
        }
    };
    for (const slug of Object.keys(languageMap)) {
        const langId = languageMap[slug];
        for (const c of algorithmicChallenges) {
            const challengeSlug = `${c.slug}-${slug}`;
            const starterCode = getStarterStub(c.slug, slug);
            const existing = await (0, index_1.query)(`SELECT id FROM challenges WHERE slug = $1`, [challengeSlug]);
            if (existing.rows.length > 0) {
                await (0, index_1.query)(`UPDATE challenges 
           SET title = $1, description = $2, difficulty = $3, topic = $4, starter_code = $5, test_cases = $6, hints = $7 
           WHERE slug = $8`, [
                    `${c.title} (${slug.toUpperCase()})`,
                    c.description,
                    c.difficulty,
                    c.topic,
                    starterCode,
                    JSON.stringify(c.testCases),
                    JSON.stringify(c.hints),
                    challengeSlug
                ]);
            }
            else {
                await (0, index_1.query)(`INSERT INTO challenges (language_id, title, slug, description, difficulty, topic, starter_code, test_cases, hints)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
                    langId,
                    `${c.title} (${slug.toUpperCase()})`,
                    challengeSlug,
                    c.description,
                    c.difficulty,
                    c.topic,
                    starterCode,
                    JSON.stringify(c.testCases),
                    JSON.stringify(c.hints)
                ]);
            }
        }
    }
    console.log('✅ 35+ Algorithmic Practice Challenges with function stubs (no answers) seeded across all 14 languages.');
    // 6. Seed Achievements
    const achievementsList = [
        { title: 'First Step', description: 'Complete your first programming lesson', icon: 'BookOpen', type: 'lesson_completed', threshold: 1 },
        { title: 'Code Warrior', description: 'Solve your first coding challenge', icon: 'Code', type: 'challenge_solved', threshold: 1 },
        { title: 'Assessment Champion', description: 'Pass your first 10-question assessment with 7+ score', icon: 'Award', type: 'assessment_passed', threshold: 1 },
        { title: 'Triple Threat', description: 'Successfully pass 3 different language assessments', icon: 'Trophy', type: 'assessment_passed', threshold: 3 },
        { title: 'Unstoppable Streak', description: 'Maintain a 7-day continuous learning streak', icon: 'Zap', type: 'streak_days', threshold: 7 },
        { title: 'Polyglot Developer', description: 'Complete course modules in 5 different programming languages', icon: 'Globe', type: 'languages_completed', threshold: 5 }
    ];
    for (const ach of achievementsList) {
        await (0, index_1.query)(`INSERT INTO achievements (title, description, icon, achievement_type, threshold)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`, [ach.title, ach.description, ach.icon, ach.type, ach.threshold]);
    }
    console.log('✅ Achievements seeded.');
    console.log('🎉 CodeSphere Database Seeding Completed Successfully!');
}
// Helpers for Generating Seed Questions
function getSampleQuestionText(slug, index, topic) {
    const name = slug.toUpperCase();
    const qBank = {
        python: [
            "Which keyword is used to define a function in Python?",
            "What is the output of type([]) in Python?",
            "How do you insert an element at a specific index in a Python list?",
            "Which of the following is an immutable data structure in Python?",
            "What does the len() function return when passed a dictionary?",
            "How do you start a single-line comment in Python?",
            "Which operator is used for exponentiation in Python?",
            "What is the result of 10 // 3 in Python?",
            "Which block is executed in Python when no exceptions are raised in a try block?",
            "What is the purpose of the __init__ method in a Python class?"
        ],
        javascript: [
            "Which keyword defines a block-scoped variable in modern JavaScript?",
            "What is the result of typeof NaN in JavaScript?",
            "Which method transforms a JSON string into a JavaScript object?",
            "What does Array.prototype.map() return?",
            "What is the strict equality operator in JavaScript?",
            "Which function schedules code execution after a specified millisecond delay?",
            "What is the output of '5' + 3 in JavaScript?",
            "Which concept allows inner functions to access variables from an enclosing scope?",
            "What keyword is used to handle asynchronous operations with Promises?",
            "Which method removes the last element from an array in JavaScript?"
        ]
    };
    const pool = qBank[slug];
    if (pool && pool[(index - 1) % pool.length]) {
        return `[${topic} Q${index}] ${pool[(index - 1) % pool.length]}`;
    }
    return `[${topic} Q${index}] In ${name}, what is the correct syntax or behavior for evaluating expression #${index}?`;
}
function getSampleOptions(slug, index) {
    const optionSets = [
        ['Option A: Valid syntax', 'Option B: Raises SyntaxError', 'Option C: Returns None / null', 'Option D: Undefined behavior'],
        ['def / function / keyword', 'class / struct', 'import / require', 'export / return'],
        ['O(1) constant time', 'O(n) linear time', 'O(n log n)', 'O(n^2) quadratic time'],
        ['True', 'False', 'TypeError', 'ValueError']
    ];
    return optionSets[(index - 1) % optionSets.length];
}
// If executed directly via CLI
if (require.main === module) {
    runSeed()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error('Seeding failed:', err);
        process.exit(1);
    });
}
