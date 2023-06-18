const express = require("express");
const router = express.Router();
// DB 연결부 ==================================================================================
const connectDB = require("../config/connectDB.js");
const db = connectDB.init();
// ===========================================================================================
// ==================================================================
// 서울 아파트 매매 거래량 데이터 가져오기 ==============================
router.get("/", (req, res) => {
  try {
    const sqlQuery = `SELECT year, month, day, value FROM transaction_volume_sales_apt_seoul;`;
    db.query(sqlQuery, (err, result) => {
      if (err) return console.log(err);
      const data = result.map((item) => {
        return [
          Date.UTC(item.year, item.month - 1, item.day),
          parseInt(item.value),
        ];
      });

      res.status(200).send({ data: data });
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
