// ==UserScript==
// @name         reCAPTCHA v2 image solver - noCaptchaAi
// @name:ar      reCAPTCHA v2 image solver - noCaptchaAi حلال
// @name:ru      noCaptchaAI Решатель капчи reCAPTCHA v2 image
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      3.9.2
// @run-at       document-start
// @description  reCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @description:ar تجاوز برنامج Captcha Solver الآلي لخدمة reCaptcha Solver خدمة Ai. 6000 🔥 حل / شهر مجاني! 50x⚡ أسرع من 2Captcha وغيرها
// @description:ru reCaptcha Solver автоматизирует решение Captcha Solver в обход сервиса Ai. Бесплатно 6000 🔥решений/месяц! В 50 раз⚡ быстрее, чем 2Captcha и другие
// @description:zh-CN reCaptcha Solver 自动绕过 Ai 服务的 Captcha Solver。 免费 6000 🔥解决/月！ 比 2Captcha 和其他人快 50x⚡
// @author       noCaptcha AI, Diego and Subcode
// @match        http*://*/*
// @icon         https://avatars.githubusercontent.com/u/110127579
// @updateURL    https://github.com/noCaptchaAi/reCaptcha-Solver.user.js/raw/main/reCaptchaSolver.user.js
// @downloadURL  https://github.com/noCaptchaAi/reCaptcha-Solver.user.js/raw/main/reCaptchaSolver.user.js
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_listValues
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @license      MIT
// ==/UserScript==
(async () => {
    const softid = "recapUser_v" + GM_info.script.version;
    const searchParams = new URLSearchParams(location.search);
    const open = XMLHttpRequest.prototype.open;

    const cfg = new config({
        APIKEY: "",
        PLAN: "free",
        LOOP: false,
        RECAPTCHA: true,
        AUTO_SOLVE: true,
        DEBUG_LOGS: false,
        CHECKBOX_AUTO_OPEN: true
    });

    const isApikeyEmpty = !cfg.get("APIKEY");
    let sitekey, wait = 666; //temp

    XMLHttpRequest.prototype.open = function () {
        if (location.href.includes("recaptcha/api2")) {
            log(location.href);
            this.addEventListener("load", runSolver);
        }
        open.apply(this, arguments);
    }

    addMenu("⚙️ Settings", cfg.open, !isApikeyEmpty);
    addMenu(isApikeyEmpty ? "Login" : "📈 Dashboard/ 💰 Buy Plan / 👛 Balance info", "https://dash.nocaptchaai.com")
    addMenu("🏠 HomePage", "https://nocaptchaai.com");
    addMenu("📄 Api Docs", "https://docs.nocaptchaai.com/category/api-methods");
    addMenu("❓ Discord", "https://discord.gg/E7FfzhZqzA");
    addMenu("❓ Telegram", "https://t.me/noCaptchaAi");

    //todo sitekey check
    //log("loop running in bg"); //document.hasFocus()

    // GM_addValueChangeListener("APIKEY", function (key, oldValue, newValue, remote) {
    //     log("The value of the '" + key + "' key has changed from '" + oldValue + "' to '" + newValue + "'");
    //     location = location.href;
    // });

    if (location.hostname === "config.nocaptchaai.com") {
        if (searchParams.has("apikey") && searchParams.has("plan") && document.referrer === "https://dash.nocaptchaai.com/") {
            cfg.set("APIKEY", searchParams.get("apikey"));
            cfg.set("PLAN", searchParams.get("plan"));
            // Toast.fire({
            //     title: "noCaptchaAi.com \n Config Saved Successfully."
            // });
            jsNotif("noCaptchaAi.com \n Config Saved Successfully.", 5000);
            history.replaceState({}, document.title, "/");
        }

        window.addEventListener('load', function (params) {
            const template = document.getElementById("tampermonkey");
            const clone = template.content.cloneNode(true);
            const inputs = clone.querySelectorAll("input");

            for (const input of inputs) {
                const type = input.type === "checkbox" ? "checked" : "value";
                input[type] = cfg.get(input.id);
                input.addEventListener("change", function (e) {
                    // Toast.fire({
                    //     title: "Your change has been saved"
                    // });
                    jsNotif("Your change has been saved", 5000);
                    cfg.set(input.id, e.target[type])
                })
            }

            document.querySelector("h1").after(clone);

        })
    }

    let currentType = '';
    async function runSolver() {
        log("runSolver");
        if (isApikeyEmpty || !cfg.get("AUTO_SOLVE") || this.responseType === "arraybuffer" || !this.responseText) {
            return;
        }
        log("captcha loaded");

        try {
            let data = JSON.parse(this.responseText.replace(')]}\'\n', ''));
            if (this.responseURL.startsWith("https://www.google.com/recaptcha/api2/") && cfg.get("RECAPTCHA")) {
                sitekey ||= searchParams.get("k");

                if (data[0] === 'dresp') {
                    log("Dynamic response");
                } else if (data[0] === 'uvresp') {
                    log("User verify response");
                    if (data[2] != 1) {
                        data = data[7];
                    } else {
                        log("Response: captcha solved");
                        return;
                    }
                } else {
                    log("Reload response");
                }

                const type = data.at(5);
                const p = data.at(9);
                log("type: " + type);
                if (type === "audio") {
                    log("Audio not implemented");
                    //return audio("https://www.google.com/recaptcha/api2/payload/audio.mp3?p="+ p +"&k=" + sitekey);
                } else if (type === "imageselect" || type === "dynamic") {
                    currentType = type;
                    const image = await getBase64FromUrl('https://www.google.com/recaptcha/api2/payload?p=' + p + '&k=' + sitekey)
                    const target = data.at(4).at(1).at(6);
                    await solveRE(image, 33, target, type === "dynamic");

                } else if (type === "multicaptcha") {
                    currentType = type;
                    await solveREM();

                } else if (type === "tileselect") {
                    currentType = type;
                    await solveRE44();

                } else if (type === "nocaptcha") {
                    log("captcha solve done");
                    return;
                } else if (type === "doscaptcha") {
                    log("automation detected");
                    return;
                } else if (currentType == "multicaptcha") {
                    setTimeout(solveREM, 1000);
                    return;
                }
            }

        } catch (e) {
            log("loadCatch error: " + e);
            // console.error(this.responseText);
        }

        //Check for errors in solve
        await sleep(500);

        if (isRecapError()) { //todo var uvresp to check errors
            recapReload();
        }
    }

    function recapExpired() {
        const recap = document.querySelector("#recaptcha-anchor");
        return recap?.classList.contains('recaptcha-checkbox-expired');
    }

    function recapSolved() {
        let captcha = document.querySelector("#recaptcha-anchor");
        if (captcha) {
            return captcha.getAttribute("aria-checked") === "true";
        }
        return true;
    }

    function isFrameVisible(element) {
        var style = window.getComputedStyle(element);
        if (element.offsetParent === null) {
            return false;
        } else {
            return true;
        }
    }

    function isCaptchaFrame() {
        if (document.getElementById('recaptcha-anchor')) {
            return true;
        }
        return false;
    }

    function hasCaptchas() {
        var iframes = document.getElementsByTagName('iframe');
        for (var i = 0; i < iframes.length; i++) {
            if (iframes[i].title === "reCAPTCHA") {
                return true;
            }
        }
        return false;
    }

    function msgVisibleCaptchas() {
        var iframes = document.getElementsByTagName('iframe');
        for (var i = 0; i < iframes.length; i++) {
            if (iframes[i].title === "reCAPTCHA") {
                var visible = isFrameVisible(iframes[i]);
                if (visible) {
                    iframes[i].contentWindow.postMessage('reCaptchaVisible', '*');
                } else {
                    iframes[i].contentWindow.postMessage('reCaptchaHidden', '*');
                }
            }
        }
    }

    let captchaVisible = false;
    window.addEventListener('message', function (event) {
        if (event.data === "reCaptchaVisible") {
            if (!captchaVisible) {
                log("Captcha Visible");
                captchaVisible = true;
            }
        } else if (event.data === "reCaptchaHidden") {
            if (captchaVisible) {
                log("Captcha Hidden");
                captchaVisible = false;
            }
        }
    });

    let captchaOpened = false;
    while (!(!navigator.onLine || isApikeyEmpty)) {
        await sleep(1000);

        if (!isCaptchaFrame()) {
            if (hasCaptchas()) {
                msgVisibleCaptchas();
            }
        } else if (captchaVisible) {
            if (cfg.get("CHECKBOX_AUTO_OPEN") && document.contains(document.querySelector('.recaptcha-checkbox')) && !captchaOpened) {
                log("opening recaptcha");
                captchaOpened = true;
                fireMouseEvents(document.querySelector("#recaptcha-anchor"));
            } else if (recapExpired()) {
                // check for expired captcha
                log("recaptcha expired");
                captchaOpened = false;
            } else if (recapSolved()) {
                log("recaptcha solved");
                break;
            }
        }
    }

    //Solve function for dynamic 3x3, checks previously solved indexes
    async function solveRED(target, array) {
        while (document.querySelectorAll('.rc-image-tile-11').length < array.length && document.querySelector('.rc-imageselect-dynamic-selected').length === 0) {
            await sleep(100);
        }
        
        log("solveRED");
        let cells = document.querySelectorAll('.rc-image-tile-wrapper img');

        const images = {}

        for (const index of array) {
            images[index] = await getBase64FromUrl(cells[index].src)
        }

        if (Object.keys(images).length == 0) {
            return recapReload();
        }

        const data = await apiSolve({
            images,
            target,
            type: 'split_33',
            method: "recaptcha2",
            softid
        }, true);

        let result = await getResult(data, true);

        if (result.solution.length == 0) {
            return submit();
        }

        for (const index of result.solution) {
            cells[index].click();
            await sleep(1000);
        }

        await solveRED(target, result.solution);
    }

    function submit() {
        fireMouseEvents(document.querySelector("#recaptcha-verify-button"));
    }

    function isRecapError() {
        try {
            // Check if error messages are shown
            let err1 = document.querySelector(".rc-imageselect-error-select-more").style.display !== 'none';
            let err2 = document.querySelector(".rc-imageselect-error-dynamic-more").style.display !== 'none';

            log("isRecapError: " + err1 + " / " + err2);
            return (err1 || err2);

        } catch (e) {
            log("isRecapError fault: " + e);
        }
        return false;
    }

    // function isSolveError() {
    //     try {
    //         // Check if try again message is shown
    //         let err = document.querySelector(".rc-imageselect-incorrect-response").style.display !== 'none';

    //         log("isSolveError: " + err);
    //         return (err);
    //     } catch (e) {
    //         log("isSolveError fault: " + e);
    //     }
    //     return false;
    // }

    function recapReload() {
        // clear errors to prevent reloading the captcha twice in a row
        document.querySelector(".rc-imageselect-error-select-more").style.display = 'none';
        document.querySelector(".rc-imageselect-error-dynamic-more").style.display = 'none';

        // press reload captcha button
        fireMouseEvents(document.querySelector("#recaptcha-reload-button"));
    }

    async function getResult(data, beta = false) {
        log("getResult: " + beta);
        switch (data.status) {
            case "new":
                log("⏳ waiting a second");
                await sleep(1000);
                data = await apiStatus(data.url)
                break;
            case "solved":
                break;
            case "skip":
                log("⚠️ Seems this a new challenge, please contact noCaptchaAi!");
                break;
            default:
                log("😨 Unknown status", data.status);
                recapReload();
        }
        return data;
    }

    //Solve function for Recaptcha Multi
    async function solveREM() {
        log("solveREM");

        const target = document.querySelector('.rc-imageselect-desc-no-canonical strong')?.textContent
        const cells = document.querySelectorAll('.rc-image-tile-wrapper img');
        const image = document.querySelector('.rc-image-tile-44')?.src;

        const data = await apiSolve({
            images: {
                0: await getBase64FromUrl(image)
            },
            target,
            type: '44',
            method: "recaptcha2",
            softid
        }, true)

        let result = await getResult(data, true);

        for (const index of result.solution) {
            fireMouseEvents(cells[index]);
            await sleep(500);
        }

        submit();
    }

    //Solve function for Recaptcha Multi
    async function solveRE44() {
        log("solveRE44");
        const target = document.querySelector('.rc-imageselect-desc-no-canonical strong')?.textContent
        const cells = document.querySelectorAll('.rc-image-tile-wrapper img');
        const image = document.querySelector('.rc-image-tile-44')?.src;

        const data = await apiSolve({
            images: {
                0: await getBase64FromUrl(image)
            },
            target,
            type: '44',
            method: "recaptcha2",
            softid
        }, true)

        let result = await getResult(data, true);

        for (const index of result.solution) {
            fireMouseEvents(cells[index]);
            await sleep(wait);
        }

        await sleep(1000);
        submit();
    }

    //Solve function for Recaptcha 3x3
    async function solveRE(image, type, target, isDynamic) {
        log("solveRE");
        const htmlTarget = document.querySelector('.rc-imageselect-desc-no-canonical strong')?.textContent;
        log(target, htmlTarget);
        const data = await apiSolve({
            images: {
                0: image
            },
            target: target || htmlTarget,
            type,
            method: "recaptcha2",
            softid
        }, true);

        let result = await getResult(data, true);

        const cells = document.querySelectorAll('.rc-image-tile-wrapper');
        for (const index of result.solution) {
            fireMouseEvents(cells[index]);
            await sleep(wait);
        }

        if (isDynamic) {
            await sleep(5000); //Wait for new images to show up
            await solveRED(target, result.solution);
        } else {
            submit();
        }

    }

    // async function audio(url) {
    //     const arrayBuffer = await fetch(url).then(response => response.arrayBuffer());
    //     const body = new FormData();
    //     body.append("audio", new Blob([arrayBuffer], { type: "audio/mp3" }), "audio.mp3");
    //     const data = await apiFetch(body, "audio")
    //     document.querySelector("#audio-response").value = data.solution;
    // }

    async function getBase64FromUrl(url) {
        const blob = await (await fetch(url)).blob();
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.addEventListener("loadend", function () {
                resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ""));
            });
            reader.addEventListener("error", function () {
                reject("❌ Failed to convert url to base64");
            });
        });
    }

    async function apiSolve(body, beta, v = "solve", method = "POST") {
        log("apiFetch: request solve");
        const options = {
            method,
            headers: {
                "Content-Type": "application/json",
                apikey: cfg.get("APIKEY")
            },
        }

        if (method !== "GET") {
            options.body = JSON.stringify(body)
        }

        const response = await fetch("https://" + (beta ? "recap" : cfg.get("PLAN")) + ".nocaptchaai.com/" + v, options)
        const data = await response.json();
        return data;
    }

    async function apiStatus(url) {
        log("apiStatus: request solve result");
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                apikey: cfg.get("APIKEY")
            },
        }

        const response = await fetch(url, options)
        const data = await response.json();
        return data;
    }

    function addMenu(name, url, check = true) {
        if (!check) {
            return;
        }

        GM_registerMenuCommand(name, function () {
            if (typeof url === "function") {
                url();
            } else {
                GM_openInTab(url, {
                    active: true,
                    setParent: true
                });
            }
        });
    }

    function fireMouseEvents(element) {
        if (!document.contains(element)) {
            return;
        }

        for (const eventName of ["mouseover", "mousedown", "mouseup", "click"]) {
            const eventObject = document.createEvent("MouseEvents"); //todo update
            eventObject.initEvent(eventName, true, false);
            element.dispatchEvent(eventObject);
        }
    }

    function config(data) {
        let openWin;

        function get(name) {
            return GM_getValue(name, "")
        }

        function set(name, value) {
            GM_setValue(name, value);
        }

        function open() {
            const windowFeatures = {
                location: "no",
                status: "no",
                left: window.screenX,
                top: window.screenY,
                width: 500,
                height: 500
            };

            const featuresArray = Object.keys(windowFeatures).map(key => key + "=" + windowFeatures[key]);

            openWin = window.open("https://config.nocaptchaai.com/", "_blank", featuresArray.join(","));
            openWin.moveBy(Math.round((window.outerWidth - openWin.outerWidth) / 2), Math.round((window.outerHeight - openWin.outerHeight) / 2));
        }

        function close() {
            openWin?.close();
            openWin = undefined;
        }

        const storedKeys = GM_listValues();
        for (const name in data) {
            if (storedKeys.includes(name)) {
                set(name, get(name));
            } else if (data[name] !== undefined) {
                set(name, data[name]);
            } else {
                set(name, "");
            }
        }

        return { get, set, open, close };
    }

    function random(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function log() {
        cfg.get("DEBUG_LOGS") && console.log.apply(this, arguments)
    }

    function jsNotif(message, duration) {
        const toast = document.createElement("div");
        toast.style.cssText = `
          position: fixed;
          top: 10%;
          left: 0;
          background-color: rgba(0, 0, 0, 0.8);
          border-radius: 4px;
          padding: 16px;
          color: #fff;
          font-size: calc(14px + 0.5vw);
          font-family: 'Arial', sans-serif;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          z-index: 9999;
          transition: all 1s ease-in-out;
        `;
        toast.innerHTML = `${message}`;
        document.body.appendChild(toast);

        const style = document.createElement("style");
        style.innerHTML = `
          @keyframes slideIn {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0); }
          }
      
          @keyframes slideOut {
            0% { transform: translateX(0); }
            100% { transform: translateX(100%); }
          }
        `;
        document.head.appendChild(style);

        // Slide in animation
        toast.style.animation = "slideIn 1s forwards";
        toast.style.animationFillMode = "forwards";

        setTimeout(() => {
            // Slide out animation
            toast.style.animation = "slideOut 1s forwards";

            setTimeout(() => {
                document.body.removeChild(toast);
            }, 1000);
        }, duration || 3000);
    }

})();

