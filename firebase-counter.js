import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgcgv2HK1Gx_Vzgq9SovkWiAVbw-1xMkw",
  authDomain: "crayzillaiptv-d2a8e.firebaseapp.com",
  databaseURL: "https://crayzillaiptv-d2a8e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crayzillaiptv-d2a8e",
  storageBucket: "crayzillaiptv-d2a8e.firebasestorage.app",
  messagingSenderId: "1039436888354",
  appId: "1:1039436888354:web:5bba9b6976702ecb528d7b",
  measurementId: "G-QC0K4LB51J"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const now = new Date();

const todayKey =
  now.getFullYear() +
  "-" +
  String(now.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(now.getDate()).padStart(2, "0");

const monthKey =
  now.getFullYear() +
  "-" +
  String(now.getMonth() + 1).padStart(2, "0");

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const weekKey =
  now.getFullYear() +
  "-W" +
  String(getWeekNumber(now)).padStart(2, "0");

async function addVisitor() {
  const visitorLock = sessionStorage.getItem("visitorCounted");

  if (visitorLock) return;

  const statsRef = ref(db, "stats");
  const snap = await get(statsRef);

  let totalVisitors = 0;

  if (snap.exists()) {
    totalVisitors = snap.val().totalVisitors || 0;
  }

  totalVisitors++;

  await update(statsRef, {
    totalVisitors
  });

  sessionStorage.setItem("visitorCounted", "true");
}

async function trackDownload() {
  const uniqueKey = "download_" + todayKey;

  if (localStorage.getItem(uniqueKey)) {
    return;
  }

  const statsRef = ref(db, "stats");
  const statsSnap = await get(statsRef);

  let totalDownloads = 0;

  if (statsSnap.exists()) {
    totalDownloads = statsSnap.val().totalDownloads || 0;
  }

  await update(statsRef, {
    totalDownloads: totalDownloads + 1
  });

  const dailyRef = ref(db, "daily/" + todayKey);
  const dailySnap = await get(dailyRef);

  let dailyDownloads = 0;

  if (dailySnap.exists()) {
    dailyDownloads = dailySnap.val().downloads || 0;
  }

  await set(dailyRef, {
    downloads: dailyDownloads + 1
  });

  const weeklyRef = ref(db, "weekly/" + weekKey);
  const weeklySnap = await get(weeklyRef);

  let weeklyDownloads = 0;

  if (weeklySnap.exists()) {
    weeklyDownloads = weeklySnap.val().downloads || 0;
  }

  await set(weeklyRef, {
    downloads: weeklyDownloads + 1
  });

  const monthlyRef = ref(db, "monthly/" + monthKey);
  const monthlySnap = await get(monthlyRef);

  let monthlyDownloads = 0;

  if (monthlySnap.exists()) {
    monthlyDownloads = monthlySnap.val().downloads || 0;
  }

  await set(monthlyRef, {
    downloads: monthlyDownloads + 1
  });

  localStorage.setItem(uniqueKey, "true");
}

async function loadCounters() {
  try {
    const statsSnap = await get(ref(db, "stats"));

    if (statsSnap.exists()) {
      const stats = statsSnap.val();

      document.getElementById("total-vs").innerText =
        (stats.totalVisitors || 0).toLocaleString();

      document.getElementById("total-dl").innerText =
        (stats.totalDownloads || 0).toLocaleString();
    }

    const dailySnap = await get(ref(db, "daily/" + todayKey));

    if (dailySnap.exists()) {
      document.getElementById("today-dl").innerText =
        (dailySnap.val().downloads || 0).toLocaleString();
    } else {
      document.getElementById("today-dl").innerText = "0";
    }

    const weeklySnap = await get(ref(db, "weekly/" + weekKey));

    if (weeklySnap.exists()) {
      document.getElementById("weekly-dl").innerText =
        (weeklySnap.val().downloads || 0).toLocaleString();
    } else {
      document.getElementById("weekly-dl").innerText = "0";
    }

    const monthlySnap = await get(ref(db, "monthly/" + monthKey));

    if (monthlySnap.exists()) {
      document.getElementById("monthly-dl").innerText =
        (monthlySnap.val().downloads || 0).toLocaleString();
    } else {
      document.getElementById("monthly-dl").innerText = "0";
    }

  } catch (err) {
    console.error(err);
  }
}

await addVisitor();
await loadCounters();

const downloadBtn = document.getElementById("downloadBtn");

if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    trackDownload();
  });
}