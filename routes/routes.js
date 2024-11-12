const express = require("express");
const {createBlogController, getBlogsController, getBlogByIdController, updateBlogIdConrtoller, deleteBlogsController} = require("../controller/blogsController");
const { default: axios } = require("axios");
const { getFormDataEmail, getUserResponse } = require("../controller/formdata");
const router = express.Router();


router.get("/", async (req,res)=>{
    res.render("index")
})

router.get("/admin/login", async (req,res)=>{
    res.render("login")
})

router.get("/admin/blogs", async (req,res)=>{
    res.render("blogs")
})

router.get("/admin/blogs/:id", async (req,res)=>{
    try {
        const id = req.params.id;

        const response = await axios.get(`http://localhost:8001/api/blogs/${id}`);
        // console.log(response);
        if (response.data.success) {
            // Render the 'blogs' view and pass the blog data
            return res.render("editBlogs", { blog: response.data.data[0] });
        } else {
            return res.render("blogs", { errorMessage: "Blog not found" });
        }
    } catch (error) {
        console.log("Something went wrong", error);
        return res.status(500).json({ success: false, message: "An error occurred", error: error.message });
    } 

    // res.render("blogs")
})

router.get("/admin/blog/create", async (req,res)=> {
    res.render("createBlogs");
} )

router.get("/admin/user-response", async (req,res)=> {
    try {
        const response = await axios.get("http://localhost:8001/api/user-response");
        if (response.data.success) {
            // Render the 'blogs' view and pass the blog data
            return res.render("user-demo", { blog: response.data.data[0] });
        } else {
            return res.render("user-demo", { errorMessage: "No user found" });
        }
    }
    catch (error) {
        console.log("Something went wrong", error);
        return res.status(500).json({ success: false, message: "An error occurred", error: error.message });
    }
})

// API 
router.post("/api/login", async (req,res)=>{
    const { email, password } = req.body;

    if(email === "admin@gmail.com" && password === "123") {
        return res.redirect("/")
    }
    else {
        return res.render("login", {errorMessage : "Invalid credentials, please try again."});
    }
})

// Get all Blogs List API
router.get('/api/blogs', getBlogsController);

// get one blog item using id : 
router.get('/api/blogs/:id', getBlogByIdController);

// update blogs value by id 
router.put('/api/blogs/update/:id', updateBlogIdConrtoller)

// delete blogs using id
router.delete('/api/blogs/delete/:id', deleteBlogsController)

// Create Blog
router.post('/api/blogs/create', createBlogController);

// ===========================================
// formdata recive routes and send mails
router.post('/api/book-demo', getFormDataEmail)

// ==================================================
router.get("/api/user-response", getUserResponse)


module.exports = router;