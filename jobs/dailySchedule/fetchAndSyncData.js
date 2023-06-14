// job import ================================================================================
const jobUpdatePirAptSeoul = require("./jobUpdatePirAptSeoul.js");
const jobUpdateTransactionVolumeSalesAptSeoul = require("./jobUpdateTransactionVolumeSalesAptSeoul.js");
const jobUpdateTransactionVolumeJeonseAptSeoul = require("./jobUpdateTransactionVolumeJeonseAptSeoul.js");
const jobUpdateHaiSeoul = require("./jobUpdateHaiSeoul.js");
const jobUpdateHousePriceIndexAptSeoul = require("./jobUpdateHousePriceIndexAptSeoul.js");
const jobUpdateJeonsePriceIndexAptSeoul = require("./jobUpdateJeonsePriceIndexAptSeoul.js");
const jobUpdateHousePriceIndexAptAroundSeoul = require("./jobUpdateHousePriceIndexAptAroundSeoul.js");
const jobUpdateJeonsePriceIndexAptAroundSeoul = require("./jobUpdateJeonsePriceIndexAptAroundSeoul.js");
const jobUpdateWeeklyPriceIndexChangesAptSeoul = require("./jobUpdateWeeklyPriceIndexChangesAptSeoul.js");
const jobUpdateUnsoldHouseAroundSeoul = require("./jobUpdateUnsoldHouseAroundSeoul.js");
const jobUpdateJeonsePriceRatioAptSeoul = require("./jobUpdateJeonsePriceRatioAptSeoul.js");
const jobUpdateBaseRateKorea = require("./jobUpdateBaseRateKorea.js");
const jobResetTodayFirstVisit = require("./jobResetTodayFirstVisit.js");
// ===========================================================================================
// 예약된 작업 실행 ===========================================================================
const executeScheduledUpdate = () => {
  console.log("일일단위 스케줄러 작업이 정상적으로 실행되었습니다.");
  // 서울 아파트 PIR
  jobUpdatePirAptSeoul;
  // 서울 아파트 매매 거래량
  jobUpdateTransactionVolumeSalesAptSeoul;
  // 서울 아파트 전세 거래량
  jobUpdateTransactionVolumeJeonseAptSeoul;
  //서울 HAI
  jobUpdateHaiSeoul;
  // 서울 아파트 매매 지수
  jobUpdateHousePriceIndexAptSeoul;
  // 서울 아파트 전세 지수
  jobUpdateJeonsePriceIndexAptSeoul;
  // 수도권 아파트 매매 지수
  jobUpdateHousePriceIndexAptAroundSeoul;
  // 수도권 아파트 전세 지수
  jobUpdateJeonsePriceIndexAptAroundSeoul;
  // 서울 아파트 주간 매매 지수 증감률
  jobUpdateWeeklyPriceIndexChangesAptSeoul;
  // 수도권 미분양
  jobUpdateUnsoldHouseAroundSeoul;
  // 서울 아파트 전세가율
  jobUpdateJeonsePriceRatioAptSeoul;
  // 한국 기준금리
  jobUpdateBaseRateKorea;
  // 금일 방문 횟수 카운터를 초기화
  jobResetTodayFirstVisit;
};

module.exports = executeScheduledUpdate;
//=============================================================================================================

// const agent = new https.Agent({ rejectUnauthorized: false }); // SSL 인증서 오류 무시
// =============================================================================================

// // // 이하 최초 데이터 추가시 사용할 로직?
// const schedule = require("node-schedule");
// const axios = require("axios");
// const https = require("https");
// // DB 연결부 ================================================================================
// const connectDB = require("../config/connectDB.js");
// // const { route } = require("./allCharts.js");
// const db = connectDB.init();
// connectDB.open(db);
// // ===========================================================================================

// 서울 아파트 매매지수 =========================================================================================================
// const KOSIS_KEY = process.env.KOSIS_KEY;
// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 11;
//   rule.minute = 46;

//   const job1 = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       axios
//         .get(
//           `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&itmId=sales+&objL1=01+&objL2=a7+&objL3=&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&startPrdDe=200311&endPrdDe=203012&orgId=408&tblId=DT_40803_N0001&apiKey=${KOSIS_KEY}`
//         )
//         .then((response) => {
//           for (const item of response.data) {
//             const originDate = item.PRD_DE;
//             const year = item.PRD_DE.slice(0, 4);
//             const month = item.PRD_DE.slice(4, 6);
//             const day = 1;
//             const value = item.DT;
//             console.log("검문소", value);
//             const sqlQuery =
//               "INSERT INTO house_price_index_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//             db.query(sqlQuery, [originDate, year, month, day, value]);
//             console.log("DB저장 성공");
//           }
//         })
//         .catch((error) => {
//           console.log(error);
//           // res.status(500).send(error.message);
//         });
//     } catch (error) {
//       console.log("axios 에러", error);
//     }

//     job1.cancel();
//   });

//   const job2 = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       axios
//         .get(
//           `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&itmId=sales+&objL1=01+&objL2=a7+&objL3=&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&startPrdDe=200311&endPrdDe=203012&orgId=408&tblId=DT_40803_N0002`
//         )
//         .then((response) => {
//           for (const item of response.data) {
//             const originDate = item.PRD_DE;
//             const year = item.PRD_DE.slice(0, 4);
//             const month = item.PRD_DE.slice(4, 6);
//             const day = 1;
//             const value = item.DT;
//             console.log("검문소", value);
//             const sqlQuery =
//               "INSERT INTO jeonse_price_index_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//             db.query(sqlQuery, [originDate, year, month, day, value]);
//             console.log("DB저장 성공");
//           }
//         })
//         .catch((error) => {
//           console.log(error);
//           // res.status(500).send(error.message);
//         });
//     } catch (error) {
//       console.log("axios 에러", error);
//     }

//     job2.cancel();
//   });
//   // };

//   const job3 = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       axios
//         .get(
//           `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&itmId=sales+&objL1=01+&objL2=a1+&objL3=&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&startPrdDe=200311&endPrdDe=203012&orgId=408&tblId=DT_40803_N0001`
//         )
//         .then((response) => {
//           for (const item of response.data) {
//             const originDate = item.PRD_DE;
//             const year = item.PRD_DE.slice(0, 4);
//             const month = item.PRD_DE.slice(4, 6);
//             const day = 1;
//             const value = item.DT;
//             console.log("검문소", value);
//             const sqlQuery =
//               "INSERT INTO house_price_index_apt_around_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//             db.query(sqlQuery, [originDate, year, month, day, value]);
//             console.log("DB저장 성공");
//           }
//         })
//         .catch((error) => {
//           console.log(error);
//           // res.status(500).send(error.message);
//         });
//     } catch (error) {
//       console.log("axios 에러", error);
//     }

//     job3.cancel();
//   });
// };

// const job4 = schedule.scheduleJob(rule, async function () {
//   console.log("작업이 실행되었습니다.");

//   try {
//     axios
//       .get(
//         `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&itmId=sales+&objL1=01+&objL2=a1+&objL3=&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&startPrdDe=200311&endPrdDe=203012&orgId=408&tblId=DT_40803_N0002`
//       )
//       .then((response) => {
//         for (const item of response.data) {
//           const originDate = item.PRD_DE;
//           const year = item.PRD_DE.slice(0, 4);
//           const month = item.PRD_DE.slice(4, 6);
//           const day = 1;
//           const value = item.DT;
//           console.log("검문소", value);
//           const sqlQuery =
//             "INSERT INTO jeonse_price_index_apt_around_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//           db.query(sqlQuery, [originDate, year, month, day, value]);
//           console.log("DB저장 성공");
//         }
//       })
//       .catch((error) => {
//         console.log(error);
//         // res.status(500).send(error.message);
//       });
//   } catch (error) {
//     console.log("axios 에러", error);
//   }

//   // job4.cancel();
// });
// job4.cancel();
// };

// test();

// module.exports = test;
