const galleryModel = require('../models/galleryModel');
const path = require('path');
const fs = require('fs');

// Get all gallery images with pagination, search, and ordering
async function getAllGalleryImages(req, res) {
    try {
        let { draw, start, length, search, order } = req.query;

        start = parseInt(start) || 0;
        length = parseInt(length) || 10;
        const searchValue = search?.value || '';
        const orderColumn = order ? parseInt(order[0].column) : 0;
        const orderDir = order ? order[0].dir : 'desc';

        const columns = ["id", "tag", "img_url", "created_at", "updated_at"];
        const orderByColumn = columns[orderColumn] || 'id';

        // Get data and filtered count using model functions
        const { totalRecords, filteredRecords, data } = await galleryModel.getAllGalleryImages(
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
            message: "Error fetching gallery images",
            error,
        });
    }
}

// Create a new gallery image
const createGalleryInstance = async (req, res) => {
    try {
        const { tag, is_deleted = '0' } = req.body;
        const images = req.files; // Assuming Multer handles the 'images[]' array
//    console.log("req.file", req.files);
   
        if (!tag || !images || images.length === 0) {
            return res.status(400).send({
                success: false,
                message: "Tag and images are required",
            });
        }

        // Loop through each image and save it
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const imagePath = `/assets/uploads/gallery/${image.filename}`;

            // Insert each image entry into the database
            const insertId = await galleryModel.createGalleryInstance(tag, imagePath, is_deleted);
            if (!insertId) {
                return res.status(400).send({
                    success: false,
                    message: "Failed to insert gallery image",
                });
            }
        }

        req.flash('info', 'Gallery images uploaded successfully!');
        return res.status(200).json({ success: true, message: 'Images uploaded successfully!' });

    } catch (error) {
        console.error(error);
        return res.status(500).send({
            success: false,
            message: "Error creating gallery images",
            error,
        });
    }
};

// Delete a gallery image by ID
async function deleteGalleryImageById(req, res) {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }

        const image = await galleryModel.getGalleryImageByID(id);
        console.log('Image record:', image);  // Check the content of the image record

        if (!image) {
            return res.status(400).json({ message: 'Gallery image not found' });
        }

        // Extract the filename from img_url
        const filename = image.img_url.replace('/assets/uploads/gallery/', '');  // Remove the base path
        console.log('Extracted filename:', filename);

        if (!filename) {
            return res.status(400).json({ message: 'Invalid image filename' });
        }

        // Construct the path to the image file
        const imagePath = path.join(__dirname, '..', 'public', 'assets', 'uploads', 'gallery', filename);
        console.log('Image path:', imagePath);

        // Check if the file exists before trying to delete it
        fs.stat(imagePath, (err, stats) => {
            if (err || !stats.isFile()) {
                console.error('File not found:', err);
                return res.status(400).json({
                    success: false,
                    message: 'Image file does not exist on the server',
                });
            }

            // If file exists, proceed to delete it
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error deleting image file:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error deleting image file from server',
                    });
                }

                // After deleting the file, delete the image record from the database
                galleryModel.deleteGalleryImageById(id)
                    .then((deleted) => {
                        if (!deleted) {
                            return res.status(400).json({ message: 'Failed to delete gallery image from database' });
                        }

                        req.flash('info', 'Image Deleted Successfully!');
                        return res.redirect("/admin/gallery");
                    })
                    .catch((error) => {
                        console.error('Error deleting from database:', error);
                        res.status(500).json({ success: false, message: 'Error deleting gallery image from database' });
                    });
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: 'Error deleting gallery image',
            error,
        });
    }
}

module.exports = {
    getAllGalleryImages,
    createGalleryInstance,
    deleteGalleryImageById
};
