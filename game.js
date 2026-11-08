"use strict";

const startButton = document.getElementById("startButton");
const settingsButton = document.getElementById("settingsButton");

startButton.addEventListener("click", () => {
  alert("MISSION 249\n\nجاري تجهيز المهمة الأولى...");
});

settingsButton.addEventListener("click", () => {
  alert(
    "إعدادات اللعبة\n\n" +
    "الكاميرا: عادية / حرارية\n" +
    "التحكم: لمس\n" +
    "وضع التشغيل: Offline"
  );
});