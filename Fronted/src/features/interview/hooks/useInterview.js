import { useCallback, useContext } from "react";
import { InterviewContext } from "../interview.context";

import {
    generateInterviewReport,
    getInterviewReportById,
    getAllInterviewReports,
    generateResumePdf,
} from "../services/interview.api";

export const useInterview = () => {
    const context = useContext(InterviewContext);

    if (!context) {
        throw new Error(
            "useInterview must be used inside InterviewProvider"
        );
    }

    const {
        loading,
        setLoading,
        report,
        setReport,
        reports,
        setReports,
        error,
        setError,
    } = context;
    
const generateReport = useCallback(
    async (payload) => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await generateInterviewReport(payload);

            if (
                !response ||
                !response.interviewReport
            ) {
                throw new Error(
                    "Interview report was not returned by server."
                );
            }

            setReport(
                response.interviewReport
            );

            // IMPORTANT:
            // Home.jsx expects:
            // data.interviewReport._id
            //
            // So return the COMPLETE API response.
            return response;

        } catch (error) {
            console.error(
                "Generate report error:",
                error
            );

            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to generate interview.";

            setError(message);

            throw error;

        } finally {
            setLoading(false);
        }
    },
    [setError, setLoading, setReport]
);

    const getReportById = useCallback(
        async (interviewId) => {
            setLoading(true);
            setError(null);

            try {
                const response =
                    await getInterviewReportById(
                        interviewId
                    );

                if (
                    !response ||
                    !response.interviewReport
                ) {
                    throw new Error(
                        "Interview report not found."
                    );
                }

                setReport(
                    response.interviewReport
                );

                return response.interviewReport;
            } catch (error) {
                console.error(
                    "Get report error:",
                    error
                );

                const message =
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to load interview.";

                setError(message);

                throw error;
            } finally {
                setLoading(false);
            }
        },
        [setError, setLoading, setReport]
    );

    const getReports = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response =
                await getAllInterviewReports();

            const interviewReports =
                response?.interviewReports || [];

            setReports(interviewReports);

            return interviewReports;
        } catch (error) {
            console.error(
                "Get reports error:",
                error
            );

            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load interviews.";

            setError(message);

            throw error;
        } finally {
            setLoading(false);
        }
    }, [setError, setLoading, setReports]);

    const downloadResume = useCallback(
        async (interviewReportId) => {
            try {
                const responseData = await generateResumePdf({
                    interviewReportId,
                });

                // Ensure data is treated as Blob
                const blob =
                    responseData instanceof Blob
                        ? responseData
                        : new Blob([responseData], { type: "application/pdf" });

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `resume-${interviewReportId}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                return true;
            } catch (error) {
                console.error("Download resume error:", error);

                let message = "Failed to download resume.";
                if (error?.response?.data instanceof Blob) {
                    try {
                        const raw = await error.response.data.text();
                        const parsed = JSON.parse(raw);
                        if (parsed?.message) message = parsed.message;
                    } catch {
                        // ignore JSON parse error on blob
                    }
                } else if (error?.response?.data?.message) {
                    message = error.response.data.message;
                } else if (error?.message) {
                    message = error.message;
                }

                throw new Error(message);
            }
        },
        []
    );

    return {
        loading,
        report,
        reports,
        error,

        generateReport,
        getReportById,
        getReports,
        downloadResume,
    };
};