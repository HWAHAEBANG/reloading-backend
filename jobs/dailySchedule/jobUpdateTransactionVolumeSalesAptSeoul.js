/**
 * "부동산 정보 광장 거래량 데이터"는 최신 날짜 뿐 아니라 과거의 데이터도 매일 변경되므로,
 * 매일 밤 업데이트시 기존의 데이터를 모두 지우고, 새로운 데이터로 갈아끼우는 것으로 한다.
 *
 * 단, 사용자들에게 "최신 날짜의 데이터가 변경 되었거나 새로운 데이터가  추가되었는자" 정도의 알림은 보여줘야하므로,
 * 최신 날짜와 해당 날짜의 값을 비교하는 기존의 양식은 유지한다.
 * 과거의 데이터가 바뀐 것은 굳이 알림을 보내지 않아도 된다고 판단되기에, 이정도 로직이면 충분할 것이라 생각된다.
 */

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
const agent = new https.Agent({ rejectUnauthorized: false }); // SSL 인증서 오류 무시

const jobUpdateTransactionVolumeSalesAptSeoul = schedule.scheduleJob(
  updateRule,
  function () {
    console.log(
      "현재시간 02시 00분 서울 매매 거래량 데이터 최신화를 진행합니다."
    );
    try {
      // DB의 가장 최신 데이터의 날짜와 값 가져오기
      const checkSqlQuery =
        "SELECT origin_date,value FROM transaction_volume_sales_apt_seoul WHERE no = (SELECT MAX(no) FROM transaction_volume_sales_apt_seoul);";
      db.query(checkSqlQuery, async (err, result) => {
        if (err) console.log("DB 정보를 불러올 수 없음", err);

        // 비교하기 편하게 객체 형태로 파싱
        const latestDataDb = {
          date: result[0].origin_date,
          value: result[0].value,
        };

        // api에서 데이터 받아옴
        axios
          .post(
            "https://land.seoul.go.kr:444/land/rtms/getRtmsSggStatsList.do",
            "&bldgGbn=AP&rightGbnGrp=RTMS&fromYm=200601&toYm=203012",
            {
              headers: {
                Host: "land.seoul.go.kr:444",
                "Content-Length": "54",
                Accept: "application/json, text/javascript, */*; q=0.01",
                "Content-Type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
                "Accept-Encoding": "gzip, deflate",
                Connection: "close",
              },
              httpsAgent: agent,
            }
          )
          .then((response) => {
            const filteredData = response.data.result
              .filter((item) => item.gubunNm === "서울특별시" && item.val !== 0)
              .map((item) => ({ date: item.baseMm, value: item.val }));

            // 그중에서 가장 최신 값 가져오기
            const latestDataApi = filteredData[filteredData.length - 1];
            // 날짜가 일치하면 값까지 같은지 확인한다음 같으면 통과, 다르면 update문 실행.
            // value까지 비교하는 이유는 몇몇 api에서 가장 최신 값의 변경되는 경우가 있기 때문.

            if (latestDataApi.date === latestDataDb.date) {
              if (latestDataApi.value === latestDataDb.value) {
                console.log(
                  "서울 아파트 매매 거래량 : 현재 DB는 최신 상태 입니다. "
                );
                //==============================================================================================================
                // 기존 데이터 모두 지우기
                const truncateQuery = `TRUNCATE transaction_volume_sales_apt_seoul;`;
                db.query(truncateQuery, (err, result) => {
                  if (err)
                    return console.log(
                      "서울 아파트 매매 거래량 : TRUCATE에 실패 했습니다."
                    );
                  console.log(
                    "서울 아파트 매매 거래량 : TRUCATE성공, 새 데이터 추가를 진행합니다."
                  );
                  // 새로 받아온 데이터로 모두 갈아끼우기

                  const insertData = response.data.result.filter(
                    (item) => item.gubunNm === "서울특별시" && item.val !== 0
                  );

                  let insertCount = 0;

                  for (const item of insertData) {
                    const originDate = item.baseMm;
                    const year = item.baseMm.slice(0, 4);
                    const month = item.baseMm.slice(4, 6);
                    const day = 1;
                    const value = item.val;
                    const sqlQuery =
                      "INSERT INTO transaction_volume_sales_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
                    db.query(
                      sqlQuery,
                      [originDate, year, month, day, value],
                      (err, result) => {
                        if (err)
                          return console.log(
                            "서울 아파트 매매 거래량 : 새 데이터 추가에 실패 했습니다."
                          );

                        insertCount++;

                        // 모든 데이터 추가 완료 후에 실행할 코드
                        if (insertCount === insertData.length) {
                          console.log(
                            "서울 아파트 매매 거래량 : 새 데이터로 교체 완료하였습니다."
                          );
                        }
                      }
                    );
                  }
                });
                //==============================================================================================================
              } else {
                console.log(
                  "서울 아파트 매매 거래량 : 데이터에 변경사항이 감지되어 전체 데이터를 리셋합니다. "
                );
                //==============================================================================================================
                // 기존 데이터 모두 지우기
                const truncateQuery = `TRUNCATE transaction_volume_sales_apt_seoul;`;
                db.query(truncateQuery, (err, result) => {
                  if (err)
                    return console.log(
                      "서울 아파트 매매 거래량 : TRUCATE에 실패 했습니다."
                    );
                  console.log(
                    "서울 아파트 매매 거래량 : TRUCATE성공, 새 데이터 추가를 진행합니다."
                  );
                  // 새로 받아온 데이터로 모두 갈아끼우기

                  const insertData = response.data.result.filter(
                    (item) => item.gubunNm === "서울특별시" && item.val !== 0
                  );

                  let insertCount = 0;

                  for (const item of insertData) {
                    const originDate = item.baseMm;
                    const year = item.baseMm.slice(0, 4);
                    const month = item.baseMm.slice(4, 6);
                    const day = 1;
                    const value = item.val;
                    const sqlQuery =
                      "INSERT INTO transaction_volume_sales_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
                    db.query(
                      sqlQuery,
                      [originDate, year, month, day, value],
                      (err, result) => {
                        if (err)
                          return console.log(
                            "서울 아파트 매매 거래량 : 새 데이터 추가에 실패 했습니다."
                          );

                        insertCount++;

                        // 모든 데이터 추가 완료 후에 실행할 코드
                        if (insertCount === insertData.length) {
                          const message =
                            "서울 아파트 매매 거래량 : 최근 몇개월 데이터의 변동 사항 반영 ( 변동 요인 : 취소거래 )";
                          const notificationQuery = `INSERT INTO data_update_logs (message,update_type) VALUES (?,?);`;
                          db.query(
                            notificationQuery,
                            [message, "refetch"],
                            (err, result) => {
                              if (err)
                                return console.log(
                                  "업데이트 공지 테이블에 추가하지 못했습니다."
                                );
                              console.log(
                                "서울 아파트 매매 거래량 : 새 데이터로 교체 완료하였습니다."
                              );
                            }
                          );
                        }
                      }
                    );
                  }
                });
                //==============================================================================================================
              }
            } else {
              // 날짜가 일치하지 않으면 새로운 데이터가 생선된 것이므로 insertans 실행
              console.log(
                "서울 아파트 매매 거래량 : 새로운 데이터가 감지되어 전체 데이터를 리셋합니다."
              );
              //==============================================================================================================
              // 기존 데이터 모두 지우기
              const truncateQuery = `TRUNCATE transaction_volume_sales_apt_seoul;`;
              db.query(truncateQuery, (err, result) => {
                if (err)
                  return console.log(
                    "서울 아파트 매매 거래량 : TRUCATE에 실패 했습니다."
                  );
                console.log(
                  "서울 아파트 매매 거래량 : TRUCATE성공, 새 데이터 추가를 진행합니다."
                );
                // 새로 받아온 데이터로 모두 갈아끼우기

                const insertData = response.data.result.filter(
                  (item) => item.gubunNm === "서울특별시" && item.val !== 0
                );

                let insertCount = 0;

                for (const item of insertData) {
                  const originDate = item.baseMm;
                  const year = item.baseMm.slice(0, 4);
                  const month = item.baseMm.slice(4, 6);
                  const day = 1;
                  const value = item.val;
                  const sqlQuery =
                    "INSERT INTO transaction_volume_sales_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
                  db.query(
                    sqlQuery,
                    [originDate, year, month, day, value],
                    (err, result) => {
                      if (err)
                        return console.log(
                          "서울 아파트 매매 거래량 : 새 데이터 추가에 실패 했습니다."
                        );

                      insertCount++;

                      // 모든 데이터 추가 완료 후에 실행할 코드
                      if (insertCount === insertData.length) {
                        const message =
                          "서울 아파트 매매 거래량 : 최신 데이터 추가";
                        const notificationQuery = `INSERT INTO data_update_logs (message,update_type) VALUES (?,?);`;
                        db.query(
                          notificationQuery,
                          [message, "add"],
                          (err, result) => {
                            if (err)
                              return console.log(
                                "업데이트 공지 테이블에 추가하지 못했습니다."
                              );
                            console.log(
                              "서울 아파트 매매 거래량 : 새 데이터로 교체 완료하였습니다."
                            );
                          }
                        );
                      }
                    }
                  );
                }
              });
              //==============================================================================================================
            }
          })
          .catch((error) => {
            console.log(error);
          });
      });
    } catch (error) {
      console.log("axios 에러", error);
    }
  }
);

module.exports = jobUpdateTransactionVolumeSalesAptSeoul;

//==============================================================================================================
//==============================================================================================================
//==============================================================================================================
//==============================================================================================================
//==============================================================================================================
//==============================================================================================================
//==============================================================================================================
//==============================================================================================================
// const schedule = require("node-schedule");
// const axios = require("axios");
// const https = require("https");
// const updateRule = require("./updateRule.js");

// // DB 연결부 ================================================================================
// const connectDB = require("../config/connectDB.js");
// // const { route } = require("./allCharts.js");
// const db = connectDB.init();
// // connectDB.open(db);
// // ===========================================================================================
// const agent = new https.Agent({ rejectUnauthorized: false }); // SSL 인증서 오류 무시

// const jobUpdateTransactionVolumeSalesAptSeoul = schedule.scheduleJob(
//   updateRule,
//   function () {
//     console.log(
//       "현재시간 02시 00분 서울 매매 거래량 데이터 최신화를 진행합니다."
//     );
//     try {
//       // DB의 가장 최신 데이터의 날짜와 값 가져오기
//       const checkSqlQuery =
//         "SELECT origin_date,value FROM transaction_volume_sales_apt_seoul WHERE no = (SELECT MAX(no) FROM transaction_volume_sales_apt_seoul);";
//       db.query(checkSqlQuery, async (err, result) => {
//         if (err) console.log("DB 정보를 불러올 수 없음", err);

//         // 비교하기 편하게 객체 형태로 파싱
//         const latestDataDb = {
//           date: result[0].origin_date,
//           value: result[0].value,
//         };

//         // api에서 데이터 받아옴
//         axios
//           .post(
//             "https://land.seoul.go.kr:444/land/rtms/getRtmsSggStatsList.do",
//             "&bldgGbn=AP&rightGbnGrp=RTMS&fromYm=200601&toYm=203012",
//             {
//               headers: {
//                 Host: "land.seoul.go.kr:444",
//                 "Content-Length": "54",
//                 Accept: "application/json, text/javascript, */*; q=0.01",
//                 "Content-Type":
//                   "application/x-www-form-urlencoded; charset=UTF-8",
//                 "User-Agent":
//                   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
//                 "Accept-Encoding": "gzip, deflate",
//                 Connection: "close",
//               },
//               httpsAgent: agent,
//             }
//           )
//           .then((response) => {
//             const filteredData = response.data.result
//               .filter((item) => item.gubunNm === "서울특별시" && item.val !== 0)
//               .map((item) => ({ date: item.baseMm, value: item.val }));

//             // 그중에서 가장 최신 값 가져오기
//             const latestDataApi = filteredData[filteredData.length - 1];

//             // 날짜가 일치하면 값까지 같은지 확인한다음 같으면 통과, 다르면 update문 실행.
//             // value까지 비교하는 이유는 몇몇 api에서 가장 최신 값의 변경되는 경우가 있기 때문.
//             if (latestDataApi.date === latestDataDb.date) {
//               if (latestDataApi.value === latestDataDb.value) {
//                 console.log(
//                   "서울 아파트 매매 거래량 : 현재 DB는 최신 상태 입니다. "
//                 );
//                 // //배포시 주석해제==============================================================================================================
//                 //     // 기존 데이터 모두 지우기
//                 //     const truncateQuery = `TRUNCATE transaction_volume_sales_apt_seoul;`;
//                 //     db.query(truncateQuery, (err, result) => {
//                 //       if (err)
//                 //         return console.log(
//                 //           "서울 아파트 매매 거래량 : TRUCATE에 실패 했습니다."
//                 //         );
//                 //       console.log(
//                 //         "서울 아파트 매매 거래량 : TRUCATE성공, 새 데이터 추가를 진행합니다."
//                 //       );
//                 //       // 새로 받아온 데이터로 모두 갈아끼우기

//                 //       const insertData = response.data.result.filter(
//                 //         (item) =>
//                 //           item.gubunNm === "서울특별시" && item.val !== 0
//                 //       );

//                 //       for (const item of insertData) {
//                 //         const originDate = item.baseMm;
//                 //         const year = item.baseMm.slice(0, 4);
//                 //         const month = item.baseMm.slice(4, 6);
//                 //         const day = 1;
//                 //         const value = item.val;
//                 //         const sqlQuery =
//                 //           "INSERT INTO transaction_volume_sales_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//                 //         db.query(
//                 //           sqlQuery,
//                 //           [originDate, year, month, day, value],
//                 //           (err, result) => {
//                 //             if (err)
//                 //               return console.log(
//                 //                 "서울 아파트 매매 거래량 : 새 데이터 추가에 실패 했습니다."
//                 //               );
//                 //             console.log(
//                 //               "서울 아파트 매매 거래량 : 새 데이터로 교체 완료하였습니다."
//                 //             );
//                 //           }
//                 //         );
//                 //       }
//                 //     });
//                 //     //==============================================================================================================
//               } else {
//                 const updateSqlQuery = `UPDATE transaction_volume_sales_apt_seoul SET value = ? WHERE origin_date = ?`;
//                 db.query(
//                   updateSqlQuery,
//                   [latestDataApi.value, latestDataApi.date],
//                   (err, result) => {
//                     if (err) return console.log(err);
//                     console.log(
//                       "서울 아파트 매매 거래량 : 데이터에 변경사항이 감지되어 전체 데이터를 리셋합니다. "
//                     );
//                     //==============================================================================================================
//                     // 기존 데이터 모두 지우기
//                     const truncateQuery = `TRUNCATE transaction_volume_sales_apt_seoul;`;
//                     db.query(truncateQuery, (err, result) => {
//                       if (err)
//                         return console.log(
//                           "서울 아파트 매매 거래량 : TRUCATE에 실패 했습니다."
//                         );
//                       console.log(
//                         "서울 아파트 매매 거래량 : TRUCATE성공, 새 데이터 추가를 진행합니다."
//                       );
//                       // 새로 받아온 데이터로 모두 갈아끼우기

//                       const insertData = response.data.result.filter(
//                         (item) =>
//                           item.gubunNm === "서울특별시" && item.val !== 0
//                       );

//                       for (const item of insertData) {
//                         const originDate = item.baseMm;
//                         const year = item.baseMm.slice(0, 4);
//                         const month = item.baseMm.slice(4, 6);
//                         const day = 1;
//                         const value = item.val;
//                         const sqlQuery =
//                           "INSERT INTO transaction_volume_sales_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//                         db.query(
//                           sqlQuery,
//                           [originDate, year, month, day, value],
//                           (err, result) => {
//                             if (err)
//                               return console.log(
//                                 "서울 아파트 매매 거래량 : 새 데이터 추가에 실패 했습니다."
//                               );
//                             console.log(
//                               "서울 아파트 매매 거래량 : 새 데이터로 교체 완료하였습니다."
//                             );
//                           }
//                         );
//                       }
//                     });
//                     //==============================================================================================================
//                   }
//                 );
//               }
//             } else {
//               // 날짜가 일치하지 않으면 새로운 데이터가 생선된 것이므로 insertans 실행
//               const year = latestDataApi.date.slice(0, 4);
//               const month = latestDataApi.date.slice(4, 6);
//               const day = 1;
//               const insertSqlQuery =
//                 "INSERT INTO transaction_volume_sales_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//               db.query(
//                 insertSqlQuery,
//                 [latestDataApi.date, year, month, day, latestDataApi.value],
//                 (err, result) => {
//                   if (err) return console.log(err);
//                   console.log(
//                     "서울 아파트 매매 거래량 : 새로운 데이터가 감지되어 전체 데이터를 리셋합니다."
//                   );
//                   //==============================================================================================================
//                   // 기존 데이터 모두 지우기
//                   const truncateQuery = `TRUNCATE transaction_volume_sales_apt_seoul;`;
//                   db.query(truncateQuery, (err, result) => {
//                     if (err)
//                       return console.log(
//                         "서울 아파트 매매 거래량 : TRUCATE에 실패 했습니다."
//                       );
//                     console.log(
//                       "서울 아파트 매매 거래량 : TRUCATE성공, 새 데이터 추가를 진행합니다."
//                     );
//                     // 새로 받아온 데이터로 모두 갈아끼우기

//                     const insertData = response.data.result.filter(
//                       (item) => item.gubunNm === "서울특별시" && item.val !== 0
//                     );

//                     for (const item of insertData) {
//                       const originDate = item.baseMm;
//                       const year = item.baseMm.slice(0, 4);
//                       const month = item.baseMm.slice(4, 6);
//                       const day = 1;
//                       const value = item.val;
//                       const sqlQuery =
//                         "INSERT INTO transaction_volume_sales_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//                       db.query(
//                         sqlQuery,
//                         [originDate, year, month, day, value],
//                         (err, result) => {
//                           if (err)
//                             return console.log(
//                               "서울 아파트 매매 거래량 : 새 데이터 추가에 실패 했습니다."
//                             );
//                           console.log(
//                             "서울 아파트 매매 거래량 : 새 데이터로 교체 완료하였습니다."
//                           );
//                         }
//                       );
//                     }
//                   });
//                   //==============================================================================================================
//                 }
//               );
//             }
//           });
//       });
//     } catch (error) {
//       console.log("axios 에러", error);
//     }
//   }
// );

// module.exports = jobUpdateTransactionVolumeSalesAptSeoul;
