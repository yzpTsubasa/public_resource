let isRecordVisible = false;

function UpdateRecordVisibility() {
    Q("#records_wrap").style.display = isRecordVisible ? "flex" : "none";
    // 设置默认日期和时间
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const hour = today.getHours();
    const minute = today.getMinutes();
    const date_str = `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
    // const time_str = `${pad(hour, 2)}:${pad(minute, 2)}`;
    const time_str = "09:00";
    
    Q("#input_record_date").value = date_str;
    Q("#input_record_time").value = time_str;
}

function deleteRecord(index) {
    records.splice(index, 1);
    UpdateRecordList();
    processDingTalkInput();
}

function UpdateRecordList() {
    const records_html = records.map(record => {
        const date = record.date;
        const time = record.time;
        const type = record.type;
        const delete_btn = `<span class="badge bg-danger delete_record" onclick="deleteRecord(${records.indexOf(record)})">删除</span>`;
        return `<div class="record_item">
                    <p class="record_date">${date}</p>
                    <p class="record_time">${time}</p>
                    <p class="record_type">${type}</p>
                    <p>${delete_btn}</p>
                </div>`;
    }).join("");
    Q("#records_list").innerHTML = records_html;
    Q("#records_empty").style.display = records.length === 0 ? "block" : "none";
    Q("#records_list").style.display = records.length !== 0 ? "block" : "none";
}

UpdateRecordVisibility();
UpdateRecordList();

Q("#btn_records").addEventListener("click", function () {
    isRecordVisible = !isRecordVisible;
    UpdateRecordVisibility();
});

Q("#btn_add_record").addEventListener("click", function () {
    // hour, minute, type, month, day, year
    const time = Q("#input_record_time").value;
    const date = Q("#input_record_date").value;
    const type = Q("#input_record_type").value;
    const record = {
        time,
        date,
        type,
    };
    records.push(record);
    UpdateRecordList();
    processDingTalkInput();
});