const schedule = require("node-schedule");
const axios = require("axios");
const refetchRule = require("./refetchRule.js");

// DB 연결부 ================================================================================
const connectDB = require("../../config/connectDB.js");
const db = connectDB.init();
// =========================================================================================

const HAI_KEY = process.env.HAI_KEY;

const jobRefetchHaiSeoul = schedule.scheduleJob(refetchRule, function () {
  console.log("현재시간 토요일 04시 00분 서울 HAI 데이터 리패치를 진행합니다.");
  try {
    axios
      .get(
        `https://houstat.hf.go.kr/research/openapi/SttsApiTblData.do?STATBL_ID=T186503126543136&DTACYCLE_CD=QY&ITM_DATANO=10002&START_DTA_DT=200401&END_DTA_DT=203004&TYPE=json&pIndex=1&pSize=1000&key=${HAI_KEY}`
      )
      .then((response) => {
        const truncateQuery = `TRUNCATE hai_seoul;`;
        db.query(truncateQuery, (err, result) => {
          if (err) return console.log("서울 HAI : TRUCATE에 실패 했습니다.");
          console.log("서울 HAI : TRUCATE성공, 새 데이터 추가를 진행합니다.");

          let insertCount = 0;

          for (const item of response.data.SttsApiTblData[1].row) {
            const originDate = item.WRTTIME_IDTFR_ID;
            const year = item.WRTTIME_IDTFR_ID.slice(0, 4);
            const month = item.WRTTIME_IDTFR_ID.slice(5, 6) * 3 - 2;
            const day = 1;
            const value = item.DTA_VAL;
            //========================================================================================
            const sqlQuery =
              "INSERT INTO hai_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
            db.query(
              sqlQuery,
              [originDate, year, month, day, value],
              (err, result) => {
                if (err)
                  return console.log(
                    "서울 HAI : 새 데이터 추가에 실패 했습니다."
                  );

                insertCount++;

                // 모든 데이터 추가 완료 후에 실행할 코드
                if (
                  insertCount === response.data.SttsApiTblData[1].row.length
                ) {
                  //=====================================================================================
                  const message =
                    "서울 HAI : 모든 데이터를 새 데이터로 교체 완료";
                  const notificationQuery = `INSERT INTO data_update_logs (message,update_type) VALUES (?,?);`;
                  db.query(
                    notificationQuery,
                    [message, "refetch"],
                    (err, result) => {
                      if (err)
                        return console.log(
                          "서울 HAI : 업데이트 공지 테이블에 추가하지 못했습니다."
                        );
                      console.log(
                        "서울 HAI : 새 데이터로 교체 완료하였습니다."
                      );
                    }
                  );
                  //=====================================================================================
                }
              }
            );
            //========================================================================================
          }
        });
      })
      .catch((error) => {
        console.log(error);
        // res.status(500).send(error.message);
      });
  } catch (error) {
    console.log("axios 에러", error);
  }
});

module.exports = jobRefetchHaiSeoul;
