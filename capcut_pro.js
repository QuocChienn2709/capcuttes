// ============================================================
// capcut_pro.js — BẢN SỬA
// Không hardcode UID/SESSION. Lấy định danh từ:
// 1) JSON phản hồi gốc ($response.body) nếu có
// 2) Header Cookie của $request
// 3) Query/body của $request
// Nếu không tìm thấy, trả nguyên phản hồi gốc.
// ============================================================

const CFG = {
    EXPIRE_MS: 4102444800000,
    PLAN_ID: "com.lemon.lv.pro",
    PLAN_NAME: "Pro",
    COUNTRY: "vn",
    IDC: "alisg",
    DEBUG: true
};

function log() { if (CFG.DEBUG) console.log.apply(console, arguments); }
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

// --- Trích định danh ---
function parseCookies(header) {
    const out = {};
    if (!header) return out;
    header.split(/;\s*/).forEach(function (kv) {
        const i = kv.indexOf("=");
        if (i > 0) out[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
    });
    return out;
}

function extractIdentity() {
    const id = { uid: null, session: null, country: CFG.COUNTRY, idc: CFG.IDC };

    // 1) Từ JSON phản hồi gốc
    try {
        if (typeof $response !== "undefined" && $response.body) {
            const raw = typeof $response.body === "string"
                ? $response.body
                : String($response.body);
            const j = JSON.parse(raw);
            const d = (j && j.data) || j || {};
            id.uid = d.uid || d.user_id || d.userId || (d.user && d.user.uid) || null;
            id.session = d.session_id || d.sessionid || d.sid || null;
            if (d.country) id.country = d.country;
            if (d.idc) id.idc = d.idc;
        }
    } catch (e) { log("resp parse err", e && e.message); }

    // 2) Từ Cookie của request
    try {
        const h = ($request && $request.headers) || {};
        const ck = parseCookies(h.Cookie || h.cookie || "");
        if (!id.session) id.session = ck.sessionid || ck.sid_tt || ck.sessionid_ss || null;
        if (!id.uid && ck.multi_sids) {
            // multi_sids: uid1:sid1|uid2:sid2
            const pairs = decodeURIComponent(ck.multi_sids).split("|");
            for (let i = 0; i < pairs.length; i++) {
                const parts = pairs[i].split(":");
                if (parts.length === 2 && id.session && parts[1] === id.session) {
                    id.uid = parts[0];
                    break;
                }
            }
            if (!id.uid && pairs.length) {
                const first = pairs[0].split(":");
                if (first.length === 2) id.uid = first[0];
            }
        }
        if (ck.store_country_code || ck["store-country-code"])
            id.country = ck.store_country_code || ck["store-country-code"];
        if (ck.store_idc || ck["store-idc"])
            id.idc = ck.store_idc || ck["store-idc"];
    } catch (e) { log("cookie parse err", e && e.message); }

    // 3) Từ query/body request
    try {
        const url = new URL($request.url);
        if (!id.uid) id.uid = url.searchParams.get("uid") || url.searchParams.get("user_id");
        if (!id.session) id.session = url.searchParams.get("sessionid") || url.searchParams.get("sid");
    } catch (e) { log("url parse err", e && e.message); }

    return id;
}

// --- Payload ---
function userInfoPayload(id) {
    return {
        code: 0,
        message: "success",
        data: {
            uid: id.uid,
            session_id: id.session,
            country: id.country,
            idc: id.idc,
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

function liteInfoPayload(id) {
    return {
        code: 0,
        message: "success",
        data: {
            uid: id.uid,
            is_pro: true,
            vip: true,
            pro: true,
            plan_id: CFG.PLAN_ID,
            expire_time_ms: CFG.EXPIRE_MS,
            country: id.country,
            idc: id.idc
        }
    };
}

function planListPayload(id) {
    return {
        code: 0,
        message: "success",
        data: {
            subscriptions: [{
                plan_id: CFG.PLAN_ID,
                plan_name: CFG.PLAN_NAME,
                status: "active",
                auto_renew: true,
                expire_time_ms: CFG.EXPIRE_MS,
                uid: id.uid
            }]
        }
    };
}

function entitlementPayload(id) {
    return {
        code: 0,
        message: "success",
        data: {
            uid: id.uid,
            is_pro: true,
            vip: true,
            pro: true,
            entitlements: userInfoPayload(id).data.entitlements,
            expire_time_ms: CFG.EXPIRE_MS
        }
    };
}

function route(url, id) {
    const p = url.pathname.toLowerCase();

    if (p.includes("/commerce/v1/subscription/user_info")) return jr(userInfoPayload(id));
    if (p.includes("/commerce/v1/subscription/list") ||
        p.includes("/commerce/v1/subscription/plans")) return jr(planListPayload(id));
    if (p.includes("/commerce") && p.includes("lite")) return jr(liteInfoPayload(id));
    if (p.includes("/commerce/v1/entitlement") ||
        p.includes("/commerce/v1/benefit")) return jr(entitlementPayload(id));
    if (p.includes("/v1/user/info") ||
        p.includes("/passport/user_info") ||
        p.includes("/passport/account/info")) return jr(userInfoPayload(id));
    if (p.includes("/commerce/v1/subscription/query") ||
        p.includes("/commerce/v1/subscription/status")) return jr(userInfoPayload(id));

    return null;
}

(function main() {
    try {
        if (typeof $request === "undefined" || !$request.url) return $done({});
        const u = new URL($request.url);
        if (!hostMatch(u.hostname)) return $done({});

        const id = extractIdentity();
        log("IDENTITY", JSON.stringify(id));

        if (!id.uid && !id.session) {
            log("NO IDENTITY — passthrough");
            return $done({});
        }

        const ov = route(u, id);
        if (!ov) return $done({});
        $done(ov);
    } catch (e) {
        log("ERR", e && e.message);
        $done({});
    }
})();
