const MySqlPool = require("../connection");
const { sendDemoEmail } = require("../services/sendEmail");

async function getFormDataEmail(req, res) {
    const connection = await MySqlPool.getConnection();
    try {
        // Start a transaction
        await connection.beginTransaction();

        const { name, email, phone, message } = req.body;

        // Validate if all fields are provided
        if (!name || !email || !phone || !message) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
                body: req.body,
            });
        }

        // Send email notification
        // await sendDemoEmail({ name, email, phone, message });

        // Insert the form data into the database only if the email is sent successfully
        const [userdata] = await connection.query(
            `INSERT INTO clientreachout (name, email, phone, message) VALUES (?, ?, ?, ?)`,
            [name, email, phone, message]
        );

        // If data was successfully inserted, commit the transaction
        if (userdata.affectedRows > 0) {
            await connection.commit();
            return res.status(200).send({
                success: true,
                message: "Form submitted successfully, and email sent.",
                data: userdata,
            });
        } else {
            // Rollback if the data insertion fails
            await connection.rollback();
            return res.status(400).send({
                success: false,
                message: "Failed to insert data into the database.",
            });
        }
    } catch (error) {
        // Rollback the transaction in case of any errors (either email or DB)
        await connection.rollback();
        console.error("Error in getFormDataEmail:", error);
        res.status(500).send({
            success: false,
            message: "Something went wrong",
            error: error.message || error,
        });
    } finally {
        // Release the connection back to the pool
        connection.release();
    }
}

async function getUserResponse(req,res) {
    try {
        const data = await MySqlPool.query('SELECT * FROM get_in_touch_fe')
        if (!data) {
            res.status(400).send({
                success: false,
                message: "data not found",
            })
        }
        res.status(200).send({
            success: true,
            message: "data fetch succes",
            data: data[0]
        })
    } 
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error creating blog",
            error,
        });
    }
}

module.exports = {
    getFormDataEmail,getUserResponse
}