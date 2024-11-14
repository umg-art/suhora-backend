const express = require("express");
const { createBlogController, getBlogsController, getBlogByIdController, updateBlogIdConrtoller } = require("../controller/blogsController");
const { default: axios } = require("axios");
const { getFormDataEmail, getUserResponse } = require("../controller/formdata");
const eventController = require('../controller/EventsController');
const router = express.Router();
const path = require('path');
const multer  = require('multer')
const fs = require('fs')

const uploadDirBlog = path.join(__dirname, '..', 'public', 'assets', 'uploads', 'blogs');
const uploadDirEvent = path.join(__dirname, '..', 'public', 'assets', 'uploads', 'events');

// for upload blog image disk 
if (!fs.existsSync(uploadDirBlog)) {
    fs.mkdirSync(uploadDirBlog, { recursive: true });
    console.log('Uploads directory created:', uploadDirBlog);
  }
  if (!fs.existsSync(uploadDirEvent)) {
    fs.mkdirSync(uploadDirEvent, { recursive: true });
    // console.log('Event uploads directory created:', uploadDirEvent);
}

const storageforEvent = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("Upload directory:", uploadDirEvent); // Ensure the directory path is correct
        cb(null, uploadDirEvent);  // Use the absolute path to the uploads directory
    },
    filename: (req, file, cb) => {
        // Ensure the file is being correctly named with the extension
        console.log("File being uploaded:", file.originalname); // Check file's original name
        cb(null, Date.now() + path.extname(file.originalname));  // Ensure it's saving with a unique name
    }
});

  const storageforBlog = multer.diskStorage({
    destination: (req, file, cb) => {
      // Log the destination path to check if it's correct
      console.log("Upload directory:", uploadDirBlog);
      cb(null, uploadDirBlog); // Use the absolute path to the uploads directory
    },
    filename: (req, file, cb) => {
      // Create a unique filename based on timestamp
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });

const upload = multer({ storage : storageforBlog });
const uploadEvents = multer({ storage : storageforEvent });




// Check if the user is logged in (session validation)
const isAuthenticated = (req, res, next) => {
    if (req.session.uid) {
        return next();  // Continue to the requested route
    } else {
        return res.redirect("/admin/login");
    }
};

router.get("/", (req,res)=>{
  return res.redirect("/admin/events")
})

// ---------------------------------------------- Blog Routes -----------------------------------------
router.get("/admin/login", async (req, res) => {
    res.render("login");
});

// Ensure user is logged in for blogs-related routes
router.get("/admin/blogs", isAuthenticated, async (req, res) => {
    const flashInfo = req.flash('info');
    // console.log("Flash message:", flashInfo); 
    return res.render("blogs/index", { sessionTime: req.session.uid , info: flashInfo.length > 0 ? flashInfo[0] : null });
});

router.get("/admin/blogs/:id", isAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const response = await axios.get(`http://localhost:8001/api/blogs/${id}`);
        if (response.data.success) {
            return res.render("blogs/editBlogs", { blog: response.data.data[0] });
        } else {
            return res.render("blogs/index", { errorMessage: "Blog not found" });
        }
    } 
    catch (error) {
        console.log("Something went wrong", error);
        return res.status(500).json({ success: false, message: "An error occurred", error: error.message });
    }
});

router.get("/admin/blog/create", isAuthenticated, async (req, res) => {
    res.render("blogs/createBlogs");
});

// ------------------------------------ Event Routes ---------------------------------
router.get("/admin/events", isAuthenticated, async (req, res) => {
    const flashInfo = req.flash('info');
    return res.render("events/index", { sessionTime: req.session.uid , info: flashInfo.length > 0 ? flashInfo[0] : null });
});

router.get("/admin/events/create", isAuthenticated, async (req, res) => {
    res.render("events/create");
});

router.get("/admin/events/:id", isAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        console.log("Request ID:", id);  // Debugging the id parameter
        const response = await axios.get(`http://localhost:8001/api/event/${id}`);

        if (response.data.success) {
            return res.render("events/edit", { blog: response.data.data });
        } else {
            return res.render("admin/events", { errorMessage: "Event not found" });
        }
    } catch (error) {
        console.error("Something went wrong", error);
        return res.status(500).json({ success: false, message: "An error occurred", error: error.message });
    }
});

// ---------------------------------------- User Response -------------------------------------
router.get("/admin/user-response", isAuthenticated, async (req, res) => {
    try {
        const response = await axios.get("http://localhost:8001/api/user-response");
        if (response.data.success) {
            return res.render("userDemo/user-demo", { blog: response.data.data[0] });
        } else {
            return res.render("userDemo/user-demo", { errorMessage: "No user found" });
        }
    } catch (error) {
        console.log("Something went wrong", error);
        return res.status(500).json({ success: false, message: "An error occurred", error: error.message });
    }
});

// ---------------------------------------- Login API ----------------------------------------
router.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (email === "admin@gmail.com" && password === "123") {
        // Create session with uid as the current timestamp
        req.session.uid = Date.now();
        // Redirect to the events page after successful login
        return res.redirect("/admin/events");
    } else {
        // If credentials are incorrect, return an error message
        return res.render("login", { errorMessage: "Invalid credentials, please try again." });
    }
});

// ------------------------------------------------ Blog API Routes -----------------------------------
router.get('/api/blogs', getBlogsController);  // Get all blogs list
router.get('/api/blogs/:id', getBlogByIdController);  // Get blog by ID
router.put('/api/blogs/update/:id', upload.single('image'), updateBlogIdConrtoller);  // Update blog by ID
router.post('/api/blogs/create', upload.single('image') , createBlogController);  // Create blog

// ------------------------------------------- Events API -------------------------------------------
router.get('/api/events', eventController.getEvents);  // Get all events with pagination
router.get('/api/event/:id', eventController.getEventById);  // Get event by ID
router.post('/api/events/create',uploadEvents.single('image') , eventController.createEvent);  // Create a new event
router.put('/api/events/update/:id', eventController.updateEvent);  // Update event by ID
// router.delete('/api/events/:id', eventController.deleteEvent);  // Delete event by ID

// Form data routes (for user demo)
router.post('/api/book-demo', getFormDataEmail);
router.get("/api/user-response", getUserResponse);

module.exports = router;