const nodemailer = require('nodemailer');
require("dotenv").config()

const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,// add your email that will be the sender
        pass: process.env.EMAIL_PASS// add your email app password
    }
});

module.exports={
    sendEmail: async function (email, notif) {
        const mailOptions = {
            from: process.env.EMAIL_USER,//repeat your email again
            to: email,
            subject: notif.title,
            html: `
            <div style="width:80%;text-align:center; font-family: sans-serif;">
                <div style="padding: 10px 0;background-color:#333;color: white;margin:auto;">CodeXpress</div>
                ${notif.content}
            </div>
            `
        };
        await transporter.sendMail(mailOptions);
    }
}
