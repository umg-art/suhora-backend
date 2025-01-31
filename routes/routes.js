const express = require("express");
const {
  createBlogController,
  getBlogsController,
  getBlogByIdController,
  updateBlogIdConrtoller,
} = require("../controller/blogsController");
const { default: axios } = require("axios");
const { getFormDataEmail, getUserResponse, viewResponse } = require("../controller/formdata");
const eventController = require("../controller/EventsController");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const {
  getAllGalleryImages,
  createGalleryInstance,
  deleteGalleryImageById,
} = require("../controller/galleryController");
const checkHeader = require("../middleware/checkApiAcces");
const {
  createJob,
  deleteJob,
  getJobDetailById,
  getAllJobsOpening,
  updateJob,
} = require("../controller/jobApplication");
const {
  getJobApplication,
  getJobApplicationList,
  viewCandidate,
} = require("../controller/jobCandidate");

const uploadDirBlog = path.join(
  __dirname,
  "..",
  "public",
  "assets",
  "uploads",
  "blogs"
);
const uploadDirEvent = path.join(
  __dirname,
  "..",
  "public",
  "assets",
  "uploads",
  "events"
);
const uploadGallery = path.join(
  __dirname,
  "..",
  "public",
  "assets",
  "uploads",
  "gallery"
);
const uploadResumeDir = path.join(__dirname, "..", "public", "assets", "uploads", "resume");


const baseurl = "http://127.0.0.1:7080";

// for upload blog image disk
if (!fs.existsSync(uploadDirBlog)) {
  fs.mkdirSync(uploadDirBlog, { recursive: true });
  console.log("Uploads directory created:", uploadDirBlog);
}
if (!fs.existsSync(uploadDirEvent)) {
  fs.mkdirSync(uploadDirEvent, { recursive: true });
  // console.log('Event uploads directory created:', uploadDirEvent);
}
if (!fs.existsSync(uploadGallery)) {
  fs.mkdirSync(uploadGallery, { recursive: true });
}

if (!fs.existsSync(uploadResumeDir)) {
  fs.mkdirSync(uploadResumeDir, { recursive: true });
}
const fileFilterForResume = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || 
      file.mimetype === 'application/msword' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return cb(null, true);  // Accept the file
  }
  cb(new Error('Only PDF or Word documents are allowed'), false);  // Reject non-PDF and non-Word files
};

const storageforEvent = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirEvent);
  },
  filename: (req, file, cb) => {
    // Ensure the file is being correctly named with the extension
    console.log("File being uploaded:", file.originalname); // Check file's original name
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure it's saving with a unique name
  },
});

const storageForResume = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadResumeDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get the file extension (pdf, docx, etc.)
    cb(null, Date.now() + ext); // Create a unique filename based on timestamp
  },
});

const storageforBlog = multer.diskStorage({
  destination: (req, file, cb) => {
    //   console.log("Upload directory:", uploadDirBlog);
    cb(null, uploadDirBlog); // Use the absolute path to the uploads directory
  },
  filename: (req, file, cb) => {
    // Create a unique filename based on timestamp
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const storageGallery = multer.diskStorage({
  destination: (req, file, cb) => {
    // console.log("Upload directory:", uploadGallery);
    cb(null, uploadGallery); // Use the absolute path to the uploads directory
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get the file extension
    cb(null, Date.now() + ext); // Use the current timestamp to ensure unique filenames
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false); // Reject non-image files
  }
  cb(null, true); // Accept the file
};
const uploadResume = multer({
    storage: storageForResume,
    fileFilter: fileFilterForResume,
    limits: { fileSize: 10 * 1024 * 1024 },
}).single('resume');

const upload = multer({ storage: storageforBlog });
const uploadEvents = multer({ storage: storageforEvent });

const uploadImages = multer({
  storage: storageGallery,
  fileFilter,
  limits: { files: 10 },
}).array("images[]", 10);

// Check if the user is logged in (session validation)
const isAuthenticated = (req, res, next) => {
  if (req.session.uid) {
    return next(); // Continue to the requested route
  } else {
    return res.redirect("/admin/login");
  }
};

router.get("/", (req, res) => {
  return res.redirect("/admin/events");
});
// ------------------------------------------ Job Application -----------------------

router.get("/admin/job-application", isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`${baseurl}/api/job-application`, {
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_KEY}`,
      },
    });

    if (response.data.success) {
      return res.render("jobapplication/index", {
        blog: response.data.data[0],
      });
    } else {
      return res.render("jobapplication/index", {
        errorMessage: "No user found",
      });
    }
  } catch (error) {
    console.log("Something went wrong", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred",
        error: error.message,
      });
  }
});

router.get("/admin/job-application/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const response = await axios.get(`${baseurl}/api/job-application/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_KEY}`,
      },
    });
    console.log("responce", response);

    if (response.data.success) {
      return res.render("jobapplication/viewCandidate", {
        candidate: response.data.data,
      });
    } else {
      return res.render("jobapplication/viewCandidate", {
        errorMessage: "Candidate not found",
      });
    }
  } catch (error) {
    console.log("Something went wrong", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred",
        error: error.message,
      });
  }
});
// ---------------------------------------------- gallery  -----------------------------------------
router.get("/admin/gallery", isAuthenticated, async (req, res) => {
  try {
    const successMessage = req.flash("info");
    const response = await axios.get(`${baseurl}/api/gallery`, {
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_KEY}`,
      },
    });

    if (response.data.success) {
      return res.render("gallery/index", {
        blog: response.data.data[0], // Pass the fetched gallery data (assuming data[0] contains gallery info)
        info: successMessage.length > 0 ? successMessage[0] : null, // Pass the flash message if it exists
      });
    } else {
      return res.render("gallery/index", { errorMessage: "No image found" });
    }
  } catch (error) {
    console.error("Something went wrong", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred",
        error: error.message,
        req: req.url,
      });
  }
});

router.get("/admin/gallery/create", isAuthenticated, (req, res) => {
  res.render("gallery/create");
});

// ---------------------------------------------- Blog Routes -----------------------------------------
router.get("/admin/login", async (req, res) => {
  res.render("login");
});

// Ensure user is logged in for blogs-related routes
router.get("/admin/blogs", isAuthenticated, async (req, res) => {
  const flashInfo = req.flash("info");
  // console.log("Flash message:", flashInfo);
  return res.render("blogs/index", {
    sessionTime: req.session.uid,
    info: flashInfo.length > 0 ? flashInfo[0] : null,
  });
});

router.get("/admin/blogs/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const response = await axios.get(`${baseurl}/api/blogs/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_KEY}`,
      },
    });
    if (response.data.success) {
      return res.render("blogs/editBlogs", { blog: response.data.data[0] });
    } else {
      return res.render("blogs/index", { errorMessage: "Blog not found" });
    }
  } catch (error) {
    console.log("Something went wrong", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred",
        error: error.message,
      });
  }
});

router.get("/admin/blog/create", isAuthenticated, async (req, res) => {
  res.render("blogs/createBlogs");
});

// ------------------------------------ Event Routes ---------------------------------
router.get("/admin/events", isAuthenticated, async (req, res) => {
  const flashInfo = req.flash("info");
  return res.render("events/index", {
    sessionTime: req.session.uid,
    info: flashInfo.length > 0 ? flashInfo[0] : null,
  });
});

router.get("/admin/events/create", isAuthenticated, async (req, res) => {
  res.render("events/create");
});

router.get("/admin/events/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Request ID:", id); // Debugging the id parameter
    const response = await axios.get(`${baseurl}/api/event/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_KEY}`,
      },
    });

    if (response.data.success) {
      return res.render("events/edit", { blog: response.data.data });
    } else {
      return res.render("admin/events", { errorMessage: "Event not found" });
    }
  } catch (error) {
    console.error("Something went wrong", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred",
        error: error.message,
      });
  }
});

// ---------------------------------------- User Response -------------------------------------
router.get("/admin/user-response", isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`${baseurl}/api/user-response`, {
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_KEY}`,
      },
    });
    if (response.data.success) {
      return res.render("userDemo/user-demo", { blog: response.data.data[0] });
    } else {
      return res.render("userDemo/user-demo", {
        errorMessage: "No user found",
      });
    }
  } catch (error) {
    console.log("Something went wrong", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred",
        error: error.message,
      });
  }
});

router.get("/admin/user-response/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const response = await axios.get(`${baseurl}/api/user-response/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_KEY}`,
      },
    });
    if (response.data.success) {
      return res.render("userDemo/viewRes", { res: response.data.data[0] });
    } else {
      return res.render("userDemo/viewRes", {
        errorMessage: "No response found",
      });
    }
  } catch (error) {
    console.log("Something went wrong", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred",
        error: error.message,
      });
  }
});


// ---------------------------------------- Jobs --------------------------------------
router.get("/admin/jobs", isAuthenticated, async (req, res) => {
  try {
    const successMessage = req.flash("info");
    const response = await axios.get(`${baseurl}/api/get-all-jobs`, {
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_KEY}`,
      },
    });

    if (response.data.success) {
      return res.render("joblist/index", {
        blog: response.data.data[0],
        info: successMessage.length > 0 ? successMessage[0] : null,
      });
    } else {
      return res.render("joblist/index", { errorMessage: "No image found" });
    }
  } catch (error) {
    console.error("Something went wrong", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred",
        error: error.message,
        req: req.url,
      });
  }
});
router.get("/admin/jobs/create", isAuthenticated, async (req, res) => {
  res.render("joblist/create");
});

router.get("/admin/jobs/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const response = await axios.get(`${baseurl}/api/jobs/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.API_ACCESS_KEY}`,
      },
    });
    console.log("responce", response);

    if (response.data.success) {
      return res.render("joblist/edit", { job: response.data.data });
    } else {
      return res.render("joblist/index", { errorMessage: "job not found" });
    }
  } catch (error) {
    console.error("Something went wrong", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred",
        error: error.message,
      });
  }
});

// ---------------------------------------- Login API ----------------------------------------
router.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_LOGIN_EMAIL &&
    password === process.env.ADMIN_LOGIN_PASSWORD
  ) {
    req.session.uid = Date.now();
    return res.redirect("/admin/events");
  } else {
    return res.render("login", {
      errorMessage: "Invalid credentials, please try again.",
    });
  }
});

// ---------------------------------------- Logout API ----------------------------------------
router.get("/api/logout", (req, res) => {
  // Destroy the session and redirect to the login page
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({
        success: false,
        message: "Error while logging out, please try again.",
      });
    }
    // Redirect to the login page after destroying the session
    return res.redirect("/admin/login");
  });
});

// ------------------------------------------------ Blog API Routes -----------------------------------

router.get("/api/blogs", checkHeader, getBlogsController); // Get all blogs list
router.get("/api/blogs/:id", checkHeader, getBlogByIdController); // Get blog by ID
router.put(
  "/api/blogs/update/:id",
  checkHeader,
  upload.single("image"),
  updateBlogIdConrtoller
); // Update blog by ID
router.post(
  "/api/blogs/create",
  checkHeader,
  upload.single("image"),
  createBlogController
); // Create blog

// ------------------------------------------- Events API -------------------------------------------
router.get("/api/events", checkHeader, eventController.getEvents);
router.get("/api/event/:id", checkHeader, eventController.getEventById);
router.post(
  "/api/events/create",
  checkHeader,
  uploadEvents.single("image"),
  eventController.createEvent
); // Create a new event
router.put(
  "/api/events/update/:id",
  checkHeader,
  uploadEvents.single("image"),
  eventController.updateEvent
); // Update event by ID
// router.delete('/api/events/:id', eventController.deleteEvent);

// Form data routes (for user demo)
router.post("/api/book-demo", checkHeader, getFormDataEmail);
router.get("/api/user-response", checkHeader, getUserResponse);
router.get("/api/user-response/:id", checkHeader, viewResponse);


// ------------------- Jobs Application --------------------------
router.post("/api/jobs/create", checkHeader, createJob);
router.delete("/api/jobs/delete/:id", checkHeader, deleteJob);
router.get("/api/get-all-jobs", checkHeader, getAllJobsOpening);
router.get("/api/jobs/:id", checkHeader, getJobDetailById);
router.put("/api/jobs/edit/:id", checkHeader, updateJob);

router.post("/api/job-application/apply", checkHeader, uploadResume, getJobApplication);
router.get("/api/job-application", checkHeader, getJobApplicationList);
router.get("/api/job-application/:id", checkHeader, viewCandidate);

//------------------------------------------- Gallery ------------------------------
router.get("/api/gallery", checkHeader, getAllGalleryImages);
router.delete("/api/gallery/delete/:id", checkHeader, deleteGalleryImageById);
router.post(
  "/api/gallery/create",
  checkHeader,
  uploadImages,
  createGalleryInstance
);

// -------------------------------Career ---------------------------------
module.exports = router;
