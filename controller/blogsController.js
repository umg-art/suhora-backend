const MySqlPool = require("../connection");


async function getBlogsController(req, res) {
    try {
        let { draw, start, length, search, order } = req.query;

        // Sanitize and validate start and length
        start = parseInt(start) || 0;  // Default to 0 if invalid or missing
        length = parseInt(length) || 10;  // Default to 10 if invalid or missing

        const searchValue = search?.value || '';  // Extract search value from the query
        const orderColumn = order ? parseInt(order[0].column) : 0;  // Column index for ordering
        const orderDir = order ? order[0].dir : 'desc';  // Order direction

        // Map column indexes to database column names
        const columns = ["id", "title", "slug", "description", "created_at", "updated_at", "status", "image", "tags"];
        const orderByColumn = columns[orderColumn] || 'id';

        // Get total number of records (without filtering)
        const [totalRecordsResult] = await MySqlPool.query('SELECT COUNT(*) AS total FROM blogs');
        const totalRecords = totalRecordsResult[0].total;

        // Get filtered records count and data
        const [filteredRecordsResult] = await MySqlPool.query(
            `SELECT COUNT(*) AS total FROM blogs WHERE title LIKE ? OR description LIKE ?`,
            [`%${searchValue}%`, `%${searchValue}%`]
        );
        const filteredRecords = filteredRecordsResult[0].total;

        // Fetch paginated data with search, order, and limit
        const [data] = await MySqlPool.query(
            `SELECT * FROM blogs WHERE title LIKE ? OR slug LIKE ? 
             ORDER BY ${orderByColumn} ${orderDir}
             LIMIT ?, ?`,
            [`%${searchValue}%`, `%${searchValue}%`, start, length]
        );

        // Respond with data in DataTables format
        res.status(200).json({
            draw: parseInt(draw),  // draw count to synchronize with DataTables request
            recordsTotal: totalRecords,  // total number of records
            recordsFiltered: filteredRecords,  // total number of records after filtering
            data: data  // array of blog records
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error get all blogs",
            error
        });
    }
}


async function getBlogByIdController(req, res,) {

    try {
        const id = req?.params?.id
        // console.log("id for get blog", id);

        const data = await MySqlPool.query(`SELECT * FROM blogs WHERE ID=${id}`)

        // console.log("data fetch using id", data);
        if (!data) {
            res.status(400).send({
                success: false,
                message: "data not get by id",
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
            message: "Error to get data using id",
            error
        });
    }
}

async function createBlogController(req, res) {
    try {
        const { title, description, status, tags } = req.body;
        const image = req.file;        

        // Check if all required fields are provided
        if (!title || !description || !status || !image || !tags) {
            return res.status(400).send({
                success: false,
                message: "All fields are required",
                body: req.body,
            });
        }

        // Generate a slug from the title
        let slug = generateSlug(title)
        slug = `${slug}-${Date.now()}`;

        const imagePath = `/assets/uploads/blogs/${image.filename}`;  // Image path to store

        // Determine the 'published_at' field value based on status
        let publish_at = null;
        if (status === 'published') {
            publish_at = new Date().toISOString().slice(0, 19).replace('T', ' '); // Get current timestamp in 'YYYY-MM-DD HH:mm:ss' format
        }

        // Insert the blog data into the database
        const dataInsert = await MySqlPool.query(
            `INSERT INTO \`blogs\` (title, slug, description, status, image, tags, publish_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, slug, description, status, imagePath, tags, publish_at]
        );

        if (!dataInsert) {
            return res.status(400).send({
                success: false,
                message: "Failed to insert blog",
            });
        }
        req.flash('info', 'Blog Created Successfully!');
        return res.status(200).json({ success: true, message: 'Blog Created Successfully!' });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error creating blog",
            error,
        });
    }
}


function generateSlug(title) {
    return title
        .toLowerCase()               // Convert title to lowercase
        .replace(/[^a-z0-9\s-]/g, '') // Remove all non-alphanumeric characters except space and hyphen
        .trim()                       // Remove spaces at the beginning and end
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-');         // Remove multiple consecutive hyphens
}

async function updateBlogIdConrtoller(req, res) {
    try {
        const id = req.params.id;

        const { title, description, status, tags } = req.body;
        const image = req.file;

        // Handle image upload if a new image is provided
        const imagePath = image ? `/assets/uploads/blogs/${image.filename}` : null;

        // Get the current status from the database before updating
        const currentBlog = await MySqlPool.query('SELECT status FROM blogs WHERE ID = ?', [id]);
        
        // Check if the current blog exists
        if (currentBlog.length === 0) {
            return res.status(404).send({
                success: false,
                message: "Blog not found",
            });
        }

        const currentStatus = currentBlog[0].status;

        // Determine if we need to update 'published_at' (only if status changes from 'draft' to 'published')
        let published_at;
        if (status === 'published' && currentStatus !== 'published') {
            published_at = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current timestamp in 'YYYY-MM-DD HH:mm:ss' format
        }

        // Construct the SQL query dynamically based on whether imagePath is set
        let query = `UPDATE blogs SET title = ?, description = ?, status = ?, tags = ?`;
        const queryParams = [title, description, status, tags];

        // Include the 'published_at' field if necessary
        if (published_at) {
            query += `, publish_at = ?`;
            queryParams.push(published_at);
        }

        // Include the image field if a new image is provided
        if (imagePath) {
            query += `, image = ?`;
            queryParams.push(imagePath);
        }

        // Add the WHERE condition
        query += ` WHERE ID = ?`;
        queryParams.push(id);

        // Execute the update query
        const dataInsert = await MySqlPool.query(query, queryParams);

        if (!dataInsert) {
            return res.status(400).send({
                success: false,
                message: "Failed to update blog",
            });
        }

        req.flash('info', 'Blog Updated Successfully!');
        return res.status(200).json({ success: true, message: 'Blog Update Successfully!' });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: "Error in update api",
            error
        });
    }
}

async function deleteBlogsController(req,res) {
  try {
   const id = req.params.id;
//    console.log("delete id");
   if (!id) {
    return res.status(400).json({ message: 'ID is required' });
  }
  const result = await MySqlPool.query(`DELETE FROM blogs WHERE id = ?`, [id]);

  if(result.affectedRows === 0){
  return res.status(400).json({ message: 'Blog not found' });
  }

  res.status(200).json({
    message : "Blog delete succesfully"
  })
} 
  catch (error) {
    console.log("Error in delete blogs", error);
    
  }
}

module.exports = { getBlogsController, createBlogController, getBlogByIdController, updateBlogIdConrtoller, deleteBlogsController }