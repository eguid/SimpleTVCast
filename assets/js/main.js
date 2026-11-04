/* ==========================================================================
   简单电视投屏（SimpleTVCast）官方网站 · 交互脚本
   无依赖、无统计、无第三方资源
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 顶部导航滚动态 ---------- */
  var header = document.getElementById("siteHeader");

  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 2. 移动端导航抽屉 ---------- */
  var navToggle = header && header.querySelector(".nav-toggle");
  var mobileNav = document.getElementById("mobileNav");

  function closeNav() {
    if (!navToggle || !mobileNav) return;
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "打开导航菜单");
    mobileNav.hidden = true;
    document.body.classList.remove("nav-open");
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      if (open) {
        closeNav();
        return;
      }
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "关闭导航菜单");
      mobileNav.hidden = false;
      document.body.classList.add("nav-open");
    });

    mobileNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        closeNav();
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1023) closeNav();
    });
  }

  /* ---------- 3. 滚动揭示 ---------- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-in");
    });
  }

  /* ---------- 4. 首屏四种投屏方式演示 ---------- */
  var heroScreen = document.getElementById("heroScreen");
  var castStatusText = document.getElementById("castStatusText");
  var castButtons = Array.prototype.slice.call(document.querySelectorAll("[data-cast-mode]"));

  if (heroScreen && castButtons.length) {
    var modeLabels = {
      mirror: "实时桌面镜像",
      ppt: "PPT 演示",
      stream: "网络多媒体",
      local: "本地多媒体"
    };

    var applyMode = function (mode) {
      var casting = mode !== null;
      heroScreen.classList.toggle("is-casting", casting);

      if (casting) {
        heroScreen.setAttribute("data-mode", mode);
      } else {
        heroScreen.removeAttribute("data-mode");
      }

      if (castStatusText) {
        castStatusText.textContent = casting ? "投屏中 · " + modeLabels[mode] : "投屏中";
      }

      castButtons.forEach(function (btn) {
        var active = btn.getAttribute("data-cast-mode") === mode;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    };

    castButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-cast-mode");
        applyMode(heroScreen.getAttribute("data-mode") === mode ? null : mode);
      });
    });
  }

  /* ---------- 5. 六种投屏方式切换 ---------- */
  var tablist = document.querySelector(".feature-tabs");

  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    });

    function activateTab(index, focus) {
      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.tabIndex = active ? 0 : -1;
        if (panels[i]) {
          panels[i].hidden = !active;
          panels[i].classList.toggle("is-active", active);
        }
      });
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activateTab(index, false);
      });
    });

    tablist.addEventListener("keydown", function (event) {
      var current = tabs.indexOf(document.activeElement);
      if (current === -1) return;

      var next = null;
      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
          next = (current + 1) % tabs.length;
          break;
        case "ArrowUp":
        case "ArrowLeft":
          next = (current - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          next = 0;
          break;
        case "End":
          next = tabs.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      activateTab(next, true);
    });
  }

  /* ---------- 6. 能力对比横条 ---------- */
  var meters = document.querySelector(".meters");

  if (meters) {
    var fills = Array.prototype.slice.call(meters.querySelectorAll(".meter-fill"));

    var drawMeters = function () {
      fills.forEach(function (fill, index) {
        var value = parseFloat(fill.getAttribute("data-value")) || 0;
        fill.style.transitionDelay = index * 0.12 + "s";
        fill.style.width = Math.max(0, Math.min(100, value)) + "%";
      });
    };

    if ("IntersectionObserver" in window && !reduceMotion) {
      var meterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            drawMeters();
            meterObserver.disconnect();
          });
        },
        { threshold: 0.35 }
      );
      meterObserver.observe(meters);
    } else {
      drawMeters();
    }
  }

  /* ---------- 7. 更新日志展开 ---------- */
  var timelineToggle = document.getElementById("timelineToggle");

  if (timelineToggle) {
    var extraItems = Array.prototype.slice.call(document.querySelectorAll(".tl-extra"));

    timelineToggle.addEventListener("click", function () {
      var expanded = timelineToggle.getAttribute("aria-expanded") === "true";
      var nextState = !expanded;

      extraItems.forEach(function (item) {
        item.hidden = !nextState;
      });

      timelineToggle.setAttribute("aria-expanded", nextState ? "true" : "false");
      timelineToggle.textContent = nextState ? "收起更早版本" : "展开更早版本";
    });
  }

  /* ---------- 8. 版权年份 ---------- */
  var year = document.getElementById("year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();
