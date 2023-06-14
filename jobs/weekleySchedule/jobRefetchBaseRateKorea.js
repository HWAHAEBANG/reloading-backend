const schedule = require("node-schedule");
const axios = require("axios");
const refetchRule = require("./refetchRule.js");

// DB 연결부 ================================================================================
const connectDB = require("../../config/connectDB.js");
const db = connectDB.init();
// =========================================================================================

const ECOS_KEY = process.env.ECOS_KEY;

const jobRefetchBaseRateKorea = schedule.scheduleJob(refetchRule, function () {
  console.log(
    "현재시간 토요일 04시 00분 한국 기준금리 데이터 리패치를 진행합니다."
  );
  try {
    axios
      .get(
        `https://ecos.bok.or.kr/api/StatisticSearch/${ECOS_KEY}/json/kr/1/1000/722Y001/M/200312/203012/0101000`
      )
      .then((response) => {
        const truncateQuery = `TRUNCATE base_rate_korea;`;
        db.query(truncateQuery, (err, result) => {
          if (err)
            return console.log("한국 기준금리 : TRUCATE에 실패 했습니다.");
          console.log(
            "한국 기준금리 : TRUCATE성공, 새 데이터 추가를 진행합니다."
          );

          let insertCount = 0;

          for (const item of response.data.StatisticSearch.row) {
            const originDate = item.TIME;
            const year = item.TIME.slice(0, 4);
            const month = item.TIME.slice(4, 6);
            const day = 1;
            const value = item.DATA_VALUE;
            //========================================================================================
            const sqlQuery =
              "INSERT INTO base_rate_korea(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
            db.query(
              sqlQuery,
              [originDate, year, month, day, value],
              (err, result) => {
                if (err)
                  return console.log(
                    "한국 기준금리 : 새 데이터 추가에 실패 했습니다."
                  );

                insertCount++;

                // 모든 데이터 추가 완료 후에 실행할 코드
                if (insertCount === response.data.StatisticSearch.row.length) {
                  //=====================================================================================
                  const message =
                    "한국 기준금리 : 모든 데이터를 새 데이터로 교체 완료";
                  const notificationQuery = `INSERT INTO data_update_logs (message,update_type) VALUES (?,?);`;
                  db.query(
                    notificationQuery,
                    [message, "refetch"],
                    (err, result) => {
                      if (err)
                        return console.log(
                          "한국 기준금리 : 업데이트 공지 테이블에 추가하지 못했습니다."
                        );
                      console.log(
                        "한국 기준금리 : 새 데이터로 교체 완료하였습니다."
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

module.exports = jobRefetchBaseRateKorea;
