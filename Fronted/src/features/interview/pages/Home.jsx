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
            setError("About you should contain at least 20 characters.");
            return;
        }

        try {
            const data = await generateReport({
                jobDescription,
                selfDescription,
                resumeFile: resume,
            });

            if (data?.interviewReport?._id) {
                navigate(`/interviews/${data.interviewReport._id}`);
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
        <main className="prep-page">
            <div className="prep-container">
                <div className="prep-grid">
                    {/* LEFT COLUMN: INTRO & SAMPLE QUESTION */}
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
                    </div>

                    {/* RIGHT COLUMN: THE FORM */}
                    <div className="prep-form-wrapper">
                        <form className="prep-form" onSubmit={handleSubmit}>
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
                                    placeholder="Paste the role requirements, responsibilities, and qualifications..."
                                    value={formData.jobDescription}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <p className="step-helper">
                                    Paste the job description you are preparing for.
                                </p>
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
                                <p className="step-helper">
                                    Upload your resume so the questions match your actual background.
                                </p>
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
                                    placeholder="Summarize your core skills, recent projects, and work experience..."
                                    value={formData.selfDescription}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <p className="step-helper">
                                    Tell us about your experience level and the technologies you use.
                                </p>
                            </div>

                            {/* ERROR MESSAGE */}
                            {error && (
                                <div className="form-error-box">
                                    {error}
                                </div>
                            )}

                            {/* PRIMARY SUBMIT BUTTON */}
                            <button
                                type="submit"
                                className="primary-submit-btn"
                                disabled={loading}
                            >
                                {loading ? "Preparing your practice interview..." : "Start my practice interview"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Home;
