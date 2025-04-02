import NewsApp from "./NewsApp";

export default class AppInitializer {
  static init() {
    new NewsApp();

    if ("serviceWorker" in navigator) {
      setTimeout(() => {
        navigator.serviceWorker
          .register("/serviceWorker/sw.js", {
            scope: "/serviceWorker/",
            updateViaCache: "none",
          })
          .then((registration) => {
            if (registration.active) {
              registration.update().catch(console.error);
            }
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "activated") {
                  console.log("New SW activated");
                }
              });
            });
          })
          .catch(console.error);
      }, 1000);
    }

    AppInitializer.initNetworkStatus();
  }

  static handleSWRegistration(registration) {
    console.log("ServiceWorker зарегистрирован:", registration.scope);

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      console.log("Обнаружено обновление Service Worker");

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "activated") {
          console.log("Новая версия Service Worker активирована");
          window.location.reload();
        }
      });
    });

    setInterval(
      () => {
        registration
          .update()
          .catch((err) =>
            console.log("Автопроверка обновлений SW не удалась:", err),
          );
      },
      60 * 60 * 1000,
    );
  }

  static initNetworkStatus() {
    const updateStatus = () => {
      const status = navigator.onLine ? "Онлайн" : "Оффлайн";
      console.log(status);

      if (!navigator.onLine) {
        console.log("Приложение запущено в оффлайн-режиме");
      }
    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    updateStatus();
  }
}
