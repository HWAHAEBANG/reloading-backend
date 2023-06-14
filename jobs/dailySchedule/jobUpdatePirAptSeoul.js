const schedule = require("node-schedule");
const axios = require("axios");
const updateRule = require("./updateRule.js");
// DB 연결부 ================================================================================
const connectDB = require("../../config/connectDB.js");
// const { route } = require("./allCharts.js");
const db = connectDB.init();
connectDB.open(db);
// ===========================================================================================

// 실행할 작업
const jobUpdatePirAptSeoul = schedule.scheduleJob(updateRule, function () {
  console.log("현재시간 02시 00분 서울 아파트 PIR 데이터 최신화를 진행합니다.");
  try {
    // DB의 가장 최신 데이터의 날짜와 값 가져오기
    const checkSqlQuery =
      "SELECT origin_date,value FROM pir_apt_seoul WHERE no = (SELECT MAX(no) FROM pir_apt_seoul);";
    db.query(checkSqlQuery, async (err, result) => {
      if (err) console.log("DB 정보를 불러올 수 없음", err);

      // 비교하기 편하게 객체 형태로 파싱
      const latestDataDb = {
        date: result[0].origin_date,
        value: result[0].value,
      };

      // api에서 데이터 받아옴
      const response = await axios.get(
        "https://aptgin.com/pre/chart/region?loc=1100000000&target=rchart&type=p&ref=REGION01.MULTI_CHART%2CREGION01.REGION_LIST&locList=1100000000",
        {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      const removedNullValue = response.data[0]
        .filter((item) => item.pir_3part !== null) //api에서 받아온 데이터에서 value값이 null로 되어있는 것을 걸러줌(pir만 해당)
        .map((item) => ({ date: item.yyyymm, value: item.pir_3part })); // 비교하기 편한 객체 형태로 파싱

      // 그중에서 가장 최신 값 가져오기
      const latestDataApi = removedNullValue[removedNullValue.length - 1];

      // 날짜가 일치하면 값까지 같은지 확인한다음 같으면 통과, 다르면 update문 실행.
      // value까지 비교하는 이유는 몇몇 api에서 가장 최신 값의 변경되는 경우가 있기 때문.
      if (latestDataApi.date === latestDataDb.date) {
        if (latestDataApi.value === latestDataDb.value) {
          console.log("PIR : 현재 DB는 최신 상태 입니다. ");
        } else {
          const updateSqlQuery = `UPDATE pir_apt_seoul SET value = ? WHERE origin_date = ?;`;
          db.query(
            updateSqlQuery,
            [latestDataApi.value, latestDataApi.date],
            (err, result) => {
              if (err) return console.log(err);
              //============================================================================
              const messageText =
                "'서울 아파트 PIR'의 최근 일자 데이터가 수정되었습니다.";
              const messageQuery = `INSERT INTO data_update_notification(message, update_type) VALUES(?,?);`;
              db.query(messageQuery, [messageText, "modify"], (err, result) => {
                if (err) return console.log(err);

                //=====================================================================
                const message = "PIR : 최근 일자 데이터 변동";
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
                      "PIR : 데이터에 변경사항이 감지되어 DB를 수정하였습니다."
                    );
                  }
                );
                //=====================================================================
              });
              //============================================================================
            }
          );
        }
      } else {
        // 날짜가 일치하지 않으면 새로운 데이터가 생선된 것이므로 insertans 실행
        const year = latestDataApi.date.slice(0, 4);
        const month = latestDataApi.date.slice(5, 7);
        const day = latestDataApi.date.slice(8);
        const insertSqlQuery =
          "INSERT INTO pir_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
        db.query(
          insertSqlQuery,
          [latestDataApi.date, year, month, day, latestDataApi.value],
          (err, result) => {
            if (err) return console.log(err);
            //============================================================================
            const messageText =
              "'서울 아파트 PIR'에 최신 데이터가 등록되었습니다.";
            const messageQuery = `INSERT INTO data_update_notification(message, update_type) VALUES(?,?);`;
            db.query(messageQuery, [messageText, "add"], (err, result) => {
              if (err) return console.log(err);

              //========================================================================
              const message = "PIR : 최신 데이터 추가";
              const notificationQuery = `INSERT INTO data_update_logs (message,update_type) VALUES (?,?);`;
              db.query(notificationQuery, [message, "add"], (err, result) => {
                if (err)
                  return console.log(
                    "업데이트 공지 테이블에 추가하지 못했습니다."
                  );
                console.log(
                  "PIR : 새로운 데이터가 감지되어 DB에 추가하였습니다."
                );
              });
              //========================================================================
            });
            //============================================================================
          }
        );
      }
    });
  } catch (error) {
    console.log("axios 에러", error);
  }

  // jobUpdatePirAptSeoul.cancel(); // 이거 있으면 다음 날 스케줄링 안됨
});

module.exports = jobUpdatePirAptSeoul;
