const express = require("express");
const router = express.Router();

// DB 연결부 ===================================
const connectDB = require("../config/connectDB.js");
const db = connectDB.init();
connectDB.open(db);
//=============================================
// ==================================================================
// 나의 차트 데이터를 가져옴 ==========================================
//조인!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
router.get("/", (req, res) => {
  // const { userId } = req.query; // 클라이언트로부터 현재 로그인 중인 회원의 ID 받아옴
  const { id: userId } = req.user; //  미들웨어 거쳐서 검증된 아이디
  const sqlQuery = `
    SELECT charts.*,
    CASE WHEN favorites.chart_id IS NOT NULL THEN 1 ELSE 0 END AS isFavorite
    FROM favorites
    JOIN charts ON favorites.chart_id = charts.id
    WHERE favorites.user_id = ?;
  `;
  db.query(sqlQuery, [userId], (err, result) => {
    if (err) throw err;
    console.log(result);
    res.send(result);
  });
});
// ==================================================================
// 나의 차트에 추가함 ================================================
router.post("/add", (req, res) => {
  const { /* userId, */ chartId } = req.body.data;
  const { id: userId } = req.user;

  // 데이터베이스에 favorites 정보 저장하는 로직 예시
  const sqlQuery = "INSERT INTO favorites (user_id, chart_id) VALUES (?, ?)";
  db.query(sqlQuery, [userId, chartId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add favorite" });
    } else {
      res.status(200).json({ message: "Favorite added successfully" });
    }
  });
});
// ==================================================================
//나의 차트에서 삭제함 ================================================
// delete 메서드로 작성했을 시 서버 콘솔에 다음과 같은 애러 뜸. 추후 다시 시도 요망
// Cannot destructure property 'userId' of 'req.body.data' as it is undefined.
router.post("/delete", (req, res) => {
  const { /* userId, */ chartId } = req.body.data;
  const { id: userId } = req.user;
  const sqlQuery = "DELETE FROM favorites WHERE user_id= ? and chart_id = ?";
  db.query(sqlQuery, [userId, chartId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete favorite" });
    } else {
      res.status(200).json({ message: "Favorite deleted successfully" });
    }
  });
});

module.exports = router;

// GET: 리소스의 조회를 요청합니다. 서버로부터 데이터를 가져오는 용도로 사용됩니다.
// POST: 리소스의 생성을 요청합니다. 서버에 새로운 데이터를 전송하고 생성을 요청할 때 사용됩니다.
// PUT: 리소스의 수정을 요청합니다. 서버의 데이터를 갱신 또는 새로 생성할 때 사용됩니다.
// DELETE: 리소스의 삭제를 요청합니다. 서버의 데이터를 삭제할 때 사용됩니다.
// PATCH: 리소스의 부분적인 수정을 요청합니다. 서버의 데이터를 일부만 수정할 때 사용됩니다.
// HEAD: GET 메서드와 유사하지만, 응답 본문을 제외한 응답 헤더만 가져옵니다.
// OPTIONS: 서버가 지원하는 HTTP 메서드 옵션을 요청합니다.
// TRACE: 요청을 서버에 보내고, 경로를 따라 리턴되는 메시지를 확인합니다. (보안상의 이유로 일반적으로 사용되지 않습니다.)
// CONNECT: 프록시 서버와의 터널링을 요청합니다.
