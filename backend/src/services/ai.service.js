const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

/**
 * Generate interview strategy using Gemini AI
 */
async function generateInterviewStrategy(jobDescription, selfDescription = "", resumeText = "") {
  const profileSection = resumeText
    ? `Resume Content:\n${resumeText}`
    : selfDescription
      ? `Candidate Self-Description:\n${selfDescription}`
      : "No profile provided";

  const prompt = `You are an expert interview coach and career advisor. Analyze the following job description and candidate profile, then generate a comprehensive, personalized interview strategy.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${profileSection}

Respond with ONLY a valid JSON object (no markdown, no code blocks) in exactly this structure:
{
  "jobTitle": "extracted job title",
  "company": "extracted company name or 'Unknown'",
  "overallScore": <number 1-100 representing how well the candidate fits>,
  "summary": "2-3 sentence overall strategy summary",
  "timeline": "recommended preparation timeline e.g. '2-3 weeks'",
  "focusAreas": [
    {
      "topic": "topic name",
      "importance": "High|Medium|Low",
      "description": "why this matters for this specific role",
      "timeToSpend": "e.g. '3-4 days'"
    }
  ],
  "practiceQuestions": [
    {
      "question": "the interview question",
      "difficulty": "Easy|Medium|Hard",
      "category": "e.g. Technical|Behavioral|System Design",
      "tip": "how to approach answering this question"
    }
  ],
  "generalTips": [
    "actionable tip 1",
    "actionable tip 2"
  ]
}

Generate 5-7 focus areas, 8-10 practice questions, and 5-6 general tips. Be specific to this exact job description.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite-001",
    contents: prompt
  });

  const text = response.text.trim();
  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
}

/**
 * Generate a professional resume using Gemini AI
 */
async function generateResumeContent(userProfile, jobDescription, strategy) {
  const prompt = `You are a professional resume writer. Create a tailored, ATS-optimized resume for the following candidate targeting the given job.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${userProfile}

KEY SKILLS TO HIGHLIGHT (from interview strategy):
${strategy?.focusAreas?.map(f => f.topic).join(", ") || "general skills"}

Generate a complete professional resume in clean plain text format with the following sections:
- CONTACT INFORMATION (use placeholder: [Your Name] | [email@email.com] | [Phone] | [LinkedIn])
- PROFESSIONAL SUMMARY (3-4 lines tailored to the job)
- TECHNICAL SKILLS (categorized, relevant to the job)
- PROFESSIONAL EXPERIENCE (2-3 realistic positions with bullet points using metrics)
- EDUCATION
- PROJECTS (2-3 relevant projects)
- CERTIFICATIONS (if relevant)

Use clean formatting with --- separators between sections. Make it look professional and ATS-friendly. Tailor every section to the job description.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite-001",
    contents: prompt
  });

  return response.text.trim();
}

/**
 * Stream resume content using Gemini streaming API (for SSE endpoint)
 * Yields text chunks as they arrive.
 */
async function* generateResumeStream(userProfile, jobDescription, strategy) {
  const prompt = `You are a professional resume writer. Create a tailored, ATS-optimized resume for the following candidate targeting the given job.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${userProfile}

KEY SKILLS TO HIGHLIGHT (from interview strategy):
${strategy?.focusAreas?.map(f => f.topic).join(", ") || "general skills"}

Generate a complete professional resume in clean plain text format with the following sections:
- CONTACT INFORMATION (use placeholder: [Your Name] | [email@email.com] | [Phone] | [LinkedIn])
- PROFESSIONAL SUMMARY (3-4 lines tailored to the job)
- TECHNICAL SKILLS (categorized, relevant to the job)
- PROFESSIONAL EXPERIENCE (2-3 realistic positions with bullet points using metrics)
- EDUCATION
- PROJECTS (2-3 relevant projects)
- CERTIFICATIONS (if relevant)

Use clean formatting with --- separators between sections. Make it look professional and ATS-friendly.`;

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.0-flash-lite-001",
    contents: prompt
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}

/**
 * Rate a candidate's answer to an interview question on 3 dimensions.
 * Returns { scores: { clarity, accuracy, depth }, feedback }
 */
async function rateAnswer(question, answer, jobDescription = "") {
  const prompt = `You are an expert interview coach. Rate the following candidate's answer to an interview question.

INTERVIEW QUESTION:
${question}

CANDIDATE ANSWER:
${answer}

JOB CONTEXT:
${jobDescription || "General software engineering role"}

Rate the answer on exactly these 3 dimensions (score 1-10) and provide concise feedback.

Respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "scores": {
    "clarity": <number 1-10, how clearly the answer is communicated>,
    "accuracy": <number 1-10, how technically correct and relevant the answer is>,
    "depth": <number 1-10, how thoroughly the topic is explored>
  },
  "feedback": "2-4 sentences of specific, constructive feedback pointing out strengths and areas for improvement."
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite-001",
    contents: prompt
  });

  const text = response.text.trim();
  const cleaned = text.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
}
/**
 * Generate a comprehensive summary of the interview session.
 */
async function generateSessionSummary(answers, jobDescription) {
  const qaPairs = answers.map(a => `Q: ${a.question}\nA: ${a.answer}\nScores: Clarity ${a.scores.clarity}/10, Accuracy ${a.scores.accuracy}/10, Depth ${a.scores.depth}/10\nFeedback: ${a.feedback}`).join('\n\n');

  const prompt = `You are an expert technical recruiter and interview coach. Review the following completed interview session.
  
JOB DESCRIPTION:
${jobDescription || "General software engineering role"}

CANDIDATE Q&A HISTORY:
${qaPairs}

Provide a personalized final assessment of the candidate's performance. Respond with ONLY a valid JSON object matching this structure:
{
  "overallFeedback": "1 paragraph summarizing their performance, confidence, and fit for the role",
  "strengths": ["string", "string", "string"],
  "improvements": ["string", "string", "string"]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite-001",
    contents: prompt
  });

  const text = response.text.trim();
  const cleaned = text.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(cleaned);
}

module.exports = { generateInterviewStrategy, generateResumeContent, generateResumeStream, rateAnswer, generateSessionSummary };
