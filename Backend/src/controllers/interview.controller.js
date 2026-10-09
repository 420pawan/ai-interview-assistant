const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

const reportArrayFields = [
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan"
]

function hasCompleteReportSections(interviewReport) {
    return reportArrayFields.every((field) => Array.isArray(interviewReport[field])) &&
        interviewReport.preparationPlan.every((day) => Array.isArray(day.tasks))
}

function createBadRequestError(message) {
    const error = new Error(message)
    error.statusCode = 400
    return error
}

async function extractResumeText(file) {
    if (file.mimetype !== "application/pdf") {
        throw createBadRequestError("Resume must be a PDF file.")
    }

    if (!file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
        throw createBadRequestError("Resume must be a valid PDF file.")
    }

    let parser
    try {
        parser = new pdfParse.PDFParse({ data: file.buffer })
        const resumeContent = await parser.getText()
        const resume = resumeContent.text?.trim()

        if (!resume) {
            throw createBadRequestError("Resume PDF does not contain readable text.")
        }

        return resume
    } catch (error) {
        if (error.statusCode === 400) {
            throw error
        }

        throw createBadRequestError("Resume PDF could not be read.")
    } finally {
        if (parser) {
            await parser.destroy().catch(() => {})
        }
    }
}



/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription = "", jobDescription = "" } = req.body
        const trimmedJobDescription = jobDescription.trim()
        const trimmedSelfDescription = selfDescription.trim()

        if (!trimmedJobDescription) {
            return res.status(400).json({ message: "Job description is required." })
        }

        if (!req.file && !trimmedSelfDescription) {
            return res.status(400).json({ message: "Upload a PDF resume or provide a self description." })
        }

        let resume = ""
        if (req.file) {
            resume = await extractResumeText(req.file)
        }

        const interViewReportByAi = await generateInterviewReport({
            resume,
            selfDescription: trimmedSelfDescription,
            jobDescription: trimmedJobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume,
            selfDescription: trimmedSelfDescription,
            jobDescription: trimmedJobDescription,
            ...interViewReportByAi
        })

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error(`Interview report generation failed: ${error.message}`)
        const statusCode = error.statusCode || 500
        const message = statusCode === 400
            ? error.message
            : "Unable to generate an interview report. Please try again."

        return res.status(statusCode).json({ message })
    }

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id }).lean()

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    if (!hasCompleteReportSections(interviewReport)) {
        return res.status(500).json({
            message: "Interview report is incomplete and cannot be displayed."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
