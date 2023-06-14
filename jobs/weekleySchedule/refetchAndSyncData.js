// job import ================================================================================
// ===========================================================================================
const jobRefetchPirAptSeoul = require("./jobRefetchPirAptSeoul.js");
const jobRefetchHaiSeoul = require("./jobRefetchHaiSeoul.js");
const jobRefetchHousePriceIndexAptSeoul = require("./jobRefetchHousePriceIndexAptSeoul.js");
const jobRefetchJeonsePriceIndexAptSeoul = require("./jobRefetchJeonsePriceIndexAptSeoul.js");
const jobRefetchHousePriceIndexAptAroundSeoul = require("./jobRefetchHousePriceIndexAptAroundSeoul.js");
const jobRefetchJeonsePriceIndexAptAroundSeoul = require("./jobRefetchJeonsePriceIndexAptAroundSeoul.js");
const jobRefetchWeeklyPriceIndexChangesAptSeoul = require("./jobRefetchWeeklyPriceIndexChangesAptSeoul.js");
const jobRefetchUnsoldHouseAroundSeoul = require("./jobRefetchUnsoldHouseAroundSeoul.js");
const jobRefetchJeonsePriceRatioAptSeoul = require("./jobRefetchJeonsePriceRatioAptSeoul.js");
const jobRefetchBaseRateKorea = require("./jobRefetchBaseRateKorea.js");
// ===========================================================================================

// 예약된 작업 실행
const executeScheduledRefetch = () => {
  console.log("주단위 스케줄러 작업이 정상적으로 실행되었습니다.");
  // 서울 아파트 PIR
  jobRefetchPirAptSeoul;
  //서울 HAI
  jobRefetchHaiSeoul;
  // 서울 아파트 매매 지수
  jobRefetchHousePriceIndexAptSeoul;
  // 서울 아파트 전세 지수
  jobRefetchJeonsePriceIndexAptSeoul;
  // 수도권 아파트 매매 지수
  jobRefetchHousePriceIndexAptAroundSeoul;
  // 수도권 아파트 전세 지수
  jobRefetchJeonsePriceIndexAptAroundSeoul;
  // 서울 아파트 주간 매매 지수 증감률
  jobRefetchWeeklyPriceIndexChangesAptSeoul;
  // 수도권 미분양
  jobRefetchUnsoldHouseAroundSeoul;
  // 서울 아파트 전세가율
  jobRefetchJeonsePriceRatioAptSeoul;
  // 한국 기준금리
  jobRefetchBaseRateKorea;

  // + 회원정보 toDayFirstVisit 초기화 (+ 하는김에 emailService 도 추가)
};

module.exports = executeScheduledRefetch;
