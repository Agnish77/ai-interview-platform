const InterviewStrategy = require("../models/interview.model");
const { generateInterviewStrategy, generateResumeContent, generateResumeStream } = require("../services/ai.service");
const pdfParse = require("pdf-parse");

/**
 * @name generateStrategyController
 * @description Generate AI interview strategy from job description + profile
 * @access Private
 */
async function generateStrategyController(req, res) {
    try {
        const { jobDescription, selfDescription } = req.body;
        let resumeText = req.body.resumeText || "";
        const userId = req.user.id;

        if (req.file) {
            const pdfData = await pdfParse(req.file.buffer);
            resumeText = pdfData.text;
        }

        if (!jobDescription || jobDescription.trim().length < 20) {
            return res.status(400).json({ message: "Please provide a job description (at least 20 characters)" });
        }
        if (!selfDescription && !resumeText) {
            return res.status(400).json({ message: "Please provide either a self-description or resume text" });
        }

        // Call Gemini AI
        const strategy = await generateInterviewStrategy(jobDescription, selfDescription, resumeText);

        // Save to DB
        const saved = await InterviewStrategy.create({
            userId,
            jobDescription,
            selfDescription,
            resumeText,
            strategy
        });

        res.status(200).json({
            message: "Strategy generated successfully",
            strategyId: saved._id,
            strategy
        });

    } catch (err) {
        console.error("Generate strategy error:", err);
        const status = err.status || err.response?.status;
        const msg = err.message || "";
        
        if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('exhausted')) {
            return res.status(429).json({ message: "AI Service is currently overloaded (Quota Exceeded). Please try again later." });
        }
        if (status === 400 || status === 403 || msg.includes('API key') || msg.includes('key')) {
            return res.status(400).json({ message: "Google AI API Key is expired or invalid. Please check your .env file." });
        }
        res.status(500).json({ message: "Failed to generate strategy. Please try again.", error: msg });
    }
}

/**
 * @name generateResumePdfController
 * @description Generate an AI-written resume as a downloadable text file
 * @access Private
 */
async function generateResumePdfController(req, res) {
    try {
        const { jobDescription, selfDescription, strategyId } = req.body;

        if (!jobDescription) {
            return res.status(400).json({ message: "Job description is required to generate a resume" });
        }

        // Optionally fetch strategy for better context
        let strategy = null;
        if (strategyId) {
            const saved = await InterviewStrategy.findById(strategyId);
            if (saved) strategy = saved.strategy;
        }

        const profile = selfDescription || "Professional candidate seeking this role";
        const resumeText = await generateResumeContent(profile, jobDescription, strategy);

        const PDFDocument = require("pdfkit");
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=\"ai-resume.pdf\"");

        doc.pipe(res);
        
        doc.fontSize(20).text("AI Generated Resume", { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(resumeText, {
            align: 'left',
            lineGap: 2
        });
        
        doc.end();
    } catch (err) {
        console.error("Generate resume error:", err);
        const status = err.status || err.response?.status;
        const msg = err.message || "";
        
        if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('exhausted')) {
            return res.status(429).json({ message: "AI Service is currently overloaded (Quota Exceeded). Please try again later." });
        }
        if (status === 400 || status === 403 || msg.includes('API key') || msg.includes('key')) {
            return res.status(400).json({ message: "Google AI API Key is expired or invalid. Please check your .env file." });
        }
        res.status(500).json({ message: "Failed to generate resume. Please try again.", error: msg });
    }
}

/**
 * @name getStrategyHistoryController
 * @description Get user's past interview strategies
 * @access Private
 */
async function getStrategyHistoryController(req, res) {
    try {
        const strategies = await InterviewStrategy.find({ userId: req.user.id })
            .select("jobDescription strategy.jobTitle strategy.company createdAt")
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({ strategies });
    } catch (err) {
        console.error("Get history error:", err);
        res.status(500).json({ message: "Failed to fetch history" });
    }
}

/**
 * @name getStrategyByIdController
 * @description Get a specific strategy by ID
 * @access Private
 */
async function getStrategyByIdController(req, res) {
    try {
        const strategy = await InterviewStrategy.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!strategy) {
            return res.status(404).json({ message: "Strategy not found" });
        }

        res.status(200).json({ strategy });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch strategy" });
    }
}

/**
 * @name generateResumeStreamController
 * @description Stream AI-written resume via Server-Sent Events (SSE)
 * @access Private
 */
async function generateResumeStreamController(req, res) {
    const { jobDescription, selfDescription, resumeText, strategyId } = req.query;

    if (!jobDescription) {
        return res.status(400).json({ message: "jobDescription query param is required" });
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    try {
        let strategy = null;
        if (strategyId) {
            const saved = await InterviewStrategy.findById(strategyId);
            if (saved) strategy = saved.strategy;
        }

        // Build a rich profile: prefer uploaded resume text, fall back to self-description
        let profile = "Professional candidate seeking this role";
        if (resumeText && resumeText.trim().length > 20) {
            profile = `UPLOADED RESUME:\n${resumeText.trim()}`;
            if (selfDescription && selfDescription.trim()) {
                profile += `\n\nADDITIONAL CANDIDATE NOTES:\n${selfDescription.trim()}`;
            }
        } else if (selfDescription && selfDescription.trim()) {
            profile = selfDescription.trim();
        }

        const stream = generateResumeStream(profile, jobDescription, strategy);

        for await (const chunk of stream) {
            sendEvent({ type: "chunk", text: chunk });
        }

        sendEvent({ type: "done" });
    } catch (err) {
        console.error("SSE stream error:", err);
        const msg = err.message || "";
        if (err.status === 429 || msg.includes("quota") || msg.includes("exhausted")) {
            sendEvent({ type: "error", message: "AI quota exceeded. Please try again later." });
        } else {
            sendEvent({ type: "error", message: "Failed to generate resume stream." });
        }
    } finally {
        res.end();
    }
}

module.exports = {
    generateStrategyController,
    generateResumePdfController,
    generateResumeStreamController,
    getStrategyHistoryController,
    getStrategyByIdController
};
