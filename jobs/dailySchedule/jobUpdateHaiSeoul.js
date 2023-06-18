const schedule = require("node-schedule");
const axios = require("axios");
const https = require("https");
const updateRule = require("./updateRule.js");

// DB 연결부 ================================================================================
const connectDB = require("../../config/connectDB.js");
// const { route } = require("./allCharts.js");
const db = connectDB.init();
// connectDB.open(db);
// ===========================================================================================

const HAI_KEY = process.env.HAI_KEY;

const jobUpdateHaiSeoul = schedule.scheduleJob(updateRule, function () {
  console.log("현재시간 02시 00분 서울 HAI 데이터 최신화를 진행합니다.");
  try {
    // DB의 가장 최신 데이터의 날짜와 값 가져오기
    const checkSqlQuery =
      "SELECT origin_date,value FROM hai_seoul WHERE no = (SELECT MAX(no) FROM hai_seoul);";
    db.query(checkSqlQuery, async (err, result) => {
      if (err) console.log("DB 정보를 불러올 수 없음", err);

      // 비교하기 편하게 객체 형태로 파싱
      const latestDataDb = {
        date: result[0].origin_date,
        value: result[0].value,
      };

      // api에서 데이터 받아옴
      axios
        .get(
          `https://houstat.hf.go.kr/research/openapi/SttsApiTblData.do?STATBL_ID=T186503126543136&DTACYCLE_CD=QY&ITM_DATANO=10002&START_DTA_DT=200401&END_DTA_DT=203012&TYPE=json&pIndex=1&pSize=1000&key=${HAI_KEY}`
        )
        .then((response) => {
          const filteredData = response.data.SttsApiTblData[1].row.map(
            (item) => ({
              date: item.WRTTIME_IDTFR_ID,
              value: item.DTA_VAL,
            })
          );

          // 그중에서 가장 최신 값 가져오기
          const latestDataApi = filteredData[filteredData.length - 1];

          // 날짜가 일치하면 값까지 같은지 확인한다음 같으면 통과, 다르면 update문 실행.
          // value까지 비교하는 이유는 몇몇 api에서 가장 최신 값의 변경되는 경우가 있기 때문.
          if (latestDataApi.date === latestDataDb.date) {
            if (latestDataApi.value === latestDataDb.value) {
              console.log("서울 HAI : 현재 DB는 최신 상태 입니다. ");
            } else {
              const updateSqlQuery = `UPDATE hai_seoul SET value = ? WHERE origin_date = ?`;
              db.query(
                updateSqlQuery,
                [latestDataApi.value, latestDataApi.date],
                (err, result) => {
                  if (err) return console.log(err);
                  console.log(
                    "서울 HAI : 데이터에 변경사항이 감지되어 DB를 수정하였습니다."
                  );
                  //=====================================================================
                  const message = "서울 HAI : 최근 일자 데이터 변동";
                  const notificationQuery = `INSERT INTO data_update_logs (message,update_type) VALUES (?,?);`;
                  db.query(
                    notificationQuery,
                    [message, "modify"],
                    (err, result) => {
                      if (err)
                        return console.log(
                          "업데이트 공지 테이블에 추가하지 못했습니다."
                        );
                      console.log(
                        "서울 HAI : 데이터에 변경사항이 감지되어 DB를 수정하였습니다."
                      );
                    }
                  );
                  //=====================================================================
                }
              );
            }
          } else {
            // 날짜가 일치하지 않으면 새로운 데이터가 생선된 것이므로 insert문 실행
            const year = latestDataApi.date.slice(0, 4);
            const month = latestDataApi.date.slice(5, 6) * 3 - 2;
            const day = 1;
            const insertSqlQuery =
              "INSERT INTO hai_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
            db.query(
              insertSqlQuery,
              [latestDataApi.date, year, month, day, latestDataApi.value],
              (err, result) => {
                if (err) return console.log(err);
                //========================================================================
                const message = "서울 HAI : 최신 데이터 추가";
                const notificationQuery = `INSERT INTO data_update_logs (message,update_type) VALUES (?,?);`;
                db.query(notificationQuery, [message, "add"], (err, result) => {
                  if (err)
                    return console.log(
                      "업데이트 공지 테이블에 추가하지 못했습니다."
                    );
                  console.log(
                    "서울 HAI : 새로운 데이터가 감지되어 DB에 추가하였습니다."
                  );
                });
                //========================================================================
              }
            );
          }
        });
    });
  } catch (error) {
    console.log("axios 에러", error);
  }
});

module.exports = jobUpdateHaiSeoul;
