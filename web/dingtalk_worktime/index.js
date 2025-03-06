const LOCAL_STORAGE_KEY = {
  DINGTALK_CFG: "DINGTALK_CFG",
};

function resetWeekDateRange(history) {
  Q("#input_date_begin").valueAsDate = history[0]?.begTime || new Date();
  Q("#input_date_end").valueAsDate = history[history.length - 1]?.begTime || new Date();
  return [Q("#input_date_begin").valueAsDate, Q("#input_date_end").valueAsDate];
}

var needEndTime = null;
var lastDay = null;
var hasNotified = false;
var historyChanged = true;
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
let records = [];
if (localCfg) {
  localCfg = JSON.parse(localCfg);
  Q("#input_dingtalk").value = localCfg.dingtalk;
  Q("#input_worktime_per_day").value = localCfg.worktime_per_day;
  Q("#input_least_worktime_per_day").value = localCfg.least_worktime_per_day || 4.5;
  Q("#switch_filter").checked = localCfg.filter;
  Q("#input_worktime_begin").value = localCfg.worktime_begin || "09:00";
  Q("#input_alert_forward").value = localCfg.alert_forward || 5;
  records = localCfg.records || [];
  this.processDingTalkInput();
}
// 监听 Q("#input_dingtalk") 文本变化
Q("#input_dingtalk").addEventListener("input", function () {
  historyChanged = true;
  processDingTalkInput();
});
Q("#input_worktime_per_day").addEventListener("input", function () {
  processDingTalkInput();
});
Q("#input_least_worktime_per_day").addEventListener("input", function () {
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
Q("#input_date_begin").addEventListener("input", function () {
  processDingTalkInput();
});
Q("#input_date_end").addEventListener("input", function () {
  processDingTalkInput();
});
Q("#btn_reset").addEventListener("click", function () {
  Q("#input_dingtalk").value = "";
});
Q("#btn_read_clipboard").addEventListener("click", function () {
  clearStatus();
  // 网页获取剪切板内容
  if (!navigator.clipboard) {
    addStatus("不支持自动读取剪贴板,请手动粘贴到输入框", "danger");
    return;
  }
  navigator.clipboard
    .readText()
    .then((text) => {
      Q("#input_dingtalk").value += text;
      historyChanged = true;
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
    least_worktime_per_day: Q("#input_least_worktime_per_day").value,
    filter: Q("#switch_filter").checked,
    worktime_begin: Q("#input_worktime_begin").value,
    alert_forward: Q("#input_alert_forward").value,
    records,
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
    Q("#input_alert_forward").value,
    Q("#input_date_begin").valueAsDate,
    Q("#input_date_end").valueAsDate,
    Q("#input_least_worktime_per_day").value,
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
  alertForward,
  filterBeginDate,
  filterEndDate,
  leastWorktimePerDay,
) {
  needEndTime = null;
  clearStatus();
  Q("#input_date_range").style.display = filter ? "none" : "";
  const matches = Array.from(content.matchAll(
    /(\d{2}):(\d{2}) (上班|下班)打卡·成功班次时间(\d{2})月(\d{2})日 \d{2}:\d{2}.*?(\d{4})年(\d{2})月(\d{2})日/g
  ));
  records.forEach((record) => {
    const {date, time, type} = record;
    const [hour, minute] = time.split(":").map((v) => +v);
    const [year, month, day] = date.split("-").map((v) => +v);
    matches.push(["", hour, minute, type, month, day, year]);
  });
  matches.sort((a, b) => {
    const [hourA, minuteA, typeA, monthA, dayA, yearA] = a.slice(1);
    const [hourB, minuteB, typeB, monthB, dayB, yearB] = b.slice(1);
    return yearA - yearB ||
      monthA - monthB ||
      dayA - dayB ||
      hourA - hourB ||
      minuteA - minuteB;
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
    /** 是否为补卡 */
    const isRemake = match[0] === "";
    const [hour, minute, type, month, day, year] = args;
    let time = new Date(year, month - 1, day, hour, minute);
    if (type === "上班") {
      if (begTime && isSameDay(begTime, time)) {
        continue;
      }
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
        begTimeRemake: isRemake,
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
      tmp.endTimeRemake = isRemake;
      isNewDay = false;
    }
  }
  if (historyChanged) {
    [filterBeginDate, filterEndDate] = resetWeekDateRange(history);
  }
  // 过滤非本周的打卡记录
  var filteredHistory = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const curr = history[i];
    const next = history[i + 1];
    if (filter) {
      // 仅本周
      if (
        i == history.length - 1 ||
        isSameWeek(curr.begTime, next.begTime)
      ) {
        filteredHistory.unshift(curr);
        continue;
      }
      break;
    } else {
      // 判断是否在指定时间范围
      if (curr.begTime.getTime() >= filterBeginDate.setHours(0, 0, 0, 0) && curr.begTime.getTime() <= filterEndDate.setHours(23, 59, 59, 999)) {
        filteredHistory.unshift(curr);
      }
    }
  }
  filteredHistory.forEach((item) => {
    // 每日打卡情况
    const {
      begTime,
      endTime,
      begTimeRemake,
      endTimeRemake,
      workTimeInMinutes,
      realBegTime
    } = item;
    const date = (begTime || endTime).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const isToday = isSameDay(new Date(), begTime);
    const total =
      begTime && endTime ?
      ` (${formatMilliSeconds(endTime.getTime() - begTime.getTime())})` :
      "";
    if (realBegTime != begTime) {
      addStatus(
        `[${date}] ${formatTime(begTime, begTimeRemake)}<span class="text-warning">[${formatTime(realBegTime, begTimeRemake)}]</span>~${formatTime(endTime, endTimeRemake)} ${total}`
      );
    } else {
      addStatus(
        `<span class="${isToday ? "text-success" : ""}">[${date}] ${formatTime(begTime, begTimeRemake)}~${formatTime(endTime, endTimeRemake)} ${total}</span>`
      );
    }
  });

  const totalWorkTimeInMinutes = filteredHistory.reduce(
    (acc, cur) => acc + cur.workTimeInMinutes,
    0
  );
  const totalWorkTimeFormated = formatMinutes(totalWorkTimeInMinutes);
  const needWorkTimeInMinutes = worktimePerDay * 60 * filteredHistory.length;
  Q("#label_total").innerHTML = `${totalWorkTimeFormated}(${formatMinutes(
    totalWorkTimeInMinutes - needWorkTimeInMinutes, undefined, true
  )})/${formatMinutes(
    needWorkTimeInMinutes
  )}(共${filteredHistory.length}天)`;
  const diff = needWorkTimeInMinutes - totalWorkTimeInMinutes;
  // Q("#label_need").innerHTML = `${formatMinutes(Math.max(0, diff))}`;
  lastDay = filteredHistory[filteredHistory.length - 1];
  const showRecommend = lastDay && !lastDay.endTime;
  Q("#left_wrap").style.display = showRecommend ? "" : "none";
  if (showRecommend) {
    const realDiff = Math.max(diff, leastWorktimePerDay * 60);
    needEndTime = new Date(lastDay.begTime.getTime() + realDiff * 60 * 1000);
    Q("#label_recommend").innerHTML = `${needEndTime.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    })}`;
    alerTime = new Date(
      lastDay.begTime.getTime() + realDiff * 60 * 1000 - alertForward * 60 * 1000
    );
    Q("#label_recommend").innerHTML = isSameDay(new Date(), needEndTime) ? needEndTime.toLocaleTimeString() : needEndTime.toLocaleString();
    updateTimer();
    // Q("#label_off_duty").innerHTML = `${needEndTime.toLocaleString()}`;
  }

  historyChanged = false;
}
var hasNotifiedAlert = false;

function updateTimer() {
  const showToday = lastDay && isSameDay(new Date(), lastDay.begTime) && !lastDay.endTime;
  Q("#label_today").innerHTML = formatMilliSeconds(showToday ? Date.now() - lastDay.begTime.getTime() : 0, true);
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
            })}`, {
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