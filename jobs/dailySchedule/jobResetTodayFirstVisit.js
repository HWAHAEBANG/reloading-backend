const schedule = require("node-schedule");
const updateRule = require("./updateRule.js");
// DB 연결부 ================================================================================
const connectDB = require("../../config/connectDB.js");
const db = connectDB.init();
// =========================================================================================

const jobResetTodayFirstVisit = schedule.scheduleJob(updateRule, function () {
  console.log("현재시간 02시 00분 금일 방문 횟수 카운터를 초기화합니다.");
  try {
    // DB의 가장 최신 데이터의 날짜와 값 가져오기
    const checkSqlQuery = "UPDATE users SET today_visit_cnt = 0";
    db.query(checkSqlQuery, (err, result) => {
      if (err) console.log("DB 정보를 불러올 수 없음", err);
    });
    console.log("현재시간 02시 00분 금일 방문 횟수 초기화를 완료하였습니다.");
  } catch (error) {
    console.log("axios 에러", error);
  }
});

module.exports = jobResetTodayFirstVisit;
