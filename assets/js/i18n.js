/* 多语言切换：字典位于 assets/js/i18n/*.js，本文件负责应用与交互 */
(function () {
  var STORAGE_KEY = "stv-lang";
  var MANUAL_KEY = "stv-lang-manual";
  var SUPPORTED = ["zh-CN", "zh-HK", "zh-TW", "ja", "en-US", "en-GB"];
  var HTML_LANG = { "zh-CN": "zh-CN", "zh-HK": "zh-HK", "zh-TW": "zh-Hant", "ja": "ja", "en-US": "en-US", "en-GB": "en-GB" };
  var BROWSER_MAP = {
    "zh-cn": "zh-CN",
    "zh-sg": "zh-CN",
    "zh-my": "zh-CN",
    "zh-hk": "zh-HK",
    "zh-mo": "zh-HK",
    "zh-tw": "zh-TW",
    "zh-hant": "zh-TW",
    "ja": "ja",
    "ja-jp": "ja",
    "en-us": "en-US",
    "en-gb": "en-GB"
  };
  var dict = window.STV_I18N || {};

  function readSaved() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function isManual() {
    try {
      return localStorage.getItem(MANUAL_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function save(lang, manual) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      if (manual) localStorage.setItem(MANUAL_KEY, "1");
    } catch (e) {
      /* 隐私模式下不可写，忽略即可 */
    }
  }

  /* 浏览器 / 系统语言 → 站点支持的语言 */
  function detectBrowserLang() {
    var tags = [];
    if (navigator.languages && navigator.languages.length) {
      tags = Array.prototype.slice.call(navigator.languages);
    } else if (navigator.language) {
      tags = [navigator.language];
    }

    for (var i = 0; i < tags.length; i++) {
      var tag = String(tags[i]).toLowerCase().replace(/_/g, "-");
      if (BROWSER_MAP[tag]) return BROWSER_MAP[tag];

      var base = tag.split("-")[0];
      if (base === "zh") {
        if (tag.indexOf("-hk") !== -1 || tag.indexOf("-mo") !== -1) return "zh-HK";
        if (tag.indexOf("hant") !== -1 || tag.indexOf("-tw") !== -1) return "zh-TW";
        return "zh-CN";
      }
      if (base === "ja") return "ja";
      if (base === "en") return tag === "en-gb" ? "en-GB" : "en-US";
    }
    return null;
  }

  function detect() {
    var fromUrl = null;
    try {
      fromUrl = new URLSearchParams(window.location.search).get("lang");
    } catch (e) {
      fromUrl = null;
    }
    if (fromUrl && SUPPORTED.indexOf(fromUrl) !== -1) return fromUrl;

    /* 只在用户主动选过语言时才使用本地记录，避免旧的默认值覆盖系统语言 */
    var saved = readSaved();
    if (saved && isManual() && SUPPORTED.indexOf(saved) !== -1) return saved;

    var browserLang = detectBrowserLang();
    if (browserLang && SUPPORTED.indexOf(browserLang) !== -1) return browserLang;

    return "zh-CN";
  }

  var current = detect();

  function t(key, fallback) {
    var pack = dict[current] || {};
    var val = pack[key];
    if (val === undefined) val = (dict["zh-CN"] || {})[key];
    return val === undefined ? (fallback || "") : val;
  }

  function apply(lang, persist) {
    if (SUPPORTED.indexOf(lang) === -1) lang = "zh-CN";
    current = lang;
    var pack = dict[lang] || {};

    document.documentElement.lang = HTML_LANG[lang] || lang;
    document.documentElement.setAttribute("data-lang", lang);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = pack[el.getAttribute("data-i18n")];
      if (val === undefined) return;
      var attr = el.getAttribute("data-i18n-attr");
      if (attr) {
        attr.split("|").forEach(function (name) {
          el.setAttribute(name.trim(), val);
        });
      } else {
        el.textContent = val;
      }
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var val = pack[el.getAttribute("data-i18n-html")];
      if (val !== undefined) el.innerHTML = val;
    });

    var label = document.querySelector(".lang-current");
    if (label) label.textContent = t("lang.name");

    document.querySelectorAll(".lang-menu [data-lang]").forEach(function (item) {
      var on = item.getAttribute("data-lang") === lang;
      item.setAttribute("aria-selected", on ? "true" : "false");
      item.classList.toggle("is-current", on);
    });

    save(lang, persist !== false);
    document.dispatchEvent(new CustomEvent("stv:langchange", { detail: { lang: lang } }));
  }

  function initSwitcher() {
    var switcher = document.querySelector("[data-lang-switch]");
    if (!switcher) return;

    var toggle = switcher.querySelector(".lang-btn");
    var menu = switcher.querySelector(".lang-menu");
    if (!toggle || !menu) return;

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.hidden = !open;
    };

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      setOpen(menu.hidden);
    });

    menu.addEventListener("click", function (event) {
      var item = event.target.closest("[data-lang]");
      if (!item) return;
      apply(item.getAttribute("data-lang"));
      setOpen(false);
      toggle.focus();
    });

    document.addEventListener("click", function (event) {
      if (!menu.hidden && !switcher.contains(event.target)) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !menu.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  window.STVi18n = {
    t: t,
    apply: apply,
    supported: SUPPORTED,
    get lang() {
      return current;
    }
  };

  apply(current, false);
  initSwitcher();
})();
