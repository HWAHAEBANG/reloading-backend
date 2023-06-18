const express = require("express");
const router = express.Router();
// DB 연결부 ==================================================================================
const connectDB = require("../config/connectDB.js");
const db = connectDB.init();
// ===========================================================================================
// ==================================================================
// 서울 아파트 주간 매매가 변동율 =====================================
router.get("/", (req, res) => {
  try {
    const sqlQuery = `SELECT year, month, day, value FROM weekly_price_index_changes_apt_seoul;`;
    db.query(sqlQuery, (err, result) => {
      if (err) return console.log(err);
      const data = result.map((item) => {
        return [
          Date.UTC(item.year, item.month - 1, item.day),
          parseFloat(item.value.toFixed(3)),
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
