const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "oxanicorina0@gmail.com",
        pass: "zssj zxlz jaok bcpw",
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
