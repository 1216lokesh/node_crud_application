const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');

// image upload
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({ storage: storage }).single('image');

// Insert a user into database route
router.post('/add', upload, async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: req.file ? req.file.filename : null, // safe check
    });

    await user.save();

    req.session.message = {
      type: 'success',
      message: 'User added successfully',
    };
    res.redirect('/');
  } catch (err) {
    res.json({ message: err.message, type: 'danger' });
  }
});

// Get all users route (Home page)
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.render("index", {
      title: "Home Page",
      users: users,
    });
  } catch (err) {
    res.json({ message: err.message });
  }
});

// Add user form
router.get('/add', (req, res) => {
  res.render("add_users", { title: "Add Users" });
});

// Edit a user route
router.get('/edit/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    res.render("edit_users", {
      title: "Edit User",
      user: user
    });
  } catch (err) {
    res.json({ message: err.message });
  }
});

// Update user route
router.post('/update/:id', upload, async (req, res) => {
  let id = req.params.id;
  let new_image = req.body.old_image;

  if (req.file) {
    new_image = req.file.filename;
    const oldPath = "./uploads/" + req.body.old_image;

    // ✅ Safe check before deleting old file
    if (req.body.old_image && fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (err) {
        console.log("Error deleting old image:", err);
      }
    }
  }

  try {
    await User.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    });

    req.session.message = {
      type: 'success',
      message: 'User updated successfully!',
    };
    res.redirect('/');
  } catch (err) {
    res.json({ message: err.message, type: 'danger' });
  }
});

// Delete user route
router.get('/delete/:id', async (req, res) => {
  try {
    let id = req.params.id;
    const result = await User.findByIdAndDelete(id);

    if (result && result.image && result.image.trim() !== '') {
      const filePath = './uploads/' + result.image;

      // ✅ Safe check before deleting
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.log("Error deleting file:", err);
        }
      }
    }

    req.session.message = {
      type: 'info',
      message: 'User deleted successfully!',
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message });
  }
});

module.exports = router;
