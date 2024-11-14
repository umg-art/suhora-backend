const MySqlPool = require("../connection");

const getAllEvents = async (searchValue, start, length, orderByColumn, orderDir) => {
    // Fetch total records
    const [totalRecordsResult] = await MySqlPool.query('SELECT COUNT(*) AS total FROM events');
    const totalRecords = totalRecordsResult[0].total;

    // Get filtered records count and data
    const [filteredRecordsResult] = await MySqlPool.query(
        `SELECT COUNT(*) AS total FROM events WHERE title LIKE ? OR description LIKE ?`,
        [`%${searchValue}%`, `%${searchValue}%`]
    );
    const filteredRecords = filteredRecordsResult[0].total;

    // Fetch the paginated and filtered data
    const [data] = await MySqlPool.query(
        `SELECT * FROM events WHERE title LIKE ? OR slug LIKE ? 
         ORDER BY ${orderByColumn} ${orderDir}
         LIMIT ?, ?`,
        [`%${searchValue}%`, `%${searchValue}%`, start, length]
    );

    return { totalRecords, filteredRecords, data };
};

const getEventById = async (id) => {
    const [data] = await MySqlPool.query(`SELECT * FROM events WHERE ID = ?`, [id]);
    return data[0] || null;
};

const createEvent = async (title, slug, description, status, image, tags) => {
    const [result] = await MySqlPool.query(
        `INSERT INTO events (title, slug, description, status, image, tags) VALUES (?, ?, ?, ?, ?, ?)`,
        [title, slug, description, status, image, tags]
    );
    return result.insertId;  // Return the inserted event ID
};

const updateEventById = async (id, title, description,status, tags, image) => {
    const [result] = await MySqlPool.query(
        `UPDATE events SET title = ?, description = ?, status = ?, tags = ?, image = ? WHERE ID = ?`,
        [title, description,status, tags, image, id]
    );
    return result.affectedRows > 0;
};

const deleteEventById = async (id) => {
    const [result] = await MySqlPool.query(`DELETE FROM events WHERE id = ?`, [id]);
    return result.affectedRows > 0;
};

module.exports = {
    getAllEvents,
    getEventById,
    createEvent,
    updateEventById,
    deleteEventById,
};
