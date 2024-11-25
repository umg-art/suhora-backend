const MySqlPool = require("../connection");
const { sendDemoEmail } = require("../services/sendEmail");

async function getFormDataEmail(req, res) {
    const connection = await MySqlPool.getConnection();
    try {
        // Start a transaction
        await connection.beginTransaction();

        const { name, email, phone, message,resource } = req.body;

        // Validate if all fields are provided
        if (!name || !email || !phone || !message || !resource) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
                body: req.body,
            });
        }

        // Send email notification
        await sendDemoEmail({ name, email, phone, message,resource });

        // Insert the form data into the database only if the email is sent successfully
        const [userdata] = await connection.query(
            `INSERT INTO get_in_touch_fe (name, email, phone, message, resource) VALUES (?, ?, ?, ?,?)`,
            [name, email, phone, message,resource]
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


async function getUserResponse(req, res) {
    try {
        let { draw, start, length, search, order } = req.query;

        // Sanitize and validate start and length
        start = parseInt(start) || 0;  // Default to 0 if invalid or missing
        length = parseInt(length) || 10;  // Default to 10 if invalid or missing

        const searchValue = search?.value || '';  // Extract search value from the query
        const orderColumnIndex = order ? parseInt(order[0].column) : 0;  // Column index for ordering
        const orderDir = order ? order[0].dir : 'asc';  // Order direction

        // Map column indexes to database column names
        const columns = ["id", "name", "email", "phone", "message", "resource"];
        const orderByColumn = columns[orderColumnIndex] || 'id';  // Default to 'id' if no valid column

        // Get total number of records (without filtering)
        const [totalRecordsResult] = await MySqlPool.query('SELECT COUNT(*) AS total FROM get_in_touch_fe');
        const totalRecords = totalRecordsResult[0].total;

        // Get filtered records count and data
        const [filteredRecordsResult] = await MySqlPool.query(
            `SELECT COUNT(*) AS total FROM get_in_touch_fe WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ?`,
            [`%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`]
        );
        const filteredRecords = filteredRecordsResult[0].total;

        // Fetch paginated data with search, order, and limit
        const [data] = await MySqlPool.query(
            `SELECT * FROM get_in_touch_fe WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR message LIKE ? 
             ORDER BY ${orderByColumn} ${orderDir}
             LIMIT ?, ?`,
            [`%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`, start, length]
        );

        // Respond with data in DataTables format
        res.status(200).json({
            draw: parseInt(draw),  // draw count to synchronize with DataTables request
            recordsTotal: totalRecords,  // total number of records
            recordsFiltered: filteredRecords,  // total number of records after filtering
            data: data  // array of user response records
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error getting user responses",
            error
        });
    }
}

module.exports = {
    getFormDataEmail,getUserResponse
}