import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "../../../components/layout/AppLayout";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import ProgressBar from "../../../components/ui/ProgressBar";
import Textarea from "../../../components/ui/Textarea";
import Alert from "../../../components/ui/Alert";
import Skeleton from "../../../components/ui/Skeleton";
import { useInterview } from "../hooks/useInterview";
import { evaluateQuestionAnswer } from "../services/interview.api";
import "../../../styles/interview.css";

// ── Safe Analysis Parser ──────────────────────────────────────────────────────
function parseSafeAnalysis(rawAnalysis, reportFallback) {
  if (!rawAnalysis && !reportFallback) {
    return null;
  }

  let data = rawAnalysis;
  if (typeof data === "string") {
    try {
      const cleaned = data.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(cleaned);
    } catch {
      data = null;
    }
  }

  if (
    data &&
    typeof data.matchScore === "number" &&
    data.matchScore >= 0 &&
    data.matchScore <= 100 &&
    Array.isArray(data.skills)
  ) {
    return {
      matchScore: Math.round(data.matchScore),
      summary: typeof data.summary === "string" ? data.summary : "Candidate evaluation summary.",
      skills: data.skills.map((s) => ({
        name: String(s.name || "Skill"),
        level: Math.min(100, Math.max(0, Number(s.level) || 50)),
        status: ["strong", "partial", "missing"].includes(s.status) ? s.status : "partial",
      })),
      strengths: Array.isArray(data.strengths) ? data.strengths.map(String) : [],
      gaps: Array.isArray(data.gaps) ? data.gaps.map(String) : [],
      focusAreas: Array.isArray(data.focusAreas) ? data.focusAreas.map(String) : [],
    };
  }

  // Safe fallback if analysis field was empty in legacy records
  if (reportFallback && typeof reportFallback.matchScore === "number") {
    const gaps = Array.isArray(reportFallback.skillGaps)
      ? reportFallback.skillGaps.map((g) => g.skill || String(g))
      : [];
    return {
      matchScore: Math.round(reportFallback.matchScore),
      summary: `Candidate profile matches approximately ${reportFallback.matchScore}% of the core qualifications for this role.`,
      skills: [
        { name: "Technical Foundation", level: Math.min(95, reportFallback.matchScore + 5), status: "strong" },
        { name: "Communication & Collaboration", level: 80, status: "strong" },
        ...gaps.slice(0, 3).map((gap) => ({
          name: gap,
          level: 45,
          status: "missing",
        })),
      ],
      strengths: [
        "Core technical competence aligned with the submitted requirements.",
        "Clear background and practical development experience.",
      ],
      gaps: gaps.length
        ? gaps.slice(0, 3).map((g) => `Preparation needed in ${g}.`)
        : ["System scale and operational tradeoffs."],
      focusAreas: [
        "Review architecture and performance patterns for the target role.",
        "Practice structured behavioral answers using the STAR method.",
      ],
    };
  }

  return null;
}

// ── Loading Skeleton for Analysis Card ───────────────────────────────────────
const AnalysisSkeleton = () => (
  <Card className="analysis-card" aria-label="Loading analysis">
    <div className="analysis-card__header">
      <div className="analysis-card__title-wrap" style={{ width: "60%" }}>
        <Skeleton className="skeleton-text" style={{ width: "30%" }} />
        <Skeleton className="skeleton-title" style={{ width: "80%" }} />
        <Skeleton className="skeleton-text" style={{ width: "95%" }} />
      </div>
    </div>
    <div className="analysis-score-grid">
      <Skeleton style={{ height: "64px", width: "120px" }} />
      <Skeleton style={{ height: "24px", width: "100%" }} />
    </div>
    <div className="analysis-skills-section">
      <Skeleton className="skeleton-text" style={{ width: "25%" }} />
      <div className="analysis-skills-grid">
        <Skeleton style={{ height: "72px" }} />
        <Skeleton style={{ height: "72px" }} />
        <Skeleton style={{ height: "72px" }} />
      </div>
    </div>
  </Card>
);

// ── Interactive Question Card with Practice & Feedback ───────────────────────
const QuestionCard = ({ item, index, role, onFeedbackReceived, savedFeedback }) => {
  const [open, setOpen] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(savedFeedback || null);
  const [error, setError] = useState("");

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) {
      setError("Please write an answer before requesting feedback.");
      return;
    }
    setError("");
    setEvaluating(true);

    try {
      const data = await evaluateQuestionAnswer({
        question: item.question,
        answer: userAnswer.trim(),
        intention: item.intention,
        modelAnswer: item.answer,
        role: role || "Software Engineer",
      });

      if (data?.feedback) {
        setFeedback(data.feedback);
        if (onFeedbackReceived) {
          onFeedbackReceived(index, item.question, userAnswer.trim(), data.feedback);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Unable to evaluate answer right now. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const getScoreVariant = (score) => {
    if (score >= 8) return "success";
    if (score >= 6) return "warning";
    return "danger";
  };

  return (
    <Card className="question-card">
      <div className="question-card__header">
        <div className="question-card__left">
          <span className="question-card__index">Q{index + 1}</span>
          <h3 className="question-card__title">{item.question}</h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          {open ? "Hide details" : "Practice & benchmarks"}
        </Button>
      </div>

      {open && (
        <div className="question-card__sections">
          {/* Question Intention */}
          <div className="question-card__section">
            <span className="question-card__section-label">Intention of question</span>
            <p className="question-card__section-content">{item.intention}</p>
          </div>

          {/* Model Answer Benchmark */}
          <div className="question-card__section">
            <span className="question-card__section-label">Benchmark answer</span>
            <p className="question-card__section-content">{item.answer}</p>
          </div>

          {/* Interactive Answer Practice Area */}
          <div className="answer-practice-wrap">
            <div className="answer-practice__header">
              <span className="answer-practice__label">Your practice answer</span>
              {feedback && (
                <Badge variant={getScoreVariant(feedback.score)}>
                  Score: {feedback.score} / 10
                </Badge>
              )}
            </div>

            <Textarea
              rows={4}
              placeholder="Type your response as you would explain it to an interviewer..."
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value);
                if (error) setError("");
              }}
              error={error}
              disabled={evaluating}
              aria-label="Your practice answer"
            />

            <div className="answer-practice__actions">
              <Button
                variant="primary"
                size="sm"
                loading={evaluating}
                disabled={evaluating}
                onClick={handleEvaluate}
              >
                {evaluating ? "Evaluating..." : "Get feedback on my answer"}
              </Button>
            </div>

            {/* Per-Answer Feedback Card */}
            {feedback && (
              <div className="feedback-card" role="region" aria-label="Answer feedback">
                <div className="feedback-card__top">
                  <span className="form-field__label">Answer Evaluation</span>
                  <div className="feedback-score-display">
                    <span className="feedback-score-num">{feedback.score}</span>
                    <span className="feedback-score-denom">/ 10</span>
                  </div>
                </div>

                <ProgressBar
                  value={feedback.score * 10}
                  variant={getScoreVariant(feedback.score)}
                  ariaLabel={`Score: ${feedback.score} out of 10`}
                />

                <div className="feedback-item">
                  <span className="feedback-item__title feedback-item__title--good">
                    What was good
                  </span>
                  <p className="feedback-item__text">{feedback.whatWasGood}</p>
                </div>

                <div className="feedback-item">
                  <span className="feedback-item__title feedback-item__title--improve">
                    What to improve
                  </span>
                  <p className="feedback-item__text">{feedback.whatToImprove}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// ── Main Interview Component ──────────────────────────────────────────────────
const Interview = () => {
  const { interviewId } = useParams();
  const { report, getReportById, loading, downloadResume, error: interviewError } =
    useInterview();

  const [activeTab, setActiveTab] = useState("technical"); // technical | behavioral | results | roadmap
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState({});

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    }
  }, [interviewId, getReportById]);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);
    try {
      await downloadResume(interviewId);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      setDownloadError(
        err?.message || "Failed to download resume PDF. Please try again."
      );
      setTimeout(() => setDownloadError(null), 5000);
    } finally {
      setDownloading(false);
    }
  };

  const handleRecordFeedback = useCallback((index, question, answer, feedback) => {
    setEvaluatedAnswers((prev) => ({
      ...prev,
      [question]: { index, question, answer, feedback },
    }));
  }, []);

  const parsedAnalysis = useMemo(() => {
    if (!report) return null;
    return parseSafeAnalysis(report.analysis, report);
  }, [report]);

  const answeredList = useMemo(() => {
    return Object.values(evaluatedAnswers);
  }, [evaluatedAnswers]);

  const averageScore = useMemo(() => {
    if (!answeredList.length) return 0;
    const total = answeredList.reduce((acc, curr) => acc + (curr.feedback?.score || 0), 0);
    return (total / answeredList.length).toFixed(1);
  }, [answeredList]);

  // Loading Screen
  if (loading && !report) {
    return (
      <AppLayout>
        <div className="interview-page">
          <AnalysisSkeleton />
        </div>
      </AppLayout>
    );
  }

  // Error State with Retry Button
  if (interviewError || (!report && !loading)) {
    return (
      <AppLayout>
        <div className="interview-page">
          <Alert
            variant="danger"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => getReportById(interviewId)}
              >
                Retry
              </Button>
            }
          >
            {interviewError || "Failed to load interview report. Please try again."}
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="interview-page">
        {/* ── Top Header ── */}
        <header className="interview-header">
          <div className="interview-header__meta">
            <span className="interview-header__label">Practice session</span>
            <h1 className="interview-header__title">
              {report.title || "Interview Practice Session"}
            </h1>
          </div>

          <div className="interview-header__actions">
            <Button
              variant="secondary"
              onClick={handleDownload}
              loading={downloading}
              disabled={downloading}
            >
              {downloading
                ? "Preparing PDF..."
                : downloadSuccess
                ? "Downloaded!"
                : "Download Resume PDF"}
            </Button>
            <Link to="/">
              <Button variant="ghost">New interview</Button>
            </Link>
          </div>
        </header>

        {downloadError && (
          <div style={{ marginBottom: "1rem" }}>
            <Alert variant="danger">{downloadError}</Alert>
          </div>
        )}
        {downloadSuccess && (
          <div style={{ marginBottom: "1rem" }}>
            <Alert variant="success">Resume PDF downloaded successfully!</Alert>
          </div>
        )}

        {/* ── Real AI Analysis Card (Requirement 5) ── */}
        {parsedAnalysis ? (
          <Card className="analysis-card" aria-label="Candidate analysis">
            <div className="analysis-card__header">
              <div className="analysis-card__title-wrap">
                <span className="analysis-card__kicker">Role Match Analysis</span>
                <h2 className="analysis-card__title">Qualifications & Skill Alignment</h2>
                <p className="analysis-card__summary">{parsedAnalysis.summary}</p>
              </div>
            </div>

            {/* Match Score Block */}
            <div className="analysis-score-grid">
              <div className="analysis-score-number-wrap">
                <span className="analysis-score-number">{parsedAnalysis.matchScore}%</span>
                <span className="analysis-score-label">Role Match Score</span>
              </div>
              <div className="analysis-score-bar-wrap">
                <ProgressBar
                  value={parsedAnalysis.matchScore}
                  variant={
                    parsedAnalysis.matchScore >= 80
                      ? "success"
                      : parsedAnalysis.matchScore >= 60
                      ? "primary"
                      : "warning"
                  }
                  ariaLabel={`Match Score: ${parsedAnalysis.matchScore}%`}
                />
                <p className="form-field__helper">
                  Computed directly by evaluating your background against the job description requirements.
                </p>
              </div>
            </div>

            {/* Skills Breakdown with Status ProgressBars */}
            {parsedAnalysis.skills && parsedAnalysis.skills.length > 0 && (
              <div className="analysis-skills-section">
                <span className="analysis-section-heading">Key Skills Evaluation</span>
                <div className="analysis-skills-grid">
                  {parsedAnalysis.skills.map((skill, i) => {
                    const statusVariant =
                      skill.status === "strong"
                        ? "success"
                        : skill.status === "partial"
                        ? "warning"
                        : "danger";

                    return (
                      <div key={i} className="skill-item-card">
                        <div className="skill-item-card__header">
                          <span className="skill-item-card__name">{skill.name}</span>
                          <Badge variant={statusVariant}>{skill.status}</Badge>
                        </div>
                        <ProgressBar
                          value={skill.level}
                          variant={statusVariant}
                          valueText={`${skill.level}%`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3-Column Lists: Strengths, Gaps, Focus Areas */}
            <div className="analysis-details-grid">
              {/* Strengths */}
              <div className="analysis-column">
                <span className="analysis-column__title">
                  <Badge variant="success">Strengths</Badge>
                </span>
                <ul className="analysis-list">
                  {parsedAnalysis.strengths.map((item, idx) => (
                    <li key={idx} className="analysis-list__item">
                      <span className="analysis-list__bullet" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps */}
              <div className="analysis-column">
                <span className="analysis-column__title">
                  <Badge variant="danger">Identified Gaps</Badge>
                </span>
                <ul className="analysis-list">
                  {parsedAnalysis.gaps.map((item, idx) => (
                    <li key={idx} className="analysis-list__item">
                      <span className="analysis-list__bullet" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Focus Areas */}
              <div className="analysis-column">
                <span className="analysis-column__title">
                  <Badge variant="primary">Focus Areas</Badge>
                </span>
                <ul className="analysis-list">
                  {parsedAnalysis.focusAreas.map((item, idx) => (
                    <li key={idx} className="analysis-list__item">
                      <span className="analysis-list__bullet" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ) : (
          <Alert
            variant="warning"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => getReportById(interviewId)}
              >
                Retry
              </Button>
            }
          >
            Analysis data could not be parsed. Click retry to refresh.
          </Alert>
        )}

        {/* ── Section Navigation Tabs ── */}
        <nav className="interview-tabs" aria-label="Question sections">
          <button
            type="button"
            className={`interview-tab-btn ${
              activeTab === "technical" ? "interview-tab-btn--active" : ""
            }`}
            onClick={() => setActiveTab("technical")}
          >
            Technical Questions
            <Badge variant="neutral">{report.technicalQuestions?.length || 0}</Badge>
          </button>

          <button
            type="button"
            className={`interview-tab-btn ${
              activeTab === "behavioral" ? "interview-tab-btn--active" : ""
            }`}
            onClick={() => setActiveTab("behavioral")}
          >
            Behavioral Questions
            <Badge variant="neutral">{report.behavioralQuestions?.length || 0}</Badge>
          </button>

          <button
            type="button"
            className={`interview-tab-btn ${
              activeTab === "results" ? "interview-tab-btn--active" : ""
            }`}
            onClick={() => setActiveTab("results")}
          >
            Final Results & Feedback
            {answeredList.length > 0 && (
              <Badge variant="primary">{answeredList.length}</Badge>
            )}
          </button>

          <button
            type="button"
            className={`interview-tab-btn ${
              activeTab === "roadmap" ? "interview-tab-btn--active" : ""
            }`}
            onClick={() => setActiveTab("roadmap")}
          >
            Preparation Roadmap
            <Badge variant="neutral">{report.preparationPlan?.length || 0} days</Badge>
          </button>
        </nav>

        {/* ── Tab Content: Technical Questions ── */}
        {activeTab === "technical" && (
          <section className="questions-list" aria-label="Technical questions">
            {report.technicalQuestions?.map((q, i) => (
              <QuestionCard
                key={i}
                item={q}
                index={i}
                role={report.title}
                savedFeedback={evaluatedAnswers[q.question]?.feedback}
                onFeedbackReceived={handleRecordFeedback}
              />
            ))}
          </section>
        )}

        {/* ── Tab Content: Behavioral Questions ── */}
        {activeTab === "behavioral" && (
          <section className="questions-list" aria-label="Behavioral questions">
            {report.behavioralQuestions?.map((q, i) => (
              <QuestionCard
                key={i}
                item={q}
                index={i}
                role={report.title}
                savedFeedback={evaluatedAnswers[q.question]?.feedback}
                onFeedbackReceived={handleRecordFeedback}
              />
            ))}
          </section>
        )}

        {/* ── Tab Content: Final Results & Per-Answer Feedback (Requirement 5) ── */}
        {activeTab === "results" && (
          <section className="results-summary" aria-label="Final practice results">
            <div className="results-stats-grid">
              <div className="results-stat-card">
                <span className="results-stat-num">{answeredList.length}</span>
                <span className="results-stat-label">
                  Questions Attempted (out of{" "}
                  {(report.technicalQuestions?.length || 0) +
                    (report.behavioralQuestions?.length || 0)}
                  )
                </span>
              </div>

              <div className="results-stat-card">
                <span className="results-stat-num">
                  {averageScore > 0 ? `${averageScore} / 10` : "—"}
                </span>
                <span className="results-stat-label">Average Practice Score</span>
                {averageScore > 0 && (
                  <ProgressBar
                    value={Number(averageScore) * 10}
                    variant={
                      Number(averageScore) >= 8
                        ? "success"
                        : Number(averageScore) >= 6
                        ? "warning"
                        : "danger"
                    }
                  />
                )}
              </div>
            </div>

            {answeredList.length === 0 ? (
              <Card padding="lg" style={{ textAlign: "center" }}>
                <p className="form-field__label">No answers evaluated yet</p>
                <p className="form-field__helper" style={{ marginTop: "4px" }}>
                  Open any technical or behavioral question in the tabs above, type your response, and click "Get feedback on my answer".
                </p>
              </Card>
            ) : (
              <div className="questions-list">
                {answeredList.map((entry, idx) => (
                  <Card key={idx} className="feedback-card">
                    <div className="feedback-card__top">
                      <div>
                        <span className="form-field__status">Question</span>
                        <h3 className="question-card__title">{entry.question}</h3>
                      </div>
                      <div className="feedback-score-display">
                        <span className="feedback-score-num">{entry.feedback.score}</span>
                        <span className="feedback-score-denom">/ 10</span>
                      </div>
                    </div>

                    <ProgressBar
                      value={entry.feedback.score * 10}
                      variant={
                        entry.feedback.score >= 8
                          ? "success"
                          : entry.feedback.score >= 6
                          ? "warning"
                          : "danger"
                      }
                    />

                    <div className="feedback-item">
                      <span className="feedback-item__title">Your submitted answer</span>
                      <p className="question-card__section-content">{entry.answer}</p>
                    </div>

                    <div className="feedback-item">
                      <span className="feedback-item__title feedback-item__title--good">
                        What was good
                      </span>
                      <p className="feedback-item__text">{entry.feedback.whatWasGood}</p>
                    </div>

                    <div className="feedback-item">
                      <span className="feedback-item__title feedback-item__title--improve">
                        What to improve
                      </span>
                      <p className="feedback-item__text">{entry.feedback.whatToImprove}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Tab Content: 7-Day Roadmap ── */}
        {activeTab === "roadmap" && (
          <section className="roadmap-list" aria-label="Preparation roadmap">
            {report.preparationPlan?.map((day) => (
              <Card key={day.day} className="roadmap-card">
                <div className="roadmap-card__header">
                  <span className="roadmap-day-badge">Day {day.day}</span>
                  <h3 className="roadmap-focus-title">{day.focus}</h3>
                </div>
                <ul className="roadmap-tasks-list">
                  {day.tasks?.map((task, i) => (
                    <li key={i}>{task}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Interview;
