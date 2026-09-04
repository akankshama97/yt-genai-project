const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    console.log("=================================");
    console.log("Uploaded file:");
    console.log("Original name:", file.originalname);
    console.log("Mimetype:", file.mimetype);
    console.log("=================================");

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    // Only check the actual file extension.
    // Some clients/Postman can send a different MIME type
    // even when the file is a valid PDF.
    if (extension === ".pdf") {
        return cb(null, true);
    }

    return cb(
        new Error(
            `Only PDF files are allowed. Received: ${file.originalname}`
        ),
        false
    );
};

const upload = multer({
    storage,

    limits: {
        fileSize: 3 * 1024 * 1024,
    },

    fileFilter,
});

module.exports = upload;