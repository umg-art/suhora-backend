const MySqlPool = require("../connection");

const getAllJobs = async (searchValue, start, length, orderByColumn, orderDir) => {
    start = parseInt(start, 10) || 0; // Default to 0 if undefined or NaN
    length = parseInt(length, 10) || 10; // Default to 10 if undefined or NaN
    orderByColumn = orderByColumn || 'title'; // Default to 'title' column if not provided
    orderDir = orderDir || 'asc';  // Default to ascending order if not provided

    const [totalRecordsResult] = await MySqlPool.query('SELECT COUNT(*) AS total FROM job_list');
    const totalRecords = totalRecordsResult[0].total;

    const [filteredRecordsResult] = await MySqlPool.query(
        `SELECT COUNT(*) AS total FROM job_list WHERE title LIKE ? OR skills LIKE ? OR job_location LIKE ? OR job_type LIKE ?`,
        [`%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`, `%${searchValue}%`]
    );
    const filteredRecords = filteredRecordsResult[0].total;

    const [data] = await MySqlPool.query(
        `SELECT * FROM job_list WHERE title LIKE ? OR skills LIKE ? OR job_location LIKE ? OR job_type LIKE ?
         ORDER BY ?? ${orderDir} LIMIT ?, ?`,
        [
            `%${searchValue}%`, 
            `%${searchValue}%`, 
            `%${searchValue}%`, 
            `%${searchValue}%`, 
            orderByColumn, 
            start, 
            length
        ]
    );

    return { totalRecords, filteredRecords, data };
};

module.exports = {
    getAllJobs
};