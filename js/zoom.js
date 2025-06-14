let zoomLevel = 100;
function retrieveZoomLevel() {
    const savedZoom = localStorage.getItem("zoomLevel");
    if (savedZoom) {
        zoomLevel = parseInt(savedZoom);
        changeZoom(zoomLevel);
    }
}
function changeZoom(zoomValue) {
    const body = document.body;
    zoomLevel = parseInt(zoomValue); // Cập nhật biến toàn cục

    // Lưu vào localStorage
    localStorage.setItem("zoomLevel", zoomLevel);

    if ("zoom" in body.style) {
        body.style.zoom = zoomLevel + "%";
        body.style.transform = "";
        body.style.transformOrigin = "";
    } else {
        const scale = zoomLevel / 100;
        body.style.transform = `scale(${scale})`;
        body.style.transformOrigin = "0 0";
    }

    // Nếu có thẻ select zoom, đồng bộ giá trị
    const zoomSelect = document.getElementById("zoomSelect");
    if (zoomSelect) zoomSelect.value = zoomLevel;
}
function adjustZoom(isincrease) {
    if (isincrease) {
        zoomLevel += 10;
    } else {
        zoomLevel -= 10;
    }
    changeZoom(zoomLevel);
}

function resetZoom() {
    zoomLevel = 100;
    changeZoom(zoomLevel);
}
window.addEventListener("DOMContentLoaded", () => {
    retrieveZoomLevel();
});
