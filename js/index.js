const baseUrl = "https://tcn.io.vn";
const apiUrl = baseUrl + "/api/instrument_ratios";

function formatTimestamp(timestamp) {
    const d = new Date(timestamp);

    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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
            const volCapRatio = vol24_usdt && cap && cap > 0 ? ((vol24_usdt / cap) * 100).toFixed(2) : 0.0;
            const format_vol24h_usdt = item?.market_future?.format?.turnOver24h ?? "";
            const format_mktcap = item?.market_spot?.format?.marketCap ?? item?.coin_info?.format?.marketCap ?? "";
            const vol24h_percent = item?.volume24h_changes?.["15min"]?.percent ?? "0";
            const trend = item?.trend_analysis ?? { emoji: "⚠️", label: "Thiếu dữ liệu" };
            const price_changes = {
                "15min": {
                    percent: item?.price_changes?.["15min"]?.percent ?? null,
                    current: item?.price_changes?.["15min"]?.current ?? null,
                },
                "1h": {
                    percent: item?.price_changes?.["1h"]?.percent ?? null,
                    current: item?.price_changes?.["1h"]?.current ?? null,
                },
                "4h": {
                    percent: item?.price_changes?.["4h"]?.percent ?? null,
                    current: item?.price_changes?.["4h"]?.current ?? null,
                },
            };

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

            return [
                item.instId || "",
                item.timestamp ? formatTimestamp(item.timestamp) : "",
                parseFloat(item.long_percent ?? "").toFixed(2),
                parseFloat(item.short_percent ?? "0").toFixed(2),
                parseFloat(item.funding_rate_percent ?? "0").toFixed(4),
                // Thêm data-sort cho format_vol24h_usdt
                `<span data-sort="${vol24_usdt}">${format_vol24h_usdt}</span>`,
                // Thêm data-sort cho format_mktcap
                `<span data-sort="${cap}">${format_mktcap}</span>`,
                parseFloat(volCapRatio).toFixed(2),
                vol24h_percent,
                item?.price_changes?.["15min"]?.percent ?? "-",
                item?.price_changes?.["1h"]?.percent ?? "-",
                item?.price_changes?.["4h"]?.percent ?? "-",
                `<span style="display: none">${trendText()}</span><span title="${trend.label}">${getTrendIcon()}</span>`,
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
                    buttons: ["colvis"],
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
                    targets: [5, 6],
                    type: "num", // Đảm bảo sort kiểu số
                    render: function (data, type) {
                        if (type === "sort") {
                            return $(data).data("sort");
                        }
                        return data;
                    },
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

loadData();
