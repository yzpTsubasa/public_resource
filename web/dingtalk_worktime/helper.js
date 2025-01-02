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
  // 获取两个日期的周一日期
  const monday1 = getMonday(new Date(date1));
  const monday2 = getMonday(new Date(date2));
  // 比较两个周一日期是否相同
  return monday1.getTime() === monday2.getTime();
}

function getMonday(date) {
  // 获取当前日期的星期几（0表示周日，1表示周一，...，6表示周六）
  const day = date.getDay();
  // 计算当前日期到本周一的偏移量
  const diff = (day + 6) % 7;
  const monday = new Date(date.getTime() - diff * 24 * 60 * 60 * 1000);
  monday.setHours(0, 0, 0, 0);
  return monday;
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
