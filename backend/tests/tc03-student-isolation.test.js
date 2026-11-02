
"use strict";

const assert = require("node:assert/strict");

const BASE = "http://localhost:3000/api/v1";

async function testTC03() {
    // 1. Dang nhap tai khoan hoc sinh A.
    const login = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: "DEMO_G05_HS",
            password: process.env.DEMO_G05_HS_PASSWORD
        })
    });

    assert.equal(login.status, 200);

    const cookie = login.headers
        .get("set-cookie")?.split(";")[0];

    assert.ok(cookie, "Khong nhan duoc cookie.");

    // 2. Thu lay ho so hoc sinh B bang tai khoan A.
    const profile = await fetch(
        `${BASE}/hoc-sinh/profile?studentId=23`,
        { headers: { Cookie: cookie } }
    );

    const profileData = await profile.json();

    assert.equal(profile.status, 200);
    assert.equal(String(profileData.data.studentId), "22");

    console.log("PASS_PROFILE_ISOLATION");

    // 3. Thu truy cap API diem quan tri.
    const scores = await fetch(
        `${BASE}/scores?studentId=23`,
        { headers: { Cookie: cookie } }
    );

    assert.equal(scores.status, 403);

    console.log("PASS_ADMIN_SCORE_BLOCKED");

    // 4. Kiem tra API xem diem ca nhan da co chua.
    const personal = await fetch(
        `${BASE}/hoc-sinh/diem?academicYearId=8`,
        { headers: { Cookie: cookie } }
    );

    console.log("PERSONAL_SCORE_HTTP:", personal.status);

    if (personal.status === 404) {
        console.log("TC03: BLOCKED_NO_STUDENT_SCORE_API");
    } else {
        console.log("TC03: CAN_KIEM_TRA_API_CA_NHAN");
    }
}

testTC03().catch(error => {
    console.error("TC03_TEST_ERROR:", error.message);
    process.exitCode = 1;
});
