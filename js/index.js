const baseUrl = "https://tcn.io.vn";
const apiUrl = baseUrl + "/api/instrument_ratios";

function formatDateTime(timestamp) {
    const d = new Date(timestamp);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function formatTimestamp(timestamp) {
    // Tạo helper function để pad số
    const pad = (num) => String(num).padStart(2, "0");

    // Tạo date object và điều chỉnh timezone
    const d = new Date(timestamp);
    const vietnamTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);

    return `${pad(vietnamTime.getDate())}-${pad(vietnamTime.getMonth() + 1)}-${vietnamTime.getFullYear()} ${pad(vietnamTime.getHours())}:${pad(vietnamTime.getMinutes())}:${pad(
        vietnamTime.getSeconds()
    )}`;
}
function handleTradeWindow(instId) {
    const tradeUrl = `https://www.okx.com/vi/trade-swap/${instId}`;

    if (window.tradeWindow && !window.tradeWindow.closed) {
        try {
            window.tradeWindow.location.href = tradeUrl;
            window.tradeWindow.focus();
        } catch (e) {
            console.error("Không thể cập nhật URL cửa sổ trade:", e);
            window.tradeWindow = window.open(tradeUrl, "_blank");
        }
    } else {
        window.tradeWindow = window.open(tradeUrl, "_blank");
    }
}

async function loadData() {
    try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        const instrument_ratios = data.data;

        const table = document.getElementById("ratioTable");
        const message = document.getElementById("noDataMessage");

        if (!instrument_ratios || instrument_ratios.length === 0) {
            table.style.display = "none";
            message.style.display = "block";
            return;
        }

        message.style.display = "none";
        table.style.display = "table";

        // Transform data
        const tableData = instrument_ratios.map((item) => {
            const vol24_usdt = item?.market_future ? item.market_future?.turnOver24h ?? 0.0 : 0.0;
            const cap = item?.market_spot?.marketCap ?? item?.coin_info?.marketCap ?? 0.0;
            const volCapRatio = vol24_usdt && cap && cap > 0 ? ((vol24_usdt / cap) * 100).toFixed(2) : "0.00";
            const format_vol24h_usdt = item?.market_future?.format?.turnOver24h ?? "";
            const format_mktcap = item?.market_spot?.format?.marketCap ?? item?.coin_info?.format?.marketCap ?? "";

            const vol15m_changes = item?.volume_changes?.["15m"] ?? {};
            const vol1h_changes = item?.volume_changes?.["1h"] ?? {};
            const vol4h_changes = item?.volume_changes?.["4h"] ?? {};

            const trend = item?.trend_analysis ?? { emoji: "⚠️", label: "Thiếu dữ liệu" };
            const price15m_changes = item?.price_changes?.["15m"] ?? {};
            const price1h_changes = item?.price_changes?.["1h"] ?? {};
            const price4h_changes = item?.price_changes?.["4h"] ?? {};

            // Các hàm helper giữ nguyên như cũ
            const trendText = () => {
                const p4h_percent = price_changes["4h"]?.percent;

                // Format số theo yêu cầu: phần nguyên 3 chữ số, phần thập phân 2 chữ số
                const formatNumber = (num) => {
                    const [intPart, decPart = ""] = String(num).split(".");

                    // Pad phần nguyên với số 0 bên trái cho đủ 3 chữ số
                    const paddedInt = intPart.padStart(3, "0");

                    // Pad phần thập phân với số 0 bên phải cho đủ 2 chữ số
                    const paddedDec = decPart.padEnd(2, "0");

                    // Nối lại và remove dấu chấm
                    return `${paddedInt}${paddedDec}`;
                };

                if (!p4h_percent) {
                    return `[${(trend?.trend ?? 0) + 2}.00000] ${trend.emoji}`;
                }

                if (p4h_percent >= 0) {
                    const p4h_percent_positive = parseFloat(p4h_percent);
                    const processedPositive = formatNumber(p4h_percent_positive);
                    return `[${(trend?.trend ?? 0) + 2}.${processedPositive}] ${trend.emoji}`;
                }

                const p4h_percent_negative = 100 + parseFloat(p4h_percent);
                const processedNegative = formatNumber(p4h_percent_negative);
                return `[${(trend?.trend ?? 0) + 2}.${processedNegative}] ${trend.emoji}`;
            };
            const getTrendIcon = () => {
                if (trend.trend == 2) {
                    return '<i class="fas fa-arrow-up text-success"></i> <i class="fas fa-arrow-up text-success"></i>';
                }
                if (trend.trend == 1) {
                    return '<i class="fas fa-arrow-up text-success"></i>';
                }
                if (trend.trend == -1) {
                    return '<i class="fas fa-arrow-down text-danger"></i>';
                }
                if (trend.trend == -2) {
                    return '<i class="fas fa-arrow-down text-danger"></i> <i class="fas fa-arrow-down text-danger"></i>';
                }
                return '<i class="fas fa-arrows-left-right text-secondary"></i>';
            };

            const titleChangesValue = (vol_changes) => {
                return `Hiện tại: ${vol_changes.current} \nTrước đó: ${vol_changes.previous}`;
            };

            const spanHTML = (value, title = "", data_sort = null) => {
                return `<span data-sort="${data_sort ?? 0}" title="${title ?? ""}">${value}</span>`;
            };

            const recommendHtml = () => {
                if (!item?.recommendation) {
                    return ``;
                }

                let text = item.recommendation;
                let cssClass = getRecommendationColor(item.recommendation);

                return `<div class="bg-${cssClass} rounded-pill rounded p-1 text-center">${text}</div>`;
            };

            // Sử dụng trong tradeLink
            const tradeLink = `
            <button onclick="showAnalysis('${item.instId}')" class="btn btn-sm btn-info me-2">
                <i class="fas fa-chart-line"></i>
            </button>
            <a href="#" 
                onclick="handleTradeWindow('${item.instId}'); return false;" 
                class="btn btn-sm btn-primary">
                <i class="fas fa-exchange-alt"></i> Trade
            </a>`;
            return [
                // #0 InstID
                item.instId || "",
                // #1 Update At
                item.timestamp ? formatDateTime(item.timestamp) : "",
                // #2 long %
                parseFloat(item.long_percent ?? "").toFixed(2),
                // #3 short %
                parseFloat(item.short_percent ?? "0").toFixed(2),
                // #4 funding rate
                parseFloat(item.funding_rate_percent ?? "0").toFixed(4),
                // #5 vol24_usdt
                spanHTML(format_vol24h_usdt, vol24_usdt, vol24_usdt),
                // #6 cap
                spanHTML(format_mktcap, cap, cap),
                // #7 Vol/Cap %
                parseFloat(volCapRatio).toFixed(2),
                // #8 vol15m_changes
                spanHTML(vol15m_changes?.percent, titleChangesValue(vol15m_changes), vol15m_changes?.percent ?? 0),
                // #9 vol1h_changes
                spanHTML(vol1h_changes?.percent, titleChangesValue(vol1h_changes), vol1h_changes?.percent ?? 0),
                // #10 vol4h_changes
                spanHTML(vol4h_changes?.percent, titleChangesValue(vol4h_changes), vol4h_changes?.percent ?? 0),
                // #11 price15m_changes
                spanHTML(price15m_changes?.percent, titleChangesValue(price15m_changes), price15m_changes?.percent ?? 0),
                // #12 price1h_changes
                spanHTML(price1h_changes?.percent, titleChangesValue(price1h_changes), price1h_changes?.percent ?? 0),
                // #13 price4h_changes
                spanHTML(price4h_changes?.percent, titleChangesValue(price4h_changes), price4h_changes?.percent ?? 0),
                // #14 recommendation
                recommendHtml(),
                // #15 trend
                spanHTML(getTrendIcon(), trend.label, trend.trend),
                // #16 link
                tradeLink,
            ];
        });

        // Initialize DataTable
        window.dataTable = new DataTable("#ratioTable", {
            data: tableData,
            info: true,
            ordering: true,
            pageLength: 50,
            layout: {
                top1: "searchBuilder",
                topStart: {
                    buttons: ["colvis", "excel"],
                },
            },
            stateSave: true,
            columnControl: ["order", "searchDropdown"],
            columnDefs: [
                {
                    targets: "_all", // áp dụng cho tất cả các cột
                    className: "text-nowrap",
                },
                {
                    targets: [5, 6, 8, 9, 10, 11, 12, 15],
                    type: "num", // Đảm bảo sort kiểu số
                    render: function (data, type) {
                        if (type === "sort") {
                            return $(data).data("sort") || 0;
                        }
                        return data;
                    },
                },
                {
                    targets: [16], // cột trade
                    orderable: false, // không cho phép sắp xếp
                    className: "text-center", // căn giữa button
                },
            ],
            ordering: {
                indicators: false,
                handler: false,
            },
            responsive: false,
            language: {
                searchBuilder: {
                    title: "Tìm kiếm nâng cao", // hoặc text khác mà V muốn thay đổi
                    add: "Thêm điều kiện",
                },
                buttons: {
                    colvis: "Hiển/Ẩn thị cột",
                },
            },
        });
    } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        document.getElementById("ratioTable").style.display = "none";
        document.getElementById("noDataMessage").style.display = "block";
    }
}

async function showAnalysis(instId) {
    try {
        const response = await fetch(`${baseUrl}/api/market_analysis?inst_id=${instId}&timeframe=1H`);
        const data = await response.json();
        // Thêm tên coin
        document.getElementById("coinName").textContent = instId;
        // Thêm thời gian phân tích
        if (data.analysis.analysis_time) {
            // const time = new Date(data.analysis.analysis_time);
            const formatted = formatTimestamp(data.analysis.analysis_time);
            document.getElementById("analysisTime").textContent = `Thời gian phân tích: ${formatted}`;
        } else {
            document.getElementById("analysisTime").textContent = "";
        }
        // Thêm sự kiện cho nút trade
        const tradeBtn = document.getElementById("modalTradeBtn");
        tradeBtn.onclick = (e) => {
            e.preventDefault();
            handleTradeWindow(instId); // Mở cửa sổ trade
        };
        // Cập nhật nội dung modal
        document.getElementById("recommendation").textContent = data.analysis.recommendation;
        document.getElementById("recommendation").className = `badge bg-${getRecommendationColor(data.analysis.recommendation)}`;

        // Hiển thị signals
        document.getElementById("signals").innerHTML = data.analysis.signals.map((signal) => `<li class="mb-1">• ${signal}</li>`).join("");

        // Hiển thị indicators
        const ti = data.analysis.technical_indicators;
        document.getElementById("indicators").innerHTML = `
<div class="card bg-dark border-secondary">
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-dark table-bordered border-secondary mb-0">
                <thead>
                    <tr>
                        <th colspan="4" class="text-center bg-dark border-secondary">
                            <i class="fas fa-chart-line me-2"></i>Chỉ báo kỹ thuật
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <!-- RSI & MACD Group -->
                    <tr>
                        <td class="fw-bold bg-dark border-secondary">RSI</td>
                        <td class="${ti.rsi > 70 ? "text-danger" : ti.rsi < 30 ? "text-success" : "text-light"}">
                            ${ti.rsi.toFixed(2)}
                        </td>
                        <td class="fw-bold bg-dark border-secondary">MACD</td>
                        <td class="${ti.macd > 0 ? "text-success" : "text-danger"}">
                            ${ti.macd.toFixed(4)}
                        </td>
                    </tr>
                    
                    <!-- Moving Averages Group -->
                    <tr>
                        <td class="fw-bold bg-dark border-secondary">SMA20</td>
                        <td class="text-light">${ti.sma20.toFixed(5)}</td>
                        <td class="fw-bold bg-dark border-secondary">SMA50</td>
                        <td class="text-light">${ti.sma50.toFixed(5)}</td>
                    </tr>
                    
                    <!-- Volume Group -->
                    <tr>
                        <td class="fw-bold bg-dark border-secondary">Volume</td>
                        <td class="${ti.volume > ti.volume_ema20 ? "text-success" : "text-light"}">
                            ${formatVolume(ti.volume)}
                        </td>
                        <td class="fw-bold bg-dark border-secondary">Vol EMA20</td>
                        <td class="text-light">${formatVolume(ti.volume_ema20)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>`;

        // Hiển thị reasons
        document.getElementById("reasons").innerHTML = data.analysis.reasons
            .map(
                (reason) => `
                <li class="mb-2">
                    <strong>${reason.indicator}:</strong> ${reason.reason}<br>
                    <small class="text-muted">${reason.value}</small>
                </li>`
            )
            .join("");

        // Thêm phần hiển thị nến
        const candlesticksElement = document.getElementById("candlesticks");
        const patterns = data.analysis.candlestick_patterns;

        if (patterns && Object.keys(patterns).length > 0) {
            const patternsHTML = Object.entries(patterns)
                .map(([pattern, info]) => {
                    const signalClass = info.signal === "bullish" ? "text-success" : info.signal === "bearish" ? "text-danger" : "text-warning";

                    return `
                    <div class="card mb-2">
                        <div class="card-body">
                            <h6 class="card-title text-capitalize">
                                ${pattern} 
                                <span class="badge ${signalClass}">
                                    ${info.signal}
                                </span>
                            </h6>
                            <p class="card-text mb-1">${info.meaning}</p>
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">Vị trí: ${info.position}</small>
                                <small class="text-muted">Độ mạnh: ${info.strength}%</small>
                            </div>
                        </div>
                    </div>
                `;
                })
                .join("");

            candlesticksElement.innerHTML = patternsHTML;
            candlesticksElement.parentElement.style.display = "block";
        } else {
            candlesticksElement.parentElement.style.display = "none";
        }
        // Hiển thị modal
        const modal = new bootstrap.Modal(document.getElementById("analysisModal"));
        modal.show();
    } catch (error) {
        console.error("Error fetching analysis:", error);
        alert("Không thể lấy dữ liệu phân tích");
    }
}
// function formatTimestamp(timestamp) {}
function getRecommendationColor(rec) {
    switch (rec.toUpperCase()) {
        case "STRONG_BUY":
            return "strong-buy";
        case "BUY":
            return "success";
        case "SELL":
            return "danger";
        case "HOLD":
            return "info";
        default:
            return "secondary";
    }
}
// Thêm hàm format volume
function formatVolume(vol) {
    if (!vol) return "0";

    if (vol >= 1000000) {
        return (vol / 1000000).toFixed(2) + "M";
    }
    if (vol >= 1000) {
        return (vol / 1000).toFixed(2) + "K";
    }
    return vol.toFixed(2);
}
loadData();
