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
