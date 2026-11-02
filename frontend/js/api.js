
/* =====================================================
   VT2-02 - API CLIENT DUNG CHUNG
   He thong quan ly ket qua hoc tap hoc sinh THPT

   Muc dich:
   - Gui yeu cau tu frontend den backend
   - Nhan du lieu JSON
   - Xu ly loi HTTP va loi ket noi

   Chua goi API that o buoc nay.
   ===================================================== */

// Dia chi API khi frontend va backend chay cung may chu.
// Khi tich hop, can doi chieu cau hinh voi nhom.
const API_BASE_URL = "/api/v1";

// Ham gui yeu cau API dung chung
async function apiRequest(endpoint, options = {}) {

    // Tao URL day du
    const url = API_BASE_URL + endpoint;

    // Thiet lap yeu cau
    const config = {
        method: options.method || "GET",
        headers: {
            "Accept": "application/json",
            ...options.headers
        }
    };

    // Chi them du lieu gui di neu co body
    if (options.body !== undefined) {
        config.headers["Content-Type"] = "application/json";
        config.body = JSON.stringify(options.body);
    }

    try {
        // Gui yeu cau den backend
        const response = await fetch(url, config);

        // Doc noi dung phan hoi
        const responseText = await response.text();

        let data = null;

        // Chuyen JSON thanh doi tuong JavaScript
        if (responseText !== "") {
            try {
                data = JSON.parse(responseText);
            } catch (error) {
                throw new Error(
                    "Du lieu phan hoi tu may chu khong phai JSON hop le."
                );
            }
        }

        // Kiem tra loi HTTP
        if (!response.ok) {
            const message =
                data && typeof data.message === "string"
                    ? data.message
                    : "Yeu cau that bai. Ma loi: " + response.status;

            throw new Error(message);
        }

        // Tra ve du lieu cho trang dang su dung
        return data;

    } catch (error) {
        console.error("API Error:", error.message);

        // Chuyen loi len trang goi API de hien thi
        throw error;
    }
}

// Cac phuong thuc API dung chung
const apiClient = {

    // Lay du lieu
    get: function (endpoint) {
        return apiRequest(endpoint, {
            method: "GET"
        });
    },

    // Them du lieu
    post: function (endpoint, data) {
        return apiRequest(endpoint, {
            method: "POST",
            body: data
        });
    },

    // Cap nhat mot phan du lieu
    patch: function (endpoint, data) {
        return apiRequest(endpoint, {
            method: "PATCH",
            body: data
        });
    },

    // Xoa du lieu
    delete: function (endpoint) {
        return apiRequest(endpoint, {
            method: "DELETE"
        });
    }
};
