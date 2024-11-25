const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    service: 'gmail',
    port: 587,
    auth: {
        user: process.env.EMAIL_SERVICE_MAIL,
        pass:  process.env.EMAIL_SERVICE_PASSWORD
    }
});

async function sendDemoEmail({ name, email, phone, message,resource }) {
    try {
        await transporter.sendMail({
            from: `<${email}>`, // sender address
            to: "umang.prajapati026@gmail.com", // receiver address
            subject: "Hello ✔, New user response received", // Subject line
            html: `
                <html>
                    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                        <table style="width: 100%; max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                            <tr>
                                <td colspan="2" style="text-align: center; padding-bottom: 20px;">
                                    <h2 style="color: #2c3e50;">New Demo Request Received</h2>
                                    <p style="color: #7f8c8d;">A new demo request has been submitted on your website.</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-size: 14px; color: #34495e;"><strong>Name:</strong></td>
                                <td style="padding: 10px; font-size: 14px; color: #34495e;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-size: 14px; color: #34495e;"><strong>Email:</strong></td>
                                <td style="padding: 10px; font-size: 14px; color: #34495e;">${email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-size: 14px; color: #34495e;"><strong>Phone:</strong></td>
                                <td style="padding: 10px; font-size: 14px; color: #34495e;">${phone}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-size: 14px; color: #34495e;"><strong>Message:</strong></td>
                                <td style="padding: 10px; font-size: 14px; color: #34495e;">${message}</td>
                            </tr>
                             <tr>
                                <td style="padding: 10px; font-size: 14px; color: #34495e;"><strong>From this page:</strong></td>
                                <td style="padding: 10px; font-size: 14px; color: #34495e;">${resource}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="padding-top: 20px; text-align: center; font-size: 12px; color: #95a5a6;">
                                    <p>Thank you for your submission.</p>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>
            `,
        });
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
}


module.exports = {
    sendDemoEmail
}