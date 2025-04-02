const Koa = require("koa");
const Router = require("koa-router");

class BuggyNewsApiServer {
  constructor() {
    this.app = new Koa();
    this.router = new Router();
    this.newsData = require("./src/mocks/news.json");
    this.port = process.env.PORT || 10000;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(async (ctx, next) => {
      if (ctx.path === "/serviceWorker/sw.js") {
        ctx.set("Service-Worker-Allowed", "/");
      }
      await next();
    });
  }

  setupRoutes() {
    this.router.get("/api/news", (ctx) => {
      console.log("Получен запрос на /api/news");
      if (Math.random() < 0.3) {
        ctx.status = 500;
        ctx.body = { error: "Internal Server Error" };
        return;
      }
      
      try {
        const newsWithTimeOnly = this.newsData.map(item => ({
          ...item,
          title: new Date(item.date).toLocaleTimeString()
        }));
        
        ctx.body = newsWithTimeOnly;
        ctx.status = 200;
      } catch (error) {
        console.error("Ошибка при обработке /api/news:", error);
        ctx.status = 500;
        ctx.body = { error: "Internal Server Error", message: error.message };
      }
    });

    this.router.get("/mocks/news.json", (ctx) => {
      try {
        ctx.body = this.newsData;
        ctx.type = "application/json";
        ctx.status = 200;
      } catch (error) {
        ctx.status = 500;
        ctx.body = {
          error: "Failed to load mock data",
          message: error.message,
        };
      }
    });

    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());
  }

  start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${this.port}`);
    });
  }
}

const apiServer = new BuggyNewsApiServer();
apiServer.start();
