const schedule = require("node-schedule");
const axios = require("axios");
const refetchRule = require("./refetchRule.js");

// DB 연결부 ================================================================================
const connectDB = require("../../config/connectDB.js");
const db = connectDB.init();
// =========================================================================================

const KOSIS_KEY = process.env.KOSIS_KEY;

const jobRefetchUnsoldHouseAroundSeoul = schedule.scheduleJob(
  refetchRule,
  function () {
    console.log(
      "현재시간 토요일 04시 00분 수도권 미분양 물량 데이터 리패치를 진행합니다."
    );
    try {
      axios
        .get(
          `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&itmId=13103792722T1+&objL1=13102792722A.0002+&objL2=13102792722B.0001+&objL3=13102792722C.0001+&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&startPrdDe=200701&endPrdDe=202302&orgId=116&tblId=DT_MLTM_2080`
        )
        .then((response) => {
          const truncateQuery = `TRUNCATE unsold_house_around_seoul;`;
          db.query(truncateQuery, (err, result) => {
            if (err)
              return console.log(
                "수도권 미분양 물량 : TRUCATE에 실패 했습니다."
              );
            console.log(
              "수도권 미분양 물량 : TRUCATE성공, 새 데이터 추가를 진행합니다."
            );

            let insertCount = 0;

            for (const item of response.data) {
              const originDate = item.PRD_DE;
              const year = item.PRD_DE.slice(0, 4);
              const month = item.PRD_DE.slice(4, 6);
              const day = 1;
              const value = item.DT;
              //========================================================================================
              const sqlQuery =
                "INSERT INTO unsold_house_around_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
              db.query(
                sqlQuery,
                [originDate, year, month, day, value],
                (err, result) => {
                  if (err)
                    return console.log(
                      "수도권 미분양 물량 : 새 데이터 추가에 실패 했습니다."
                    );

                  insertCount++;

                  // 모든 데이터 추가 완료 후에 실행할 코드
                  if (insertCount === response.data.length) {
                    //=====================================================================================
                    const message =
                      "수도권 미분양 물량 : 모든 데이터를 새 데이터로 교체 완료";
                    const notificationQuery = `INSERT INTO data_update_logs (message,update_type) VALUES (?,?);`;
                    db.query(
                      notificationQuery,
                      [message, "refetch"],
                      (err, result) => {
                        if (err)
                          return console.log(
                            "수도권 미분양 물량 : 업데이트 공지 테이블에 추가하지 못했습니다."
                          );
                        console.log(
                          "수도권 미분양 물량 : 새 데이터로 교체 완료하였습니다."
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
  }
);

module.exports = jobRefetchUnsoldHouseAroundSeoul;
