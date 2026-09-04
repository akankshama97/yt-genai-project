const mongoose = require('mongoose');

/**
 * - job description schema: String
 * - resume text
 * - Self description
 * 
 * -matchscore : {
 *           type : Number,
 *            min : Number,
 *           max : Number
 * }
 * 
 * - Technical questions : [{
 *      question : String,
 *      intention : String,
 *      answer : String
 * }]
 * - Behavioral questions : [{
 *      question : String,
 *      intention : String,
 *      answer : String
 * }]
 * - skill gaps : [{
 *      skill : String,
 *      severity : {
 *         type : String,
 *        enum : ['low', 'medium', 'high']}
 * }]
 * - presentation plan : [{
 *          day : Number,
 *          focus : String,
 *          task : [String]
 * }]
 */

const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Question is required']
    },
    intention: {
        type: String,
        required: [true, 'Intention is required']
    },
    answer: {
        type: String,
        required: [true, 'Answer is required']
    },
}, {
    _id: false

});
const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, 'Question is required']
    },
    intention: {
        type: String,
        required: [true, 'Intention is required']
    },
    answer: {
        type: String,
        required: [true, 'Answer is required']
    }
}, {
    _id: false
});

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [true, 'Skill is required']
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
}, {
    _id: false
});
const presentationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [true, 'Day is required']
    },
    focus: {
        type: String,
        required: [true, 'Focus is required']
    },
    tasks: [{
        type: String,
        required: [true, 'Task is required']
    }]
}, {
    _id: false
});

const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: true
    },

    resume: {
        type: String,
        default: ""
    },

    selfDescription: {
        type: String,
        default: ""
    },

    matchScore: {
        type: Number,
        min: 0,
        max: 100
    },

    technicalQuestions: [technicalQuestionSchema],

    behavioralQuestions: [behavioralQuestionSchema],

    skillGaps: [skillGapSchema],

    preparationPlan: [presentationPlanSchema],

    title: {
        type: String,
        default: ""
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

const InterviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

module.exports = InterviewReportModel;