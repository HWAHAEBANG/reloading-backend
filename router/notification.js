const express = require("express");
const router = express.Router();
// DB 연결부 ==================================================================================
const connectDB = require("../config/connectDB.js");
const db = connectDB.init();
// ===========================================================================================
// ==================================================================
// 공지사항 데이터를 가져옴 ===========================================
router.get("/notification", (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM notification;`;
    db.query(sqlQuery, (err, result) => {
      if (err) return console.log(err);
      const data = result;

      res.status(200).send({ data: data });
    });
  } catch (error) {
    console.log(error);
  }
});
// ==================================================================
// 데이터 업데이트 이력을 가져옴 ======================================
router.get("/dataUpdateLog", (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM data_update_logs;`;
    db.query(sqlQuery, (err, result) => {
      if (err) return console.log(err);
      const data = result;

      res.status(200).send({ data: data });
    });
  } catch (error) {
    console.log(error);
  }
});
// ==================================================================
// 릴리즈 노트 데이터를 가져옴==========================================
router.get("/releaseNote", (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM release_notes;`;
    db.query(sqlQuery, (err, result) => {
      if (err) return console.log(err);
      const data = result;

      res.status(200).send({ data: data });
    });
  } catch (error) {
    console.log(error);
  }
});
// ==================================================================
module.exports = router;
