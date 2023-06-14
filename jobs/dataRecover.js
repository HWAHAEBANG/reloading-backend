// pri 복구 ============================================================================================
// const schedule = require("node-schedule");
// const axios = require("axios");

// // DB 연결부 ================================================================================
// const connectDB = require("../config/connectDB.js");
// // const { route } = require("./allCharts.js");
// const db = connectDB.init();
// connectDB.open(db);
// // ===========================================================================================

// // 예약된 작업 실행

// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 17;
//   rule.minute = 44;

//   const job = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       const response = await axios.get(
//         "https://aptgin.com/pre/chart/region?loc=1100000000&target=rchart&type=p&ref=REGION01.MULTI_CHART%2CREGION01.REGION_LIST&locList=1100000000",
//         {
//           headers: {
//             "X-Requested-With": "XMLHttpRequest",
//           },
//         }
//       );
//       for (const item of response.data[0]) {
//         if (item.pir_3part === null) continue; // 맨 첫번째와 미래의 값이 null 이라 오류 발생함.
//         const originDate = item.yyyymm;
//         const year = item.yyyymm.slice(0, 4);
//         const month = item.yyyymm.slice(5, 7);
//         const day = item.yyyymm.slice(8);
//         const value = item.pir_3part;
//         console.log("검문소", value);
//         const insertSqlQuery =
//           "INSERT INTO pir_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//         db.query(insertSqlQuery, [originDate, year, month, day, value]);
//         console.log("DB저장 성공");
//       }
//     } catch (error) {
//       console.log("axios 에러", error);
//     }

//     job.cancel();
//   });
// };

// // test();

// module.exports = test;
// =============================================================================================================
// 서울 아파트 전세거래량 복구 (매매거래량 로직 거의 동일 ) ========================================================
// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 16;
//   rule.minute = 41;

//   const agent = new https.Agent({ rejectUnauthorized: false }); // SSL 인증서 오류 무시

//   const job = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       await axios
//         .post(
//           "https://land.seoul.go.kr:444/land/rent/getRentSggStatsList.do",
//           "&bldgGbn=AP&rentCd=1&rentGbn=3&fromYm=201001&toYm=202305",
//           {
//             headers: {
//               Host: "land.seoul.go.kr:444",
//               "Content-Length": "56",
//               // "Sec-Ch-Ua":
//               //   '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
//               Accept: "application/json, text/javascript, */*; q=0.01",
//               "Content-Type":
//                 "application/x-www-form-urlencoded; charset=UTF-8",
//               // "X-Requested-With": "XMLHttpRequest",
//               // "Sec-Ch-Ua-Mobile": "?0",
//               "User-Agent":
//                 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
//               // "Sec-Ch-Ua-Platform": '"Windows"',
//               // Origin: "https://land.seoul.go.kr:444",
//               // "Sec-Fetch-Site": "same-origin",
//               // "Sec-Fetch-Mode": "cors",
//               // "Sec-Fetch-Dest": "empty",
//               // Referer: "https://land.seoul.go.kr:444/land/rtms/rtmsStatistics.do",
//               "Accept-Encoding": "gzip, deflate",
//               // "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
//               Connection: "close",
//               //   Cookie:
//               //     "JSESSIONID=rjxFJVRwhG9gcXdDhHq5Z5SAcUBDX8MXIIZAG8yn9aCKWDkwxmI7phmyM178CY7D.amV1c19kb21haW4vbGFuZGluZm9fMg==; WL_PCID=16852738065658586385576",
//             },
//             httpsAgent: agent,
//           }
//         )
//         .then((response) => {
//           const filteredData = response.data.result.filter(
//             (item) => item.gubunNm === "서울특별시"
//           );
//           console.log(filteredData);

//           for (const item of filteredData) {
//             const originDate = item.baseMm;
//             const year = item.baseMm.slice(0, 4);
//             const month = item.baseMm.slice(4, 6);
//             const day = 1;
//             const value = item.val;
//             console.log("검문소", value);
//             const sqlQuery =
//               "INSERT INTO transaction_volume_jeonse_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//             db.query(sqlQuery, [originDate, year, month, day, value]);
//             console.log("DB저장 성공");
//           }

//           // const data = filteredData.map((item) => {
//           //   const year = item.baseMm.slice(0, 4);
//           //   const month = item.baseMm.slice(4, 6) - 1;
//           //   const fixedData = parseFloat(item.val).toFixed(0);
//           // return [Date.UTC(year, month, 1), parseFloat(fixedData)];
//           // });

//           // res.status(200).send({ data: data });
//         })
//         .catch((error) => {
//           console.log(error);
//           // res.status(500).send(error.message);
//         });
//       // })

//       // for (const item of response.data[0]) {
//       //   if (item.pir_3part === null) continue; // 맨 첫번째와 미래의 값이 null 이라 오류 발생함.
//       //   const originDate = item.yyyymm;
//       //   const year = item.yyyymm.slice(0, 4);
//       //   const month = item.yyyymm.slice(5, 7);
//       //   const day = item.yyyymm.slice(8);
//       //   const value = item.pir_3part;
//       //   console.log("검문소", value);
//       //   const sqlQuery =
//       //     "INSERT INTO pir_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
//       //   db.query(sqlQuery, [originDate, year, month, day, value]);
//       //   console.log("DB저장 성공");
//       // }
//     } catch (error) {
//       console.log("axios 에러", error);
//     }

//     job.cancel();
//   });
// };

// test();

// module.exports = test;
// =============================================================================================================
// hai =========================================================================================================
// const HAI_KEY = process.env.HAI_KEY;
// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 19;
//   rule.minute = 10;

//   const agent = new https.Agent({ rejectUnauthorized: false }); // SSL 인증서 오류 무시

//   const job = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       axios
//         .get(
//           `https://houstat.hf.go.kr/research/openapi/SttsApiTblData.do?STATBL_ID=T186503126543136&DTACYCLE_CD=QY&ITM_DATANO=10002&START_DTA_DT=200401&END_DTA_DT=203004&TYPE=json&pIndex=1&pSize=1000&key=${HAI_KEY}`
//         )
//         .then((response) => {
//           for (const item of response.data.SttsApiTblData[1].row) {
//             const originDate = item.WRTTIME_IDTFR_ID;
//             const year = item.WRTTIME_IDTFR_ID.slice(0, 4);
//             const month = item.WRTTIME_IDTFR_ID.slice(5, 6) * 3 - 2;
//             const day = 1;
//             const value = item.DTA_VAL;
//             console.log("검문소", value);
//             const sqlQuery =
//               "INSERT INTO hai_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
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

//     job.cancel();
//   });
// };

// // test();

// module.exports = test;
// =============================================================================================================
// 주간 변동율 =========================================================================================================
// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 20;
//   rule.minute = 52;

//   // const agent = new https.Agent({ rejectUnauthorized: false }); // SSL 인증서 오류 무시

//   const job = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       const url =
//         "https://data-api.kbland.kr/bfmstat/weekMnthlyHuseTrnd/prcIndxInxrdcRt?%EA%B8%B0%EA%B0%84=&%EB%A7%A4%EB%A7%A4%EC%A0%84%EC%84%B8%EC%BD%94%EB%93%9C=01&%EB%A7%A4%EB%AC%BC%EC%A2%85%EB%B3%84%EA%B5%AC%EB%B6%84=01&%EC%9B%94%EA%B0%84%EC%A3%BC%EA%B0%84%EA%B5%AC%EB%B6%84%EC%BD%94%EB%93%9C=02&%EC%A7%80%EC%97%AD%EC%BD%94%EB%93%9C=&type=false&excelApi=true";

//       axios
//         .get(url)
//         .then((response) => {
//           const DATA_VALUE_LIST =
//             response.data.dataBody.data.데이터리스트.filter(
//               (item) => item.지역코드 === "1100000000" && item.지역명 === "서울"
//             )[0].dataList;

//           const PRD_DE_LIST = response.data.dataBody.data.날짜리스트;

//           for (let i = 0; i < PRD_DE_LIST.length; i++) {
//             const originDate = PRD_DE_LIST[i];
//             const year = PRD_DE_LIST[i].slice(0, 4);
//             const month = PRD_DE_LIST[i].slice(4, 6);
//             const day = PRD_DE_LIST[i].slice(6);
//             const value = DATA_VALUE_LIST[i];
//             if (value === null) continue;
//             console.log("검문소", value);
//             const sqlQuery =
//               "INSERT INTO weekly_price_index_changes_apt_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
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

//     job.cancel();
//   });
// };

// // test();

// module.exports = test;
// =============================================================================================================
// 서울 아파트 매매지수 =========================================================================================================
// const KOSIS_KEY = process.env.KOSIS_KEY;
// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 21;
//   rule.minute = 41;

//   const job = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       axios
//         .get(
//           `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&itmId=sales+&objL1=01+&objL2=a7+&objL3=&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&startPrdDe=200311&endPrdDe=202302&orgId=408&tblId=DT_40803_N0001&apiKey=${KOSIS_KEY}`
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

//     job.cancel();
//   });
// };

// // test();

// module.exports = test;

// =============================================================================================================
// 서울 아파트 전세지수 =========================================================================================================
// const KOSIS_KEY = process.env.KOSIS_KEY;
// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 21;
//   rule.minute = 46;

//   const job = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       axios
//         .get(
//           `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&itmId=sales+&objL1=01+&objL2=a7+&objL3=&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&startPrdDe=200311&endPrdDe=202302&orgId=408&tblId=DT_40803_N0002`
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

//     job.cancel();
//   });
// };

// // test();

// module.exports = test;
// =============================================================================================================
// 수도권 아파트 매매지수 =========================================================================================================
// const KOSIS_KEY = process.env.KOSIS_KEY;
// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 21;
//   rule.minute = 58;

//   const job = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       axios
//         .get(
//           `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&itmId=sales+&objL1=01+&objL2=a1+&objL3=&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&startPrdDe=200311&endPrdDe=202302&orgId=408&tblId=DT_40803_N0001`
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

//     job.cancel();
//   });
// };

// // test();

// module.exports = test;
// =============================================================================================================
// 수도권 아파트 전세지수 =========================================================================================================
// const KOSIS_KEY = process.env.KOSIS_KEY;
// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 22;
//   rule.minute = 3;

//   const job = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       axios
//         .get(
//           `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&itmId=sales+&objL1=01+&objL2=a1+&objL3=&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&startPrdDe=200311&endPrdDe=202302&orgId=408&tblId=DT_40803_N0002`
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
//               "INSERT INTO jeonse_price_index_apt_around_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
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

//     job.cancel();
//   });
// };

// // test();

// module.exports = test;

// =============================================================================================================
// 수도권 미분양 =========================================================================================================
// const KOSIS_KEY = process.env.KOSIS_KEY;
// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 7;
//   rule.minute = 44;

//   const job = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       axios
//         .get(
//           `https://kosis.kr/openapi/Param/statisticsParameterData.do?method=getList&apiKey=${KOSIS_KEY}&itmId=13103792722T1+&objL1=13102792722A.0002+&objL2=13102792722B.0001+&objL3=13102792722C.0001+&objL4=&objL5=&objL6=&objL7=&objL8=&format=json&jsonVD=Y&prdSe=M&startPrdDe=200701&endPrdDe=202302&orgId=116&tblId=DT_MLTM_2080`
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
//               "INSERT INTO unsold_house_around_seoul(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
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

//     job.cancel();
//   });
// };

// // test();

// module.exports = test;
// =============================================================================================================
// 서울 전세가율 =========================================================================================================

// =============================================================================================================
// 한국 기준금리 =========================================================================================================
// const ECOS_KEY = process.env.ECOS_KEY;
// const test = () => {
//   const rule = new schedule.RecurrenceRule();
//   // rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
//   rule.hour = 9;
//   rule.minute = 29;

//   const job = schedule.scheduleJob(rule, async function () {
//     console.log("작업이 실행되었습니다.");

//     try {
//       axios
//         .get(
//           `https://ecos.bok.or.kr/api/StatisticSearch/${ECOS_KEY}/json/kr/1/1000/722Y001/M/200312/203012/0101000`
//         )
//         .then((response) => {
//           for (const item of response.data.StatisticSearch.row) {
//             const originDate = item.TIME;
//             const year = item.TIME.slice(0, 4);
//             const month = item.TIME.slice(4, 6);
//             const day = 1;
//             const value = item.DATA_VALUE;
//             console.log("검문소", value);
//             const sqlQuery =
//               "INSERT INTO base_rate_korea(origin_date,year,month,day,value) VALUES(?,?,?,?,?);";
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

//     job.cancel();
//   });
// };

// // test();

// module.exports = test;
