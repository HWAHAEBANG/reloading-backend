require("dotenv").config();
const mysql = require("mysql");
const connectDB = {
  init: () => {
    return mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });
  },
  open: (con) => {
    con.connect((err) => {
      if (err) {
        console.log("mysql 연결 실패", err);
      } else {
        console.log("mysql 연결성공");
      }
    });
  },
  close: (con) => {
    con.end((err) => {
      if (err) {
        console.log("mysql 종료 실패", err);
      } else {
        console.log("mysql 종료!");
      }
    });
  },
};

module.exports = connectDB;
