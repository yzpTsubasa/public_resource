const LOCAL_STORAGE_KEY = {
  DINGTALK_CFG: "DINGTALK_CFG",
};
var needEndTime = null;
var hasNotified = false;
setInterval(() => {
  updateTimer();
}, 1000);
// 启用tooltips
const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);
var localCfg = localStorage.getItem(LOCAL_STORAGE_KEY.DINGTALK_CFG);
if (localCfg) {
  localCfg = JSON.parse(localCfg);
  Q("#input_dingtalk").value = localCfg.dingtalk;
  Q("#input_worktime_per_day").value = localCfg.worktime_per_day;
  Q("#switch_filter").checked = localCfg.filter;
  Q("#input_worktime_begin").value = localCfg.worktime_begin || "08:30";
  Q("#input_alert_forward").value = localCfg.alert_forward || 5;
  this.processDingTalkInput();
}
// 监听 Q("#input_dingtalk") 文本变化
Q("#input_dingtalk").addEventListener("input", function () {
  processDingTalkInput();
});
Q("#input_worktime_per_day").addEventListener("input", function () {
  processDingTalkInput();
});
Q("#switch_filter").addEventListener("change", function () {
  processDingTalkInput();
});
Q("#input_worktime_begin").addEventListener("input", function () {
  processDingTalkInput();
});
Q("#input_alert_forward").addEventListener("input", function () {
  processDingTalkInput();
});
Q("#btn_read_clipboard").addEventListener("click", function () {
  Q("#input_dingtalk").value = "";
  clearStatus();
  // 网页获取剪切板内容
  if (!navigator.clipboard) {
    addStatus("不支持自动读取剪贴板,请手动粘贴到输入框", "danger");
    return;
  }
  navigator.clipboard
    .readText()
    .then((text) => {
      Q("#input_dingtalk").value = text;
      processDingTalkInput();
    })
    .catch((err) => {
      addStatus("无法读取剪贴板内容：" + err, "danger");
    });
});

function setLocalCfg() {
  var cfg = {
    dingtalk: Q("#input_dingtalk").value,
    worktime_per_day: Q("#input_worktime_per_day").value,
    filter: Q("#switch_filter").checked,
    worktime_begin: Q("#input_worktime_begin").value,
    alert_forward: Q("#input_alert_forward").value,
  };
  localStorage.setItem(LOCAL_STORAGE_KEY.DINGTALK_CFG, JSON.stringify(cfg));
}
function processDingTalkInput() {
  setLocalCfg();
  updateNotificationPermission();
  processDingTalkWorktime(
    Q("#input_dingtalk").value,
    Q("#input_worktime_per_day").value,
    Q("#switch_filter").checked,
    Q("#input_worktime_begin").value,
    Q("#input_alert_forward").value
  );
}

function addStatus(message, type = "secondary") {
  Q("#status_wrapper").innerHTML += `<p class="text-${type}">${message}</p>`;
}
function clearStatus() {
  Q("#status_wrapper").innerHTML = "";
}
function processDingTalkWorktime(
  content,
  worktimePerDay,
  filter,
  reqBegin,
  alertForward
) {
  needEndTime = null;
  clearStatus();
  const matches = Array.from(content.matchAll(
    /(\d{2}):(\d{2}) (上班|下班)打卡·成功班次时间(\d{2})月(\d{2})日 \d{2}:\d{2}.*?(\d{4})年(\d{2})月(\d{2})日/g
  )).toSorted((a, b) => {
    const [hourA, minuteA, typeA, monthA, dayA, yearA] = a.slice(1);
    const [hourB, minuteB, typeB, monthB, dayB, yearB] = b.slice(1);
    return yearA - yearB
      || monthA - monthB
      || dayA - dayB
      || hourA - hourB
      || minuteA - minuteB;
  });

  let begTime;
  let endTime;
  const history = [];
  let isNewDay = false;
  let tmp;
  const [reqBeginHour, reBeginMinute] = (reqBegin || "00:00")
    .split(":")
    .map((v) => +v);
  for (const match of matches) {
    const args = match.slice(1);
    const [hour, minute, type, month, day, year] = args;
    let time = new Date(year, month - 1, day, hour, minute);
    if (type === "上班") {
      if (isNewDay) {
        history.pop();
      }
      var reqBeginTime = new Date(
        year,
        month - 1,
        day,
        reqBeginHour,
        reBeginMinute
      );
      if (reqBeginTime.getTime() > time.getTime()) {
        begTime = reqBeginTime;
      } else {
        begTime = time;
      }

      isNewDay = true;
      tmp = {
        begTime,
        realBegTime: time,
        workTimeInMinutes: 0,
      };
      history.push(tmp);
    } else {
      if (!isSameDay(begTime, time)) {
        addStatus(
          `打卡记录不完整: <br> 上班:${
            begTime?.toLocaleString() || "未打卡"
          }<br>下班:${time?.toLocaleString() || "未打卡"} `,
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
  // 过滤非相邻天数
  var filteredHistory = [];
  if (filter) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (
        i == history.length - 1 ||
        isContinuousDay(history[i].begTime, history[i + 1].begTime)
      ) {
        filteredHistory.unshift(history[i]);
        continue;
      }
      break;
    }
  } else {
    filteredHistory = history;
  }
  filteredHistory.forEach((item) => {
    // 每日打卡情况
    const { begTime, endTime, workTimeInMinutes, realBegTime } = item;
    const date = (begTime || endTime).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const total =
      begTime && endTime
        ? ` (${formatMilliSeconds(endTime.getTime() - begTime.getTime())})`
        : "";
    if (realBegTime != begTime) {
      addStatus(
        `[${date}] ${formatTime(begTime)}<span class="text-danger">[${formatTime(realBegTime)}]</span>~${formatTime(endTime)} ${total}`
      );
    } else {
      addStatus(
        `[${date}] ${formatTime(begTime)}~${formatTime(endTime)} ${total}`
      );
    }
  });

  const totalWorkTimeInMinutes = filteredHistory.reduce(
    (acc, cur) => acc + cur.workTimeInMinutes,
    0
  );
  const totalWorkTimeFormated = formatMinutes(totalWorkTimeInMinutes);
  const needWorkTimeInMinutes = worktimePerDay * 60 * filteredHistory.length;
  Q("#label_total").innerHTML = `${totalWorkTimeFormated}/${formatMinutes(
    needWorkTimeInMinutes
  )}(共${filteredHistory.length}天)`;
  const diff = needWorkTimeInMinutes - totalWorkTimeInMinutes;
  Q("#label_need").innerHTML = `${formatMinutes(Math.max(0, diff))}`;
  const lastDay = filteredHistory[filteredHistory.length - 1];
  const showRecommend = lastDay && !lastDay.endTime;
  Q("#left_wrap").style.display = showRecommend ? "" : "none";
  if (showRecommend) {
    needEndTime = new Date(lastDay.begTime.getTime() + diff * 60 * 1000);
    Q("#label_recommend").innerHTML = `${needEndTime.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    })}`;
    alerTime = new Date(
      lastDay.begTime.getTime() + diff * 60 * 1000 - alertForward * 60 * 1000
    );
    Q("#label_recommend").innerHTML = `${needEndTime.toLocaleString()}`;
    updateTimer();
    // Q("#label_off_duty").innerHTML = `${needEndTime.toLocaleString()}`;
  }
}
var hasNotifiedAlert = false;
function updateTimer() {
  if (needEndTime) {
    const leftTime = needEndTime.getTime() - Date.now();
    const leftTimeAlert = alerTime.getTime() - Date.now();
    if (leftTime > 0) {
      hasNotified = false;
      if (leftTimeAlert == leftTime) {
        Q(
          "#label_off_duty"
        ).innerHTML = `<span class="text-warning">将在 ${formatMilliSeconds(
          leftTime,
          true
        )} 后提醒</span>`;
      } else {
        Q(
          "#label_off_duty"
        ).innerHTML = `<span class="text-warning">将在 ${formatMilliSeconds(
          leftTime,
          true
        )} 后下班</span>`;
      }
    } else {
      Q(
        "#label_off_duty"
      ).innerHTML = `<span class="text-success">下班打卡时间到了(已过${formatMilliSeconds(
        -leftTime
      )})</span>`;
      if (!hasNotified) {
        hasNotified = true;
        // 如果下班时间和当前时间是同一天，才需要提醒
        if (isSameDay(needEndTime, new Date())) {
          new Notification(
            `下班打卡时间到了: ${needEndTime.toLocaleTimeString(undefined, {
              timeStyle: "short",
            })}`,
            {
              icon: "./favicon.png",
            }
          );
        }
      }
    }

    if (leftTimeAlert == leftTime || leftTime <= 0) {
      Q("#label_off_duty_alert").innerHTML = "";
      return;
    }

    if (leftTimeAlert > 0) {
      hasNotifiedAlert = false;
      Q(
        "#label_off_duty_alert"
      ).innerHTML = `<span class="text-warning">将在 ${formatMilliSeconds(
        leftTimeAlert,
        true
      )} 后提醒</span>`;
    } else {
      Q("#label_off_duty_alert").innerHTML = "";
      if (!hasNotifiedAlert) {
        hasNotifiedAlert = true;
        new Notification(`还有 ${formatMilliSeconds(leftTime)} 下班！`, {
          icon: "./favicon.png",
        });
      }
    }
  }
}
