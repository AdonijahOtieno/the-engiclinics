/* ==========================================================
   EngiClinics Consulting — site behaviour
   ========================================================== */
(function () {
  "use strict";

  /* ---------- Settings: edit these ---------- */
  var SETTINGS = {
    // 1. Create a free form at https://formspree.io, then paste its endpoint here,
    //    e.g. "https://formspree.io/f/abcdwxyz". Leave empty to fall back to email.
    formEndpoint: "",
    // 2. Email address that receives enquiries when no form endpoint is set.
    email: "info@engiclinics.com"
  };

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- Industries tabs (home page) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) { e.preventDefault(); selectTab(next); next.focus(); }
    });
  });

  /* ---------- FAQ accordion (services page) ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var ans = item.querySelector(".faq-a");
    var sign = item.querySelector(".sign");
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".faq-item").forEach(function (other) {
        other.classList.remove("open");
        other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        other.querySelector(".faq-a").hidden = true;
        other.querySelector(".sign").textContent = "+";
      });
      if (!open) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        ans.hidden = false;
        sign.textContent = "−";
      }
    });
  });

  /* ---------- Contact form ---------- */
  var MESSAGES = {
    name: "Enter your name so we know who to reply to.",
    email: "Enter an email address like name@company.com.",
    message: "Tell us a little about the project, even one sentence helps."
  };
  function fieldCheck(input) {
    var field = input.closest(".field");
    if (!field) return true;
    var msg = field.querySelector(".error-msg");
    if (!msg) {
      msg = document.createElement("span");
      msg.className = "error-msg";
      msg.id = input.id + "-error";
      field.appendChild(msg);
    }
    var ok = input.checkValidity();
    field.classList.toggle("invalid", !ok);
    msg.textContent = ok ? "" : (MESSAGES[input.name] || "Check this field.");
    if (ok) input.removeAttribute("aria-invalid"); else { input.setAttribute("aria-invalid", "true"); input.setAttribute("aria-describedby", msg.id); }
    return ok;
  }
  function validate(f) {
    var first = null;
    f.querySelectorAll("[required]").forEach(function (el) {
      if (!fieldCheck(el) && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  }

  var form = document.getElementById("quote-form");
  if (form) {
    form.querySelectorAll("[required]").forEach(function (el) {
      el.addEventListener("blur", function () { if (el.value) fieldCheck(el); });
      el.addEventListener("input", function () { if (el.closest(".field").classList.contains("invalid")) fieldCheck(el); });
    });
    var status = document.getElementById("form-status");
    var success = document.getElementById("form-success");
    var again = document.getElementById("send-again");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";
      status.classList.remove("error");

      if (!validate(form)) return;

      var data = new FormData(form);

      if (!SETTINGS.formEndpoint) {
        // No form service yet: open the visitor's email app with the details filled in.
        var body =
          "Name: " + data.get("name") + "\n" +
          "Company: " + (data.get("company") || "-") + "\n" +
          "Email: " + data.get("email") + "\n" +
          "Phone: " + (data.get("phone") || "-") + "\n" +
          "Service: " + data.get("service") + "\n\n" +
          data.get("message");
        window.location.href =
          "mailto:" + SETTINGS.email +
          "?subject=" + encodeURIComponent("Project enquiry from " + data.get("name")) +
          "&body=" + encodeURIComponent(body);
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = "Sending…";

      fetch(SETTINGS.formEndpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          form.reset();
          form.hidden = true;
          success.hidden = false;
          success.querySelector("h2").focus();
        })
        .catch(function () {
          status.textContent = "Your enquiry could not be sent. Check your connection and try again, or call +254 718 984 998.";
          status.classList.add("error");
        })
        .then(function () {
          button.disabled = false;
          button.textContent = "Send enquiry";
        });
    });

    if (again) {
      again.addEventListener("click", function () {
        success.hidden = true;
        form.hidden = false;
        form.querySelector("input").focus();
      });
    }
  }

  /* ---------- Photo lightbox (projects page) ---------- */
  var lb = document.getElementById("lightbox");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = lb.querySelector("img");
    var opener = null;
    document.querySelectorAll(".zoom").forEach(function (btn) {
      btn.addEventListener("click", function () {
        opener = btn;
        lbImg.src = btn.getAttribute("data-full");
        lbImg.alt = btn.getAttribute("data-alt") || "";
        lb.showModal();
      });
    });
    lb.querySelector(".lb-close").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("close", function () { lbImg.removeAttribute("src"); if (opener) opener.focus(); });
  }

  /* ---------- Header shadow once the page scrolls ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
