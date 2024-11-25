const express = require("express");
const { createBlogController, getBlogsController, getBlogByIdController, updateBlogIdConrtoller } = require("../controller/blogsController");
const { default: axios } = require("axios");
const { getFormDataEmail, getUserResponse } = require("../controller/formdata");
const eventController = require('../controller/EventsController');
const router = express.Router();
const path = require('path');
const multer  = require('multer')
const fs = require('fs');
const {  getAllGalleryImages,
    createGalleryInstance,
    deleteGalleryImageById } = require("../controller/galleryController");

const uploadDirBlog = path.join(__dirname, '..', 'public', 'assets', 'uploads', 'blogs');
const uploadDirEvent = path.join(__dirname, '..', 'public', 'assets', 'uploads', 'events');
const uploadGallery = path.join(__dirname, '..', 'public', 'assets', 'uploads', 'gallery');

// for upload blog image disk 
if (!fs.existsSync(uploadDirBlog)) {
    fs.mkdirSync(uploadDirBlog, { recursive: true });
    console.log('Uploads directory created:', uploadDirBlog);
  }
  if (!fs.existsSync(uploadDirEvent)) {
    fs.mkdirSync(uploadDirEvent, { recursive: true });
    // console.log('Event uploads directory created:', uploadDirEvent);
}
if (!fs.existsSync(uploadGallery)) {
    fs.mkdirSync(uploadGallery, { recursive: true });
    // console.log('Event uploads directory created:', uploadDirEvent);
}

const storageforEvent = multer.diskStorage({
    destination: (req, file, cb) => {
        // console.log("Upload directory:", uploadDirEvent); // Ensure the directory path is correct
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
    //   console.log("Upload directory:", uploadDirBlog);
      cb(null, uploadDirBlog); // Use the absolute path to the uploads directory
    },
    filename: (req, file, cb) => {
      // Create a unique filename based on timestamp
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  const storageGallery = multer.diskStorage({
    destination: (req, file, cb) => {
        // console.log("Upload directory:", uploadGallery);
        cb(null, uploadGallery); // Use the absolute path to the uploads directory
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);  // Get the file extension
        cb(null, Date.now() + ext);  // Use the current timestamp to ensure unique filenames
    }
});

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'), false);  // Reject non-image files
    }
    cb(null, true);  // Accept the file
};

const upload = multer({ storage : storageforBlog });
const uploadEvents = multer({ storage : storageforEvent });

const uploadImages = multer({
    storage: storageGallery,
    fileFilter,
    limits: { files: 10 }  
}).array('images[]', 10);


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
// ---------------------------------------------- gallery  -----------------------------------------
router.get("/admin/gallery", isAuthenticated, async (req, res) => {
    try {
      const successMessage = req.flash('info'); 
      const response = await axios.get("http://localhost:8001/api/gallery");
  
      if (response.data.success) {
        return res.render("gallery/index", {
          blog: response.data.data[0],  // Pass the fetched gallery data (assuming data[0] contains gallery info)
          info: successMessage.length > 0 ? successMessage[0] : null,  // Pass the flash message if it exists
        });
      } else {
        return res.render("gallery/index", { errorMessage: "No image found" });
      }
    } catch (error) {
      console.error("Something went wrong", error);
      return res.status(500).json({ success: false, message: "An error occurred", error: error.message });
    }
  });
  

router.get("/admin/gallery/create", isAuthenticated, (req,res)=>{
    res.render("gallery/create")
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
// ---------------------------------------- Gallery --------------------------------------


// ---------------------------------------- Login API ----------------------------------------
router.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    console.log("Data entered:", email, password);  // Corrected

    if (email === process.env.ADMIN_LOGIN_EMAIL && password === process.env.ADMIN_LOGIN_PASSWORD) {
        req.session.uid = Date.now();
        return res.redirect("/admin/events");
    } else {
        return res.render("login", { errorMessage: "Invalid credentials, please try again." });
    }
});

// ---------------------------------------- Logout API ----------------------------------------
router.get("/api/logout", (req, res) => {
    // Destroy the session and redirect to the login page
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send({
                success: false,
                message: "Error while logging out, please try again."
            });
        }
        // Redirect to the login page after destroying the session
        return res.redirect("/admin/login");
    });
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
router.put('/api/events/update/:id',uploadEvents.single('image'),  eventController.updateEvent);  // Update event by ID
// router.delete('/api/events/:id', eventController.deleteEvent);  // Delete event by ID

// Form data routes (for user demo)
router.post('/api/book-demo', getFormDataEmail);
router.get("/api/user-response", getUserResponse);

//------------------------------------------- Gallery ------------------------------
router.get('/api/gallery', getAllGalleryImages)
router.delete('/api/gallery/delete/:id', deleteGalleryImageById)
router.post('/api/gallery/create', uploadImages, createGalleryInstance)

module.exports = router;