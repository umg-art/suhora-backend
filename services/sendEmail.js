const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'demetrius76@ethereal.email',
        pass: 'rRk617Npgp26REAdWe'
    }
});

async function sendDemoEmail({ name, email, phone, message }) {
    try {
        await transporter.sendMail({
            from: `"Maddison Foo Koch 👻" <${email}>`, // sender address
            to: "umang.prajapati026@gmail.com", // receiver address
            subject: "Hello ✔, New user response received", // Subject line
            text: `You have a new demo request from:
            Name: ${name}
            Email: ${email}
            Phone: ${phone}
            Message: ${message}`,
        });
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
}


module.exports = {
    sendDemoEmail
}