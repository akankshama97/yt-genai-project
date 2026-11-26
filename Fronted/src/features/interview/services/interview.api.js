import api from "../../../services/apiClient";

export const generateInterviewReport = async ({
  jobDescription,
  selfDescription,
  resumeFile,
}) => {
  const formData = new FormData();

  formData.append("jobDescription", jobDescription);
  formData.append("selfDescription", selfDescription);

  if (resumeFile) {
    formData.append("resume", resumeFile);
  }

  const response = await api.post("/api/interview/", formData);
  return response.data;
};

export const getInterviewReportById = async (interviewId) => {
  const response = await api.get(`/api/interview/report/${interviewId}`);
  return response.data;
};

export const getAllInterviewReports = async () => {
  const response = await api.get("/api/interview/");
  return response.data;
};

export const generateResumePdf = async ({ interviewReportId }) => {
  const response = await api.post(
    `/api/interview/resume/pdf/${interviewReportId}`,
    null,
    {
      responseType: "blob",
      headers: {
        Accept: "application/pdf, application/json, */*",
      },
    }
  );
  return response.data;
};

export const evaluateQuestionAnswer = async ({
  question,
  answer,
  intention,
  modelAnswer,
  role,
}) => {
  const response = await api.post("/api/interview/feedback", {
    question,
    answer,
    intention,
    modelAnswer,
    role,
  });
  return response.data;
};
