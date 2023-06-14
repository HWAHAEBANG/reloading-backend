const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const authMiddleware = require("./middlewares/authMiddleware.js");

// const test = require("./jobs/dailySchedule/fetchAndSyncData.js");
// const dailyDataResetScheduler = require("./jobs/dailyDataResetScheduler.js");
const executeScheduledUpdate = require("./jobs/dailySchedule/fetchAndSyncData.js");
const executeScheduledRefetch = require("./jobs/weekleySchedule/refetchAndSyncData.js");
const executeScheduledSendEmail = require("./jobs/executeScheduledSendEmail.js");

//==========================================

app.use(express.json()); // 왜필요? json 형식의 데이터를 통신하기 위해서.
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://api.cloudinary.com/v1_1/dh6tdcdyj/image/upload",
      "http://Reloading-env.eba-7nrbgs4x.ap-northeast-2.elasticbeanstalk.com",
      "https://reloading.co.kr",
    ],
    methods: ["GET", "POST"], // 사용할 메서드
    credentials: true, // 사용자와 클라이언트 서버간에 쿠키를 사용해서 통신을 할 것이기 떄문에.
  })
);
app.use(bodyParser.urlencoded({ extended: true }));

// // CORS 설정
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*"); // 모든 도메인 허용
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE"); // 허용할 HTTP 메서드
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); // 허용할 헤더
//   res.setHeader("Access-Control-Allow-Credentials", true); // 인증 정보 허용

//   next();
// });

/**
 * body-parser 미들웨어는 HTTP 요청의 본문을 파싱하여 JSON 객체나 URL-encoded 문자열 등의 형태로 변환해주는 역할을 합니다. 이렇게 변환된 데이터는 req.body 객체에 저장되어 다른 라우팅 핸들러에서 사용될 수 있습니다.
 * extended: true 옵션은 내장된 QS(Query String) 모듈을 사용하여 URL-encoded 문자열을 해석할 때, 객체 안에 중첩된 객체 형태를 허용할지 여부를 설정합니다. true로 설정하면 중첩된 객체를 허용하며, false로 설정하면 중첩된 객체를 허용하지 않습니다.
 */

// =========================================
// 빌드 폴더 안에 있는 코드들을 서버에서 마음대로 꺼내가도 된다.
// 서버가 허용되지 않은 파일을 가져가려고하면 굉장한 보안이슈가 있을 수 있기 때문에 이 같이 하는 것.
// 서버를 켜놨다는 이유로 내 PC에 있는 모든 파일을 막 접속을 하거나 한다면 굉장히 위험하므로.
app.use(express.static("build"));

app.use(
  /^\/(aboutUs|allCharts|myCharts|topicNews|notification)/,
  express.static("build")
);

app.use("/users/*", express.static("build"));
app.use("/allCharts/*", express.static("build"));

app.get("/", (req, res) => {
  // res.sendFile(__dirname, "/build/index.html");
  res.sendFile(__dirname + "/build/index.html");

  // 해당하는 파일 경로를 적어준다,  __dirname는 루트경로를 의미/
});

// page ===================================

const ABOUT_US = require("./router/aboutUs.js");
app.use("/api/aboutUs", authMiddleware, ABOUT_US);

const ALL_CHARTS = require("./router/allCharts.js");
app.use("/api/allCharts", authMiddleware, ALL_CHARTS);

const My_CHARTS = require("./router/myCharts.js");
app.use("/api/myCharts", authMiddleware, My_CHARTS);

const USERS = require("./router/users.js");
app.use("/api/users", USERS);

const TOPIC_NEWS = require("./router/topicNews.js");
app.use("/api/topicNews", authMiddleware, TOPIC_NEWS);

const NOTIFICATION = require("./router/notification.js");
app.use("/api/notification", authMiddleware, NOTIFICATION);

// chart ==================================
const HAI = require("./router/hai.js");
app.use("/api/allCharts/hai", HAI);

const PIR = require("./router/pir.js");
app.use("/api/allCharts/pir", PIR);

const UNSOLDHOUSE = require("./router/unsoldHouse.js");
app.use("/api/allCharts/unsoldHouse", UNSOLDHOUSE);

const HOUSE_PRICE_INDEX_SEOUL = require("./router/housePriceIndexSeoul.js");
app.use("/api/allCharts/housePriceIndexSeoul", HOUSE_PRICE_INDEX_SEOUL);

const JEONSE_PRICE_INDEX_SEOUL = require("./router/JeonsePriceIndexSeoul.js"); // 파일명수정 필요
app.use("/api/allCharts/JeonsePriceIndexSeoul", JEONSE_PRICE_INDEX_SEOUL);

const HOUSE_PRICE_INDEX_AROUND_SEOUL = require("./router/housePriceIndexAroundSeoul.js");
app.use(
  "/api/allCharts/housePriceIndexAroundSeoul",
  HOUSE_PRICE_INDEX_AROUND_SEOUL
);

const JEONSE_PRICE_INDEX_AROUND_SEOUL = require("./router/JeonsePriceIndexAroundSeoul.js");
app.use(
  "/api/allCharts/JeonsePriceIndexAroundSeoul",
  JEONSE_PRICE_INDEX_AROUND_SEOUL
);

const JEONSE_PRICE_RATIO = require("./router/jeonsePriceRatio.js");
app.use("/api/allCharts/jeonsePriceRatio", JEONSE_PRICE_RATIO);

const PRICE_CHANGE_RATE = require("./router/priceChangeRate.js");
app.use("/api/allCharts/priceChangeRate", PRICE_CHANGE_RATE);

const BASE_RATE_KOREA = require("./router/baseRateKorea.js");
app.use("/api/allCharts/baseRateKorea", BASE_RATE_KOREA);

const TRANSACTION_VOLUME_SALES_SEOUL = require("./router/transactionVolumeSalesSeoul.js");
app.use(
  "/api/allCharts/transactionVolumeSalesSeoul",
  TRANSACTION_VOLUME_SALES_SEOUL
);

const TRANSACTION_VOLUME_JEONSE_SEOUL = require("./router/transactionVolumeJeonseSeoul");

app.use(
  "/api/allCharts/transactionVolumeJeonseSeoul",
  TRANSACTION_VOLUME_JEONSE_SEOUL
);

// ========================================

app.listen(PORT, () => {
  console.log(`${PORT}번 포트가 열렸다..!`);
});

// schedule ================================
executeScheduledUpdate();
executeScheduledRefetch();
executeScheduledSendEmail();
// test();
