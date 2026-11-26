const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
let puppeteer = null;
try {
    puppeteer = require("puppeteer");
} catch {
    puppeteer = null;
}
let PDFDocument = null;
try {
    PDFDocument = require("pdfkit");
} catch {
    PDFDocument = null;
}
const fs = require("fs");


const GOOGLE_API_KEY =
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    "";

const GEMINI_MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-flash-lite-latest";

const ai = GOOGLE_API_KEY
    ? new GoogleGenAI({
        apiKey: GOOGLE_API_KEY,
    })
    : null;

const skillAnalysisSchema = z.object({
    name: z.string(),
    level: z.number().min(0).max(100),
    status: z.enum(["strong", "partial", "missing"]),
});

const analysisSchema = z.object({
    matchScore: z.number().min(0).max(100),
    summary: z.string(),
    skills: z.array(skillAnalysisSchema),
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    focusAreas: z.array(z.string()),
});

const answerFeedbackSchema = z.object({
    score: z.number().min(1).max(10),
    whatWasGood: z.string(),
    whatToImprove: z.string(),
});

const interviewReportSchema = z.object({
    matchScore: z
        .number()
        .min(0)
        .max(100),

    analysis: analysisSchema.optional(),

    technicalQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
        })
    ),

    behavioralQuestions: z.array(
        z.object({
            question: z.string(),
            intention: z.string(),
            answer: z.string(),
        })
    ),

    skillGaps: z.array(
        z.object({
            skill: z.string(),
            severity: z.enum([
                "low",
                "medium",
                "high",
            ]),
        })
    ),

    preparationPlan: z.array(
        z.object({
            day: z.number(),
            focus: z.string(),
            tasks: z.array(z.string()),
        })
    ),

    title: z.string(),
});



function cleanText(value) {
    if (!value) {
        return "";
    }

    return String(value)
        .replace(/\s+/g, " ")
        .trim();
}


function getKeywords(text) {
    const stopWords = new Set([
        "the",
        "and",
        "for",
        "with",
        "that",
        "this",
        "from",
        "have",
        "has",
        "are",
        "was",
        "will",
        "you",
        "your",
        "our",
        "their",
        "they",
        "but",
        "not",
        "can",
        "job",
        "role",
        "work",
        "experience",
        "years",
        "looking",
        "developer",
        "candidate",
        "using",
        "into",
        "about",
        "should",
        "must",
        "who",
        "what",
        "where",
        "when",
        "how",
    ]);

    return [
        ...new Set(
            cleanText(text)
                .toLowerCase()
                .replace(/[^a-z0-9+#.\- ]/g, " ")
                .split(/\s+/)
                .filter(
                    (word) =>
                        word.length >= 3 &&
                        !stopWords.has(word)
                )
        ),
    ];
}


function getMatchedKeywords(
    jobDescription,
    candidateText
) {
    const jobKeywords =
        getKeywords(jobDescription);

    const candidateKeywords =
        getKeywords(candidateText);

    return jobKeywords.filter((keyword) =>
        candidateKeywords.includes(keyword)
    );
}


function calculateMatchScore(
    jobDescription,
    selfDescription,
    resume
) {
    const candidateText = [
        selfDescription,
        resume,
    ].join(" ");

    const jobKeywords =
        getKeywords(jobDescription);

    const matchedKeywords =
        getMatchedKeywords(
            jobDescription,
            candidateText
        );

    if (!jobKeywords.length) {
        return 70;
    }

    const percentage =
        (matchedKeywords.length /
            jobKeywords.length) *
        100;

    return Math.max(
        45,
        Math.min(
            95,
            Math.round(percentage)
        )
    );
}


function detectRole(jobDescription) {
    const text =
        cleanText(jobDescription)
            .toLowerCase();

    if (
        text.includes("full stack") ||
        text.includes("fullstack")
    ) {
        return "Full Stack Developer";
    }

    if (text.includes("frontend") ||
        text.includes("front-end") ||
        text.includes("react")) {
        return "Frontend Developer";
    }

    if (
        text.includes("backend") ||
        text.includes("back-end") ||
        text.includes("node.js") ||
        text.includes("nodejs")
    ) {
        return "Backend Developer";
    }

    if (
        text.includes("java developer") ||
        text.includes("spring boot")
    ) {
        return "Java Developer";
    }

    if (
        text.includes("python") ||
        text.includes("django") ||
        text.includes("flask")
    ) {
        return "Python Developer";
    }

    if (
        text.includes("data analyst") ||
        text.includes("analytics")
    ) {
        return "Data Analyst";
    }

    if (
        text.includes("software engineer") ||
        text.includes("software developer")
    ) {
        return "Software Engineer";
    }

    return "Software Developer";
}


function detectSkills(jobDescription) {
    const knownSkills = [
        "JavaScript",
        "TypeScript",
        "React",
        "Next.js",
        "Node.js",
        "Express.js",
        "MongoDB",
        "SQL",
        "PostgreSQL",
        "MySQL",
        "REST API",
        "Git",
        "GitHub",
        "HTML",
        "CSS",
        "Tailwind CSS",
        "Redux",
        "Docker",
        "AWS",
        "Java",
        "Spring Boot",
        "Python",
        "Django",
        "Flask",
        "C++",
        "Data Structures",
        "Algorithms",
        "System Design",
    ];

    const lower =
        cleanText(jobDescription)
            .toLowerCase();

    return knownSkills.filter((skill) =>
        lower.includes(
            skill.toLowerCase()
        )
    );
}


function detectMissingSkills(
    jobDescription,
    candidateText
) {
    const requiredSkills =
        detectSkills(jobDescription);

    const candidateLower =
        cleanText(candidateText)
            .toLowerCase();

    return requiredSkills.filter(
        (skill) =>
            !candidateLower.includes(
                skill.toLowerCase()
            )
    );
}


function createTechnicalQuestions(
    role,
    skills
) {
    const questions = [];

    if (
        skills.includes("React") ||
        role.includes("Frontend") ||
        role.includes("Full Stack")
    ) {
        questions.push(
            {
                question:
                    "Explain how React state and props are different and when you would use each.",
                intention:
                    "To check understanding of React component architecture.",
                answer:
                    "Props are inputs passed from a parent component and should be treated as read-only. State is data managed by a component that can change over time. Use props for communication from parent to child and state for data that belongs to the component or its local UI behavior.",
            },
            {
                question:
                    "What is the purpose of useEffect in React?",
                intention:
                    "To evaluate knowledge of React side effects and lifecycle behavior.",
                answer:
                    "useEffect is used for side effects such as API calls, subscriptions, timers and synchronizing with external systems. The dependency array controls when the effect runs, and a cleanup function should be returned when resources need to be released.",
            }
        );
    }

    if (
        skills.includes("Node.js") ||
        skills.includes("Express.js") ||
        role.includes("Backend") ||
        role.includes("Full Stack")
    ) {
        questions.push(
            {
                question:
                    "How would you design a REST API for an interview application?",
                intention:
                    "To assess backend API design and architecture skills.",
                answer:
                    "Separate resources such as users, interviews and reports. Use appropriate HTTP methods, validate request data, authenticate protected routes, return consistent status codes and error responses, and keep business logic outside route definitions.",
            },
            {
                question:
                    "How does asynchronous code work in Node.js?",
                intention:
                    "To check understanding of the Node.js event loop.",
                answer:
                    "Node.js uses an event-driven model. I/O operations can run asynchronously so the main JavaScript thread does not block while waiting. Promises and async/await make asynchronous flows easier to read and maintain.",
            }
        );
    }

    if (
        skills.includes("MongoDB")
    ) {
        questions.push({
            question:
                "When would you use MongoDB instead of a relational database?",
            intention:
                "To evaluate database selection and data modeling knowledge.",
            answer:
                "MongoDB is useful when the application benefits from flexible document structures, rapid iteration or naturally document-oriented data. A relational database is often preferable when strong relationships, complex joins and transactional consistency are central requirements.",
        });
    }

    if (
        skills.includes("SQL") ||
        skills.includes("PostgreSQL") ||
        skills.includes("MySQL")
    ) {
        questions.push({
            question:
                "What is the difference between an INNER JOIN and a LEFT JOIN?",
            intention:
                "To check practical SQL knowledge.",
            answer:
                "INNER JOIN returns only records that have matching rows in both tables. LEFT JOIN returns every row from the left table and matching rows from the right table; unmatched right-side values become NULL.",
        });
    }

    if (
        skills.includes("Git") ||
        skills.includes("GitHub")
    ) {
        questions.push({
            question:
                "How do you handle a merge conflict in Git?",
            intention:
                "To evaluate practical source-control experience.",
            answer:
                "I inspect the conflicting files, understand both changes, resolve the conflict carefully, run tests, stage the resolved files and create the appropriate commit. I avoid blindly accepting one side without understanding the change.",
        });
    }

    questions.push(
        {
            question:
                `How would you debug a production issue in a ${role} application?`,
            intention:
                "To understand the candidate's debugging methodology.",
            answer:
                "First reproduce or isolate the problem using logs and monitoring. Then identify whether the issue is related to input, application logic, dependencies, database or infrastructure. I would make the smallest safe fix, test it and monitor the result after deployment.",
        },
        {
            question:
                "How do you make an application secure?",
            intention:
                "To evaluate awareness of common application security practices.",
            answer:
                "Validate input, authenticate and authorize users correctly, protect secrets, use secure cookies or tokens, avoid exposing sensitive errors, validate uploaded files, use HTTPS and keep dependencies updated.",
        }
    );

    return questions.slice(0, 8);
}


function createBehavioralQuestions(role) {
    return [
        {
            question:
                "Tell me about yourself and your experience relevant to this role.",
            intention:
                "To understand the candidate's background and communication ability.",
            answer:
                `Give a concise introduction covering your experience, strongest technical skills, one or two relevant projects and why they connect to the ${role} role.`,
        },
        {
            question:
                "Tell me about a difficult technical problem you solved.",
            intention:
                "To understand problem-solving ability.",
            answer:
                "Use the STAR structure: explain the situation, the technical problem, what you personally did, the trade-offs you considered and the measurable result.",
        },
        {
            question:
                "How do you handle deadlines when several tasks are important?",
            intention:
                "To assess prioritization and ownership.",
            answer:
                "Clarify priorities, break work into smaller deliverables, communicate risks early and complete the highest-impact work first. Avoid hiding delays from the team.",
        },
        {
            question:
                "Describe a time when you received critical feedback.",
            intention:
                "To evaluate adaptability and professionalism.",
            answer:
                "Explain what the feedback was, how you responded without becoming defensive, what you changed and what improved afterward.",
        },
        {
            question:
                "Why do you want this role?",
            intention:
                "To understand motivation and role alignment.",
            answer:
                `Connect your existing skills and projects with the responsibilities of the ${role} position. Mention what you want to learn and the value you can contribute.`,
        },
    ];
}



function createPreparationPlan(
    role,
    missingSkills
) {
    const firstFocus =
        missingSkills.length
            ? `Strengthen ${missingSkills
                .slice(0, 2)
                .join(" and ")}`
            : "Core technical fundamentals";

    return [
        {
            day: 1,
            focus: firstFocus,
            tasks: [
                `Review the fundamentals required for ${role}.`,
                "Create a short list of topics you are least confident about.",
                "Practice explaining technical concepts aloud.",
            ],
        },
        {
            day: 2,
            focus: "Technical fundamentals",
            tasks: [
                "Review language and framework fundamentals.",
                "Solve 3 to 5 coding problems.",
                "Explain your solutions without reading notes.",
            ],
        },
        {
            day: 3,
            focus: "Project discussion",
            tasks: [
                "Prepare two important projects from your experience.",
                "Explain architecture, decisions and trade-offs.",
                "Prepare answers for follow-up technical questions.",
            ],
        },
        {
            day: 4,
            focus: "Backend and API design",
            tasks: [
                "Review REST API concepts.",
                "Practice authentication and authorization questions.",
                "Review database design and error handling.",
            ],
        },
        {
            day: 5,
            focus: "System design",
            tasks: [
                "Practice designing a small application.",
                "Think about scalability, caching and databases.",
                "Practice explaining architecture on paper.",
            ],
        },
        {
            day: 6,
            focus: "Behavioral interview",
            tasks: [
                "Prepare STAR-format stories.",
                "Practice your introduction.",
                "Prepare examples about teamwork, failure and feedback.",
            ],
        },
        {
            day: 7,
            focus: "Mock interview",
            tasks: [
                "Complete one timed technical interview.",
                "Complete one behavioral interview.",
                "Review mistakes and revise weak areas.",
            ],
        },
    ];
}


function createFallbackInterviewReport({
    resume,
    selfDescription,
    jobDescription,
}) {
    const role =
        detectRole(jobDescription);

    const skills =
        detectSkills(jobDescription);

    const candidateText = [
        resume,
        selfDescription,
    ].join(" ");

    const missingSkills =
        detectMissingSkills(
            jobDescription,
            candidateText
        );

    const matchScore =
        calculateMatchScore(
            jobDescription,
            selfDescription,
            resume
        );

    const technicalQuestions =
        createTechnicalQuestions(
            role,
            skills
        );

    const behavioralQuestions =
        createBehavioralQuestions(
            role
        );

    const skillGaps =
        missingSkills.length
            ? missingSkills
                .slice(0, 8)
                .map((skill) => ({
                    skill,
                    severity:
                        skills.length >= 5
                            ? "medium"
                            : "high",
                }))
            : [
                {
                    skill:
                        "Interview communication",
                    severity: "low",
                },
                {
                    skill:
                        "System design depth",
                    severity: "low",
                },
            ];

    const preparationPlan =
        createPreparationPlan(
            role,
            missingSkills
        );

    const matchedSkills = skills.filter((s) => !missingSkills.includes(s));
    const skillItems = [
        ...matchedSkills.map((s) => ({
            name: s,
            level: Math.floor(Math.random() * 15) + 80,
            status: "strong",
        })),
        ...missingSkills.slice(0, 5).map((s, idx) => ({
            name: s,
            level: idx === 0 ? 55 : 35,
            status: idx === 0 ? "partial" : "missing",
        })),
    ];

    if (!skillItems.length) {
        skillItems.push(
            { name: "Core Fundamentals", level: 85, status: "strong" },
            { name: "Problem Solving", level: 80, status: "strong" },
            { name: "Role Specifics", level: 50, status: "partial" }
        );
    }

    const strengths = matchedSkills.length
        ? matchedSkills.slice(0, 3).map((s) => `Solid background in ${s} and related workflow practices.`)
        : [
            "Demonstrated hands-on programming experience and problem-solving initiative.",
            "Relevant foundation aligned with role expectations.",
        ];

    const gaps = missingSkills.length
        ? missingSkills.slice(0, 3).map((s) => `Limited direct exposure to ${s} requested in the job description.`)
        : [
            "Production-scale system design tradeoffs.",
            "Advanced performance tuning under high concurrency.",
        ];

    const focusAreas = [
        `Review key concepts for ${role} interviews.`,
        missingSkills.length ? `Prepare talking points addressing ${missingSkills[0]}.` : "Refine STAR behavioral storytelling.",
        "Practice communicating architectural decisions and trade-offs.",
    ];

    const analysis = {
        matchScore,
        summary: `Candidate profile matches approximately ${matchScore}% of the key requirements for the ${role} position.`,
        skills: skillItems,
        strengths,
        gaps,
        focusAreas,
    };

    return {
        matchScore,
        analysis,
        technicalQuestions,
        behavioralQuestions,
        skillGaps,
        preparationPlan,
        title: role,
    };
}



async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription,
}) {
    const cleanResume =
        cleanText(resume);

    const cleanSelfDescription =
        cleanText(selfDescription);

    const cleanJobDescription =
        cleanText(jobDescription);


    if (!ai || !GOOGLE_API_KEY) {
        console.warn(
            "Gemini API key not configured. Using fallback interview generator."
        );

        return createFallbackInterviewReport({
            resume: cleanResume,
            selfDescription:
                cleanSelfDescription,
            jobDescription:
                cleanJobDescription,
        });
    }

    const prompt = `
Generate a comprehensive interview preparation report and real evaluation analysis.

Candidate Resume:
${cleanResume || "No resume was provided."}

Candidate Self Description:
${cleanSelfDescription}

Job Description:
${cleanJobDescription}

Return ONLY valid JSON matching this schema:
- matchScore: realistic number (0-100) evaluating candidate qualifications against requirements
- analysis:
  - matchScore: number (0-100)
  - summary: concise role-specific assessment summary
  - skills: array of { name: string, level: number (0-100), status: "strong" | "partial" | "missing" } evaluating skills required in the job against what candidate demonstrated
  - strengths: list of real demonstrated candidate strengths
  - gaps: list of real missing or underdeveloped qualifications
  - focusAreas: actionable preparation focus areas
- technicalQuestions: role-specific technical questions with intentions and model answers
- behavioralQuestions: role-specific behavioral questions with intentions and model answers
- skillGaps: array of { skill, severity }
- preparationPlan: 7-day preparation plan
- title: inferred job title
`;

    try {
        const response =
            await ai.models.generateContent({
                model: GEMINI_MODEL,

                contents: prompt,

                config: {
                    responseMimeType:
                        "application/json",

                    responseSchema:
                        zodToJsonSchema(
                            interviewReportSchema
                        ),
                },
            });

        const rawText =
            typeof response?.text === "function"
                ? response.text()
                : response?.text;

        if (!rawText) {
            throw new Error(
                "Gemini returned an empty response."
            );
        }

        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        const validated = interviewReportSchema.parse(parsed);

        // Ensure analysis exists
        if (!validated.analysis) {
            const fallback = createFallbackInterviewReport({
                resume: cleanResume,
                selfDescription: cleanSelfDescription,
                jobDescription: cleanJobDescription,
            });
            validated.analysis = fallback.analysis;
        }

        return validated;
    } catch (error) {
        const status =
            error?.status ||
            error?.code ||
            error?.response?.status;

        const message =
            error?.message || "";

        const quotaError =
            status === 429 ||
            message.includes(
                "RESOURCE_EXHAUSTED"
            ) ||
            message.includes(
                "quota"
            ) ||
            message.includes(
                "Too Many Requests"
            );

        if (quotaError) {
            console.warn(
                "Gemini quota exceeded (429). Using local fallback generator."
            );
        } else {
            console.warn(
                "Gemini failed. Using local fallback generator.",
                message
            );
        }

        return createFallbackInterviewReport({
            resume: cleanResume,
            selfDescription:
                cleanSelfDescription,
            jobDescription:
                cleanJobDescription,
        });
    }
}



function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


async function generatePdfFromHtml(
    htmlContent
) {
    if (!puppeteer) {
        throw new Error(
            "PDF export via Puppeteer is not supported in this serverless environment."
        );
    }

    const launchOptions = {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ],
    };

    const defaultChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else if (fs.existsSync(defaultChromePath)) {
        launchOptions.executablePath = defaultChromePath;
    }

    const browser = await puppeteer.launch(launchOptions);

    try {
        const page =
            await browser.newPage();

        await page.setContent(
            htmlContent,
            {
                waitUntil: "networkidle0",
            }
        );

        const pdfBuffer =
            await page.pdf({
                format: "A4",

                printBackground: true,

                margin: {
                    top: "15mm",
                    bottom: "15mm",
                    left: "15mm",
                    right: "15mm",
                },
            });

        return pdfBuffer;
    } finally {
        await browser.close();
    }
}


function createFallbackResumeHtml({
    resume,
    selfDescription,
    jobDescription,
}) {
    const role =
        detectRole(jobDescription);

    const skills =
        detectSkills(jobDescription);

    const candidateText =
        resume ||
        selfDescription ||
        "Candidate";

    const lines =
        cleanText(candidateText)
            .split(/[.!?]\s+/)
            .filter(Boolean)
            .slice(0, 8);

    return `
<!DOCTYPE html>

<html>
<head>

<meta charset="UTF-8" />

<title>
${escapeHtml(role)} Resume
</title>

<style>

* {
    box-sizing: border-box;
}

body {
    font-family: Arial, Helvetica, sans-serif;
    color: #222;
    margin: 0;
    padding: 0;
    line-height: 1.5;
}

.container {
    width: 100%;
}

.header {
    border-bottom: 2px solid #222;
    padding-bottom: 12px;
    margin-bottom: 18px;
}

.name {
    font-size: 25px;
    font-weight: 700;
    margin: 0;
}

.role {
    font-size: 15px;
    margin-top: 4px;
    color: #555;
}

.section {
    margin-top: 18px;
}

.section-title {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    border-bottom: 1px solid #999;
    padding-bottom: 4px;
    margin-bottom: 8px;
}

p {
    margin: 5px 0;
}

ul {
    margin-top: 5px;
}

li {
    margin-bottom: 5px;
}

</style>

</head>

<body>

<div class="container">

<div class="header">

<p class="name">
Candidate
</p>

<p class="role">
${escapeHtml(role)}
</p>

</div>

<div class="section">

<div class="section-title">
Professional Summary
</div>

<p>
${escapeHtml(
        selfDescription ||
        "Motivated professional seeking an opportunity to contribute technical skills and continue growing."
    )}
</p>

</div>

<div class="section">

<div class="section-title">
Relevant Experience
</div>

${lines
            .map(
                (line) =>
                    `<p>${escapeHtml(
                        line
                    )}.</p>`
            )
            .join("")}

</div>

<div class="section">

<div class="section-title">
Technical Skills
</div>

<p>
${escapeHtml(
        skills.length
            ? skills.join(" • ")
            : "Software Development • Problem Solving • Git • APIs"
    )}
</p>

</div>

<div class="section">

<div class="section-title">
Target Role
</div>

<p>
${escapeHtml(
        cleanText(jobDescription)
    )}
</p>

</div>

</div>

</body>
</html>
`;
}

function generateResumePdfWithPdfKit({
    resume,
    selfDescription,
    jobDescription,
}) {
    return new Promise((resolve, reject) => {
        try {
            if (!PDFDocument) {
                PDFDocument = require("pdfkit");
            }
            const role = detectRole(jobDescription) || "Software Engineer";
            const skills = detectSkills(jobDescription);
            const candidateText = cleanText(resume || selfDescription || "Experienced Professional");
            const rawSentences = candidateText
                .split(/[.!?]\n|\.\s+/)
                .map((s) => s.trim())
                .filter((s) => s.length > 5);

            const doc = new PDFDocument({
                margin: 40,
                size: "A4",
                info: {
                    Title: `${role} - Professional Resume`,
                    Author: "InterviewPrep AI",
                    Subject: "ATS-Optimized Resume",
                },
            });

            const buffers = [];
            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (err) => reject(err));

            const colorPrimary = "#0F172A"; // Slate 900
            const colorAccent = "#4F46E5";  // Indigo / Cornflower
            const colorText = "#334155";    // Slate 700
            const colorMuted = "#64748B";   // Slate 500
            const colorLine = "#CBD5E1";    // Slate 300

            // Header - Candidate Name & Target Role
            doc.fillColor(colorPrimary)
               .fontSize(22)
               .font("Helvetica-Bold")
               .text("CANDIDATE RESUME", { align: "left" });

            doc.fillColor(colorAccent)
               .fontSize(13)
               .font("Helvetica-Bold")
               .text(role.toUpperCase(), { align: "left" });

            doc.moveDown(0.3);
            doc.strokeColor(colorLine).lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(0.8);

            // Section: Professional Summary
            doc.fillColor(colorPrimary)
               .fontSize(12)
               .font("Helvetica-Bold")
               .text("PROFESSIONAL SUMMARY");
            doc.moveDown(0.2);

            const summary = selfDescription
                ? cleanText(selfDescription)
                : rawSentences.slice(0, 3).join(". ") + ".";

            doc.fillColor(colorText)
               .fontSize(9.5)
               .font("Helvetica")
               .text(
                   summary ||
                       `Accomplished and results-driven ${role} with strong expertise in full-stack architecture, performant software delivery, and collaborative problem-solving. Proven track record of developing reliable software systems and optimizing developer velocity.`,
                   {
                       lineGap: 3,
                       align: "justify",
                   }
               );

            doc.moveDown(0.8);

            // Section: Core Skills & Competencies
            doc.fillColor(colorPrimary)
               .fontSize(12)
               .font("Helvetica-Bold")
               .text("CORE TECHNICAL & PROFESSIONAL SKILLS");
            doc.moveDown(0.2);

            const skillItems = skills.length
                ? skills
                : [
                      "System Architecture",
                      "API Engineering",
                      "Data Structures & Algorithms",
                      "Unit & Integration Testing",
                      "Agile Methodologies",
                  ];
            doc.fillColor(colorText)
               .fontSize(9.5)
               .font("Helvetica")
               .text(skillItems.map((s) => `•  ${s}`).join("     •     "), {
                   lineGap: 4,
               });

            doc.moveDown(0.8);

            // Section: Experience & Highlights
            doc.fillColor(colorPrimary)
               .fontSize(12)
               .font("Helvetica-Bold")
               .text("EXPERIENCE & KEY ACHIEVEMENTS");
            doc.moveDown(0.3);

            const experiencePoints =
                rawSentences.length > 2
                    ? rawSentences.slice(1, 8)
                    : [
                          `Developed high-throughput production services and APIs tailored for modern ${role} specifications.`,
                          "Spearheaded codebase modularization, improving test coverage and maintainability by over 25%.",
                          "Collaborated with product designers and engineering leads to scope and ship high-priority initiatives.",
                          "Implemented robust error handling, automated CI/CD checks, and observability logging.",
                      ];

            experiencePoints.forEach((point) => {
                if (point.trim()) {
                    doc.fillColor(colorText)
                       .fontSize(9)
                       .font("Helvetica")
                       .text(`•   ${point.trim()}`, {
                           indent: 10,
                           lineGap: 3,
                       });
                    doc.moveDown(0.25);
                }
            });

            doc.moveDown(0.8);

            // Section: Target Role Matching
            doc.fillColor(colorPrimary)
               .fontSize(12)
               .font("Helvetica-Bold")
               .text("TARGET ROLE ALIGNMENT");
            doc.moveDown(0.2);
            doc.fillColor(colorMuted)
               .fontSize(8.5)
               .font("Helvetica-Oblique")
               .text(
                   `Custom-tailored for role: ${cleanText(jobDescription).slice(0, 300)}...`,
                   {
                       lineGap: 2,
                   }
               );

            // Footer
            doc.fontSize(8)
               .fillColor(colorMuted)
               .font("Helvetica")
               .text(
                   "InterviewPrep AI Resume • Formatted for Applicant Tracking Systems (ATS)",
                   40,
                   785,
                   {
                       align: "center",
                       width: 515,
                   }
               );

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

async function generateResumePdf({
    resume,
    selfDescription,
    jobDescription,
}) {
    // 1. If Puppeteer is available, try generating high-fidelity PDF from Gemini or HTML
    if (puppeteer) {
        if (ai && GOOGLE_API_KEY) {
            try {
                const resumePdfSchema = z.object({
                    html: z.string(),
                });

                const prompt = `
Generate a professional ATS-friendly resume.

Candidate Resume:
${cleanText(resume) || "No resume provided."}

Self Description:
${cleanText(selfDescription)}

Job Description:
${cleanText(jobDescription)}

Return only JSON with one field:
html

The HTML must be complete and suitable for printing to A4 PDF.
`;

                const response = await ai.models.generateContent({
                    model: GEMINI_MODEL,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: zodToJsonSchema(resumePdfSchema),
                    },
                });

                const rawText =
                    typeof response?.text === "function"
                        ? response.text()
                        : response?.text;

                if (rawText) {
                    const jsonContent = JSON.parse(rawText);
                    if (jsonContent?.html) {
                        return await generatePdfFromHtml(jsonContent.html);
                    }
                }
            } catch (error) {
                console.warn(
                    "Puppeteer / Gemini PDF generation failed, falling back to PDFKit:",
                    error?.message
                );
            }
        }

        try {
            const fallbackHtml = createFallbackResumeHtml({
                resume,
                selfDescription,
                jobDescription,
            });
            return await generatePdfFromHtml(fallbackHtml);
        } catch (error) {
            console.warn(
                "Puppeteer launch failed, using robust PDFKit generator:",
                error?.message
            );
        }
    }

    // 2. High-speed, guaranteed PDFKit generation (100% reliable in any cloud/serverless environment)
    return await generateResumePdfWithPdfKit({
        resume,
        selfDescription,
        jobDescription,
    });
}

function createFallbackAnswerFeedback({ question, answer, intention, modelAnswer }) {
    const words = cleanText(answer).split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    let score = 5;
    if (wordCount >= 60) score += 3;
    else if (wordCount >= 30) score += 2;
    else if (wordCount >= 15) score += 1;

    const lower = answer.toLowerCase();
    if (lower.includes("because") || lower.includes("for example") || lower.includes("in my experience") || lower.includes("result") || lower.includes("trade-off")) {
        score += 1;
    }

    score = Math.min(10, Math.max(2, score));

    const whatWasGood = wordCount >= 30
        ? "Clear structure that directly addresses the core question and conveys relevant technical rationale."
        : "Direct and straightforward answer that identifies the main concept.";

    const whatToImprove = wordCount < 40
        ? "Expand on specific real-world examples, concrete trade-offs, and measurable outcomes to demonstrate deeper seniority."
        : "Consider addressing potential edge cases and how you would monitor or verify performance in production.";

    return {
        score,
        whatWasGood,
        whatToImprove,
    };
}

async function evaluateAnswer({ question, answer, intention, modelAnswer, role }) {
    const cleanAns = cleanText(answer);
    if (!cleanAns || cleanAns.length < 5) {
        return {
            score: 2,
            whatWasGood: "You provided an initial thought.",
            whatToImprove: "The response is too brief. Structure your answer with the problem context, technical choices, and final outcome.",
        };
    }

    if (!ai || !GOOGLE_API_KEY) {
        return createFallbackAnswerFeedback({ question, answer: cleanAns, intention, modelAnswer });
    }

    const prompt = `
You are an expert technical interviewer evaluating a candidate's answer for a ${role || "Software Engineer"} position.

Question:
"${question}"

Intention:
"${intention || "Evaluate practical depth and problem-solving reasoning"}"

Benchmark Answer:
"${modelAnswer || "N/A"}"

Candidate's Answer:
"${cleanAns}"

Evaluate this answer fairly and objectively.
Return ONLY valid JSON with this exact schema:
{
  "score": number between 1 and 10 (integer),
  "whatWasGood": "1-2 concise sentences highlighting the strongest accurate points",
  "whatToImprove": "1-2 concise sentences with constructive suggestions for missing details or better structure"
}
`;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(answerFeedbackSchema),
            },
        });

        const rawText = typeof response?.text === "function" ? response.text() : response?.text;
        if (!rawText) throw new Error("Empty evaluation response.");

        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        return answerFeedbackSchema.parse(parsed);
    } catch (err) {
        console.warn("AI evaluateAnswer failed, using fallback:", err?.message);
        return createFallbackAnswerFeedback({ question, answer: cleanAns, intention, modelAnswer });
    }
}

module.exports = {
    generateInterviewReport,
    generateResumePdf,
    generateResumePdfWithPdfKit,
    evaluateAnswer,
};