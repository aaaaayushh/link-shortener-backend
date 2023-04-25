const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const BitlyClient = require("bitly").BitlyClient;
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = 3001;

const upload = multer({ dest: "uploads/" }); // Destination folder for uploaded files
app.use(
  cors({
    origin: "*",
  })
);

// Set up AWS S3 and Bitly clients
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const bitly = new BitlyClient("064492e0828a4f8d94dbcffe6ed97e609067912c", {});

// Set up MongoDB connection
mongoose.connect(
  "mongodb+srv://aayushshah1142:aayush@cluster0.o0zq0dq.mongodb.net/test",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

// Create a schema for the links collection
const linkSchema = new mongoose.Schema({
  fileName: String,
  originalUrl: String,
  shortUrl: String,
  userEmail: String,
});

// Create a model for the links collection
const Link = mongoose.model("Link", linkSchema);

// Set up middleware for parsing request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/links/:email", async (req, res) => {
  try {
    const links = await Link.find({ userEmail: req.params.email });
    console.log(links);
    res.status(200).json(links);
  } catch (err) {
    console.log("error fetching links for user", req.params.email, err);
  }
});

// API endpoint for deleting an object from S3
app.delete("/delete", async (req, res) => {
  const data = req.body;
  console.log("link", data);
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: data.fileName,
  };

  try {
    // Delete the object from S3
    await s3.deleteObject(params).promise();
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete object from S3"); // Return 500 Internal Server Error if failed
  }
  try {
    const query = { _id: data._id };
    await Link.deleteOne(query);
    res.status(204).send(); // Return 204 No Content if successful
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to delete object from mongodb");
  }
});

// API endpoint for uploading file for authorizedu user
app.post("/upload/:email", upload.single("file"), (req, res) => {
  const file = req.file;
  const fileData = fs.readFileSync(file.path);

  // Set up S3 upload parameters
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: file.originalname,
    Body: fileData,
  };

  // Upload file to S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error uploading file to S3");
    } else {
      console.log(`File uploaded to S3 at ${data.Location}`);
      console.log(req.params.email);
      // Generate short URL using Bitly
      bitly
        .shorten(data.Location)
        .then((response) => {
          const shortUrl = response.link;

          // Save link to MongoDB
          const link = new Link({
            fileName: file.originalname,
            originalUrl: data.Location,
            shortUrl: shortUrl,
            userEmail: req.params.email,
          });

          link.save().then((savedDoc) => {
            if (savedDoc !== link) {
              throw new mongoose.Error("error saving document to mongo");
            }
          });
          return res.json({
            message: "File uploaded successfully",
            fileUrl: data.Location,
            shortUrl: shortUrl,
          });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send("Error generating short URL with Bitly");
        });
    }
  });
});

// API endpoint for uploading files for unauthorized user
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  const fileData = fs.readFileSync(file.path);

  // Set up S3 upload parameters
  const params = {
    Bucket: "link-shortener-aayush",
    Key: file.originalname,
    Body: fileData,
  };

  // Upload file to S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error uploading file to S3");
    } else {
      console.log(`File uploaded to S3 at ${data.Location}`);

      // Generate short URL using Bitly
      bitly
        .shorten(data.Location)
        .then((response) => {
          const shortUrl = response.link;

          // Save link to MongoDB
          const link = new Link({
            fileName: data.originalname,
            originalUrl: data.Location,
            shortUrl: shortUrl,
            userEmail: null,
          });

          link.save().then((savedDoc) => {
            if (savedDoc !== link) {
              throw new mongoose.Error("error saving document to db");
            }
          });
          return res.json({
            message: "File uploaded successfully",
            fileUrl: data.Location,
            shortUrl: shortUrl,
          });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send("Error generating short URL with Bitly");
        });
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Link-shortener service listening at http://localhost:${port}`);
});
