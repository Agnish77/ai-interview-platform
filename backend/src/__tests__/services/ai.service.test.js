// Shared mock function — its return value can be changed per test
const mockGenerateContent = jest.fn();

jest.mock("@google/genai", () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({
        models: {
            generateContent: mockGenerateContent,
            generateContentStream: jest.fn()
        }
    }))
}));

const { generateInterviewStrategy, rateAnswer } = require("../../services/ai.service");

const strategyPayload = {
    jobTitle: "Software Engineer",
    company: "Test Co",
    overallScore: 75,
    summary: "Good fit for the role.",
    timeline: "2 weeks",
    focusAreas: [
        { topic: "Algorithms", importance: "High", description: "Core skill", timeToSpend: "3 days" }
    ],
    practiceQuestions: [
        { question: "Explain Big O notation", difficulty: "Medium", category: "Technical", tip: "Use examples" }
    ],
    generalTips: ["Be confident", "Research the company"]
};

const ratingPayload = {
    scores: { clarity: 8, accuracy: 7, depth: 6 },
    feedback: "Good answer. Work on depth."
};

describe("AI Service", () => {
    describe("generateInterviewStrategy", () => {
        beforeEach(() => {
            mockGenerateContent.mockResolvedValue({ text: JSON.stringify(strategyPayload) });
        });

        it("returns a parsed strategy object", async () => {
            const result = await generateInterviewStrategy(
                "We are looking for a software engineer with strong algorithms skills",
                "I have 2 years experience in Python",
                ""
            );
            expect(result).toHaveProperty("jobTitle");
            expect(result).toHaveProperty("focusAreas");
            expect(Array.isArray(result.focusAreas)).toBe(true);
            expect(result).toHaveProperty("practiceQuestions");
        });

        it("throws when AI returns invalid JSON", async () => {
            mockGenerateContent.mockResolvedValue({ text: "not valid json" });
            await expect(
                generateInterviewStrategy("A valid job description for testing purposes", "", "")
            ).rejects.toThrow();
        });
    });

    describe("rateAnswer", () => {
        beforeEach(() => {
            mockGenerateContent.mockResolvedValue({ text: JSON.stringify(ratingPayload) });
        });

        it("returns scores and feedback", async () => {
            const result = await rateAnswer(
                "What is Big O notation?",
                "Big O describes algorithm complexity.",
                "Software engineering role"
            );
            expect(result).toHaveProperty("scores");
            expect(result.scores).toHaveProperty("clarity");
            expect(result.scores).toHaveProperty("accuracy");
            expect(result.scores).toHaveProperty("depth");
            expect(result).toHaveProperty("feedback");
            expect(typeof result.feedback).toBe("string");
        });

        it("throws when AI returns invalid JSON", async () => {
            mockGenerateContent.mockResolvedValue({ text: "bad json" });
            await expect(
                rateAnswer("What is React?", "A JS library.", "Frontend role")
            ).rejects.toThrow();
        });
    });
});
