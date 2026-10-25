// ============================================================
// [1] SCRIPT RESPONSE BODY — capcut_pro.js
// Shadowrocket: script-response-body
// Chức năng: ghi đè phản hồi API thương mại/subscription
// của hệ CapCut/Faceu thành trạng thái PRO.
// Không giải mã cookie; chỉ thay payload phản hồi.
// ============================================================

const CFG = {
    UID: "7544992173516489746",
    SESSION: "98679723a8686ab418fbaf07024a7a4f",
    EXPIRE_MS: 4102444800000,          // 2100-01-01
    PLAN_ID: "com.lemon.lv.pro",
    PLAN_NAME: "Pro",
    COUNTRY: "vn",
    IDC: "alisg",
    DEBUG: false
};

function log() {
    if (CFG.DEBUG) console.log.apply(console, arguments);
}

function nowSec() { return Math.floor(Date.now() / 1000); }

function jr(obj, status) {
    return {
        status: status || 200,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(obj)
    };
}

function hostMatch(host) {
    return /(^|\.)capcutapi\.(com|us)$/i.test(host) ||
           /(^|\.)h5-va-api\.capcut\.net$/i.test(host) ||
           /(^|\.)capcut\.com$/i.test(host) ||
           /(^|\.)capcutshare\.com$/i.test(host) ||
           /(^|\.)faceulv\.com$/i.test(host) ||
           /(^|\.)faceueditor\.com$/i.test(host) ||
           /(^|\.)h5\.capcut\.net$/i.test(host);
}

function userInfoPayload() {
    return {
        code: 0,
        message: "success",
        data: {
            uid: CFG.UID,
            session_id: CFG.SESSION,
            country: CFG.COUNTRY,
            idc: CFG.IDC,
            is_login: true,
            is_pro: true,
            is_vip: true,
            vip: true,
            pro: true,
            subscription: {
                status: "active",
                plan_id: CFG.PLAN_ID,
                plan_name: CFG.PLAN_NAME,
                auto_renew: true,
                start_time: nowSec() - 86400,
                expire_time: Math.floor(CFG.EXPIRE_MS / 1000),
                expire_time_ms: CFG.EXPIRE_MS
            },
            entitlements: [
                "pro_export_no_watermark",
                "pro_templates",
                "pro_effects",
                "pro_cloud",
                "pro_4k",
                "pro_ai",
                "pro_voice",
                "pro_bg_remove"
            ]
        }
    };
}

function liteInfoPayload() {
    return {
        code: 0,
        message: "success",
        data: {
            uid: CFG.UID,
            is_pro: true,
            vip: true,
            pro: true,
            plan_id: CFG.PLAN_ID,
            expire_time_ms: CFG.EXPIRE_MS,
            country: CFG.COUNTRY,
            idc: CFG.IDC
        }
    };
}

function planListPayload() {
    return {
        code: 0,
        message: "success",
        data: {
            subscriptions: [{
                plan_id: CFG.PLAN_ID,
                plan_name: CFG.PLAN_NAME,
                status: "active",
                auto_renew: true,
                expire_time_ms: CFG.EXPIRE_MS
            }]
        }
    };
}

function entitlementPayload() {
    return {
        code: 0,
        message: "success",
        data: {
            uid: CFG.UID,
            is_pro: true,
            vip: true,
            pro: true,
            entitlements: userInfoPayload().data.entitlements,
            expire_time_ms: CFG.EXPIRE_MS
        }
    };
}

function route(url) {
    const p = url.pathname.toLowerCase();

    if (p.includes("/commerce/v1/subscription/user_info"))
        return jr(userInfoPayload());

    if (p.includes("/commerce/v1/subscription/list") ||
        p.includes("/commerce/v1/subscription/plans"))
        return jr(planListPayload());

    if (p.includes("/commerce") && p.includes("lite"))
        return jr(liteInfoPayload());

    if (p.includes("/commerce/v1/entitlement") ||
        p.includes("/commerce/v1/benefit"))
        return jr(entitlementPayload());

    if (p.includes("/v1/user/info") ||
        p.includes("/passport/user_info") ||
        p.includes("/passport/account/info"))
        return jr(userInfoPayload());

    if (p.includes("/commerce/v1/subscription/query") ||
        p.includes("/commerce/v1/subscription/status"))
        return jr(userInfoPayload());

    return null;
}

(function main() {
    try {
        if (typeof $request === "undefined" || !$request.url) return $done({});
        const u = new URL($request.url);
        if (!hostMatch(u.hostname)) return $done({});

        log("HIT", $request.method, $request.url);
        const ov = route(u);
        if (!ov) return $done({});
        $done(ov);
    } catch (e) {
        log("ERR", e && e.message);
        $done({});
    }
})();
