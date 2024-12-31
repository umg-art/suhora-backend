const { getAllJobs } = require("../models/jobsModel");

async function getAllJobsOpening(req, res) {
    try {
        const { draw, start, length, search, order } = req.query;

        const searchValue = search?.value || ''; 

        const sortColumnIndex = order && order.length > 0 ? order[0].column : 0; 
        const sortDirection = order && order.length > 0 ? order[0].dir : 'asc';

        const columns = [
            'title', 'skills', 'job_location', 'job_type', 'experience', 'employment_type', 'department', 'opening_count'
        ];

        const orderBy = columns[sortColumnIndex] || 'title'; // Default to 'title' if invalid index is provided

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

module.exports = {
    getAllJobsOpening
};
