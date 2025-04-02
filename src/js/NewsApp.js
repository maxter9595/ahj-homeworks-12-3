export default class NewsApp {
  constructor() {
    this.newsContainer = document.getElementById("news-content");
    this.refreshBtn = document.querySelector(".refresh-btn");
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadNews();
  }

  setupEventListeners() {
    this.refreshBtn.addEventListener("click", () => this.loadNews());
    window.addEventListener("online", () => this.loadNews());
    window.addEventListener("offline", () => this.showOfflineError());
  }


  async loadNews() {
    this.showLoading();
    try {
      const response = await fetch("/api/news");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const news = await response.json();
      this.renderNews(news);
    } catch (error) {
      console.error("Failed to load news:", error);
      try {
        const cached = await caches.match("/api/news");
        if (cached) {
          const news = await cached.json();
          this.renderNews(news);
        } else {
          this.showError();
        }
      } catch (e) {
        this.showError();
      }
    }
  }

  renderNews(news) {
    this.newsContainer.innerHTML = news
      .map(
        (item) => `
        <div class="news-item">
          <div class="news-item-header">
            <span class="news-item-datetime">${item.date}</span>
          </div>
          <div class="news-item-content">
            <div class="news-item-image">
              <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="news-item-text">${item.text}</div>
          </div>
        </div>
      `
      )
      .join("");
  }

  showLoading() {
    this.newsContainer.innerHTML = `
      <div class="loading-skeleton">
        ${Array(2)
          .fill(
            `
          <div class="skeleton-item">
            <div class="skeleton-header">
              <div class="skeleton-title"></div>
              <div class="skeleton-date"></div>
            </div>
            <div class="skeleton-body">
              <div class="skeleton-image"></div>
              <div class="skeleton-text"></div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  showError() {
    this.showMessage("Не удалось загрузить данные");
  }

  showOfflineError() {
    this.showMessage("Не удалось загрузить данные");
  }

  showMessage(message) {
    this.newsContainer.innerHTML = `
      <div class="loading-skeleton">
        ${Array(2)
          .fill(
            `<div class="skeleton-item">
              <div class="skeleton-header">
                <div class="skeleton-title"></div>
                <div class="skeleton-date"></div>
              </div>
              <div class="skeleton-body">
                <div class="skeleton-image"></div>
                <div class="skeleton-text"></div>
              </div>
            </div>`,
          )
          .join("")}
      </div>
      <div class="error-overlay">
        <div class="error-state">
          <p>${message}</p>
          <p>Проверьте подключение</p>
          <p>и обновите страницу</p>
        </div>
      </div>
    `;
  }

  setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then(this.handleRegistration)
          .catch(console.error);
      });
    }
  }

  handleRegistration(registration) {
    console.log("ServiceWorker зарегистрирован:", registration.scope);
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      console.log("Обнаружено обновление Service Worker");
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "activated") {
          console.log("Новая версия Service Worker активирована");
        }
      });
    });
  }

  initNetworkStatus() {
    const updateStatus = () => {
      if (!navigator.onLine) {
        console.log("Приложение запущено в оффлайн-режиме");
      }
    };
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    updateStatus();
  }
}
