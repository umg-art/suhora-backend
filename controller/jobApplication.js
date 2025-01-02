const MySqlPool = require("../connection");
const { deleteJobListById,getJobById, getAllJobs } = require("../models/jobsModel");

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') 
        .trim()
        .replace(/\s+/g, '-') 
        .replace(/-+/g, '-');
}

async function getUserJobResponse(req, res) {
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

async function createJob(req,res) {
    try {
        const { title, description, job_location, job_type, experience, employment_type, department, opening_count } = req.body;
     
        if (!title || !description || !job_location || !job_type || !experience || !employment_type || !department || !opening_count) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
                body: req.body,
            });
        }

        let slug = generateSlug(title)
        slug = `${slug}-${Date.now()}`;

        const dep = department.toLowerCase();
        console.log("department", dep);
        
        
        const dataInsert = await MySqlPool.query(
            `INSERT INTO \`job_list\` (slug, title, description, job_location, job_type, experience, employment_type, department, opening_count) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [slug, title, description, job_location, job_type, experience, employment_type, dep, opening_count]
        );
        if (!dataInsert) {
            return res.status(400).send({
                success: false,
                message: "Failed to insert job",
            });
        }
        return res.status(200).json({ success: true, message: 'Job Created Successfully!' });
    } 
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error Creating job",
            error
        });
    }
}

async function deleteJob(req, res) {
    try {
        const id = req.params.id;
        if(!id){
            return res.status(400).send({
                succes: false,
                message: "Id not found",
            })
        }
        const deleteRecord = await deleteJobListById(id) 
        if(!deleteRecord){
            return res.status(400).json({success: false, message: "Something went wrong"});
        }
        return res.status(200).json({success: true, message: "Delete job succesfully!"});
    } 
    catch (error) {
        console.log("error", error);
        return res.status(500).json({success: false, message: "Internal server error", error});
    }
}

async function getJobDetailById(req, res) {
    try {
        const id = req.params.id;
        const data = await getJobById(id);

        if (!data) {
            return res.status(404).send({
                success: false,
                message: "Job not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Job fetched successfully",
            data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error fetching job",
            error,
        });
    }
}

async function getAllJobsOpening(req, res) {
    try {
        const { draw, start, length, search, order } = req.query;

        const searchValue = search?.value || ''; 

        const sortColumnIndex = order && order.length > 0 ? order[0].column : 0; 
        const sortDirection = order && order.length > 0 ? order[0].dir : 'asc';

        const columns = [
            'title', 'skills', 'job_location', 'job_type', 'experience', 'employment_type', 'department', 'opening_count'
        ];

        const orderBy = columns[sortColumnIndex] || 'title';

        const result = await getAllJobs(searchValue, start, length, orderBy, sortDirection);

        res.json({
            draw: parseInt(draw, 10), 
            recordsTotal: result.totalRecords,
            recordsFiltered: result.filteredRecords, 
            data: result.data
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the job listings.' });
    }
}

async function updateJob(req, res) {
    try {
        const id = req.params.id; 
        // console.log("update req", req.body);
        
        const { title, description, job_location, job_type, experience, employment_type, department, opening_count } = req.body;

        if (!title || !description || !job_location || !job_type || !experience || !employment_type || !department || !opening_count) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
                body: req.body,
            });
        }

        let slug = generateSlug(title);
        slug = `${slug}-${Date.now()}`;

        const dataUpdate = await MySqlPool.query(
            `UPDATE \`job_list\` 
            SET slug = ?, title = ?, description = ?, job_location = ?, job_type = ?, experience = ?, employment_type = ?, department = ?, opening_count = ? 
            WHERE id = ?`,
            [slug, title, description, job_location, job_type, experience, employment_type, department, opening_count, id]
        );

        if (dataUpdate.affectedRows === 0) {
            return res.status(404).send({
                success: false,
                message: "Job not found",
            });
        }

        return res.status(200).json({ success: true, message: 'Job Updated Successfully!' });
    } 
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error Updating job",
            error
        });
    }
}


module.exports = {
    getUserJobResponse,createJob,deleteJob,getJobDetailById,getAllJobsOpening,updateJob
}