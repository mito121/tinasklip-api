const express = require("express");
const router = express();
const Image = require("../models/image");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const sharp = require("sharp");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

/* multer middleware */
const upload = multer({
  storage: storage,

  /* Validate image filetype */
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      return cb(null, true);
    } else {
      return cb(null, false, { error: "Invalid filetype" });
    }
  }
});

router.use(
  bodyParser.json({
    limit: "50mb",
    parameterLimit: 100000,
    extended: true,
  })
);

/* Get all images */
router.get("/", async (req, res) => {
  try {
    const images = await Image.find();
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Get single original image */
router.get("/image/:id", getImage, async (req, res) => {
  try {
    const filePath = path.join(__dirname, `../uploads/${res.image.filename}`);
    return res.status(201).sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Get single thumbnail */
router.get("/image/thumbnail/:id", getImage, async (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      `../uploads/thumbnails/${res.image.filename}`
    );
    return res.status(201).sendFile(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Upload new image */
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    /* Get filename */
    const filename = req.file.filename;

    /* Resize image for thumbnail */
    const { filename: image } = req.file;
    await sharp(req.file.path)
      .resize({
        fit: sharp.fit.contain,
        height: 250
      })
      .toFile(path.resolve(req.file.destination, "thumbnails", image));

    /* Create image object */
    const newImage = new Image({
      filename: filename,
    });

    const savedImage = await newImage.save();
    res
      .status(201)
      .json({ message: "Image uploaded successfully.", image: savedImage });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ------------------------------ */
/* ----------------------------- */
/* ** Image upload test view ** */
// router.get("/upload", (req, res) => {
//   res.sendFile(path.join(__dirname, "../test/index.html"));
// });
/* ------------------------ */
/* ---------------------- */

/* Delete image */
router.delete("/:id", getImage, async (req, res) => {
  try {
    const imageId = res.image._id.toString();
    // const removePath = path.join(__dirname, `../uploads/${res.image.filename}`);
    const removePath = [
      `./uploads/${res.image.filename}`,
      `./uploads/thumbnails/${res.image.filename}`,
    ];
    /* Remove images from filesystem */
    for (let i = 0; i < removePath.length; i++) {
      fs.unlinkSync(removePath[i]);
    }

    /* Remove image from database */
    await res.image.remove();
    res.status(200).json({ success: "Image removed.", id: imageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* Middleware */
async function getImage(req, res, next) {
  let image;

  try {
    image = await Image.findById(req.params.id);
    if (image == null)
      return res.status(404).json({ message: "Image not found." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.image = image;
  next();
}

module.exports = router;
