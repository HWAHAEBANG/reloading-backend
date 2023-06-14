const schedule = require("node-schedule");
const axios = require("axios");
const refetchRule = require("./refetchRule.js");

// DB 연결부 ================================================================================
const connectDB = require("../../config/connectDB.js");
const db = connectDB.init();
// =========================================================================================

const jobRefetchWeeklyPriceIndexChangesAptSeoul = schedule.scheduleJob(
  refetchRule,
  function () {
    console.log(
      "현재시간 토요일 04시 00분 서울 아파트 주간 매매가 증감률 데이터 리패치를 진행합니다."
    );
    try {
      axios
        .get(
          "https://data-api.kbland.kr/bfmstat/weekMnthlyHuseTrnd/prcIndxInxrdcRt?%EA%B8%B0%EA%B0%84=&%EB%A7%A4%EB%A7%A4%EC%A0%84%EC%84%B8%EC%BD%94%EB%93%9C=01&%EB%A7%A4%EB%AC%BC%EC%A2%85%EB%B3%84%EA%B5%AC%EB%B6%84=01&%EC%9B%94%EA%B0%84%EC%A3%BC%EA%B0%84%EA%B5%AC%EB%B6%84%EC%BD%94%EB%93%9C=02&%EC%A7%80%EC%97%AD%EC%BD%94%EB%93%9C=&type=false&excelApi=true"
        )
        .then((response) => {
          const truncateQuery = `TRUNCATE weekly_price_index_changes_apt_seoul;`;
          db.query(truncateQuery, (err, result) => {
            if (err)
              return console.log(
                "서울 아파트 주간 매매가 증감률 : TRUCATE에 실패 했습니다."
              );
            console.log(
              "서울 아파트 주간 매매가 증감률 : TRUCATE성공, 새 데이터 추가를 진행합니다."
            );

            let insertCount = 0;

            const DATA_VALUE_LIST =
              response.data.dataBody.data.데이터리스트.filter(
                (item) =>
                  item.지역코드 === "1100000000" && item.지역명 === "서울"
              )[0].dataList;

            const PRD_DE_LIST = response.data.dataBody.data.날짜리스트;

            for (let i = 0; i < PRD_DE_LIST.length; i++) {
              const originDate = PRD_DE_LIST[i];
              const year = PRD_DE_LIST[i].slice(0, 4);
              const month = PRD_DE_LIST[i].slice(4, 6);
              const day = PRD_DE_LIST[i].slice(6);
              const value = DATA_VALUE_LIST[i];
              if (value === null) continue;
              //========================================================================================
              const sqlQuery =
                "INSERT INTO weekly_price_index_changes_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
              db.query(
                sqlQuery,
                [originDate, year, month, day, value],
                (err, result) => {
                  if (err)
                    return console.log(
                      "서울 아파트 주간 매매가 증감률 : 새 데이터 추가에 실패 했습니다."
                    );

                  insertCount++;

                  // 모든 데이터 추가 완료 후에 실행할 코드
                  if (
                    insertCount ===
                    DATA_VALUE_LIST.filter((item) => item !== null).length
                  ) {
                    //=====================================================================================
                    const message =
                      "서울 아파트 주간 매매가 증감률 : 모든 데이터를 새 데이터로 교체 완료";
                    const notificationQuery = `INSERT INTO data_update_logs (message,update_type) VALUES (?,?);`;
                    db.query(
                      notificationQuery,
                      [message, "refetch"],
                      (err, result) => {
                        if (err)
                          return console.log(
                            "서울 아파트 주간 매매가 증감률 : 업데이트 공지 테이블에 추가하지 못했습니다."
                          );
                        console.log(
                          "서울 아파트 주간 매매가 증감률 : 새 데이터로 교체 완료하였습니다."
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

module.exports = jobRefetchWeeklyPriceIndexChangesAptSeoul;
