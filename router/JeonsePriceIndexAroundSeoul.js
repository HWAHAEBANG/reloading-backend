const express = require("express");
const router = express.Router();
// DB 연결부 ==================================================================================
const connectDB = require("../config/connectDB.js");
const db = connectDB.init();
// ===========================================================================================
// ==================================================================
// 수도전 아파트 전세 지수 데이터를 가져옴 =============================
router.get("/", (req, res) => {
  try {
    const sqlQuery = `SELECT year, month, day, value FROM jeonse_price_index_apt_around_seoul;`;
    db.query(sqlQuery, (err, result) => {
      if (err) return console.log(err);
      const data = result.map((item) => {
        return [
          Date.UTC(item.year, item.month - 1, item.day),
          parseFloat(item.value.toFixed(1)),
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
