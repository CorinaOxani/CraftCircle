const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    logger: false,
    debug: false,
});

transporter.verify((error, success) => {
    if (error) {
        console.error("Email server verification error:", error);
    } else {
        console.log("Email server is ready to take messages");
    }
});

module.exports = transporter;