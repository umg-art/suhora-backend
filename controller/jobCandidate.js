const MySqlPool = require("../connection");
const { getCandidate } = require("../models/jobsModel");

async function getJobApplication(req, res) {
    const connection = await MySqlPool.getConnection();
    try {
        await connection.beginTransaction();

        const { name, email, phone_no, experience, current_company, job_position, location } = req.body;        
        const resumePath = req.file ? `/assets/uploads/resume/${req.file.filename}` : null;

        if (!name || !email || !phone_no || !experience || !current_company || !resumePath || !location) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
                body: req.body,
            });
        }

        const [userdata] = await connection.query(
            `INSERT INTO job_application (name, email, phone_no, experience, current_company, job_position, resume, location) VALUES (?,?,?,?,?,?,?,?)`,
            [name, email, phone_no, experience, current_company, job_position, resumePath, location]
        );

        if (userdata.affectedRows > 0) {
            await connection.commit();
            return res.status(200).send({
                success: true,
                message: "Job Applied successfully.",
                data: userdata,
            });
        } else {
            await connection.rollback();
            return res.status(400).send({
                success: false,
                message: "Fail to apply, try again!",
            });
        }
    } catch (error) {
        await connection.rollback();
        console.error("Error in getJobApplication:", error);
        res.status(500).send({
            success: false,
            message: "Something went wrong",
            error: error.message || error,
        });
    } finally {
        connection.release();
    }
}


async function getJobApplicationList(req, res) {
    try {
        let { draw, start, length, search, order } = req.query;

        start = parseInt(start) || 0;
        length = parseInt(length) || 10;

        const searchValue = search?.value || '';
        const orderColumnIndex = order ? parseInt(order[0].column) : 0;
        const orderDir = order ? order[0].dir : 'asc';  // Order 

        const columns = ["id", "name", "email", "phone_no", "experience", "current_company", "job_position", "resume", "location"];
        const orderByColumn = columns[orderColumnIndex] || 'id';

        // Get total number of records with the job title
        const [totalRecordsResult] = await MySqlPool.query(
            `SELECT COUNT(*) AS total 
             FROM job_application ja 
             JOIN job_list jl ON ja.job_position = jl.id`
        );
        const totalRecords = totalRecordsResult[0].total;

        const searchPattern = `%${searchValue}%`;
        const [filteredRecordsResult] = await MySqlPool.query(
            `SELECT COUNT(*) AS total 
             FROM job_application ja 
             JOIN job_list jl ON ja.job_position = jl.id
             WHERE ja.name LIKE ? OR ja.email LIKE ? OR ja.phone_no LIKE ? OR jl.title LIKE ? OR ja.location LIKE ?`,
            [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
        );
        const filteredRecords = filteredRecordsResult[0].total;

        // Get the data with job title from the job_list table
        const [data] = await MySqlPool.query(
            `SELECT ja.*, jl.title AS job_position
             FROM job_application ja
             JOIN job_list jl ON ja.job_position = jl.id
             WHERE ja.name LIKE ? OR ja.email LIKE ? OR ja.phone_no LIKE ? OR jl.title LIKE ? OR ja.location LIKE ?
             ORDER BY ?? ${orderDir}
             LIMIT ?, ?`,
            [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, orderByColumn, start, length]
        );

        res.status(200).json({
            draw: parseInt(draw),
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: data
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error getting job applications",
            error: error.message || error
        });
    }
}


async function viewCandidate(req, res) {
    try {
        const id = req.params.id;
        const data = await getCandidate(id);

        if (!data) {
            return res.status(404).send({
                success: false,
                message: "Candidate not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Candidate found successfully",
            data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error fetching candidate",
            error,
        });
    }
}

async function getAppliedJobDeatils(req,res) {
    try {
        const id = req.params.id
    }
    catch (error) {
        
    }
}


module.exports = {
    getJobApplication,getJobApplicationList,getAppliedJobDeatils,viewCandidate
}