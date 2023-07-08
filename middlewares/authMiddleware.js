const jwt = require("jsonwebtoken");

// DB 연결부 ===================================
const connectDB = require("../config/connectDB.js");
const db = connectDB.init();
connectDB.open(db);
//=============================================

const authMiddleware = (req, res, next) => {
  // 쿠키에서 access token 과 refresh token 가져오기
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // access token 없으면 401 에러 반환
  if (!accessToken) {
    // Redux Persist로 로컬 스토리지에 저장된 내용 삭제 (?)
    // localStorage.removeItem("persist:root") (? 없어도 잘 되는듯?);
    return res.status(401).json({ message: "Access token not found" });
  }

  // access token 있으면 다음실행.
  try {
    // access token 디코딩 시도
    const decodedAccessToken = jwt.verify(
      accessToken,
      process.env.ACCESS_SECRET
    );

    // 정상적이고 유효한 access token인 경우 다음 코드 실행
    req.user = decodedAccessToken;
    next();

    // 비정상적이거나 유효기만 만료된 access token인 경우 다음 코드 실행
    // refresh token으로 access token 갱신 로직 =====================================================================
  } catch (err) {
    // refresh token 없으면 401 에러 반환
    if (!refreshToken) {
      return res.status(401).json({ message: "refresh token not found" });
    }

    // refresh token 있으면 다음실행.
    try {
      // refresh token 디코딩 시도
      const decodedFreshToken = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET
      );

      // 정상적이고 유효한 refresh token인 경우 다음 코드 실행
      // DB에 저장된 해당 Id의 사용자의 refresh totken을 가져옴.
      const sqlQuery = `SELECT refresh_token FROM users WHERE id = ?;`;
      db.query(sqlQuery, [decodedFreshToken.id], (err, result) => {
        if (err) res.status(500).json(err);
        if (result.length === 0) {
          // 오류 발생구간!!!!!!!!
          res.status(401).json("There Is No That Refresh Token in DB");
        } else {
          // DB 가져온 refresh token을 브라우저에서 가져온 refresh token과 비교
          const savedRefreshToken = result[0].refresh_token;
          // 일치한다면 DB에서 해당 id의 모든 정보를 받아옴.
          if (savedRefreshToken === refreshToken) {
            const sqlQuery = `SELECT * FROM users WHERE id = ?;`;
            db.query(sqlQuery, [decodedFreshToken.id], (err, result) => {
              if (err) res.status(500).json(err);
              console.log("디비에서 리프레시 가져와서 비교 완료");
              // 받아온 정보로 access token 재생성.
              const newAccessToken = jwt.sign(
                {
                  id: result[0].id,
                  name: result[0].name,
                  nickname: result[0].nickname,
                  email: result[0].email,
                  profileImage: result[0].profile_image,
                },
                process.env.ACCESS_SECRET,
                {
                  expiresIn: "30m", // 유효기간 30분
                  issuer: "HHB", // 발행자
                }
              );
              // 브라우저로 갱신된 access token 전송 (쿠키를 통해)
              res.cookie("accessToken", newAccessToken, {
                // domain: "http://localhost:3000", //이거 썼더니, 3000도 여전히 안되고, 5000까지 안 돼버림.
                // secure: true, //https와 http 차이를 명시 하는 것 (http면 false), 쿠키가 SSL이나 HTTPS 연결을 통해서만 반횐될지 여부를 명시하는 값 , false 줬더니 쿠키 안옴;
                httpOnly: true, //JS와 http 중에 어디서 접근이 가능할지 지정하는 옵션으로, true를 주면 자바스크립트에서 쿠키의 접근이 불가능해짐!
                // sameSite: "none", // + 쿠키가 같은 도메인에서만 접근할 수 있어야 하는지 여부를 결정하는 값
              });
              console.log("재발급 완료");

              /* 원래는 access token의 디코딩된 id를 할당해주지만, 재발급한 access token을 한번도 디코딩 하면 너무 소요가 큼
              refresh token도 내부적으로 id값은 가지고 있으므로 그것을 활용하기로 함.
              */
              req.user = decodedFreshToken;
              next(); // 이게 없으면 권한이 없는 상태에서 라우터함수가 먼저 동작해 데이터를 불러오지 못함.
            });
          } else {
            // DB 가져온 refresh token와 브라우저에서 가져온 refresh token 일치하지 않는다면.
            res.status(403).json("Diffrent Refresh Token");
          }
        }
      });
      // 비정상적이거나 유효기만 만료된 refresh token인 경우 다음 코드 실행
    } catch (err) {
      res.status(401).json("Invalid Refresh Token");
    }
    // refresh token 디코딩 시도
  }
};

module.exports = authMiddleware;
