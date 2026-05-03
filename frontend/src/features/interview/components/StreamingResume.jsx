import React, { useState, useEffect, useRef } from "react";
import { getResumeStreamUrl } from "../services/interview.api.js";

/**
 * StreamingResume
 * Subscribes to the SSE endpoint and renders the resume text live,
 * then offers Download as .txt and Download as PDF once complete.
 */
export default function StreamingResume({ jobDescription, selfDescription, resumeText, strategyId, onClose }) {
    const [text, setText] = useState("");
    const [status, setStatus] = useState("idle"); // idle | streaming | done | error
    const [errorMsg, setErrorMsg] = useState("");
    const esRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!jobDescription) return;

        setStatus("streaming");
        setText("");
        setErrorMsg("");

        const url = getResumeStreamUrl(jobDescription, selfDescription, resumeText, strategyId);
        const es = new EventSource(url);
        esRef.current = es;

        es.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === "chunk") {
                    setText(prev => prev + payload.text);
                    // Auto-scroll
                    if (containerRef.current) {
                        containerRef.current.scrollTop = containerRef.current.scrollHeight;
                    }
                } else if (payload.type === "done") {
                    setStatus("done");
                    es.close();
                } else if (payload.type === "error") {
                    setStatus("error");
                    setErrorMsg(payload.message || "An error occurred.");
                    es.close();
                }
            } catch { /* ignore parse errors */ }
        };

        es.onerror = () => {
            setStatus("error");
            setErrorMsg("Connection lost. Please try again.");
            es.close();
        };

        return () => es.close();
    }, [jobDescription, selfDescription, resumeText, strategyId]);

    const handleDownloadTxt = () => {
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ai-resume.txt";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = async () => {
        // Dynamically import jsPDF (if available) or build a simple PDF via print
        try {
            // Use browser print-to-PDF as the most reliable cross-platform approach
            const printWindow = window.open("", "_blank");
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>AI Generated Resume</title>
                    <style>
                        body { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.6;
                               margin: 40px; color: #000; background: #fff; white-space: pre-wrap; }
                        @media print { @page { margin: 20mm; } }
                    </style>
                </head>
                <body>${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 400);
        } catch {
            // Fallback: plain txt
            handleDownloadTxt();
        }
    };

    const handleStop = () => {
        esRef.current?.close();
        setStatus("done");
    };

    return (
        <div className="streaming-resume-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="streaming-resume-modal">
                <div className="streaming-resume-header">
                    <h2>✨ AI Resume Generator</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="streaming-resume-status">
                    {status === "streaming" && (
                        <span className="status-badge streaming">
                            <span className="pulse-dot" /> Generating live…
                        </span>
                    )}
                    {status === "done" && (
                        <span className="status-badge done">✓ Complete — {text.split(/\s+/).length} words</span>
                    )}
                    {status === "error" && (
                        <span className="status-badge error">⚠ {errorMsg}</span>
                    )}
                </div>

                <div className="streaming-resume-body" ref={containerRef}>
                    <pre className="resume-text">
                        {text}
                        {status === "streaming" && <span className="cursor-blink">▌</span>}
                    </pre>
                </div>

                <div className="streaming-resume-actions">
                    {status === "streaming" && (
                        <button className="btn-secondary" onClick={handleStop}>⏹ Stop</button>
                    )}
                    {status === "done" && text && (
                        <>
                            <button className="btn-primary" onClick={handleDownloadTxt}>
                                ⬇ Download as .txt
                            </button>
                            <button className="btn-pdf" onClick={handleDownloadPdf}>
                                📄 Download as PDF
                            </button>
                        </>
                    )}
                    {status === "error" && (
                        <button className="btn-secondary" onClick={() => {
                            setStatus("idle");
                            setStatus("streaming");
                        }}>↺ Retry</button>
                    )}
                </div>
            </div>
        </div>
    );
}
