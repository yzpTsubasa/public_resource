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

function formatMilliSeconds(milliseconds, full) {
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

function formatMinutes(minutes) {
  return formatMilliSeconds(minutes * 60 * 1000);
}

function formatTime(date) {
  return date
    ? date.toLocaleTimeString(undefined, { timeStyle: "short" })
    : "未打卡";
}
