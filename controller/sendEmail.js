const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    secure: true,
    auth: {
        user: 'amcodes55@gmail.com',// add your email that will be the sender
        pass: 'yuha ylbv xhyp owpm'// add your email app password
    }
});

module.exports={
    sendEmail: async function (email, notif) {
        const mailOptions = {
            from: 'amcodes55@gmail.com',//repeat your email again
            to: email,
            subject: notif.title,
            html: `
            <div style="width:80%;text-align:center; font-family: sans-serif;">
                <div style="padding: 10px 0;background-color:#333;color: white;margin:auto;">CodeXpress</div>
                ${notif.content}
            </div>
            `
        };
        console.log(notif.content)
        try {
            await transporter.sendMail(mailOptions);
        } catch (err) {
            console.log(err)
        }
    }
}
