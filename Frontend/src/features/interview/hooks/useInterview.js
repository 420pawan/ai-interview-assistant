import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, error, setError, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError(null)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            const interviewReport = response?.interviewReport

            if (!interviewReport?._id) {
                throw new Error("The interview report response was incomplete. Please try again.")
            }

            setReport(interviewReport)
            return interviewReport
        } catch (error) {
            console.log(error)
            setError(error.response?.data?.message || error.message || "Unable to generate an interview report.")
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        setError(null)
        setReport(null)
        try {
            const response = await getInterviewReportById(interviewId)
            const interviewReport = response?.interviewReport
            const requiredArrays = [ "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan" ]

            if (!interviewReport ||
                requiredArrays.some((field) => !Array.isArray(interviewReport[field])) ||
                interviewReport.preparationPlan.some((day) => !Array.isArray(day.tasks))) {
                throw new Error("Interview report is incomplete and cannot be displayed.")
            }

            setReport(interviewReport)
            return interviewReport
        } catch (error) {
            console.log(error)
            setError(error.response?.data?.message || error.message || "Unable to load interview report.")
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await getAllInterviewReports()
            const interviewReports = response?.interviewReports

            if (!Array.isArray(interviewReports)) {
                throw new Error("Interview reports response is invalid.")
            }

            setReports(interviewReports)
            return interviewReports
        } catch (error) {
            console.log(error)
            setReports([])
            setError(error.response?.data?.message || error.message || "Unable to load interview reports.")
            return []
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.log(error)
            setError(error.response?.data?.message || error.message || "Unable to generate a resume PDF.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, error, report, reports, generateReport, getReportById, getReports, getResumePdf }

}
