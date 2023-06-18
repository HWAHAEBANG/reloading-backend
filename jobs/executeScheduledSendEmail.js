const schedule = require("node-schedule");
const nodemailer = require("nodemailer");
// DB 연결부 ================================================================================
const connectDB = require("../config/connectDB.js");
const db = connectDB.init();
//===========================================================================================
// rule =====================================================================================
const sendEmailRule = new schedule.RecurrenceRule();
// rule.dayOfWeek = [1]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
sendEmailRule.hour = 7;
sendEmailRule.minute = 0;
//===========================================================================================
//job================================================================================

const executeScheduledSendEmail = () => {
  console.log(
    "업데이트 데이터 알림 메일 전송 작업이 정상적으로 실행되었습니다. "
  );

  const jobSendUpdateEmail = schedule.scheduleJob(sendEmailRule, function () {
    console.log(
      "현재시간 07시 00분 업데이트 데이터 알림 메일 전송을 시작합니다. "
    );
    try {
      //=================================================

      // 오늘 일자에 업데이트된 내용이 있는지 확인하고 있으면 메일전송
      const checkSqlQuery =
        "SELECT * FROM data_update_logs WHERE update_type <> 'refetch'";
      db.query(checkSqlQuery, async (err, result) => {
        if (err) return console.log("DB 정보를 불러올 수 없음", err);

        const currentDate = new Date().toLocaleDateString("ko-KR");

        const todayUpdatedList = result.filter((item) => {
          return item.created_at.toLocaleDateString("ko-KR") === currentDate;
        });

        if (todayUpdatedList.length === 0) {
          return console.log(
            "업데이트된 데이터가 없습니다. 스케줄을 종료합니다."
          );
        } else {
          //=============================================================================================================

          //==============================================
          const userListSqlQuery =
            "SELECT nickname, email FROM users WHERE email_service_enabled = TRUE;";
          db.query(userListSqlQuery, async (err, result) => {
            if (err) return console.log("DB 정보를 불러올 수 없음", err);

            const emailRecipients = result.reduce((acc, cur) => {
              acc.push(cur.email);
              return acc;
            }, []);

            //==========================================
            // SMTP 전송 설정
            const transporter = nodemailer.createTransport({
              host: "smtp.gmail.com",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            });
            //============================================
            // 이메일 전송
            const generateVerificationCodeAndSendEmail = async () => {
              await sendEmail(emailRecipients, todayUpdatedList);
            };

            // 이메일 전송 함수
            const sendEmail = async (emailRecipients, todayUpdatedList) => {
              try {
                const mailOptions = {
                  from: process.env.SMTP_USER,
                  to: emailRecipients.join(","),
                  subject: `[RE:LOADING] ${currentDate} 데이터 업데이트 알림 서비스`,
                  // text로 할 경우 ===
                  //     text: `
                  //   ${today}의 데이터 업데이트 내역이 ${
                  //       todayUpdatedList.length
                  //     }건 있습니다.
                  //   ${todayUpdatedList.map((item) => item.message).join("<br>")}
                  // `,
                  // html로 할 경우 ===
                  html: `
                  <table style="width: 100%; max-width: 600px; margin: 0 auto;">
                  <tr>
                  <td style="text-align: center; background-color: #f5f5f5; padding-bottom: 50px; border-radius: 10px;">
                  <img src="https://res.cloudinary.com/dh6tdcdyj/image/upload/v1685938086/logoBg_lmdhiz.png" alt="로고 이미지" style=" border-radius: 10px; margin-bottom:30px">
                      <p style="font-size:20px; line-height:50px; color: #148888; font-weight:900;">${currentDate} 일자의 데이터 업데이트 내역이 ${
                    todayUpdatedList.length
                  }건 있습니다.</p>
                      <ul>
                        ${todayUpdatedList
                          .map(
                            (item) =>
                              `<p style="font-size:15px; line-height:30px"><span style="font-weight:700; color: #148888;">${
                                item.message.split(":")[0]
                              }</span> : <span>${item.message
                                .split(":")
                                .slice(1)}</span></p>`
                          )
                          .join("")}
                      </ul>
                      <br/>
                      <br/>
                      <a href="/" style="text-align: center; padding: 10px 20px; background: #148888; border-radious:5px; color:#f5f5f5; margin:20px">RE:ROADING 으로 바로 이동하기</a>
                    </td>
                  </tr>
                </table>
            `,
                };

                const response = await transporter.sendMail(mailOptions);

                console.log("이메일이 성공적으로 전송되었습니다.", response);
                // res.status(200).json("Send Complete");
              } catch (error) {
                console.error("이메일 전송 중 오류가 발생했습니다.", error);
                // res.status(500).json(error);
              }
            };
            // 실행
            await generateVerificationCodeAndSendEmail();
          });

          //=============================================================================================================
        }
      });
    } catch (error) {
      console.log("axios 에러", error);
    }
  });
};

module.exports = executeScheduledSendEmail;
