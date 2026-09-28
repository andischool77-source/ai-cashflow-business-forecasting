/* =========================================================
   AI CASHFLOW & BUSINESS FORECASTING
   Single-file application logic
   Storage: localStorage
========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "ai_cashflow_business_forecasting_v1";

const defaultData = {
  settings: {
    businessName: "AI CASHFLOW BUSINESS",
    openingBalance: 0
  },

  cashflows: [],

  sales: [],

  expenses: [],

  purchases: [],

  targets: {
    revenue: 0,
    cash: 0,
    expense: 0
  },

  forecast: [],

  scenario: null
};

let data = loadData();

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return structuredClone(defaultData);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultData),
      ...parsed,
      settings: {
        ...defaultData.settings,
        ...(parsed.settings || {})
      },
      targets: {
        ...defaultData.targets,
        ...(parsed.targets || {})
      },
      cashflows: Array.isArray(parsed.cashflows) ? parsed.cashflows : [],
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
      forecast: Array.isArray(parsed.forecast) ? parsed.forecast : []
    };
  } catch (error) {
    console.error(error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* =========================================================
   HELPERS
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function money(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

function number(value) {
  return Number(value) || 0;
}

function formatDate(date) {
  if (!date) return "-";

  const d = new Date(date + "T00:00:00");

  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix = "id") {
  return prefix + "_" + Date.now() + "_" +
    Math.random().toString(36).slice(2, 8);
}

function sum(items, callback) {
  return items.reduce((total, item) => {
    return total + number(callback(item));
  }, 0);
}

function average(items) {
  if (!items.length) return 0;

  return items.reduce((a, b) => a + number(b), 0) / items.length;
}

function percentChange(current, previous) {
  if (!previous) return 0;

  return ((current - previous) / Math.abs(previous)) * 100;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeNavigation();
  initializeForms();
  initializeTabs();
  initializeModals();
  initializeScenarioControls();
  initializeButtons();

  loadSettingsToForm();
  loadTargetsToForm();

  $("cashDate").value = today();
  $("transactionDate").value = today();

  updateCurrentDate();
  renderAll();

});

/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

  document.querySelectorAll(".nav-item").forEach(button => {

    button.addEventListener("click", () => {

      const page = button.dataset.page;

      document.querySelectorAll(".nav-item")
        .forEach(item => item.classList.remove("active"));

      button.classList.add("active");

      document.querySelectorAll(".page")
        .forEach(section => section.classList.remove("active"));

      const target = $(page + "Page");

      if (target) {
        target.classList.add("active");
      }

      const titles = {
        dashboard: "Dashboard",
        cashflow: "Cashflow",
        transactions: "Data Bisnis",
        forecast: "Forecasting",
        scenario: "Simulasi Skenario",
        planning: "Business Planning",
        insight: "AI Business Insight",
        reports: "Laporan",
        settings: "Pengaturan"
      };

      $("pageTitle").textContent = titles[page] || "Dashboard";

      if (window.innerWidth <= 800) {
        $("sidebar").classList.remove("open");
      }

      if (page === "reports") {
        renderReport();
      }

      if (page === "insight") {
        renderAIInsights();
      }

      if (page === "forecast") {
        renderForecast();
      }

    });

  });

}

/* =========================================================
   MOBILE MENU
========================================================= */

$("menuBtn").addEventListener("click", () => {
  $("sidebar").classList.toggle("open");
});

/* =========================================================
   CURRENT DATE
========================================================= */

function updateCurrentDate() {

  $("currentDate").textContent =
    new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
}

/* =========================================================
   BUTTONS
========================================================= */

function initializeButtons() {

  $("refreshBtn").addEventListener("click", () => {
    data = loadData();
    renderAll();
    showToast("Data diperbarui");
  });

  $("openCashForm").addEventListener("click", () => {
    openModal("cashModal");
  });

  $("openTransactionForm").addEventListener("click", () => {
    resetTransactionForm();
    openModal("transactionModal");
  });

  $("runForecast").addEventListener("click", () => {
    generateForecast();
  });

  $("runScenario").addEventListener("click", () => {
    runScenario();
  });

  $("generatePlan").addEventListener("click", () => {
    generateBusinessPlan();
  });

  $("saveTargets").addEventListener("click", () => {
    saveTargets();
  });

  $("refreshInsight").addEventListener("click", () => {
    renderAIInsights();
    showToast("Analisis diperbarui");
  });

  $("printReport").addEventListener("click", () => {
    window.print();
  });

  $("saveSettings").addEventListener("click", () => {
    saveSettings();
  });

  $("resetData").addEventListener("click", () => {
    resetApplicationData();
  });

}

/* =========================================================
   MODAL
========================================================= */

function initializeModals() {

  document.querySelectorAll("[data-close]").forEach(button => {

    button.addEventListener("click", () => {
      closeModal(button.dataset.close);
    });

  });

  document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", event => {

      if (event.target === modal) {
        modal.classList.remove("active");
      }

    });

  });

}

function openModal(id) {
  $(id).classList.add("active");
}

function closeModal(id) {
  $(id).classList.remove("active");
}

/* =========================================================
   TABS
========================================================= */

function initializeTabs() {

  document.querySelectorAll(".tab").forEach(tab => {

    tab.addEventListener("click", () => {

      const tabName = tab.dataset.tab;

      document.querySelectorAll(".tab")
        .forEach(item => item.classList.remove("active"));

      tab.classList.add("active");

      document.querySelectorAll(".tab-content")
        .forEach(content => content.classList.remove("active"));

      const target = $(tabName + "Tab");

      if (target) {
        target.classList.add("active");
      }

    });

  });

}

/* =========================================================
   TRANSACTION TYPE
========================================================= */

function initializeForms() {

  $("transactionType").addEventListener("change", updateTransactionFields);

  $("cashForm").addEventListener("submit", handleCashSubmit);

  $("transactionForm").addEventListener(
    "submit",
    handleTransactionSubmit
  );

}

function updateTransactionFields() {

  const type = $("transactionType").value;

  $("saleFields").classList.toggle("hidden", type !== "sale");
  $("purchaseFields").classList.toggle("hidden", type !== "purchase");
  $("expenseFields").classList.toggle("hidden", type !== "expense");
}

function resetTransactionForm() {

  $("transactionForm").reset();

  $("transactionDate").value = today();

  $("transactionType").value = "sale";

  updateTransactionFields();
}

/* =========================================================
   CASHFLOW
========================================================= */

function handleCashSubmit(event) {

  event.preventDefault();

  const type = $("cashType").value;

  const amount = number($("cashAmount").value);

  if (amount <= 0) {
    showToast("Nominal harus lebih dari 0");
    return;
  }

  const item = {
    id: uid("cash"),
    date: $("cashDate").value,
    type,
    category: $("cashCategory").value,
    description: $("cashDescription").value.trim(),
    amount
  };

  data.cashflows.push(item);

  saveData();

  $("cashForm").reset();

  $("cashDate").value = today();

  closeModal("cashModal");

  renderAll();

  showToast("Cashflow berhasil disimpan");
}

function getCashIn() {

  const manualIn = sum(
    data.cashflows.filter(item => item.type === "in"),
    item => item.amount
  );

  const sales = getSalesTotal();

  return manualIn + sales;
}

function getCashOut() {

  const manualOut = sum(
    data.cashflows.filter(item => item.type === "out"),
    item => item.amount
  );

  const expenses = getExpenseTotal();

  const purchases = getPurchaseTotal();

  return manualOut + expenses + purchases;
}

function getCurrentCash() {

  return number(data.settings.openingBalance)
    + getCashIn()
    - getCashOut();
}

/* =========================================================
   TRANSACTIONS
========================================================= */

function handleTransactionSubmit(event) {

  event.preventDefault();

  const type = $("transactionType").value;

  const date = $("transactionDate").value;

  if (!date) {
    showToast("Tanggal wajib diisi");
    return;
  }

  if (type === "sale") {

    const product = $("saleProduct").value.trim();

    const qty = number($("saleQty").value);

    const price = number($("salePrice").value);

    if (!product || qty <= 0 || price <= 0) {
      showToast("Data penjualan belum lengkap");
      return;
    }

    data.sales.push({
      id: uid("sale"),
      date,
      product,
      qty,
      price,
      total: qty * price
    });

  }

  if (type === "purchase") {

    const product = $("purchaseProduct").value.trim();

    const qty = number($("purchaseQty").value);

    const price = number($("purchasePrice").value);

    if (!product || qty <= 0 || price <= 0) {
      showToast("Data pembelian belum lengkap");
      return;
    }

    data.purchases.push({
      id: uid("purchase"),
      date,
      product,
      qty,
      price,
      total: qty * price
    });

  }

  if (type === "expense") {

    const amount = number($("expenseAmount").value);

    if (amount <= 0) {
      showToast("Nominal pengeluaran belum diisi");
      return;
    }

    data.expenses.push({
      id: uid("expense"),
      date,
      category: $("expenseCategory").value,
      description: $("expenseDescription").value.trim(),
      amount
    });

  }

  saveData();

  closeModal("transactionModal");

  resetTransactionForm();

  renderAll();

  showToast("Data bisnis berhasil disimpan");
}

/* =========================================================
   TOTALS
========================================================= */

function getSalesTotal() {

  return sum(data.sales, item => item.total);
}

function getExpenseTotal() {

  return sum(data.expenses, item => item.amount);
}

function getPurchaseTotal() {

  return sum(data.purchases, item => item.total);
}

function getNetCashflow() {

  return getCashIn() - getCashOut();
}

/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderDashboard();

  renderCashflow();

  renderTransactions();

  renderForecast();

  renderScenario();

  renderPlanning();

  renderAIInsights();

  renderReport();

  loadSettingsToForm();

  loadTargetsToForm();

}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  const cash = getCurrentCash();
  const cashIn = getCashIn();
  const cashOut = getCashOut();
  const net = cashIn - cashOut;

  $("dashCash").textContent = money(cash);
  $("dashIn").textContent = money(cashIn);
  $("dashOut").textContent = money(cashOut);
  $("dashNet").textContent = money(net);

  $("dashNet").classList.remove("positive", "negative");

  if (net > 0) {
    $("dashNet").classList.add("positive");
  }

  if (net < 0) {
    $("dashNet").classList.add("negative");
  }

  renderDashboardInsights();

  renderHealth();

  drawCashflowChart();
}

/* =========================================================
   DASHBOARD INSIGHTS
========================================================= */

function generateInsights() {

  const insights = [];

  const revenue = getSalesTotal();

  const expenses = getExpenseTotal();

  const purchases = getPurchaseTotal();

  const cash = getCurrentCash();

  const net = getNetCashflow();

  if (
    data.sales.length === 0 &&
    data.expenses.length === 0 &&
    data.purchases.length === 0
  ) {

    insights.push({
      type: "info",
      title: "Data belum tersedia",
      text: "Masukkan data bisnis terlebih dahulu agar sistem dapat menganalisis pola."
    });

    return insights;
  }

  if (net > 0) {

    insights.push({
      type: "success",
      title: "Cashflow positif",
      text:
        `Arus kas bersih saat ini ${money(net)} berdasarkan data yang tersimpan.`
    });

  } else if (net < 0) {

    insights.push({
      type: "danger",
      title: "Cashflow negatif",
      text:
        `Arus kas bersih berada di ${money(net)}. Pengeluaran perlu diperhatikan.`
    });

  }

  if (revenue > 0 && expenses > revenue * 0.7) {

    insights.push({
      type: "warning",
      title: "Beban pengeluaran cukup tinggi",
      text:
        "Pengeluaran operasional mencapai lebih dari 70% nilai penjualan yang tercatat."
    });

  }

  if (purchases > revenue && revenue > 0) {

    insights.push({
      type: "warning",
      title: "Pembelian melebihi penjualan",
      text:
        "Nilai pembelian yang tercatat lebih besar daripada penjualan. Perhatikan dampaknya terhadap kas."
    });

  }

  if (cash < 0) {

    insights.push({
      type: "danger",
      title: "Saldo kas negatif",
      text:
        "Perhitungan saldo kas berada di bawah nol berdasarkan data saat ini."
    });

  }

  if (revenue > 0 && net > 0) {

    insights.push({
      type: "success",
      title: "Ada ruang untuk perencanaan",
      text:
        "Cashflow positif dapat digunakan sebagai dasar untuk menguji beberapa skenario pertumbuhan."
    });

  }

  return insights.slice(0, 5);
}

function renderDashboardInsights() {

  const container = $("dashboardInsights");

  const insights = generateInsights();

  container.innerHTML = insights.map(item => `
    <div class="insight-item ${item.type}">
      <strong>${escapeHTML(item.title)}</strong>
      <span>${escapeHTML(item.text)}</span>
    </div>
  `).join("");
}

/* =========================================================
   HEALTH
========================================================= */

function renderHealth() {

  const badge = $("healthBadge");

  const net = getNetCashflow();

  const revenue = getSalesTotal();

  const expenses = getExpenseTotal();

  const cash = getCurrentCash();

  badge.className = "health-badge";

  if (
    data.sales.length === 0 &&
    data.expenses.length === 0
  ) {

    badge.textContent = "Belum ada data";

  } else if (net > 0 && cash >= 0) {

    badge.textContent = "Positif";
    badge.classList.add("good");

  } else if (cash < 0) {

    badge.textContent = "Perlu perhatian";
    badge.classList.add("danger");

  } else {

    badge.textContent = "Perlu dipantau";
    badge.classList.add("warning");

  }

  $("healthCashflow").textContent =
    net >= 0 ? "Positif" : "Negatif";

  $("healthCashflow").className =
    net >= 0 ? "positive" : "negative";

  $("healthRevenue").textContent =
    revenue > 0 ? money(revenue) : "-";

  const months = getHistoricalMonths();

  const monthlyExpense = months.length
    ? average(months.map(m => m.expense))
    : 0;

  $("healthBurn").textContent = money(monthlyExpense);

  if (monthlyExpense > 0 && cash > 0) {

    const runway = cash / monthlyExpense;

    $("healthRunway").textContent =
      runway.toFixed(1) + " bulan";

  } else {

    $("healthRunway").textContent = "-";

  }
}

/* =========================================================
   CASHFLOW TABLE
========================================================= */

function renderCashflow() {

  const table = $("cashflowTable");

  const rows = [...data.cashflows]
    .sort((a, b) => b.date.localeCompare(a.date));

  table.innerHTML = rows.map(item => `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>
        <span class="${item.type === "in" ? "positive" : "negative"}">
          ${item.type === "in" ? "Masuk" : "Keluar"}
        </span>
      </td>
      <td>${escapeHTML(item.category)}</td>
      <td>${escapeHTML(item.description || "-")}</td>
      <td>${money(item.amount)}</td>
      <td>
        <button class="delete-btn"
          onclick="deleteCashflow('${item.id}')">
          Hapus
        </button>
      </td>
    </tr>
  `).join("");

  $("cashflowEmpty").style.display =
    rows.length ? "none" : "block";

  $("cashOpening").textContent =
    money(data.settings.openingBalance);

  $("cashTotalIn").textContent =
    money(getCashIn());

  $("cashTotalOut").textContent =
    money(getCashOut());

  $("cashEnding").textContent =
    money(getCurrentCash());
}

window.deleteCashflow = function(id) {

  if (!confirm("Hapus transaksi cashflow ini?")) return;

  data.cashflows =
    data.cashflows.filter(item => item.id !== id);

  saveData();

  renderAll();

  showToast("Cashflow dihapus");
};

/* =========================================================
   SALES TABLE
========================================================= */

function renderTransactions() {

  const sales = [...data.sales]
    .sort((a, b) => b.date.localeCompare(a.date));

  const expenses = [...data.expenses]
    .sort((a, b) => b.date.localeCompare(a.date));

  const purchases = [...data.purchases]
    .sort((a, b) => b.date.localeCompare(a.date));

  $("salesTable").innerHTML = sales.map(item => `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${escapeHTML(item.product)}</td>
      <td>${item.qty}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.total)}</td>
      <td>
        <button class="delete-btn"
          onclick="deleteSale('${item.id}')">
          Hapus
        </button>
      </td>
    </tr>
  `).join("");

  $("expenseTable").innerHTML = expenses.map(item => `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${escapeHTML(item.category)}</td>
      <td>${escapeHTML(item.description || "-")}</td>
      <td>${money(item.amount)}</td>
      <td>
        <button class="delete-btn"
          onclick="deleteExpense('${item.id}')">
          Hapus
        </button>
      </td>
    </tr>
  `).join("");

  $("purchaseTable").innerHTML = purchases.map(item => `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${escapeHTML(item.product)}</td>
      <td>${item.qty}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.total)}</td>
      <td>
        <button class="delete-btn"
          onclick="deletePurchase('${item.id}')">
          Hapus
        </button>
      </td>
    </tr>
  `).join("");

  $("salesEmpty").style.display =
    sales.length ? "none" : "block";

  $("expenseEmpty").style.display =
    expenses.length ? "none" : "block";

  $("purchaseEmpty").style.display =
    purchases.length ? "none" : "block";
}

window.deleteSale = function(id) {

  if (!confirm("Hapus data penjualan ini?")) return;

  data.sales =
    data.sales.filter(item => item.id !== id);

  saveData();

  renderAll();

  showToast("Penjualan dihapus");
};

window.deleteExpense = function(id) {

  if (!confirm("Hapus data pengeluaran ini?")) return;

  data.expenses =
    data.expenses.filter(item => item.id !== id);

  saveData();

  renderAll();

  showToast("Pengeluaran dihapus");
};

window.deletePurchase = function(id) {

  if (!confirm("Hapus data pembelian ini?")) return;

  data.purchases =
    data.purchases.filter(item => item.id !== id);

  saveData();

  renderAll();

  showToast("Pembelian dihapus");
};

/* =========================================================
   HISTORICAL MONTHS
========================================================= */

function getHistoricalMonths() {

  const map = {};

  function ensure(date) {

    const key = String(date).slice(0, 7);

    if (!map[key]) {

      map[key] = {
        key,
        revenue: 0,
        expense: 0,
        purchase: 0
      };

    }

    return map[key];
  }

  data.sales.forEach(item => {
    ensure(item.date).revenue += number(item.total);
  });

  data.expenses.forEach(item => {
    ensure(item.date).expense += number(item.amount);
  });

  data.purchases.forEach(item => {
    ensure(item.date).purchase += number(item.total);
  });

  data.cashflows.forEach(item => {

    const month = ensure(item.date);

    if (item.type === "in") {
      month.revenue += number(item.amount);
    } else {
      month.expense += number(item.amount);
    }

  });

  return Object.values(map)
    .sort((a, b) => a.key.localeCompare(b.key));
}

/* =========================================================
   FORECAST ENGINE
========================================================= */

function generateForecast() {

  const months = getHistoricalMonths();

  const forecastMonths =
    number($("forecastMonths").value);

  if (
    data.sales.length === 0 &&
    data.expenses.length === 0 &&
    data.purchases.length === 0
  ) {

    showToast("Masukkan data historis terlebih dahulu");

    return;
  }

  const revenueValues =
    months.map(item => item.revenue);

  const expenseValues =
    months.map(item => item.expense + item.purchase);

  let avgRevenue = average(revenueValues);

  let avgExpense = average(expenseValues);

  /*
    Jika data hanya satu periode,
    sistem tetap dapat membuat forecast.
  */

  if (!avgRevenue) {
    avgRevenue = getSalesTotal();
  }

  if (!avgExpense) {
    avgExpense = getExpenseTotal() + getPurchaseTotal();
  }

  let revenueTrend = 0;
  let expenseTrend = 0;

  if (months.length >= 2) {

    const firstRevenue = months[0].revenue;
    const lastRevenue = months[months.length - 1].revenue;

    const firstExpense =
      months[0].expense + months[0].purchase;

    const lastExpense =
      months[months.length - 1].expense +
      months[months.length - 1].purchase;

    revenueTrend =
      percentChange(lastRevenue, firstRevenue);

    expenseTrend =
      percentChange(lastExpense, firstExpense);

    /*
      Batasi pengaruh trend agar forecast
      tidak menghasilkan lonjakan ekstrem.
    */

    revenueTrend =
      Math.max(-30, Math.min(30, revenueTrend));

    expenseTrend =
      Math.max(-30, Math.min(30, expenseTrend));

  }

  const monthlyRevenue =
    avgRevenue * (1 + revenueTrend / 100);

  const monthlyExpense =
    avgExpense * (1 + expenseTrend / 100);

  const result = [];

  let endingCash = getCurrentCash();

  for (let i = 1; i <= forecastMonths; i++) {

    /*
      Sedikit normalisasi trend setiap bulan.
      Ini bukan model AI generatif.
      Ini adalah forecast berbasis data lokal.
    */

    const growthFactor =
      Math.pow(1 + revenueTrend / 100, i / Math.max(1, forecastMonths));

    const expenseFactor =
      Math.pow(1 + expenseTrend / 100, i / Math.max(1, forecastMonths));

    const revenue =
      monthlyRevenue * growthFactor;

    const expense =
      monthlyExpense * expenseFactor;

    const net =
      revenue - expense;

    endingCash += net;

    const date = new Date();

    date.setMonth(date.getMonth() + i);

    result.push({
      month: date.toLocaleDateString("id-ID", {
        month: "short",
        year: "numeric"
      }),
      revenue,
      expense,
      net,
      cash: endingCash
    });

  }

  data.forecast = result;

  saveData();

  renderForecast();

  showToast("Forecast berhasil dibuat");
}

/* =========================================================
   FORECAST RENDER
========================================================= */

function renderForecast() {

  const result = data.forecast || [];

  if (!result.length) {

    $("forecastRevenue").textContent = "Rp0";
    $("forecastExpense").textContent = "Rp0";
    $("forecastNet").textContent = "Rp0";
    $("forecastCash").textContent = "Rp0";

    $("forecastAnalysis").textContent =
      "Belum ada forecast. Masukkan data bisnis dan jalankan forecast.";

    $("forecastTable").innerHTML = "";

    $("forecastEmpty").style.display = "grid";

    return;
  }

  const totalRevenue =
    sum(result, item => item.revenue);

  const totalExpense =
    sum(result, item => item.expense);

  const totalNet =
    sum(result, item => item.net);

  const endingCash =
    result[result.length - 1].cash;

  $("forecastRevenue").textContent =
    money(totalRevenue);

  $("forecastExpense").textContent =
    money(totalExpense);

  $("forecastNet").textContent =
    money(totalNet);

  $("forecastCash").textContent =
    money(endingCash);

  $("forecastRevenueTrend").textContent =
    totalRevenue >= totalExpense
      ? "Proyeksi cashflow positif"
      : "Proyeksi perlu perhatian";

  $("forecastNet").className =
    "stat-value " +
    (totalNet >= 0 ? "positive" : "negative");

  $("forecastCash").className =
    "stat-value " +
    (endingCash >= 0 ? "positive" : "negative");

  $("forecastTable").innerHTML = result.map(item => `
    <tr>
      <td>${escapeHTML(item.month)}</td>
      <td>${money(item.revenue)}</td>
      <td>${money(item.expense)}</td>
      <td class="${item.net >= 0 ? "positive" : "negative"}">
        ${money(item.net)}
      </td>
      <td>${money(item.cash)}</td>
    </tr>
  `).join("");

  $("forecastEmpty").style.display = "none";

  let analysis = "";

  if (totalNet > 0) {

    analysis += `
      <p>
        Berdasarkan data historis yang tersedia, proyeksi menunjukkan
        <strong>cashflow positif</strong> sebesar
        <strong>${money(totalNet)}</strong> selama periode forecast.
      </p>
    `;

  } else {

    analysis += `
      <p>
        Proyeksi menunjukkan tekanan terhadap cashflow.
        Net cashflow diperkirakan sebesar
        <strong>${money(totalNet)}</strong>.
      </p>
    `;

  }

  if (endingCash < 0) {

    analysis += `
      <p>
        <strong>Perhatian:</strong> saldo kas proyeksi berada di bawah nol.
        Perlu dilakukan simulasi pengurangan pengeluaran,
        peningkatan penjualan, atau perubahan pembelian.
      </p>
    `;

  } else {

    analysis += `
      <p>
        Saldo kas pada akhir periode diproyeksikan sekitar
        <strong>${money(endingCash)}</strong>.
      </p>
    `;

  }

  analysis += `
    <p>
      Forecast ini menggunakan rata-rata dan tren data historis
      yang tersimpan di perangkat.
    </p>
  `;

  $("forecastAnalysis").innerHTML = analysis;

  drawForecastChart();
}

/* =========================================================
   SCENARIO
========================================================= */

function initializeScenarioControls() {

  const controls = [
    ["salesScenario", "salesScenarioValue"],
    ["purchaseScenario", "purchaseScenarioValue"],
    ["expenseScenario", "expenseScenarioValue"],
    ["marketingScenario", "marketingScenarioValue"]
  ];

  controls.forEach(([inputId, outputId]) => {

    $(inputId).addEventListener("input", () => {

      const value = number($(inputId).value);

      $(outputId).textContent =
        (value > 0 ? "+" : "") + value + "%";

    });

  });

}

function runScenario() {

  const months =
    number($("scenarioMonths").value);

  const salesChange =
    number($("salesScenario").value);

  const purchaseChange =
    number($("purchaseScenario").value);

  const expenseChange =
    number($("expenseScenario").value);

  const marketingChange =
    number($("marketingScenario").value);

  const baseRevenue =
    getMonthlyAverageRevenue();

  const baseExpense =
    getMonthlyAverageExpense();

  const basePurchase =
    getMonthlyAveragePurchase();

  const currentCash =
    getCurrentCash();

  const baseMonthlyNet =
    baseRevenue - baseExpense - basePurchase;

  const scenarioRevenue =
    baseRevenue * (1 + salesChange / 100);

  const scenarioPurchase =
    basePurchase * (1 + purchaseChange / 100);

  const scenarioExpense =
    baseExpense * (1 + expenseChange / 100);

  const marketingBase =
    getMonthlyMarketingExpense();

  const extraMarketing =
    marketingBase * (marketingChange / 100);

  /*
    Jika belum ada data marketing,
    perubahan marketing dibuat sebagai
    proporsi dari revenue.
  */

  const effectiveMarketing =
    marketingBase > 0
      ? extraMarketing
      : baseRevenue * (marketingChange / 100) * 0.05;

  const scenarioMonthlyExpense =
    scenarioExpense +
    scenarioPurchase +
    effectiveMarketing;

  const scenarioMonthlyNet =
    scenarioRevenue -
    scenarioMonthlyExpense;

  const scenarioCash =
    currentCash +
    scenarioMonthlyNet * months;

  const baseCash =
    currentCash +
    baseMonthlyNet * months;

  const impact =
    scenarioCash - baseCash;

  const result = {
    months,
    salesChange,
    purchaseChange,
    expenseChange,
    marketingChange,
    baseCash,
    scenarioCash,
    impact,
    scenarioNet: scenarioMonthlyNet
  };

  data.scenario = result;

  saveData();

  renderScenario();

  showToast("Simulasi selesai");
}

function getMonthlyAverageRevenue() {

  const months = getHistoricalMonths();

  if (!months.length) return 0;

  return average(
    months.map(item => item.revenue)
  );
}

function getMonthlyAverageExpense() {

  const months = getHistoricalMonths();

  if (!months.length) return 0;

  return average(
    months.map(item => item.expense)
  );
}

function getMonthlyAveragePurchase() {

  const months = getHistoricalMonths();

  if (!months.length) return 0;

  return average(
    months.map(item => item.purchase)
  );
}

function getMonthlyMarketingExpense() {

  const marketing = data.expenses
    .filter(item =>
      String(item.category).toLowerCase() === "marketing"
    );

  if (!marketing.length) return 0;

  return sum(marketing, item => item.amount) /
    Math.max(1, getHistoricalMonths().length);
}

/* =========================================================
   SCENARIO RENDER
========================================================= */

/* =========================================================
   SCENARIO RENDER
========================================================= */

function renderScenario() {
  
  const result = data.scenario;
  
  if (!result) {
    
    $("scenarioBaseCash").textContent = "Rp0";
    $("scenarioCash").textContent = "Rp0";
    $("scenarioImpact").textContent = "Rp0";
    $("scenarioNet").textContent = "Rp0";
    
    $("scenarioMessage").innerHTML = `
      <p class="scenario-note">
        Atur parameter simulasi, kemudian jalankan simulasi
        untuk melihat dampaknya terhadap saldo kas.
      </p>
    `;
    
    $("scenarioEmpty").style.display = "grid";
    
    return;
  }
  
  $("scenarioBaseCash").textContent =
    money(result.baseCash);
  
  $("scenarioCash").textContent =
    money(result.scenarioCash);
  
  $("scenarioImpact").textContent =
    money(result.impact);
  
  $("scenarioNet").textContent =
    money(result.scenarioNet);
  
  $("scenarioImpact").className =
    result.impact >= 0 ? "positive" : "negative";
  
  let message = "";
  
  if (result.impact > 0) {
    
    message = `
      <p>
        Skenario ini memproyeksikan saldo kas
        <strong>lebih tinggi ${money(result.impact)}</strong>
        dibandingkan kondisi dasar setelah
        <strong>${result.months} bulan</strong>.
      </p>
    `;
    
  } else if (result.impact < 0) {
    
    message = `
      <p>
        Skenario ini memproyeksikan saldo kas
        <strong>lebih rendah ${money(Math.abs(result.impact))}</strong>
        dibandingkan kondisi dasar setelah
        <strong>${result.months} bulan</strong>.
      </p>
    `;
    
  } else {
    
    message = `
      <p>
        Skenario ini menghasilkan dampak kas yang
        <strong>relatif sama</strong> dengan kondisi dasar
        setelah <strong>${result.months} bulan</strong>.
      </p>
    `;
    
  }
  
  if (result.scenarioCash < 0) {
    
    message += `
      <p class="scenario-warning">
        <strong>Perhatian:</strong>
        simulasi menghasilkan saldo kas negatif.
      </p>
    `;
    
  }
  
  $("scenarioMessage").innerHTML = message;
  
  $("scenarioEmpty").style.display = "none";
  
  drawScenarioChart();
}
/* =========================================================
   BUSINESS PLANNING
========================================================= */

function loadTargetsToForm() {

  $("targetRevenue").value =
    data.targets.revenue || "";

  $("targetCash").value =
    data.targets.cash || "";

  $("targetExpense").value =
    data.targets.expense || "";
}

function saveTargets() {

  data.targets = {
    revenue: number($("targetRevenue").value),
    cash: number($("targetCash").value),
    expense: number($("targetExpense").value)
  };

  saveData();

  renderPlanning();

  showToast("Target berhasil disimpan");
}

function generateBusinessPlan() {

  const currentRevenue =
    getMonthlyAverageRevenue();

  const currentExpense =
    getMonthlyAverageExpense() +
    getMonthlyAveragePurchase();

  const currentCash =
    getCurrentCash();

  const targetRevenue =
    number(data.targets.revenue);

  const targetCash =
    number(data.targets.cash);

  const targetExpense =
    number(data.targets.expense);

  let html = "";

  if (!targetRevenue && !targetCash && !targetExpense) {

    html = `
      <p>
        Tentukan target pendapatan, saldo kas, atau batas pengeluaran
        terlebih dahulu.
      </p>
    `;

  } else {

    html += `<p>Analisis target bisnis:</p><ul>`;

    if (targetRevenue > 0) {

      const gap =
        targetRevenue - currentRevenue;

      if (gap > 0) {

        html += `
          <li>
            Target pendapatan masih
            <strong>${money(gap)}</strong>
            di atas rata-rata pendapatan bulanan saat ini.
          </li>
        `;

      } else {

        html += `
          <li>
            Rata-rata pendapatan saat ini sudah berada
            di atas target yang dimasukkan.
          </li>
        `;

      }

    }

    if (targetExpense > 0) {

      const gap =
        currentExpense - targetExpense;

      if (gap > 0) {

        html += `
          <li>
            Pengeluaran rata-rata perlu ditekan sekitar
            <strong>${money(gap)}</strong>
            untuk mencapai batas target.
          </li>
        `;

      } else {

        html += `
          <li>
            Pengeluaran rata-rata masih berada dalam batas target.
          </li>
        `;

      }

    }

    if (targetCash > 0) {

      const gap =
        targetCash - currentCash;

      if (gap > 0) {

        html += `
          <li>
            Bisnis membutuhkan tambahan kas sekitar
            <strong>${money(gap)}</strong>
            untuk mencapai target saldo.
          </li>
        `;

      } else {

        html += `
          <li>
            Saldo kas saat ini sudah berada di atas target.
          </li>
        `;

      }

    }

    html += "</ul>";

  }

  $("planningAnalysis").innerHTML = html;

  renderActionPlan();

  showToast("Business plan diperbarui");
}

function renderPlanning() {

  if (
    data.targets.revenue ||
    data.targets.cash ||
    data.targets.expense
  ) {

    generateBusinessPlan();

  } else {

    $("planningAnalysis").innerHTML =
      "Belum ada target bisnis. Masukkan target untuk membuat analisis.";

    renderActionPlan();

  }
}

function renderActionPlan() {

  const actions = [];

  const revenue =
    getMonthlyAverageRevenue();

  const expense =
    getMonthlyAverageExpense() +
    getMonthlyAveragePurchase();

  const cash =
    getCurrentCash();

  if (cash < 0) {

    actions.push({
      title: "Prioritaskan pemulihan cashflow",
      text:
        "Periksa pengeluaran terbesar dan simulasi perubahan pengeluaran sebelum menambah komitmen biaya baru."
    });

  }

  if (revenue > 0 && expense > revenue) {

    actions.push({
      title: "Evaluasi rasio pengeluaran terhadap pendapatan",
      text:
        "Gunakan Simulasi Skenario untuk menguji pengurangan biaya dan perubahan penjualan."
    });

  }

  if (revenue > 0 && expense < revenue) {

    actions.push({
      title: "Uji skenario pertumbuhan",
      text:
        "Simulasikan kenaikan penjualan sekaligus perubahan pembelian untuk melihat kebutuhan modal kerja."
    });

  }

  if (data.sales.length > 0) {

    actions.push({
      title: "Pantau tren penjualan",
      text:
        "Tambahkan data secara rutin agar forecast mempunyai histori yang lebih panjang."
    });

  }

  actions.push({
    title: "Gunakan forecast sebagai dasar perencanaan",
    text:
      "Bandingkan forecast dasar dengan beberapa skenario sebelum membuat keputusan bisnis."
  });

  $("actionPlan").innerHTML = actions.map((item, index) => `
    <div class="action-item">
      <div class="action-number">${index + 1}</div>
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <p>${escapeHTML(item.text)}</p>
      </div>
    </div>
  `).join("");
}

/* =========================================================
   AI BUSINESS INSIGHT
========================================================= */

function renderAIInsights() {

  const container = $("insightCards");

  const insights = generateAdvancedInsights();

  container.innerHTML = insights.map(item => `
    <div class="insight-card ${item.type}">
      <div class="insight-card-header">
        <div class="insight-icon">${item.icon}</div>
        <h3>${escapeHTML(item.title)}</h3>
      </div>
      <p>${escapeHTML(item.text)}</p>
    </div>
  `).join("");
}

function generateAdvancedInsights() {

  const result = [];

  const revenue =
    getSalesTotal();

  const expenses =
    getExpenseTotal();

  const purchases =
    getPurchaseTotal();

  const cash =
    getCurrentCash();

  const net =
    getNetCashflow();

  if (
    data.sales.length === 0 &&
    data.expenses.length === 0 &&
    data.purchases.length === 0
  ) {

    return [{
      type: "info",
      icon: "i",
      title: "Belum ada histori",
      text:
        "Masukkan data penjualan, pembelian, dan pengeluaran untuk membangun dasar analisis."
    }];

  }

  result.push({
    type: net >= 0 ? "success" : "danger",
    icon: net >= 0 ? "↑" : "↓",
    title: "Cashflow",
    text:
      `Net cashflow dari data saat ini adalah ${money(net)}.`
  });

  if (revenue > 0) {

    const expenseRatio =
      ((expenses + purchases) / revenue) * 100;

    result.push({
      type:
        expenseRatio <= 70
          ? "success"
          : expenseRatio <= 100
            ? "warning"
            : "danger",
      icon: "%",
      title: "Rasio Beban",
      text:
        `Pengeluaran dan pembelian mencapai sekitar ${expenseRatio.toFixed(1)}% dari penjualan yang tercatat.`
    });

  }

  if (purchases > revenue && revenue > 0) {

    result.push({
      type: "warning",
      icon: "!",
      title: "Modal Kerja",
      text:
        "Pembelian lebih besar daripada penjualan yang tercatat. Sistem menyarankan pengujian skenario stok sebelum meningkatkan pembelian."
    });

  }

  if (cash > 0) {

    const monthlyBurn =
      getMonthlyAverageExpense() +
      getMonthlyAveragePurchase();

    if (monthlyBurn > 0) {

      const runway =
        cash / monthlyBurn;

      result.push({
        type: runway >= 3 ? "success" : "warning",
        icon: "⌁",
        title: "Cash Runway",
        text:
          `Dengan rata-rata pengeluaran saat ini, kas memiliki estimasi daya tahan sekitar ${runway.toFixed(1)} bulan.`
      });

    }

  }

  if (data.forecast.length) {

    const futureCash =
      data.forecast[data.forecast.length - 1].cash;

    result.push({
      type: futureCash >= 0 ? "info" : "danger",
      icon: "→",
      title: "Forecast",
      text:
        `Saldo kas pada akhir forecast saat ini diproyeksikan sekitar ${money(futureCash)}.`
    });

  }

  if (data.scenario) {

    result.push({
      type:
        data.scenario.impact >= 0
          ? "success"
          : "warning",
      icon: "◈",
      title: "Scenario",
      text:
        `Simulasi terakhir menghasilkan dampak kas ${money(data.scenario.impact)} dibandingkan kondisi dasar.`
    });

  }

  return result.slice(0, 8);
}

/* =========================================================
   REPORT
========================================================= */

function renderReport() {

  $("reportCompany").textContent =
    data.settings.businessName;

  $("reportDate").textContent =
    new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  $("reportRevenue").textContent =
    money(getSalesTotal());

  $("reportExpense").textContent =
    money(getExpenseTotal() + getPurchaseTotal());

  $("reportNet").textContent =
    money(getNetCashflow());

  $("reportCash").textContent =
    money(getCurrentCash());

  const net = getNetCashflow();

  $("reportSummary").innerHTML = `
    <p>
      Total penjualan tercatat sebesar
      <strong>${money(getSalesTotal())}</strong>.
    </p>
    <p>
      Pengeluaran dan pembelian tercatat sebesar
      <strong>${money(getExpenseTotal() + getPurchaseTotal())}</strong>.
    </p>
    <p>
      Net cashflow saat ini adalah
      <strong class="${net >= 0 ? "positive" : "negative"}">
        ${money(net)}
      </strong>.
    </p>
  `;

  if (data.forecast.length) {

    const future =
      data.forecast[data.forecast.length - 1];

    $("reportForecast").innerHTML = `
      <p>
        Forecast akhir periode:
        <strong>${escapeHTML(future.month)}</strong>
      </p>

      <p>
        Revenue:
        <strong>${money(future.revenue)}</strong>
      </p>

      <p>
        Net Cashflow:
        <strong>${money(future.net)}</strong>
      </p>

      <p>
        Ending Cash:
        <strong>${money(future.cash)}</strong>
      </p>
    `;

  } else {

    $("reportForecast").textContent =
      "Forecast belum dibuat.";

  }
}

/* =========================================================
   SETTINGS
========================================================= */

function loadSettingsToForm() {

  $("businessName").value =
    data.settings.businessName;

  $("openingBalance").value =
    data.settings.openingBalance || "";
}

function saveSettings() {

  const businessName =
    $("businessName").value.trim();

  const openingBalance =
    number($("openingBalance").value);

  data.settings.businessName =
    businessName || "AI CASHFLOW BUSINESS";

  data.settings.openingBalance =
    openingBalance;

  saveData();

  renderAll();

  showToast("Pengaturan disimpan");
}

function resetApplicationData() {

  const confirmed =
    confirm(
      "Semua data bisnis, forecast, skenario, dan pengaturan akan dihapus. Lanjutkan?"
    );

  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);

  data = structuredClone(defaultData);

  renderAll();

  loadSettingsToForm();

  loadTargetsToForm();

  showToast("Semua data telah dihapus");
}

/* =========================================================
   CHART ENGINE
   Native Canvas — no external library required.
========================================================= */

function setupCanvas(canvas) {

  const rect =
    canvas.getBoundingClientRect();

  const ratio =
    window.devicePixelRatio || 1;

  canvas.width =
    Math.max(1, rect.width * ratio);

  canvas.height =
    Math.max(1, rect.height * ratio);

  const ctx =
    canvas.getContext("2d");

  ctx.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );

  return {
    ctx,
    width: rect.width,
    height: rect.height
  };
}

function drawAxes(ctx, width, height, padding) {

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(
    padding.left,
    padding.top
  );

  ctx.lineTo(
    padding.left,
    height - padding.bottom
  );

  ctx.lineTo(
    width - padding.right,
    height - padding.bottom
  );

  ctx.stroke();
}

function drawLineChart(canvas, datasets, labels) {

  if (!canvas) return;

  const setup =
    setupCanvas(canvas);

  const ctx = setup.ctx;

  const width = setup.width;

  const height = setup.height;

  ctx.clearRect(0, 0, width, height);

  const padding = {
    top: 25,
    right: 20,
    bottom: 45,
    left: 55
  };

  const allValues =
    datasets.flatMap(dataset => dataset.values);

  if (!allValues.length) return;

  let min =
    Math.min(...allValues);

  let max =
    Math.max(...allValues);

  if (min === max) {

    min -= 1;

    max += 1;

  }

  const range =
    max - min;

  drawAxes(
    ctx,
    width,
    height,
    padding
  );

  /*
    Horizontal grid
  */

  for (let i = 0; i <= 4; i++) {

    const y =
      padding.top +
      ((height - padding.top - padding.bottom) *
        i / 4);

    ctx.strokeStyle = "#f1f5f9";

    ctx.beginPath();

    ctx.moveTo(
      padding.left,
      y
    );

    ctx.lineTo(
      width - padding.right,
      y
    );

    ctx.stroke();

    const value =
      max - range * i / 4;

    ctx.fillStyle = "#64748b";

    ctx.font = "10px Arial";

    ctx.textAlign = "right";

    ctx.fillText(
      shortMoney(value),
      padding.left - 7,
      y + 3
    );

  }

  datasets.forEach((dataset, datasetIndex) => {

    const values =
      dataset.values;

    if (!values.length) return;

    ctx.strokeStyle =
      datasetIndex === 0
        ? "#2563eb"
        : "#16a34a";

    ctx.lineWidth = 2.5;

    ctx.beginPath();

    values.forEach((value, index) => {

      const x =
        values.length === 1
          ? width / 2
          : padding.left +
            ((width -
              padding.left -
              padding.right) *
              index /
              (values.length - 1));

      const y =
        padding.top +
        ((max - value) / range) *
        (height -
          padding.top -
          padding.bottom);

      if (index === 0) {

        ctx.moveTo(x, y);

      } else {

        ctx.lineTo(x, y);

      }

    });

    ctx.stroke();

    values.forEach((value, index) => {

      const x =
        values.length === 1
          ? width / 2
          : padding.left +
            ((width -
              padding.left -
              padding.right) *
              index /
              (values.length - 1));

      const y =
        padding.top +
        ((max - value) / range) *
        (height -
          padding.top -
          padding.bottom);

      ctx.fillStyle =
        datasetIndex === 0
          ? "#2563eb"
          : "#16a34a";

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        4,
        0,
        Math.PI * 2
      );

      ctx.fill();

    });

  });

  /*
    Labels
  */

  labels.forEach((label, index) => {

    const x =
      labels.length === 1
        ? width / 2
        : padding.left +
          ((width -
            padding.left -
            padding.right) *
            index /
            (labels.length - 1));

    ctx.fillStyle = "#64748b";

    ctx.font = "10px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
      String(label),
      x,
      height - 15
    );

  });

  /*
    Legend
  */

  datasets.forEach((dataset, index) => {

    const x =
      padding.left + index * 110;

    ctx.fillStyle =
      index === 0
        ? "#2563eb"
        : "#16a34a";

    ctx.fillRect(
      x,
      7,
      20,
      3
    );

    ctx.fillStyle = "#475569";

    ctx.font = "10px Arial";

    ctx.textAlign = "left";

    ctx.fillText(
      dataset.name,
      x + 25,
      11
    );

  });
}

function shortMoney(value) {

  const n = number(value);

  if (Math.abs(n) >= 1000000000) {
    return "Rp" + (n / 1000000000).toFixed(1) + "M";
  }

  if (Math.abs(n) >= 1000000) {
    return "Rp" + (n / 1000000).toFixed(1) + "jt";
  }

  if (Math.abs(n) >= 1000) {
    return "Rp" + (n / 1000).toFixed(1) + "rb";
  }

  return "Rp" + Math.round(n);
}

/* =========================================================
   DASHBOARD CHART
========================================================= */

function drawCashflowChart() {

  const months =
    getHistoricalMonths();

  if (!months.length) {

    $("chartEmpty").style.display = "grid";

    return;
  }

  $("chartEmpty").style.display = "none";

  drawLineChart(
    $("cashflowChart"),
    [
      {
        name: "Revenue",
        values: months.map(item => item.revenue)
      },
      {
        name: "Expense",
        values: months.map(item =>
          item.expense + item.purchase
        )
      }
    ],
    months.map(item => item.key)
  );
}

/* =========================================================
   FORECAST CHART
========================================================= */

function drawForecastChart() {

  const result = data.forecast || [];

  if (!result.length) return;

  drawLineChart(
    $("forecastChart"),
    [
      {
        name: "Cash",
        values: result.map(item => item.cash)
      },
      {
        name: "Net",
        values: result.map(item => item.net)
      }
    ],
    result.map(item => item.month)
  );
}

/* =========================================================
   SCENARIO CHART
========================================================= */

function drawScenarioChart() {

  const scenario =
    data.scenario;

  if (!scenario) return;

  const months =
    Math.max(1, scenario.months);

  const labels = [];

  const baseValues = [];

  const scenarioValues = [];

  const baseStart =
    getCurrentCash();

  for (let i = 0; i <= months; i++) {

    labels.push(
      i === 0
        ? "Sekarang"
        : "Bulan " + i
    );

    const base =
      baseStart +
      (
        getMonthlyAverageRevenue() -
        getMonthlyAverageExpense() -
        getMonthlyAveragePurchase()
      ) * i;

    const scenarioCash =
      baseStart +
      scenario.scenarioNet * i;

    baseValues.push(base);

    scenarioValues.push(scenarioCash);

  }

  drawLineChart(
    $("scenarioChart"),
    [
      {
        name: "Base",
        values: baseValues
      },
      {
        name: "Scenario",
        values: scenarioValues
      }
    ],
    labels
  );
}

/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener("resize", () => {

  const activePage =
    document.querySelector(".page.active");

  if (!activePage) return;

  if (activePage.id === "dashboardPage") {
    drawCashflowChart();
  }

  if (activePage.id === "forecastPage") {
    drawForecastChart();
  }

  if (activePage.id === "scenarioPage") {
    drawScenarioChart();
  }

});

/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener("keydown", event => {

  if (event.key === "Escape") {

    document.querySelectorAll(".modal.active")
      .forEach(modal => {
        modal.classList.remove("active");
      });

  }

});

/* =========================================================
   FINAL SAFETY
========================================================= */

window.AICashflow = {
  getData: () => data,
  saveData,
  generateForecast,
  runScenario,
  generateBusinessPlan,
  renderAll
};