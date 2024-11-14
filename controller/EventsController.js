const eventModel = require('../models/eventModel');

// Get all events with pagination, search, and ordering
async function getEvents(req, res) {
    try {
        let { draw, start, length, search, order } = req.query;

        start = parseInt(start) || 0;
        length = parseInt(length) || 10;
        const searchValue = search?.value || '';
        const orderColumn = order ? parseInt(order[0].column) : 0;
        const orderDir = order ? order[0].dir : 'desc';

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
        console.log("req" ,req);
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
        console.log("image details", image);

        if (!title || !description || !status || !image || !tags) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
                body: req.body,
            });
        }

        let slug = generateSlug(title);
        slug = `${slug}-${Date.now()}`;
        const imagePath = `/public/assets/uploads/events/${image.filename}`;  // Image path to store


        const insertId = await eventModel.createEvent(title, slug, description, status, imagePath, tags);
        if (!insertId) {
            return res.status(400).send({
                success: false,
                message: "Failed to insert event",
            });
        }

        req.flash('info', 'Event Created Successfully!') // send succes message

        return res.redirect("/admin/events")

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
        // console.log("test update callted" , req.body)

        const { title, description,status, tags, image } = req.body;
        console.log("test update callted" , )
        const updated = await eventModel.updateEventById(id, title, description,status, tags, image);

        if (!updated) {
            return res.status(400).send({
                success: false,
                message: "Event not found or no changes made",
            });
        }
        req.flash('info', 'Event Updated Successfully!')
        return res.redirect("/admin/events")
        // res.status(200).send({
        //     success: true,
        //     message: "Event updated successfully",
        // });
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
