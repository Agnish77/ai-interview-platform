import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useInterview } from '../interview.context.jsx';

export const useInterviewPlan = () => {
    const navigate = useNavigate();
    const { generate, loading, error, setError } = useInterview();

    const [jobDescription, setJobDescription] = useState('');
    const [selfDescription, setSelfDescription] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [localError, setLocalError] = useState('');

    const handleJobDescriptionChange = (e) => {
        setJobDescription(e.target.value);
        if (localError) setLocalError('');
    };

    const handleSelfDescriptionChange = (e) => setSelfDescription(e.target.value);

    const handleFileDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) setResumeFile(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) setResumeFile(file);
    };

    const handleGenerateStrategy = async () => {
        if (!jobDescription.trim() || jobDescription.trim().length < 20) {
            setLocalError('Please enter a job description (at least 20 characters).');
            return;
        }
        if (!selfDescription.trim() && !resumeFile) {
            setLocalError('Please provide either a self-description or upload a resume.');
            return;
        }
        setLocalError('');

        const result = await generate(
            jobDescription,
            selfDescription,
            resumeFile
        );

        if (result.success) {
            navigate('/interview');
        }
    };

    return {
        state: {
            jobDescription,
            selfDescription,
            resumeFile,
            loading,
            localError: localError || error
        },
        actions: {
            handleJobDescriptionChange,
            handleSelfDescriptionChange,
            handleFileDrop,
            handleFileSelect,
            handleGenerateStrategy
        }
    };
};
