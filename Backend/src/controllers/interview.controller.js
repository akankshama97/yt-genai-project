const {
    generateInterviewReport,
    generateResumePdf,
} = require("../services/ai.service");

const InterviewReport = require("../models/interviewReport.model");

async function extractResumeText(file) {
    if (!file) {
        return "";
    }

    try {
        const pdfParse = require("pdf-parse");

        if (typeof pdfParse === "function") {
            const result = await pdfParse(file.buffer);
            return result?.text || "";
        }

        if (pdfParse?.PDFParse) {
            const parser = new pdfParse.PDFParse(
                new Uint8Array(file.buffer)
            );

            const result = await parser.getText();

            if (parser.destroy) {
                await parser.destroy();
            }

            return result?.text || "";
        }

        return "";
    } catch (error) {
        console.error("Resume parsing error:", error);
        throw new Error("Unable to read the uploaded PDF.");
    }
}

async function generateInterViewReportController(req, res) {
    try {
        const {
            jobDescription,
            selfDescription,
        } = req.body;

        if (!jobDescription?.trim()) {
            return res.status(400).json({
                message: "Job description is required.",
            });
        }

        if (!selfDescription?.trim()) {
            return res.status(400).json({
                message: "About You is required.",
            });
        }

        // Resume is OPTIONAL
        const resumeText = await extractResumeText(req.file);

        const aiReport = await generateInterviewReport({
            resume: resumeText,
            jobDescription: jobDescription.trim(),
            selfDescription: selfDescription.trim(),
        });

        if (!aiReport) {
            return res.status(500).json({
                message: "AI failed to generate interview report.",
            });
        }

        const interviewReport =
            await InterviewReport.create({
                user: req.user.id,
                resume: resumeText,
                jobDescription: jobDescription.trim(),
                selfDescription: selfDescription.trim(),
                ...aiReport,
            });

        return res.status(201).json({
            message: "Interview generated successfully.",
            interviewReport,
        });
    } catch (error) {
        console.error(
            "GENERATE INTERVIEW ERROR:",
            error
        );

        return res.status(500).json({
            message:
                error?.message ||
                "Something went wrong while generating interview.",
        });
    }
}

async function getInterviewReportByIdController(
    req,
    res
) {
    try {
        const { interviewId } = req.params;

        const interviewReport =
            await InterviewReport.findOne({
                _id: interviewId,
                user: req.user.id,
            });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found.",
            });
        }

        return res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport,
        });
    } catch (error) {
        console.error(
            "GET INTERVIEW ERROR:",
            error
        );

        return res.status(500).json({
            message: "Unable to fetch interview report.",
        });
    }
}

async function getAllInterviewReportsController(
    req,
    res
) {
    try {
        const interviewReports =
            await InterviewReport.find({
                user: req.user.id,
            }).sort({
                createdAt: -1,
            });

        return res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports,
        });
    } catch (error) {
        console.error(
            "GET ALL INTERVIEWS ERROR:",
            error
        );

        return res.status(500).json({
            message: "Unable to fetch interview reports.",
        });
    }
}

async function generateResumePdfController(
    req,
    res
) {
    try {
        const { interviewReportId } = req.params;

        const interviewReport =
            await InterviewReport.findOne({
                _id: interviewReportId,
                user: req.user.id,
            });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found.",
            });
        }

        const pdfBuffer = await generateResumePdf({
            resume: interviewReport.resume || "",
            jobDescription:
                interviewReport.jobDescription || "",
            selfDescription:
                interviewReport.selfDescription || "",
        });

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="resume-${interviewReportId}.pdf"`
        );

        return res.send(pdfBuffer);
    } catch (error) {
        console.error(
            "GENERATE PDF ERROR:",
            error
        );

        return res.status(500).json({
            message: "Unable to generate PDF.",
        });
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
};