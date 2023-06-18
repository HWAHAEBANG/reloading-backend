const express = require("express");
const router = express.Router();
// DB 연결부 ==================================================================================
const connectDB = require("../config/connectDB.js");
const db = connectDB.init();
// ===========================================================================================
// ==================================================================
// 한국 기준금리 데이터 가져옴 ========================================
router.get("/", (req, res) => {
  try {
    const sqlQuery = `SELECT year, month, day, value FROM base_rate_korea;`;
    db.query(sqlQuery, (err, result) => {
      if (err) return console.log(err);
      const data = result.map((item) => {
        return [
          Date.UTC(item.year, item.month - 1, item.day),
          parseFloat(item.value),
        ];
      });

      res.status(200).send({ data: data });
    });
  } catch (error) {
    console.log(error);
  }
});
// ==================================================================
module.exports = router;
