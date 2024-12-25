let hasNotificationPermission = false;
function updateNotificationPermission() {
  hasNotificationPermission =
    window.Notification && Notification.permission === "granted";
  if (window.Notification && Notification.permission !== "granted") {
    Notification.requestPermission(function (status) {
      hasNotificationPermission = status === "granted";
      if (!hasNotificationPermission) {
        addStatus("无法获取通知权限", "warning");
      }
    });
  }
}

function Q(selector) {
  return document.querySelector(selector);
}

/**
 * 是否为同一天
 * @param {Date} date1
 * @param {Date} date2
 * @returns
 */
function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/** 是否为相邻天 */
function isContinuousDay(date1, date2) {
  if (!date1 || !date2) return false;
  var newDate = new Date(date1.getTime() + 24 * 60 * 60 * 1000);
  return isSameDay(newDate, date2);
}

/** 获取指定日期是这一年的第几周 */
function getDateWeek(date) {
  const januaryFirst = new Date(date.getFullYear(), 0, 1);
  const daysToNextMonday =
    januaryFirst.getDay() === 1 ? 0 : (7 - januaryFirst.getDay()) % 7;
  const nextMonday = new Date(
    date.getFullYear(),
    0,
    januaryFirst.getDate() + daysToNextMonday
  );

  return date < nextMonday
    ? 52
    : date > nextMonday
    ? Math.ceil((date - nextMonday) / (24 * 3600 * 1000) / 7)
    : 1;
}

/** 判断两个日期是否为同一周内的日期 */
function isSameWeek(date1, date2) {
  if (!date1 || !date2) return false;
  const year1 = date1.getFullYear();
  const year2 = date2.getFullYear();
  if (year1 !== year2) return false;
  const week1 = getDateWeek(date1);
  const week2 = getDateWeek(date2);
  return week1 === week2;
}

function formatMilliSeconds(milliseconds, full, signed = false) {
  var isNegative = milliseconds < 0;
  milliseconds = Math.abs(milliseconds);
  return (isNegative ? '-' : (signed ? '+' : '')) + _formatMilliSeconds(milliseconds, full);
}

function _formatMilliSeconds(milliseconds, full) {
  // 如果大于1小时,则显示小时和分钟
  if (milliseconds > 60 * 60 * 1000) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    if (!full) {
      return `${hours}小时${minutes}分钟`;
    } else {
      const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
      return `${hours}小时${minutes}分钟${seconds}秒`;
    }
  }
  // 如果大于1分钟，则显示分钟和秒数
  if (milliseconds > 60 * 1000) {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}分钟${seconds}秒`;
  }
  // 否则，直接显示秒数
  return `${Math.floor(milliseconds / 1000)}秒`;
}

function formatMinutes(minutes, full, signed) {
  return formatMilliSeconds(minutes * 60 * 1000, full, signed);
}

function formatTime(date, isRemake) {
  return date
    ? (date.toLocaleTimeString(undefined, { timeStyle: "short" }) + (isRemake? "(补)" : ""))
    : "未打卡";
}

/** 补全数字到指定位数 */
function pad(num, size, padChar = "0") {
  let s = num + "";
  while (s.length < size) s = padChar + s;
  return s;
}
