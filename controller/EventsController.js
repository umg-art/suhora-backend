const MySqlPool = require('../connection');
const eventModel = require('../models/eventModel');

// Get all events with pagination, search, and ordering
async function getEvents(req, res) {
    try {
        let { draw, start, length, search, order } = req.query;

        start = parseInt(start) || 0;
        length = parseInt(length) || 10;
        const searchValue = search?.value || '';
        const orderColumn = order ? parseInt(order[0].column) : 0;
        const orderDir = order ? order[0].dir : 'asc';

        const columns = ["id", "title", "slug", "description", "created_at", "updated_at", "status", "image", "tags"];
        const orderByColumn = columns[orderColumn] || 'id';

        // Get data and filtered count using model functions
        const { totalRecords, filteredRecords, data } = await eventModel.getAllEvents(
            searchValue, start, length, orderByColumn, orderDir
        );

        // Send response in DataTables format
        res.status(200).json({
            draw: parseInt(draw),
            recordsTotal: totalRecords,
            recordsFiltered: filteredRecords,
            data: data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error fetching events",
            error,
        });
    }
}

// Get event by ID
async function getEventById(req, res) {
    try {
        // console.log("req" ,req);
        const id = req.params.id;
        const data = await eventModel.getEventById(id);

        if (!data) {
            return res.status(404).send({
                success: false,
                message: "Event not found",
            });
        }

        res.status(200).send({
            success: true,
            message: "Event fetched successfully",
            data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error fetching event",
            error,
        });
    }
}

// Create new event
async function createEvent(req, res) {
    try {
        const { title, description, status, tags } = req.body;
        const image = req.file;
        // console.log("image details", image);

        if (!title || !description || !status || !image || !tags) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
                body: req.body,
            });
        }

        let slug = generateSlug(title);
        slug = `${slug}-${Date.now()}`;
        const imagePath = `/assets/uploads/events/${image.filename}`;  // Image path to store

         // Determine the 'published_at' field value based on status
         let publish_at = null;
         if (status === 'published') {
             publish_at = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get current timestamp in 'YYYY-MM-DD HH:mm:ss' format
         }

        const insertId = await eventModel.createEvent(title, slug, description, status, imagePath, tags,publish_at);
        if (!insertId) {
            return res.status(400).send({
                success: false,
                message: "Failed to insert event",
            });
        }

        req.flash('info', 'Event Created Successfully!') // send succes message

        return res.status(200).json({ success: true, message: 'Event Created Successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error creating event",
            error,
        });
    }
}

// Update event by ID
async function updateEvent(req, res) {
    try {
        const id = req.params.id;
        const { title, description, status, tags } = req.body;
        const image = req.file;

        // Determine the new image path or retain existing image
        let imagePath = image ? `/assets/uploads/events/${image.filename}` : null;

        if (!imagePath) {
            const [event] = await MySqlPool.query('SELECT image FROM events WHERE ID = ?', [id]);
            if (event.length > 0) {
                imagePath = event[0].image; // Retain existing image if no new image is uploaded
            } else {
                imagePath = null; // No existing image
            }
        }

        // Get the current status of the event from the database
        const [currentEvent] = await MySqlPool.query('SELECT status FROM events WHERE ID = ?', [id]);

        if (currentEvent.length === 0) {
            return res.status(404).send({
                success: false,
                message: "Event not found",
            });
        }

        const currentStatus = currentEvent[0].status;

        // Determine if we need to update 'published_at' (only if status changes from 'draft' to 'published')
        let publish_at = null;
        if (status === 'published' && currentStatus !== 'published') {
            publish_at = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current timestamp in 'YYYY-MM-DD HH:mm:ss' format
        }

        const updated = await eventModel.updateEventById(id, title, description, status, tags, imagePath, publish_at);

        if (!updated) {
            return res.status(400).send({
                success: false,
                message: "Event not found or no changes made",
            });
        }

        req.flash('info', 'Event Updated Successfully!');
        return res.status(200).json({ success: true, message: 'Event Updated Successfully!' });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error updating event",
            error,
        });
    }
}


// Delete event by ID
async function deleteEvent(req, res) {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }

        const deleted = await eventModel.deleteEventById(id);

        if (!deleted) {
            return res.status(400).json({ message: 'Event not found' });
        }

        res.status(200).json({
            message: "Event deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: "Error deleting event",
            error,
        });
    }
}

// Helper function to generate a slug
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
};
