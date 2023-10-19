const express = require("express");
const router = express.Router();
const generateUploadURL = require('./s3.js')

router.get('/', async (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  const url = await generateUploadURL()
  res.send({url})
})

module.exports = router;
