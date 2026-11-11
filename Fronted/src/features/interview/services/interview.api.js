import axios from "axios";

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    if (import.meta.env.DEV) {
        return "http://localhost:3000";
    }
    return "";
};

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const generateInterviewReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
}) => {
    const formData = new FormData();

    formData.append(
        "jobDescription",
        jobDescription
    );

    formData.append(
        "selfDescription",
        selfDescription
    );

    // Resume OPTIONAL
    if (resumeFile) {
        formData.append(
            "resume",
            resumeFile
        );
    }

    const response = await api.post(
        "/api/interview/",
        formData
    );

    return response.data;
};

export const getInterviewReportById = async (
    interviewId
) => {
    const response = await api.get(
        `/api/interview/report/${interviewId}`
    );

    return response.data;
};

export const getAllInterviewReports = async () => {
    const response = await api.get(
        "/api/interview/"
    );

    return response.data;
};

export const generateResumePdf = async ({
    interviewReportId,
}) => {
    const response = await api.post(
        `/api/interview/resume/pdf/${interviewReportId}`,
        null,
        {
            responseType: "blob",
        }
    );

    return response.data;
};
