const input_dingtalk = document.getElementById("input_dingtalk");
const status_wrapper = document.getElementById("status_wrapper");
const input_worktime_per_day = document.getElementById(
  "input_worktime_per_day"
);
const btn_read_clipboard = document.getElementById("btn_read_clipboard");

// 启用tooltips
const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);

// 监听 input_dingtalk 文本变化
input_dingtalk.addEventListener("input", function () {
  processDingTalkInput();
});
input_worktime_per_day.addEventListener("input", function () {
  processDingTalkInput();
});
btn_read_clipboard.addEventListener("click", function () {
  input_dingtalk.value = "";
  clearStatus();
  // 网页获取剪切板内容
  if (!navigator.clipboard) {
    addStatus("不支持自动读取剪贴板,请手动粘贴到输入框", "danger");
    return;
  }
  navigator.clipboard
    .readText()
    .then((text) => {
      input_dingtalk.value = text;
      processDingTalkInput();
    })
    .catch((err) => {
      addStatus("无法读取剪贴板内容：" + err, "danger");
    });
});
let hasNotificationPermission = false;
let notificationTimer;
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
function processDingTalkInput() {
  updateNotificationPermission();
  processDingTalkWorktime(input_dingtalk.value, input_worktime_per_day.value);
}

function addStatus(message, style = "black") {
  status_wrapper.innerHTML += `<p class=text-${style}>${message}</p>`;
}
function clearStatus() {
  status_wrapper.innerHTML = "";
}
function processDingTalkWorktime(content, worktimePerDay) {
  clearStatus();
  const matches = content.matchAll(
    /(\d{2}):(\d{2}) (上班|下班)打卡·成功班次时间(\d{2})月(\d{2})日 \d{2}:\d{2}.*?(\d{4})年(\d{2})月(\d{2})日/g
  );

  let begTime;
  let endTime;
  const history = [];
  let isNewDay = false;
  let tmp;
  for (const match of matches) {
    const args = match.slice(1);
    const [hour, minute, type, month, day, year] = args;
    const time = new Date(year, month - 1, day, hour, minute);
    if (type === "上班") {
      if (isNewDay) {
        history.pop();
      }
      begTime = time;
      isNewDay = true;
      tmp = {
        begTime,
        workTimeInMinutes: 0,
      };
      history.push(tmp);
    } else {
      if (!isSameDay(begTime, time)) {
        addStatus(
          `打卡记录不完整: <br> 上班:${
            begTime?.toLocaleString() || "无"
          }<br>下班:${time?.toLocaleString() || "无"} `,
          "danger"
        );
        continue;
      }
      endTime = time;
      const workTime = endTime.getTime() - begTime.getTime();
      const workTimeInMinutes = Math.ceil(workTime / 1000 / 60);
      tmp.endTime = endTime;
      tmp.workTimeInMinutes = workTimeInMinutes;
      isNewDay = false;
    }
  }
  history.forEach((item) => {
    // 每日打卡情况
    const { begTime, endTime, workTimeInMinutes } = item;
    const date = (begTime || endTime).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const total =
      begTime && endTime
        ? ` (${formatMilliSeconds(endTime.getTime() - begTime.getTime())})`
        : "";
    addStatus(
      `[${date}] ${formatTime(begTime)} > ${formatTime(endTime)} ${total}`
    );
  });

  const totalWorkTimeInMinutes = history.reduce(
    (acc, cur) => acc + cur.workTimeInMinutes,
    0
  );
  const totalWorkTimeFormated = formatMinutes(totalWorkTimeInMinutes);
  const needWorkTimeInMinutes = worktimePerDay * 60 * history.length;
  addStatus(
    `总工时: ${totalWorkTimeFormated}/${formatMinutes(
      needWorkTimeInMinutes
    )}(共${history.length}天)`
  );
  const diff = needWorkTimeInMinutes - totalWorkTimeInMinutes;
  if (diff > 0) {
    addStatus(`还需: ${formatMinutes(diff)}`);
    const lastDay = history[history.length - 1];
    if (lastDay && !lastDay.endTime) {
      const needEndTime = new Date(
        lastDay.begTime.getTime() + diff * 60 * 1000
      );
      addStatus(`建议下班打卡时间: ${needEndTime.toLocaleString()}`, "success");
      const leftTime = needEndTime.getTime() - Date.now();
      if (leftTime > 0 && hasNotificationPermission) {
        notificationTimer && clearTimeout(notificationTimer);
        notificationTimer = setTimeout(() => {
          new Notification(`建议下班打卡时间: ${needEndTime.toLocaleTimeString()}`, {
            icon: "./favicon.png"
          })
        }, leftTime);
        addStatus(`将在 ${formatMilliSeconds(leftTime)} 后提醒`, "success");
      }
    }
  }
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

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const minutesLeft = minutes % 60;
  if (minutesLeft) {
    return `${hours}小时${minutesLeft}分钟`;
  }
  return `${hours}小时整`;
}

function formatMilliSeconds(milliseconds) {
  return formatMinutes(Math.floor(milliseconds / 1000 / 60));
}

function formatTime(date) {
  return date ? date.toLocaleTimeString() : "无";
}
