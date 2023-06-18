const express = require("express");
const router = express.Router();
const axios = require("axios");
// const cheerio = require("cheerio"); 추후 사용 고려. 이미지 가져오기.

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// ==================================================================
// 클라이언트로 부터 파라미터를 전달받아 해당 검색어도 네이버 뉴스 데이터 받아옴 ==
router.get("/", (req, res) => {
  const sort = req.query.selectedSort === "정확도순" ? "sim" : "date";

  axios
    .get("https://openapi.naver.com/v1/search/news.json", {
      params: {
        query: req.query.keyword,
        sort: sort,
        display: 100,
        start: 1,
      },
      headers: {
        "X-naver-Client-Id": NAVER_CLIENT_ID,
        "X-naver-Client-Secret": NAVER_CLIENT_SECRET,
      },
    })
    .then((response) => {
      const data = response.data.items;
      res.status(200).send({ data: data });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send(error.message);
    });
});
// ==================================================================

module.exports = router;
