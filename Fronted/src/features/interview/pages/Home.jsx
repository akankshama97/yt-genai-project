import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../../components/layout/AppLayout";
import FileUpload from "../../../components/ui/FileUpload";
import Button from "../../../components/ui/Button";
import Alert from "../../../components/ui/Alert";
import { useInterview } from "../hooks/useInterview";
import "../../../styles/home.css";

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
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (hasSubmitted && errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: "" }));
    }
  };

  const handleResumeSelect = (file) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 3 * 1024 * 1024; // 3 MB

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, resume: "Please upload a PDF file." }));
      setResume(null);
      return;
    }

    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        resume: "Resume size must be less than 3 MB.",
      }));
      setResume(null);
      return;
    }

    setResume(file);
    setErrors((prev) => ({ ...prev, resume: "" }));
  };

  const handleResumeRemove = () => {
    setResume(null);
  };

  const validate = () => {
    const newErrors = {
      jobDescription: "",
      selfDescription: "",
      resume: errors.resume || "",
      general: "",
    };
    let isValid = true;

    const trimmedJob = formData.jobDescription.trim();
    if (!trimmedJob) {
      newErrors.jobDescription = "Please enter the job description.";
      isValid = false;
    } else if (trimmedJob.length < 20) {
      newErrors.jobDescription =
        "Job description should contain at least 20 characters.";
      isValid = false;
    }

    const trimmedSelf = formData.selfDescription.trim();
    if (!trimmedSelf) {
      newErrors.selfDescription = "Please tell us something about yourself.";
      isValid = false;
    } else if (trimmedSelf.length < 20) {
      newErrors.selfDescription =
        "About you should contain at least 20 characters.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!validate()) {
      return;
    }

    try {
      const data = await generateReport({
        jobDescription: formData.jobDescription.trim(),
        selfDescription: formData.selfDescription.trim(),
        resumeFile: resume,
      });

      if (data?.interviewReport?._id) {
        navigate(`/interviews/${data.interviewReport._id}`);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: "Unable to create interview. Please try again.",
        }));
      }
    } catch (err) {
      console.error("Submission error:", err);
      setErrors((prev) => ({
        ...prev,
        general:
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong while generating your interview.",
      }));
    }
  };

  return (
    <AppLayout>
      <div className="home-grid">
        {/* LEFT COLUMN: Spacious Hero & Minimal Sample Question */}
        <section className="home-intro" aria-labelledby="intro-heading">
          <div className="home-intro__header">
            {/* Eyebrow Pill: Soft #6495ED/15 pill badge */}
            <span className="home-intro__badge">
              INTERVIEW PREPARATION
            </span>

            {/* Heading: Large, crisp dark-slate heading */}
            <h1 id="intro-heading" className="home-intro__title">
              Prepare for your next interview
            </h1>

            {/* Subtitle */}
            <p className="home-intro__subtext">
              Paste the job description and share your background. You will get
              role-specific questions and feedback on every answer.
            </p>
          </div>

          {/* Sample Question Card: Clean white card */}
          <div className="sample-card">
            <div className="sample-card__header">
              <span className="sample-card__icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6495ED"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a6 6 0 0 0-6 6c0 2.22 1.2 4.15 3 5.19V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.81c1.8-1.04 3-2.97 3-5.19a6 6 0 0 0-6-6z" />
                  <line x1="9" y1="21" x2="15" y2="21" />
                </svg>
              </span>
              <span className="sample-card__kicker">SAMPLE QUESTION</span>
            </div>

            <p className="sample-card__quote">
              "Tell me about a time when the project requirements changed midway through. How did you handle scope and timelines?"
            </p>

            <div className="sample-card__hint">
              <span className="sample-card__hint-title">What a strong answer includes:</span>
              <p className="sample-card__hint-text">
                How you communicated early with stakeholders, evaluated trade-offs between delivery and scope, and maintained engineering quality.
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Minimalist Vertical Stepper Form Card */}
        <section aria-label="Interview configuration form">
          <div className="home-stepper-card">
            <form className="home-form" onSubmit={handleSubmit} noValidate>
              <div className="stepper-steps-wrapper">
                {/* Step 1: Job Description */}
                <div className="stepper-step">
                  <div className="stepper-step__timeline">
                    <div className="stepper-step__badge">1</div>
                    <div className="stepper-step__line" />
                  </div>
                  <div className="stepper-step__content">
                    <div className="stepper-step__header">
                      <label htmlFor="jobDescription" className="stepper-step__label">
                        Job description
                      </label>
                      <span className="stepper-step__status">Required</span>
                    </div>
                    <textarea
                      id="jobDescription"
                      name="jobDescription"
                      rows={5}
                      placeholder="Paste the role requirements, responsibilities, and qualifications..."
                      value={formData.jobDescription}
                      onChange={handleChange}
                      disabled={loading}
                      aria-invalid={Boolean(hasSubmitted && errors.jobDescription)}
                      className={`stepper-step__textarea ${
                        hasSubmitted && errors.jobDescription
                          ? "stepper-step__textarea--error"
                          : ""
                      }`}
                    />
                    {hasSubmitted && errors.jobDescription && (
                      <p className="stepper-step__error-text" role="alert">
                        {errors.jobDescription}
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 2: About You */}
                <div className="stepper-step">
                  <div className="stepper-step__timeline">
                    <div className="stepper-step__badge">2</div>
                    <div className="stepper-step__line" />
                  </div>
                  <div className="stepper-step__content">
                    <div className="stepper-step__header">
                      <label htmlFor="selfDescription" className="stepper-step__label">
                        About you
                      </label>
                      <span className="stepper-step__status">Required</span>
                    </div>
                    <textarea
                      id="selfDescription"
                      name="selfDescription"
                      rows={5}
                      placeholder="Summarize your core skills, recent projects, and work experience..."
                      value={formData.selfDescription}
                      onChange={handleChange}
                      disabled={loading}
                      aria-invalid={Boolean(hasSubmitted && errors.selfDescription)}
                      className={`stepper-step__textarea ${
                        hasSubmitted && errors.selfDescription
                          ? "stepper-step__textarea--error"
                          : ""
                      }`}
                    />
                    {hasSubmitted && errors.selfDescription && (
                      <p className="stepper-step__error-text" role="alert">
                        {errors.selfDescription}
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 3: Resume */}
                <div className="stepper-step">
                  <div className="stepper-step__timeline">
                    <div className="stepper-step__badge">3</div>
                  </div>
                  <div className="stepper-step__content">
                    <div className="stepper-step__header">
                      <label htmlFor="resume" className="stepper-step__label">
                        Resume
                      </label>
                      <span className="stepper-step__status stepper-step__status--optional">
                        Optional
                      </span>
                    </div>
                    <FileUpload
                      id="resume"
                      label=""
                      statusText=""
                      hideHeader
                      file={resume}
                      onFileSelect={handleResumeSelect}
                      onFileRemove={handleResumeRemove}
                      error={errors.resume}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* General Submission Error */}
              {errors.general && (
                <Alert variant="danger">{errors.general}</Alert>
              )}

              {/* Primary CTA Button: Full-width solid #6495ED button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                className="home-submit-btn"
                loading={loading}
                disabled={loading}
              >
                {loading ? "Preparing interview questions..." : "Start practice interview"}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Home;
