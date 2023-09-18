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
    sendEmail: async function (email, notif) {
        const mailOptions = {
            from: 'amcodes55@gmail.com',
            to: email,
            subject: notif.title,
            html: `
            <div style="width:80%;text-align:center; font-family: sans-serif;">
                <div style="padding: 10px 0;background-color:#333;color: white;margin:auto;">AMCodes</div>
                ${notif.content}
            </div>
            `
        };
        await transporter.sendMail(mailOptions);
    }
}
