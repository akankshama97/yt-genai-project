import React, { useRef, useState } from "react";
import "../style/home.scss";
import { useInterview } from "../hooks/useInterview";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();
    const { loading, generateReport } = useInterview();

    const [formData, setFormData] = useState({
        jobDescription: "",
        selfDescription: "",
    });

    const [resume, setResume] = useState(null);
    const [error, setError] = useState("");

    const resumeInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (error) setError("");
    };

    const handleResumeChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            setError("Please upload a PDF file.");
            e.target.value = "";
            setResume(null);
            return;
        }

        if (file.size > maxSize) {
            setError("Resume size should be less than 3 MB.");
            e.target.value = "";
            setResume(null);
            return;
        }

        setResume(file);
        setError("");
    };

    const handleRemoveResume = () => {
        setResume(null);

        if (resumeInputRef.current) {
            resumeInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const jobDescription = formData.jobDescription.trim();
        const selfDescription = formData.selfDescription.trim();

        if (!jobDescription) {
            setError("Please enter the job description.");
            return;
        }

        if (jobDescription.length < 20) {
            setError("Job description should contain at least 20 characters.");
            return;
        }

        if (!selfDescription) {
            setError("Please tell us something about yourself.");
            return;
        }

        if (selfDescription.length < 20) {
            setError("About You should contain at least 20 characters.");
            return;
        }

        try {
            const data = await generateReport({
                jobDescription,
                selfDescription,
                resumeFile: resume,
            });

            if (data?.interviewReport?._id) {
            navigate(`/interviews/${data.interviewReport._id}`
                
            );
            } else {
                setError("Unable to create interview. Please try again.");
            }
        } catch (err) {
            console.error(err);

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Something went wrong. Please try again."
            );
        }
    };

    return (
        <main className="home-page">

            {/* HERO */}
            <section className="hero-section">

                <div className="hero-content">

                    <div className="hero-badge">
                        <span>✦</span>
                        AI-Powered Interview Preparation
                    </div>

                    <h1>
                        Crack Your Next
                        <span> Interview With AI</span>
                    </h1>

                    <p className="hero-description">
                        Get personalized interview questions based on your
                        job description, resume and experience.
                    </p>

                    <div className="hero-features">
                        <div>
                            <span>✓</span>
                            AI Generated Questions
                        </div>

                        <div>
                            <span>✓</span>
                            Resume Based Analysis
                        </div>

                        <div>
                            <span>✓</span>
                            Personalized Interview
                        </div>
                    </div>

                    <div className="ai-coach-card">

                        <div className="coach-icon">
                            ✨
                        </div>

                        <div>
                            <h3>AI Interview Coach</h3>

                            <p>
                                Let's prepare you for your dream job.
                            </p>

                            <div className="ai-status">
                                <span></span>
                                AI is ready
                            </div>
                        </div>

                    </div>

                </div>

                <div className="hero-visual">

                    <div className="visual-glow"></div>

                    <div className="visual-card">

                        <div className="visual-top">
                            <span>AI ANALYSIS</span>

                            <span className="live-dot">
                                ● LIVE
                            </span>
                        </div>

                        <div className="score-circle">
                            <strong>87%</strong>
                            <span>Match Score</span>
                        </div>

                        <div className="score-bars">

                            <div>
                                <span>Skills</span>
                                <div className="bar">
                                    <i style={{ width: "90%" }}></i>
                                </div>
                            </div>

                            <div>
                                <span>Experience</span>
                                <div className="bar">
                                    <i style={{ width: "78%" }}></i>
                                </div>
                            </div>

                            <div>
                                <span>Role Match</span>
                                <div className="bar">
                                    <i style={{ width: "86%" }}></i>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>

            </section>


            {/* FORM */}
            <section className="interview-section">

                <div className="section-heading">

                    <span className="section-number">
                        01 — GET STARTED
                    </span>

                    <h2>
                        Tell us about your
                        <span> interview</span>
                    </h2>

                    <p>
                        Provide some details and our AI will create a
                        personalized interview for you.
                    </p>

                </div>


                <form
                    className="interview-form"
                    onSubmit={handleSubmit}
                >

                    {/* JOB DESCRIPTION */}
                    <div className="input-group">

                        <div className="label-wrapper">

                            <div>
                                <label htmlFor="jobDescription">
                                    Job Description
                                </label>

                                <span className="required-badge">
                                    Required
                                </span>
                            </div>

                            <span className="character-count">
                                {formData.jobDescription.length} chars
                            </span>

                        </div>

                        <textarea
                            id="jobDescription"
                            name="jobDescription"
                            rows={7}
                            placeholder="Example: We are looking for a React Developer with experience in JavaScript, React, Node.js and REST APIs..."
                            value={formData.jobDescription}
                            onChange={handleChange}
                            disabled={loading}
                        />

                        <small>
                            Paste the job description you're preparing for.
                        </small>

                    </div>


                    {/* RESUME */}
                    <div className="input-group">

                        <div className="label-wrapper">

                            <div>
                                <label>
                                    Resume
                                </label>

                                <span className="optional-badge">
                                    Optional
                                </span>
                            </div>

                        </div>

                        {!resume ? (

                            <label
                                htmlFor="resume"
                                className="upload-box"
                            >

                                <div className="upload-icon">
                                    ↑
                                </div>

                                <div className="upload-content">

                                    <strong>
                                        Upload your resume
                                    </strong>

                                    <p>
                                        PDF
                                        <span> • </span>
                                        Max 3 MB
                                    </p>

                                </div>

                                <div className="upload-arrow">
                                    →
                                </div>

                            </label>

                        ) : (

                            <div className="selected-file">

                                <div className="file-icon">
                                    PDF
                                </div>

                                <div className="file-details">

                                    <strong>
                                        {resume.name}
                                    </strong>

                                    <span>
                                        {(resume.size / 1024 / 1024).toFixed(2)} MB
                                    </span>

                                </div>

                                <button
                                    type="button"
                                    className="remove-file"
                                    onClick={handleRemoveResume}
                                    disabled={loading}
                                >
                                    ×
                                </button>

                            </div>

                        )}

                        <input
                            ref={resumeInputRef}
                            id="resume"
                            type="file"
                            hidden
                            accept=".pdf"
                            onChange={handleResumeChange}
                            disabled={loading}
                        />

                        <small>
                            Uploading your resume helps AI create more
                            relevant questions.
                        </small>

                    </div>


                    {/* ABOUT YOU */}
                    <div className="input-group">

                        <div className="label-wrapper">

                            <div>
                                <label htmlFor="selfDescription">
                                    About You
                                </label>

                                <span className="required-badge">
                                    Required
                                </span>
                            </div>

                            <span className="character-count">
                                {formData.selfDescription.length} chars
                            </span>

                        </div>

                        <textarea
                            id="selfDescription"
                            name="selfDescription"
                            rows={7}
                            placeholder="Tell us about your skills, projects, experience, strengths and technologies you know..."
                            value={formData.selfDescription}
                            onChange={handleChange}
                            disabled={loading}
                        />

                        <small>
                            This helps AI understand your experience level.
                        </small>

                    </div>


                    {/* ERROR */}
                    {error && (
                        <div className="form-error">
                            <span>!</span>
                            {error}
                        </div>
                    )}


                    {/* BUTTON */}
                    <button
                        type="submit"
                        className="generate-button"
                        disabled={loading}
                    >

                        {loading ? (
                            <>
                                <span className="loader"></span>
                                Creating Your Interview...
                            </>
                        ) : (
                            <>
                                Generate My Interview
                                <span>→</span>
                            </>
                        )}

                    </button>


                    <div className="privacy-note">
                        <span>🔒</span>
                        Your information is used only to personalize
                        your interview experience.
                    </div>

                </form>

            </section>

        </main>
    );
};

export default Home;