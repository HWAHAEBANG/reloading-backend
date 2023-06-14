const express = require("express");
const router = express.Router();

// DB 연결부 ===================================
const connectDB = require("../config/connectDB.js");
const db = connectDB.init();
connectDB.open(db);
//=============================================

// router.get("/", (req, res) => {
//   res.sendFile(__dirname, "/build/index.html");
//   // 해당하는 파일 경로를 정어운다,  __dirname는 루트경로를 의미/
// });

// id 데이터 무관하게 모든 차트 가져오는 코드 (CSS 테스트 용)
// router.get("/", (req, res) => {
//   const sqlQuery = `SELECT * FROM charts;`;
//   db.query(sqlQuery, (err, result) => {
//     if (err) throw err;
//     console.log(result);
//     res.send(result);
//   });
// });

//============================================
router.get("/", (req, res) => {
  const { userId } = req.query; // 클라이언트로부터 현재 로그인 중인 회원의 ID 받아옴
  const sqlQuery = `
    SELECT charts.*,
    CASE WHEN favorites.chart_id IS NOT NULL THEN 1 ELSE 0 END AS isFavorite
    FROM charts
    LEFT JOIN favorites ON charts.id = favorites.chart_id AND favorites.user_id = ?
  `;
  db.query(sqlQuery, [userId], (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send(result);
  });
});
//==========================================
router.get("/chartDetail", (req, res) => {
  const { urlPathName } = req.query; // 클라이언트로부터 현재 로그인 중인 회원의 ID 받아옴
  console.log("잠만", urlPathName);
  const sqlQuery = `
    SELECT * FROM charts WHERE id = ?
  `;
  db.query(sqlQuery, [urlPathName], (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send(result);
  });
});

//=========================================
router.put("/viewCount", (req, res) => {
  const { chartId } = req.body.data;
  const sqlQuery = `UPDATE charts SET view_count = view_count + 1 WHERE id = ?;`;
  db.query(sqlQuery, [chartId], (err, result) => {
    if (err) res.status(500).json(err);
    res.send(result);
    console.log(result);
  });
});

module.exports = router;
