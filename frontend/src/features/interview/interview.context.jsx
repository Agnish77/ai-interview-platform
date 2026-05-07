import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { generateStrategy, downloadResume as fetchResumePdf } from "./services/interview.api.js";

const InterviewContext = createContext(null);

export const InterviewProvider = ({ children }) => {
    const [strategy, setStrategy] = useState(() => {
        const saved = sessionStorage.getItem("iv_strategy");
        return saved ? JSON.parse(saved) : null;
    });
    const [strategyId, setStrategyId] = useState(() => sessionStorage.getItem("iv_strategyId") || null);
    const [jobDescription, setJobDescription] = useState(() => sessionStorage.getItem("iv_jd") || "");
    const [selfDescription, setSelfDescription] = useState(() => sessionStorage.getItem("iv_sd") || "");
    const [resumeText, setResumeText] = useState(() => sessionStorage.getItem("iv_resumeText") || "");
    const [loading, setLoading] = useState(false);
    const [resumeLoading, setResumeLoading] = useState(false);
    const [error, setError] = useState(null);

    // Sync to sessionStorage
    useEffect(() => {
        if (strategy) sessionStorage.setItem("iv_strategy", JSON.stringify(strategy));
        else sessionStorage.removeItem("iv_strategy");

        if (strategyId) sessionStorage.setItem("iv_strategyId", strategyId);
        else sessionStorage.removeItem("iv_strategyId");

        sessionStorage.setItem("iv_jd", jobDescription);
        sessionStorage.setItem("iv_sd", selfDescription);
        sessionStorage.setItem("iv_resumeText", resumeText);
    }, [strategy, strategyId, jobDescription, selfDescription, resumeText]);

    const generate = useCallback(async (jd, sd, resumeText) => {
        setLoading(true);
        setError(null);
        try {
            const data = await generateStrategy(jd, sd, resumeText);
            setStrategy(data.strategy);
            setStrategyId(data.strategyId);
            setJobDescription(jd);
            setSelfDescription(sd || "");
            // Store uploaded resume text so streaming resume can use it
            if (typeof resumeText === "string") setResumeText(resumeText);
            return { success: true, strategy: data.strategy };
        } catch (err) {
            const msg = err.response?.data?.message || "Network Error: Failed to connect to server. Please try again.";
            setError(msg);
            return { success: false, message: msg };
        } finally {
            setLoading(false);
        }
    }, []);

    const downloadResume = useCallback(async () => {
        setResumeLoading(true);
        setError(null);
        try {
            const blob = await fetchResumePdf(strategyId, jobDescription, selfDescription, resumeText);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "ai-generated-resume.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return { success: true };
        } catch (err) {
            let msg = "Network Error: Failed to connect to server. Please try again.";
            
            if (err.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text();
                    const json = JSON.parse(text);
                    msg = json.message || msg;
                } catch (e) {
                    console.error("Failed to parse blob error", e);
                }
            } else if (err.response?.data?.message) {
                msg = err.response.data.message;
            }

            setError(msg);
            return { success: false, message: msg };
        } finally {
            setResumeLoading(false);
        }
    }, [jobDescription, selfDescription, strategyId]);

    const clearStrategy = useCallback(() => {
        setStrategy(null);
        setStrategyId(null);
        setError(null);
    }, []);

    const value = {
        strategy, strategyId, jobDescription, selfDescription, resumeText,
        loading, resumeLoading, error,
        generate, downloadResume, clearStrategy, setError
    };

    return (
        <InterviewContext.Provider value={value}>
            {children}
        </InterviewContext.Provider>
    );
};

export const useInterview = () => {
    const ctx = useContext(InterviewContext);
    if (!ctx) throw new Error("useInterview must be used inside InterviewProvider");
    return ctx;
};

export default InterviewContext;
