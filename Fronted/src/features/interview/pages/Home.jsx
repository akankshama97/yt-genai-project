import { useRef, useState } from "react";
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
    const [errors, setErrors] = useState({
        jobDescription: "",
        selfDescription: "",
        resume: "",
        general: "",
    });

    const [liveAnalysis, setLiveAnalysis] = useState(null);

    const resumeInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (errors.general) {
            setErrors((prev) => ({ ...prev, general: "" }));
        }
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
            setErrors((prev) => ({ ...prev, resume: "Please upload a PDF file." }));
            e.target.value = "";
            setResume(null);
            return;
        }

        if (file.size > maxSize) {
            setErrors((prev) => ({ ...prev, resume: "Resume size should be less than 3 MB." }));
            e.target.value = "";
            setResume(null);
            return;
        }

        setResume(file);
        setErrors((prev) => ({ ...prev, resume: "" }));
    };

    const handleRemoveResume = () => {
        setResume(null);
        if (resumeInputRef.current) {
            resumeInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {
            jobDescription: "",
            selfDescription: "",
            resume: "",
            general: "",
        };

        const jobDescription = formData.jobDescription.trim();
        const selfDescription = formData.selfDescription.trim();

        let hasError = false;

        if (!jobDescription) {
            newErrors.jobDescription = "Please enter the job description.";
            hasError = true;
        } else if (jobDescription.length < 20) {
            newErrors.jobDescription = "Job description should contain at least 20 characters.";
            hasError = true;
        }

        if (!selfDescription) {
            newErrors.selfDescription = "Please tell us something about yourself.";
            hasError = true;
        } else if (selfDescription.length < 20) {
            newErrors.selfDescription = "About you should contain at least 20 characters.";
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        setErrors({
            jobDescription: "",
            selfDescription: "",
            resume: "",
            general: "",
        });

        try {
            const data = await generateReport({
                jobDescription,
                selfDescription,
                resumeFile: resume,
            });

            if (data?.interviewReport) {
                // Real live analysis computed from the submitted job description & resume
                setLiveAnalysis(data.interviewReport);
            } else {
                setErrors((prev) => ({
                    ...prev,
                    general: "Unable to create interview. Please try again.",
                }));
            }
        } catch (err) {
            console.error(err);
            setErrors((prev) => ({
                ...prev,
                general:
                    err?.response?.data?.message ||
                    err?.message ||
                    "Something went wrong. Please try again.",
            }));
        }
    };

    const handleProceedToInterview = () => {
        if (liveAnalysis?._id) {
            navigate(`/interviews/${liveAnalysis._id}`);
        }
    };

    const handleReset = () => {
        setLiveAnalysis(null);
    };

    return (
        <main className="prep-page">
            <div className="prep-container">
                <div className="prep-grid">
                    {/* LEFT COLUMN: INTRO, SAMPLE QUESTION & HOW IT WORKS */}
                    <div className="prep-sidebar">
                        <span className="prep-label">Interview Prep</span>
                        <h1 className="prep-heading">
                            Practice for the role you <span className="prep-accent">actually want</span>.
                        </h1>
                        <p className="prep-intro">
                            Add the job requirements and your background to work through realistic technical and team questions.
                        </p>

                        <div className="sample-card">
                            <span className="sample-kicker">Sample interview question</span>
                            <p className="sample-quote">
                                "Tell me about a time when the project requirements changed midway through. How did you handle scope and timelines?"
                            </p>
                            <div className="sample-hint">
                                <span className="sample-hint-title">What a good answer includes:</span>
                                <p className="sample-hint-text">
                                    How you communicated early with stakeholders, the specific trade-offs evaluated between scope and delivery, and the measurable outcome achieved.
                                </p>
                            </div>
                        </div>

                        {/* HOW IT WORKS LIST */}
                        <div className="how-it-works">
                            <span className="how-title">How it works</span>
                            <ol className="how-list">
                                <li className="how-item">
                                    <span className="how-num">1</span>
                                    <span className="how-text">Paste the job description</span>
                                </li>
                                <li className="how-item">
                                    <span className="how-num">2</span>
                                    <span className="how-text">Add your background</span>
                                </li>
                                <li className="how-item">
                                    <span className="how-num">3</span>
                                    <span className="how-text">Answer questions and get feedback</span>
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: THE FORM OR LIVE ANALYSIS */}
                    <div className="prep-form-wrapper">
                        {!liveAnalysis ? (
                            <form className="prep-form" onSubmit={handleSubmit} noValidate>
                                {/* STEP 1: JOB DESCRIPTION */}
                                <div className="form-step">
                                    <div className="step-header">
                                        <label htmlFor="jobDescription" className="step-label">
                                            1. Job description
                                        </label>
                                        <span className="step-status">Required</span>
                                    </div>
                                    <textarea
                                        id="jobDescription"
                                        name="jobDescription"
                                        rows={6}
                                        className={errors.jobDescription ? "has-error" : ""}
                                        placeholder="Paste the role requirements, responsibilities, and qualifications..."
                                        value={formData.jobDescription}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    {errors.jobDescription ? (
                                        <span className="field-error-text">{errors.jobDescription}</span>
                                    ) : (
                                        <p className="step-helper">
                                            Paste the job description you are preparing for.
                                        </p>
                                    )}
                                </div>

                                {/* STEP 2: RESUME (OPTIONAL) */}
                                <div className="form-step">
                                    <div className="step-header">
                                        <label className="step-label">
                                            2. Resume
                                        </label>
                                        <span className="step-status">Optional</span>
                                    </div>

                                    {!resume ? (
                                        <label htmlFor="resume" className="upload-box">
                                            <span className="upload-title">Click to upload your resume</span>
                                            <span className="upload-note">PDF only, maximum 3 MB</span>
                                        </label>
                                    ) : (
                                        <div className="uploaded-file">
                                            <div className="file-info">
                                                <span className="file-name">{resume.name}</span>
                                                <span className="file-size">{(resume.size / 1024 / 1024).toFixed(2)} MB</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="remove-btn"
                                                onClick={handleRemoveResume}
                                                disabled={loading}
                                            >
                                                Remove
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
                                    {errors.resume ? (
                                        <span className="field-error-text">{errors.resume}</span>
                                    ) : (
                                        <p className="step-helper">
                                            Upload your resume so the questions match your actual background.
                                        </p>
                                    )}
                                </div>

                                {/* STEP 3: ABOUT YOU */}
                                <div className="form-step">
                                    <div className="step-header">
                                        <label htmlFor="selfDescription" className="step-label">
                                            3. About you
                                        </label>
                                        <span className="step-status">Required</span>
                                    </div>
                                    <textarea
                                        id="selfDescription"
                                        name="selfDescription"
                                        rows={6}
                                        className={errors.selfDescription ? "has-error" : ""}
                                        placeholder="Summarize your core skills, recent projects, and work experience..."
                                        value={formData.selfDescription}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    {errors.selfDescription ? (
                                        <span className="field-error-text">{errors.selfDescription}</span>
                                    ) : (
                                        <p className="step-helper">
                                            Tell us about your experience level and the technologies you use.
                                        </p>
                                    )}
                                </div>

                                {/* GENERAL ERROR */}
                                {errors.general && (
                                    <div className="field-error-text general-error">
                                        {errors.general}
                                    </div>
                                )}

                                {/* PRIMARY SUBMIT BUTTON */}
                                <button
                                    type="submit"
                                    className="primary-submit-btn"
                                    disabled={loading}
                                >
                                    {loading ? "Analyzing and preparing interview..." : "Start my practice interview"}
                                </button>
                            </form>
                        ) : (
                            /* LIVE ANALYSIS SECTION (DISPLAYED AFTER SUBMISSION WITH REAL DATA) */
                            <div className="prep-form analysis-card">
                                <div className="analysis-header">
                                    <span className="analysis-badge">Live Analysis</span>
                                    <h2 className="analysis-title">Resume & Role Evaluation</h2>
                                    <p className="analysis-subtitle">
                                        Real analysis computed from your submitted job description and resume.
                                    </p>
                                </div>

                                {/* REAL MATCH SCORE */}
                                <div className="analysis-score-row">
                                    <div className="score-block">
                                        <div className="score-number-wrap">
                                            <span className="score-number">{liveAnalysis.matchScore}</span>
                                            <span className="score-percent">%</span>
                                        </div>
                                        <span className="score-label">Role Match Score</span>
                                    </div>
                                    <div className="score-summary">
                                        <p className="score-heading">
                                            {liveAnalysis.matchScore >= 80
                                                ? "Strong alignment with role qualifications."
                                                : liveAnalysis.matchScore >= 60
                                                ? "Moderate alignment with role qualifications."
                                                : "Notable skill gaps identified for this role."}
                                        </p>
                                        <p className="score-note">
                                            Your practice interview has been tailored with specific questions to target your strengths and address identified gaps.
                                        </p>
                                    </div>
                                </div>

                                {/* REAL SKILL GAPS */}
                                {liveAnalysis.skillGaps && liveAnalysis.skillGaps.length > 0 && (
                                    <div className="analysis-section">
                                        <span className="analysis-section-title">Identified Skill Gaps</span>
                                        <div className="skill-tags-list">
                                            {liveAnalysis.skillGaps.map((gap, i) => (
                                                <div key={i} className={`skill-gap-pill severity-${gap.severity || "medium"}`}>
                                                    <span className="gap-name">{gap.skill}</span>
                                                    <span className="gap-severity">{gap.severity} priority</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* REAL SUGGESTED FOCUS AREAS */}
                                {liveAnalysis.preparationPlan && liveAnalysis.preparationPlan.length > 0 && (
                                    <div className="analysis-section">
                                        <span className="analysis-section-title">Suggested Focus Areas</span>
                                        <div className="focus-areas-list">
                                            {liveAnalysis.preparationPlan.slice(0, 3).map((item) => (
                                                <div key={item.day} className="focus-area-item">
                                                    <span className="focus-day">Day {item.day}</span>
                                                    <div className="focus-details">
                                                        <span className="focus-title">{item.focus}</span>
                                                        {item.tasks && item.tasks.length > 0 && (
                                                            <span className="focus-task">{item.tasks[0]}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ACTION BUTTONS */}
                                <div className="analysis-actions">
                                    <button
                                        type="button"
                                        className="primary-submit-btn"
                                        onClick={handleProceedToInterview}
                                    >
                                        Open Practice Questions (
                                        {(liveAnalysis.technicalQuestions?.length || 0) +
                                            (liveAnalysis.behavioralQuestions?.length || 0)}
                                        ) →
                                    </button>
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={handleReset}
                                    >
                                        Edit requirements / Submit another role
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Home;
