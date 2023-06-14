const schedule = require("node-schedule");

const refetchRule = new schedule.RecurrenceRule();
refetchRule.dayOfWeek = [6]; // 0:일 1:월 2:화 3:수 4:목 5:금  6:토
refetchRule.hour = 4;
refetchRule.minute = 0;

module.exports = refetchRule;
