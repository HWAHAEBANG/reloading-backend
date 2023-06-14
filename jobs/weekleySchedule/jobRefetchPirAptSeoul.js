const schedule = require("node-schedule");
const axios = require("axios");
const refetchRule = require("./refetchRule.js");

// DB 연결부 ================================================================================
const connectDB = require("../../config/connectDB.js");
const db = connectDB.init();
// =========================================================================================

const jobRefetchPirAptSeoul = schedule.scheduleJob(refetchRule, function () {
  console.log(
    "현재시간 토요일 04시 00분 서울 아파트 PIR 데이터 리패치를 진행합니다."
  );
  try {
    axios
      .get(
        "https://aptgin.com/pre/chart/region?loc=1100000000&target=rchart&type=p&ref=REGION01.MULTI_CHART%2CREGION01.REGION_LIST&locList=1100000000",
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      )
      .then((response) => {
        const truncateQuery = `TRUNCATE pir_apt_seoul;`;
        db.query(truncateQuery, (err, result) => {
          if (err)
            return console.log("서울 아파트 PIR : TRUCATE에 실패 했습니다.");
          console.log(
            "서울 아파트 PIR : TRUCATE성공, 새 데이터 추가를 진행합니다."
          );

          let insertCount = 0;

          for (const item of response.data[0]) {
            if (item.pir_3part === null) continue; // 맨 첫번째와 미래의 값이 null 이라 오류 발생함.
            const originDate = item.yyyymm;
            const year = item.yyyymm.slice(0, 4);
            const month = item.yyyymm.slice(5, 7);
            const day = item.yyyymm.slice(8);
            const value = item.pir_3part;
            //========================================================================================
            const sqlQuery =
              "INSERT INTO pir_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
            db.query(
              sqlQuery,
              [originDate, year, month, day, value],
              (err, result) => {
                if (err)
                  return console.log(
                    "서울 아파트 PIR : 새 데이터 추가에 실패 했습니다."
                  );

                insertCount++;

                // 모든 데이터 추가 완료 후에 실행할 코드
                if (
                  insertCount ===
                  response.data[0].filter((item) => item.pir_3part !== null)
                    .length
                ) {
                  //=====================================================================================
                  const message =
                    "서울 아파트 PIR : 모든 데이터를 새 데이터로 교체 완료";
                  const notificationQuery = `INSERT INTO data_update_logs (message,update_type) VALUES (?,?);`;
                  db.query(
                    notificationQuery,
                    [message, "refetch"],
                    (err, result) => {
                      if (err)
                        return console.log(
                          "서울 아파트 PIR : 업데이트 공지 테이블에 추가하지 못했습니다."
                        );
                      console.log(
                        "서울 아파트 PIR : 새 데이터로 교체 완료하였습니다."
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

module.exports = jobRefetchPirAptSeoul;
