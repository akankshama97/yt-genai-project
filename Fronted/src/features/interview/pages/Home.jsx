import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../../components/layout/AppLayout";
import Card from "../../../components/ui/Card";
import Textarea from "../../../components/ui/Textarea";
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
        {/* LEFT COLUMN: 40% DESKTOP */}
        <section className="home-intro" aria-labelledby="intro-heading">
          <div className="home-intro__header">
            <span className="home-intro__label">Interview preparation</span>
            <h1 id="intro-heading" className="home-intro__title">
              Prepare for your next interview
            </h1>
            <p className="home-intro__subtext">
              Paste the job description and share your background. You will get
              role-specific questions and feedback on every answer.
            </p>
          </div>

          {/* Sample Question Card */}
          <Card className="sample-card">
            <span className="sample-card__kicker">Sample question</span>
            <p className="sample-card__quote">
              "Tell me about a time when the project requirements changed
              midway through. How did you handle scope and timelines?"
            </p>
            <div className="sample-card__hint">
              <span className="sample-card__hint-title">
                What a strong answer includes
              </span>
              <p className="sample-card__hint-text">
                How you communicated early with stakeholders, the specific
                trade-offs evaluated between scope and delivery, and the
                measurable outcome achieved.
              </p>
            </div>
          </Card>

          {/* How It Works */}
          <div className="how-it-works">
            <span className="how-it-works__title">How it works</span>
            <div className="how-it-works__list">
              <div className="how-it-works__item">
                <span className="how-it-works__num">1</span>
                <span className="how-it-works__text">
                  Paste the job description
                </span>
              </div>
              <div className="how-it-works__item">
                <span className="how-it-works__num">2</span>
                <span className="how-it-works__text">
                  Add your background
                </span>
              </div>
              <div className="how-it-works__item">
                <span className="how-it-works__num">3</span>
                <span className="how-it-works__text">
                  Answer questions and get feedback
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: 60% DESKTOP */}
        <section aria-label="Interview configuration form">
          <Card padding="lg">
            <form className="home-form" onSubmit={handleSubmit} noValidate>
              {/* Step 1: Job Description */}
              <Textarea
                id="jobDescription"
                name="jobDescription"
                label="1. Job description"
                statusText="Required"
                helperText="Paste the role requirements, responsibilities, and qualifications."
                placeholder="Paste the role requirements, responsibilities, and qualifications..."
                value={formData.jobDescription}
                onChange={handleChange}
                error={hasSubmitted ? errors.jobDescription : ""}
                disabled={loading}
                rows={6}
              />

              {/* Step 2: Resume */}
              <FileUpload
                id="resume"
                label="2. Resume"
                statusText="Optional"
                helperText="Upload your resume so the questions match your actual background."
                file={resume}
                onFileSelect={handleResumeSelect}
                onFileRemove={handleResumeRemove}
                error={errors.resume}
                disabled={loading}
              />

              {/* Step 3: About You */}
              <Textarea
                id="selfDescription"
                name="selfDescription"
                label="3. About you"
                statusText="Required"
                helperText="Summarize your core skills, recent projects, and work experience."
                placeholder="Summarize your core skills, recent projects, and work experience..."
                value={formData.selfDescription}
                onChange={handleChange}
                error={hasSubmitted ? errors.selfDescription : ""}
                disabled={loading}
                rows={6}
              />

              {/* General Submission Error */}
              {errors.general && (
                <Alert variant="danger">{errors.general}</Alert>
              )}

              {/* Primary Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                height44
                loading={loading}
                disabled={loading}
              >
                {loading ? "Preparing interview questions..." : "Start practice interview"}
              </Button>
            </form>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
};

export default Home;
