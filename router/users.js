const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// 또 써줘야하는건가? 추후 확인 ====================
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

router.use(express.json()); // 왜필요? json 형식의 데이터를 통신하기 위해서.
router.use(cookieParser());
router.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"], // 사용할 메서드
    credentials: true, // 사용자와 클라이언트 서버간에 쿠키를 사용해서 통신을 할 것이기 떄문에.
  })
);
router.use(bodyParser.urlencoded({ extended: true }));

//===========================================================================================
// 인증 미들웨어 ============================================================================-
const authMiddleware = require("../middlewares/authMiddleware.js");

//===========================================================================================
// crypto 관련 ==============================================================================
// 비밀번호를 해시화 하는 함수
function hashPassword(pwd) {
  // salt생성
  const salt = crypto.randomBytes(16);
  // 해시 함수 생성 (pbkdf2Syncg는 해시화 알고리즘)
  const hash = crypto.pbkdf2Sync(pwd, salt, 1000, 64, "sha512");
  return { salt, hash };
}
// 비밀번호 확인 함수
function verifyPassword(pwd, hash, salt) {
  const hashVerify = crypto.pbkdf2Sync(pwd, salt, 1000, 64, "sha512");
  return hash.toString("hex") === hashVerify.toString("hex");
}
//===========================================================================================
// DB 연결부 ================================================================================
const connectDB = require("../config/connectDB.js");
const { route } = require("./allCharts.js");
const db = connectDB.init();
connectDB.open(db);

//===========================================================================================
//아이디 확인 ================================================================================
router.post("/idCheck", (req, res) => {
  const inputId = req.body.data.inputId;
  const sqlQuery = `SELECT id FROM users WHERE id = ?;`;
  db.query(sqlQuery, [inputId], (err, result) => {
    if (err) res.status(500).json(err);
    if (result.length === 0) {
      res.status(403).json("Not Exist ID");
    } else {
      res.send(result);
    }
    // console.log(result);
  });
});
//===========================================================================================
//닉네임 확인 ================================================================================
router.post("/nicknameCheck", (req, res) => {
  const inputNickname = req.body.data.inputNickname;
  const sqlQuery = `SELECT id FROM users WHERE nickname = ?;`;
  db.query(sqlQuery, [inputNickname], (err, result) => {
    if (err) res.status(500).json(err);
    if (result.length === 0) {
      res.status(403).json("Not Exist Nickname");
    } else {
      res.send(result);
    }
    // console.log(result);
  });
});
//===========================================================================================
//비밀번호 확인 ==============================================================================
router.post("/pwCheck", (req, res) => {
  const inputId = req.body.data.inputId;
  const inputPw = req.body.data.inputPw;
  const sqlQuery = `SELECT * FROM users WHERE id = ?;`; // 그거 버그 잡아야함.
  db.query(sqlQuery, [inputId], (err, result) => {
    if (err) res.status(500).json(err);
    // 해쉬값 비교
    const isAuthenticated = verifyPassword(
      inputPw,
      result[0].hash,
      result[0].salt
    );

    // access Token 발급
    //세가지의 인수를 받음 (1. 어떤 user 정보를 담을지, 2.시크릿값, 3.유효기간 및 발행자)
    if (isAuthenticated) {
      const accessToken = jwt.sign(
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

      // refresh Token 발글
      const refreshToken = jwt.sign(
        {
          id: result[0].id,
        },
        process.env.REFRESH_SECRET,
        {
          expiresIn: "336h", // 유효기간 2주
          issuer: "HHB", // 발행자
        }
      );

      // 발급한 refresh Token을 DB에도 저장
      const sqlQuery = `UPDATE users SET refresh_token = ? WHERE id = ?;`;
      db.query(sqlQuery, [refreshToken, result[0].id], (err, result) => {
        if (err) res.status(500).json(err);
      });

      // token 전송 (쿠키를 통해)
      res.cookie("accessToken", accessToken, {
        // domain:
        // "/", //이거 썼더니, 3000도 여전히 안되고, 5000까지 안 돼버림.
        // secure: true, //https와 http 차이를 명시 하는 것 (http면 false), 쿠키가 SSL이나 HTTPS 연결을 통해서만 반횐될지 여부를 명시하는 값 , false 줬더니 쿠키 안옴;
        httpOnly: true, //JS와 http 중에 어디서 접근이 가능할지 지정하는 옵션으로, true를 주면 자바스크립트에서 쿠키의 접근이 불가능해짐!
        // sameSite: "none", // + 쿠키가 같은 도메인에서만 접근할 수 있어야 하는지 여부를 결정하는 값
      });

      res.cookie("refreshToken", refreshToken, {
        // domain:
        // "/", //이거 썼더니, 3000도 여전히 안되고, 5000까지 안 돼버림.
        // secure: true, //https와 http 차이를 명시 하는 것 (http면 false), 쿠키가 SSL이나 HTTPS 연결을 통해서만 반횐될지 여부를 명시하는 값, , false 줬더니 쿠키 안옴;
        httpOnly: true, //JS와 http 중에 어디서 접근이 가능할지 지정하는 옵션으로, true를 주면 자바스크립트에서 쿠키의 접근이 불가능해짐!
        // sameSite: "none", // + 쿠키가 같은 도메인에서만 접근할 수 있어야 하는지 여부를 결정하는 값
      });

      const todayCntSqlQuery = `UPDATE users SET today_visit_cnt = today_visit_cnt + 1 WHERE id = ?;`;
      db.query(todayCntSqlQuery, [result[0].id], (err, result) => {
        if (err) res.status(500).json(err);
      });

      const totalCntSqlQuery = `UPDATE users SET total_visit_cnt = total_visit_cnt + 1 WHERE id = ?;`;
      db.query(totalCntSqlQuery, [result[0].id], (err, result) => {
        if (err) res.status(500).json(err);
      });

      res.status(200).json("Login Success");
    } else {
      res.status(403).json("Wrong Password");
    }
  });
});
//액세스 토큰으로 회원 정보 받아오기 ===========================================================
//===========================================================================================
router.get("/accesstoken", (req, res) => {
  const token = req.cookies.accessToken;
  const data = jwt.verify(token, process.env.ACCESS_SECRET);
  const sqlQuery = `SELECT * FROM users WHERE id = ?;`;
  db.query(sqlQuery, [data.id], (err, result) => {
    if (err) res.status(500).json(err);
    if (result.length === 0) {
      res.status(403).json("Can Not Get Info");
    } else {
      console.log(result);
      const { salt, hash, ...others } = result[0];
      res.status(200).json(others);
    }
  });
});
//리프레시 토큰으로 엑세스 토근 갱신하기 (현재 로직상 갱신은 자동이라 필요 없음)===================
//===========================================================================================
// 필요없...근거같은데?? 갱신은 자동으로 해주고, 처음에는 로그인에서 받고... 주석처리!
// router.get("/refreshtoken", (req, res) => {
//   const token = req.cookies.refreshToken;
//   const data = jwt.verify(token, process.env.REFRESH_SECRET);
//   const sqlQuery = `SELECT * FROM users WHERE id = ?;`;
//   db.query(sqlQuery, [data.id], (err, result) => {
//     if (err) res.status(500).json(err);
//     if (result.length === 0) {
//       res.status(403).json("Can Not Get Refresh Token");
//     } else {
//       console.log(result);
//       const savedToken = result[0].refresh_token;

//       if (savedToken === token) {
//         const accessToken = jwt.sign(
//           {
//             id: result[0].id,
//             name: result[0].name,
//             email: result[0].email,
//           },
//           process.env.ACCESS_SECRET,
//           {
//             expiresIn: "30m", // 유효기간 30분
//             issuer: "HHB", // 발행자
//           }
//         );

//         // token 전송 (쿠키를 통해)
//         res.cookie("accessToken", accessToken, {
//           // domain: "http://localhost:3000", //이거 썼더니, 3000도 여전히 안되고, 5000까지 안 돼버림.
//           // secure: true, //https와 http 차이를 명시 하는 것 (http면 false), 쿠키가 SSL이나 HTTPS 연결을 통해서만 반횐될지 여부를 명시하는 값 , false 줬더니 쿠키 안옴;
//           httpOnly: true, //JS와 http 중에 어디서 접근이 가능할지 지정하는 옵션으로, true를 주면 자바스크립트에서 쿠키의 접근이 불가능해짐!
//           // sameSite: "none", // + 쿠키가 같은 도메인에서만 접근할 수 있어야 하는지 여부를 결정하는 값
//         });

//         res.status(200).json("Access Token Recreated");
//       } else {
//         res.status(403).json("Diffrent Refresh Token");
//       }
//     }
//   });
// });
//===========================================================================================
//로그아웃 ===================================================================================
router.post("/logout", (req, res) => {
  // 추후 다른 요청들도 try catch 문으로 리팩토링 요망.
  try {
    const presentId = req.body.data.presentId;
    const sqlQuery = `UPDATE users SET refresh_token = null WHERE id = ?;`;
    db.query(sqlQuery, [presentId], (err, result) => {
      if (err) res.status(500).json(err);
      res.cookie("accessToken", "", {
        // domain: "http://localhost:3000", //이거 썼더니, 3000도 여전히 안되고, 5000까지 안 돼버림.
        // secure: true, //https와 http 차이를 명시 하는 것 (http면 false), 쿠키가 SSL이나 HTTPS 연결을 통해서만 반횐될지 여부를 명시하는 값 , false 줬더니 쿠키 안옴;
        httpOnly: true, //JS와 http 중에 어디서 접근이 가능할지 지정하는 옵션으로, true를 주면 자바스크립트에서 쿠키의 접근이 불가능해짐!
        // sameSite: "none", // + 쿠키가 같은 도메인에서만 접근할 수 있어야 하는지 여부를 결정하는 값
      });
      res.cookie("refreshToken", "", {
        // domain: "http://localhost:3000", //이거 썼더니, 3000도 여전히 안되고, 5000까지 안 돼버림.
        // secure: true, //https와 http 차이를 명시 하는 것 (http면 false), 쿠키가 SSL이나 HTTPS 연결을 통해서만 반횐될지 여부를 명시하는 값 , false 줬더니 쿠키 안옴;
        httpOnly: true, //JS와 http 중에 어디서 접근이 가능할지 지정하는 옵션으로, true를 주면 자바스크립트에서 쿠키의 접근이 불가능해짐!
        // sameSite: "none", // + 쿠키가 같은 도메인에서만 접근할 수 있어야 하는지 여부를 결정하는 값
      });
      res.status(200).json("Logout Seuccess");
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
//===========================================================================================
//회원가입 ===================================================================================
router.post("/signup", (req, res) => {
  try {
    const { id, pw, name, nickname, emailId, emailAddress, profileImage } =
      req.body.data.inputValue;
    const email = emailId + emailAddress;
    const { salt, hash } = hashPassword(pw);
    const profileImageValue = profileImage ? profileImage : null;
    // console.log(id, pw, name, nickname, emailId, emailAddress, profileImage);
    const sqlQuery =
      "INSERT INTO users(id,salt,hash,name,nickname,email,profile_image) VALUES(?,?,?,?,?,?,?);";
    db.query(
      sqlQuery,
      [id, salt, hash, name, nickname, email, profileImageValue],
      (err, result) => {
        if (err) res.status(500).json(err);
        res.status(200).json("Signup Success");
      }
    );
  } catch (error) {
    res.status(500).json(error);
  }
});
//===========================================================================================
//회원정보 수정 ==============================================================================
router.post("/editUserInfo", (req, res) => {
  // 추후 다른 요청들도 try catch 문으로 리팩토링 요망.
  try {
    const { id, pw, name, nickname, emailId, emailAddress, profileImage } =
      req.body.data.inputValue;
    const email = emailId + emailAddress;
    const profileImageValue = profileImage ? profileImage : null;
    if (pw) {
      const { salt, hash } = hashPassword(pw);
      const sqlQuery = `UPDATE users SET salt = ?, hash= ?,  name = ?, nickname = ?, email = ?, profile_image = ? WHERE id = ?;`;
      db.query(
        sqlQuery,
        [salt, hash, name, nickname, email, profileImageValue, id],
        (err, result) => {
          if (err) res.status(500).json(err);

          // access Token 발급
          //세가지의 인수를 받음 (1. 어떤 user 정보를 담을지, 2.시크릿값, 3.유효기간 및 발행자)
          const accessToken = jwt.sign(
            {
              id: id,
              name: name,
              nickname: nickname,
              email: email,
              profileImage: profileImageValue,
            },
            process.env.ACCESS_SECRET,
            {
              expiresIn: "30m", // 유효기간 30분
              issuer: "HHB", // 발행자
            }
          );

          // token 전송 (쿠키를 통해)
          res.cookie("accessToken", accessToken, {
            // domain: "http://localhost:3000", //이거 썼더니, 3000도 여전히 안되고, 5000까지 안 돼버림.
            // secure: true, //https와 http 차이를 명시 하는 것 (http면 false), 쿠키가 SSL이나 HTTPS 연결을 통해서만 반횐될지 여부를 명시하는 값 , false 줬더니 쿠키 안옴;
            httpOnly: true, //JS와 http 중에 어디서 접근이 가능할지 지정하는 옵션으로, true를 주면 자바스크립트에서 쿠키의 접근이 불가능해짐!
            // sameSite: "none", // + 쿠키가 같은 도메인에서만 접근할 수 있어야 하는지 여부를 결정하는 값
          });

          res.status(200).json("Access Token Recreated");
        }
      );
    } else {
      const sqlQuery = `UPDATE users SET name = ?, nickname = ?, email = ?, profile_image = ? WHERE id = ?;`;
      db.query(
        sqlQuery,
        [name, nickname, email, profileImageValue, id],
        (err, result) => {
          if (err) res.status(500).json(err);

          // access Token 발급
          //세가지의 인수를 받음 (1. 어떤 user 정보를 담을지, 2.시크릿값, 3.유효기간 및 발행자)
          const accessToken = jwt.sign(
            {
              id: id,
              name: name,
              nickname: nickname,
              email: email,
              profileImage: profileImageValue,
            },
            process.env.ACCESS_SECRET,
            {
              expiresIn: "30m", // 유효기간 30분
              issuer: "HHB", // 발행자
            }
          );

          // token 전송 (쿠키를 통해)
          res.cookie("accessToken", accessToken, {
            // domain: "http://localhost:3000", //이거 썼더니, 3000도 여전히 안되고, 5000까지 안 돼버림.
            // secure: true, //https와 http 차이를 명시 하는 것 (http면 false), 쿠키가 SSL이나 HTTPS 연결을 통해서만 반횐될지 여부를 명시하는 값 , false 줬더니 쿠키 안옴;
            httpOnly: true, //JS와 http 중에 어디서 접근이 가능할지 지정하는 옵션으로, true를 주면 자바스크립트에서 쿠키의 접근이 불가능해짐!
            // sameSite: "none", // + 쿠키가 같은 도메인에서만 접근할 수 있어야 하는지 여부를 결정하는 값
          });

          res.status(200).json("Access Token Recreated");
        }
      );
    }
  } catch (error) {
    res.status(500).json(error);
  }
});
//===========================================================================================
// 사용자별 인증 코드를 저장하는 객체 ==========================================================
const verificationCodes = {};
// let verificationCode = ""; <= 이와 같이 단일 변수로 할 경우 동시성 문제 발생.
//===========================================================================================
//이메일 인증코드 전송 ========================================================================
// verificationCode 변수를 서버 측에서 공유하여 클라이언트의 입력과 비교하는 방식은 보안상 취약합니다.
// 이 부분은 안전한 방식으로 구현해야 합니다. 예를 들어, 클라이언트에게 이메일로 전송된 인증 링크를 클릭하도록 하고,
// 해당 링크에는 고유한 인증 토큰을 포함시켜서 서버에서 유효성을 검사하는 방식이 일반적으로 사용됩니다. <== 추후 리팩토링 해보기

// 비동기 제대로짚고 넘어가기 ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
router.post("/sendEmail", (req, res) => {
  // 동적으로 nanoid 모듈 가져오기
  try {
    const { emailId, emailAddress } = req.body.data;

    // 수신자 이메일 주소
    const recipientEmail = `${emailId}${emailAddress}`;

    const sqlQuery = `SELECT email FROM users WHERE email=?`;
    db.query(sqlQuery, [recipientEmail], async (err, result) => {
      if (err) res.status(500).json(err);
      if (result.length === 0) {
        // SMTP 전송 설정
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        //================================================================================
        const generateVerificationCodeAndSendEmail = async () => {
          // 인증 코드 생성 로직
          verificationCodes[recipientEmail] = Math.floor(
            1000 + Math.random() * 9000
          );

          // 10분 경과 후 해당 키 삭제
          setTimeout(() => {
            delete verificationCodes[recipientEmail];
          }, 6000000);

          // 이메일 전송
          await sendEmail(recipientEmail, verificationCodes[recipientEmail]);
        };

        // 이메일 전송 함수
        const sendEmail = async (recipientEmail, verificationCode) => {
          try {
            const mailOptions = {
              from: process.env.SMTP_USER,
              to: recipientEmail,
              subject: "RE:LOADING 이메일 인증 코드",
              // text: `
              //   다음 인증코드를 사이트의 입력란이 입력해주세요.
              //   인증 코드: ${verificationCode}
              //   본 인증 코드는 발급 기준 10분뒤 만기됩니다.
              // `,

              html: `
              <table style="width: 100%; max-width: 600px; margin: 0 auto;">
              <tr>
              <td style="text-align: center; background-color: #f5f5f5; padding-bottom: 50px; border-radius: 10px;">
              <img src="https://res.cloudinary.com/dh6tdcdyj/image/upload/v1685938086/logoBg_lmdhiz.png" alt="로고 이미지" style=" border-radius: 10px; margin-bottom:30px">
                  <p style="font-size:20px; line-height:50px; color: #148888; font-weight:900;">다음 인증코드를 사이트의 입력란에 입력해주세요.</p>
                  <p>인증코드 : <span style="font-size:20px; line-height:50px; color: #148888; font-weight:900;">${verificationCode}</span></p>
                  <p style="font-size:20px; line-height:50px; color: #148888; font-weight:900;">본 인증 코드는 발급 기준 10분뒤 만기됩니다.</p>
                  <br/>
                </td>
              </tr>
            </table>
        `,
            };

            const response = await transporter.sendMail(mailOptions);

            console.log("이메일이 성공적으로 전송되었습니다.", response);
            res.status(200).json("Send Complete");
          } catch (error) {
            console.error("이메일 전송 중 오류가 발생했습니다.", error);
            res.status(500).json(error);
          }
        };
        // 실행
        await generateVerificationCodeAndSendEmail();

        // 비동기 설명 ======================
        // 위 코드에서 비동기 부분은 다음과 같은 부분들이 있습니다:
        // 데이터베이스 쿼리: db.query 함수를 사용하여 데이터베이스에 쿼리를 전송합니다. 이 함수는 비동기적으로 동작하며, 콜백 함수를 사용하여 쿼리 결과를 처리합니다. 여기서는 async (err, result) => { ... } 형태로 콜백 함수를 정의하여 에러와 결과를 처리합니다.
        // 이메일 전송 함수: sendEmail 함수는 nodemailer 라이브러리를 사용하여 이메일을 전송합니다. 이 함수는 async 키워드로 정의되어 있으며, 내부에서 await 키워드를 사용하여 이메일 전송이 완료될 때까지 기다립니다. 이렇게 함으로써 이메일 전송이 완료되기 전에 다음 동작이 실행되지 않도록 합니다.
        // 코드 실행: generateVerificationCodeAndSendEmail 함수는 await 키워드로 호출됩니다. 이 함수 내부에서는 비동기적으로 인증 코드를 생성하고 이메일을 전송합니다. await 키워드를 사용하여 sendEmail 함수가 완료될 때까지 기다립니다.
        // 따라서, 데이터베이스 쿼리와 이메일 전송은 비동기적으로 동작하며, 이를 처리하기 위해 콜백 함수와 async/await를 사용하여 순서를 제어하고 응답을 처리합니다. 이를 통해 코드의 실행 흐름을 유지하면서 비동기 작업이 완료될 때까지 기다릴 수 있습니다.

        //========================================
      } else {
        res.status(400).json("Aready Used Email");
      }
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
//===========================================================================================
//입력한 인증코드 검증 ========================================================================
router.post(
  "/verifyEmail",
  /* async */ (req, res) => {
    try {
      const { inputCode, emailId, emailAddress } = req.body.data;

      if (
        parseInt(inputCode) === verificationCodes[`${emailId}${emailAddress}`]
      ) {
        res.status(200).json("Valid Code");
      } else {
        res.status(400).json("Invalid Code"); // 틀렸을 때는 상태 코드 400을 반환하는 것이 적합
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }
);
//===========================================================================================
// 아이디 찾기 이메일 발송 ====================================================================

router.post("/sendFindIdEmail", (req, res) => {
  try {
    // 이메일 전송
    const recipientEmail = req.body.data.inputEmail;
    const sqlQuery = `SELECT id From users WHERE email = ?`;
    db.query(sqlQuery, [recipientEmail], (err, result) => {
      if (err) res.status(500).json(err);
      if (result.length === 0) {
        res.status(403).json("Not Exist Email");
      } else {
        console.log(result[0].id);

        // SMTP 전송 설정
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        // 이메일 전송 함수
        const sendEmail = async (recipientEmail, foundId) => {
          try {
            const mailOptions = {
              from: process.env.SMTP_USER,
              to: recipientEmail,
              subject: "RE:LOADING 아이디 찾기 결과",
              //     text: `
              //     RE:LOADING을 다시 찾아주셔서 감사합니다.

              //     문의하신 회원님의 아이디는 "${foundId}"입니다.
              // `,
              html: `
              <table style="width: 100%; max-width: 600px; margin: 0 auto;">
              <tr>
              <td style="text-align: center; background-color: #f5f5f5; padding-bottom: 50px; border-radius: 10px;">
              <img src="https://res.cloudinary.com/dh6tdcdyj/image/upload/v1685938086/logoBg_lmdhiz.png" alt="로고 이미지" style=" border-radius: 10px; margin-bottom:30px">
              <p style="font-size:20px; line-height:50px; color: #148888; font-weight:900;">RE:LOADING을 다시 찾아주셔서 감사합니다.</p>
              <p>문의하신 회원님의 아이디는 " <span style="font-size:20px; line-height:50px; color: #148888; font-weight:900;">${foundId}</span> " 입니다.</p>
              <br/>
                      <br/>
                      <a href="/" style="text-align: center; padding: 10px 20px; background: #148888; border-radious:5px; color:#f5f5f5; margin:20px">RE:ROADING 으로 바로 이동하기</a>
                      <br/>
            </td>
          </tr>
        </table>
    `,
            };

            const response = await transporter.sendMail(mailOptions);

            console.log("이메일이 성공적으로 전송되었습니다.", response);
            res.status(200).json("Send Complete");
          } catch (error) {
            console.error("이메일 전송 중 오류가 발생했습니다.", error);
            res.status(500).json(error);
          }
        };

        // 실행
        // 이메일 전송
        sendEmail(recipientEmail, result[0].id);
      }
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

//=======================================================================================
// 비밀번호 찾기 이메일 발송 ==============================================================
router.post("/sendFindPwEmail", async (req, res) => {
  try {
    const recipientEmail = req.body.data.inputEmail;

    const generateUniquePw = async () => {
      // 동적으로 nanoid 모듈 가져오기
      const { nanoid } = await import("nanoid");
      return nanoid(10);
    };

    // 임시 비밀번호로 DB 데이터 교체.
    const tempPw = await generateUniquePw(); // generateUniqueId() 함수가 완료될 때까지 기다립니다
    const { salt, hash } = hashPassword(tempPw);
    const sqlQuery1 = `UPDATE users SET salt=?, hash=? WHERE email = ?`;
    db.query(sqlQuery1, [salt, hash, recipientEmail], (err, result) => {
      if (err) res.status(500).json(err);

      // 이메일 전송
      const sqlQuery2 = `SELECT id From users WHERE email = ?`;
      db.query(sqlQuery2, [recipientEmail], (err, result) => {
        if (err) res.status(500).json(err);
        if (result.length === 0) {
          res.status(403).json("Not Exist Email");
        } else {
          console.log(result[0].id);

          // SMTP 전송 설정
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          // 이메일 전송 함수
          const sendEmail = async (recipientEmail, tempPw) => {
            try {
              const mailOptions = {
                from: process.env.SMTP_USER,
                to: recipientEmail,
                subject: "RE:LOADING 임시 비밀번호 발송",
                //       text: `
                //     RE:LOADING을 다시 찾아주셔서 감사합니다.

                //     문의하신 회원님의 임시 비밀번호는 " ${tempPw} "입니다.

                //     계정의 보안을 위해 임시 비밀번호로 로그인 후 비밀번호를 반드시 변경하시기 바랍니다.
                // `,
                html: `
                <table style="width: 100%; max-width: 600px; margin: 0 auto;">
                <tr>
                <td style="text-align: center; background-color: #f5f5f5; padding-bottom: 50px; border-radius: 10px;">
                <img src="https://res.cloudinary.com/dh6tdcdyj/image/upload/v1685938086/logoBg_lmdhiz.png" alt="로고 이미지" style=" border-radius: 10px; margin-bottom:30px">
              <p style="font-size:20px; line-height:50px; color: #148888; font-weight:900;">RE:LOADING을 다시 찾아주셔서 감사합니다.</p>
              <p>문의하신 회원님의 임시 비밀번호는 " <span style="font-size:20px; line-height:50px; color: #148888; font-weight:900;">${tempPw}</span> " 입니다.</p>
              <p style="font-size:20px; line-height:50px; color: #148888; font-weight:900;"> 계정의 보안을 위해 임시 비밀번호로 로그인 후 비밀번호를 반드시 변경하시기 바랍니다.</p>
              <br/>
                      <br/>
                      <a href="/" style="text-align: center; padding: 10px 20px; background: #148888; border-radious:5px; color:#f5f5f5; margin:20px">RE:ROADING 으로 바로 이동하기</a>
                      <br/>
            </td>
          </tr>
        </table>
    `,
              };

              const response = await transporter.sendMail(mailOptions);

              console.log("이메일이 성공적으로 전송되었습니다.", response);
              res.status(200).json("Send Complete");
            } catch (error) {
              console.error("이메일 전송 중 오류가 발생했습니다.", error);
              res.status(500).json(error);
            }
          };

          // 실행
          // 이메일 전송
          sendEmail(recipientEmail, tempPw);
        }
      });
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
// =====================================================================================
// 이메일 서비스 요청 ====================================================================
router.post("/emailServiceEnabled", (req, res) => {
  try {
    const presentId = req.body.data.presentId;
    const sqlQuery = `UPDATE users SET email_service_enabled = TRUE WHERE id = ?;`;
    db.query(sqlQuery, [presentId], (err, result) => {
      if (err) res.status(500).json(err);
      res.status(200).json("emailServiceEnabled Seuccess");
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
//=======================================================================================
// 이메일 서비스 요청 취소 =================================================================
router.post("/emailServiceDisabled", (req, res) => {
  try {
    const presentId = req.body.data.presentId;
    const sqlQuery = `UPDATE users SET email_service_enabled = FALSE WHERE id = ?;`;
    db.query(sqlQuery, [presentId], (err, result) => {
      if (err) res.status(500).json(err);
      res.status(200).json("emailServiceDisabled Seuccess");
    });
  } catch (error) {
    res.status(500).json(error);
  }
});
//=======================================================================================
// 방문자 수 조회 ========================================================================
router.get("/visitorCnt", (req, res) => {
  const sqlQuery = `SELECT sum(today_visit_cnt), sum(total_visit_cnt) FROM users`;
  db.query(sqlQuery, (err, result) => {
    if (err) {
      res.status(500).json(err);
    } else {
      const todayVisitCnt = result[0]["sum(today_visit_cnt)"];
      const totalVisitCnt = result[0]["sum(total_visit_cnt)"];
      const visitorCnt = {
        today: todayVisitCnt,
        total: totalVisitCnt,
      };
      res.status(200).json(visitorCnt);
    }
  });
});
//=======================================================================================
// 개발 제안 메일 전송 ====================================================================
router.post("/sendSuggest", (req, res) => {
  try {
    // 이메일 전송
    const { presentUserInfo, text } = req.body.data;

    // SMTP 전송 설정
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 이메일 전송 함수
    const sendEmail = async (presentUserInfo, text) => {
      try {
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: "bcl0206@gmail.com",
          subject: "RE:LOADING 회원님의 소중한 의견이 도착하였습니다.",
          html: `
              <table style="width: 100%; max-width: 600px; margin: 0 auto;">
              <tr>
              <td style="text-align: center; background-color: #f5f5f5; padding-bottom: 50px; border-radius: 10px;">
              <img src="https://res.cloudinary.com/dh6tdcdyj/image/upload/v1685938086/logoBg_lmdhiz.png" alt="로고 이미지" style=" border-radius: 10px; margin-bottom:30px">
              <p style="font-size:20px; line-height:50px; color: #148888; font-weight:900;">회원님의 소중한 의견이 도착하였습니다</p>
              <p> 발신자 id : ${presentUserInfo.id} </p>
              <p> 발신자 성명 : ${presentUserInfo.name}</p>
              <p> 발신자 닉네임 : ${presentUserInfo.nickname}</p>
              <p> 발신자 이메일 : ${presentUserInfo.email}</p>
              <p> 본문</p>
              <p> ${text}</p>
              <br/>
                      <br/>
                      <a href="/" style="text-align: center; padding: 10px 20px; background: #148888; border-radious:5px; color:#f5f5f5; margin:20px">RE:ROADING 으로 바로 이동하기</a>
                      <br/>
            </td>
          </tr>
        </table>
    `,
        };

        const response = await transporter.sendMail(mailOptions);

        console.log("이메일이 성공적으로 전송되었습니다.", response);
        res.status(200).json("Send Complete");
      } catch (error) {
        console.error("이메일 전송 중 오류가 발생했습니다.", error);
        res.status(500).json(error);
      }
    };

    // 실행
    // 이메일 전송
    sendEmail(presentUserInfo, text);
  } catch (error) {
    res.status(500).json(error);
  }
});

//=======================================================================================
module.exports = router;
