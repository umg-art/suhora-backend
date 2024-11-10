const MySqlPool = require("../connection");
const { sendDemoEmail } = require("../services/sendEmail");


async function getFormDataEmail(req, res) {
    try {
        const { name, email, phone, message } = req.body;

        // Validate if all fields are provided
        if (!name || !email || !phone || !message) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
                body: req.body,
            });
        }

        // Insert the form data into the database
        const [userdata] = await MySqlPool.query(
            `INSERT INTO clientreachout (name, email, phone, message) VALUES (?, ?, ?, ?)`,
            [name, email, phone, message]
        );

        // Check if data is successfully inserted
        if (!userdata || userdata.affectedRows === 0) {
            return res.status(400).send({
                success: false,
                message: "Failed to send data",
            });
        }

        // Send email notification
        await sendDemoEmail({ name, email, phone, message });

        // Send response to the client
        res.status(200).send({
            success: true,
            message: "Form submitted successfully, and email sent.",
            data: userdata,
        });

    } catch (error) {
        console.log("Error in getFormDataEmail:", error);
        res.status(500).send({
            success: false,
            message: "Something went wrong",
            error: error.message || error,
        });
    }
}

module.exports = {
    getFormDataEmail
}