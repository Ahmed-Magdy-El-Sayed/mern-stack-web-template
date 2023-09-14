const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    secure: true,
    auth: {
        user: 'amcodes55@gmail.com',
        pass: 'ziichubwyythblop'
    }
});

module.exports={
    sendEmailVerification: async function (email, code) {
        const mailOptions = {
            from: 'amcodes55@gmail.com',
            to: email,
            subject: 'Email Verification',
            html: `
            <div style="text-align:center; font-family: sans-serif;">
                <div style="width:80%;padding: 10px 0;background-color:#333;color: white;margin:auto;">Comment app</div>
                <p>Your verification code is: <strong>${code}</strong></p>
                <p>If you did not sign up, please ignore this email.</p>
            </div>
            `
        };
        await transporter.sendMail(mailOptions);
    },
    sendEmailNotification: async function (email, notif) {
        const mailOptions = {
            from: 'amcodes55@gmail.com',
            to: email,
            subject: notif.title,
            html: `
            <div style="text-align:center; font-family: sans-serif;">
                <div style="width:80%;padding: 10px 0;background-color:#333;color: white;margin:auto;">Comment app</div>
                ${notif.content}
            </div>
            `
        };
        await transporter.sendMail(mailOptions);
    }
}
