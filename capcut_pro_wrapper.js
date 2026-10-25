// ============================================================
// capcut_pro_wrapper.js — FULL SOURCE (tùy chọn)
// Wrapper cho môi trường không hỗ trợ URL thuần,
// tự parse $request/$response và gọi logic chính.
// ============================================================

(function () {
    try {
        if (typeof $request === "undefined" || !$request.url) {
            return $done({});
        }

        const reqUrl = new URL($request.url);
        const host = reqUrl.hostname;
        const path = reqUrl.pathname.toLowerCase();

        const isHost =
            /(^|\.)capcutapi\.(com|us)$/i.test(host) ||
            /(^|\.)h5-va-api\.capcut\.net$/i.test(host) ||
            /(^|\.)capcut\.com$/i.test(host) ||
            /(^|\.)capcutshare\.com$/i.test(host) ||
            /(^|\.)faceulv\.com$/i.test(host) ||
            /(^|\.)faceueditor\.com$/i.test(host) ||
            /(^|\.)h5\.capcut\.net$/i.test(host);

        if (!isHost) return $done({});

        const UID = "7544992173516489746";
        const SESSION = "98679723a8686ab418fbaf07024a7a4f";
        const EXPIRE_MS = 4102444800000;
        const PLAN_ID = "com.lemon.lv.pro";

        function nowSec() { return Math.floor(Date.now() / 1000); }

        function payloadUserInfo() {
            return {
                code: 0,
                message: "success",
                data: {
                    uid: UID,
                    session_id: SESSION,
                    country: "vn",
                    idc: "alisg",
                    is_login: true,
                    is_pro: true,
                    is_vip: true,
                    vip: true,
                    pro: true,
                    subscription: {
                        status: "active",
                        plan_id: PLAN_ID,
                        plan_name: "Pro",
                        auto_renew: true,
                        start_time: nowSec() - 86400,
                        expire_time: Math.floor(EXPIRE_MS / 1000),
                        expire_time_ms: EXPIRE_MS
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

        function payloadLite() {
            return {
                code: 0,
                message: "success",
                data: {
                    uid: UID,
                    is_pro: true,
                    vip: true,
                    pro: true,
                    plan_id: PLAN_ID,
                    expire_time_ms: EXPIRE_MS,
                    country: "vn",
                    idc: "alisg"
                }
            };
        }

        function payloadList() {
            return {
                code: 0,
                message: "success",
                data: {
                    subscriptions: [{
                        plan_id: PLAN_ID,
                        plan_name: "Pro",
                        status: "active",
                        auto_renew: true,
                        expire_time_ms: EXPIRE_MS
                    }]
                }
            };
        }

        let body = null;

        if (path.includes("/commerce/v1/subscription/user_info")) {
            body = payloadUserInfo();
        } else if (path.includes("/commerce/v1/subscription/list") ||
                   path.includes("/commerce/v1/subscription/plans")) {
            body = payloadList();
        } else if (path.includes("/commerce") && path.includes("lite")) {
            body = payloadLite();
        } else if (path.includes("/commerce/v1/entitlement") ||
                   path.includes("/commerce/v1/benefit")) {
            body = payloadUserInfo();
        } else if (path.includes("/v1/user/info") ||
                   path.includes("/passport/user_info") ||
                   path.includes("/passport/account/info")) {
            body = payloadUserInfo();
        } else if (path.includes("/commerce/v1/subscription/query") ||
                   path.includes("/commerce/v1/subscription/status")) {
            body = payloadUserInfo();
        }

        if (!body) return $done({});

        $done({
            status: 200,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(body)
        });
    } catch (e) {
        $done({});
    }
})();
