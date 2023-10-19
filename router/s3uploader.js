const express = require("express");
const router = express.Router();
const generateUploadURL = require('./s3.js')

router.get('/', async (req, res) => {
  const url = await generateUploadURL()
  res.send({url})
})

module.exports = router;
