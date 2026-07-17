const http = require("http");

const PORT = process.env.PORT || 3000;
const APP_VERSION = process.env.APP_VERSION || "1.0.0";
const APP_ENV = process.env.APP_ENV || "blue";
const FORCE_ERROR = process.env.FORCE_ERROR === "true";

const sendJsonResponse = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });

  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    if (FORCE_ERROR) {
      sendJsonResponse(res, 500, {
        application: "TechMarket Orders",
        environment: APP_ENV,
        version: APP_VERSION,
        status: "error",
        message: "Fallo controlado para prueba de remediación EFT",
      });

      return;
    }

    sendJsonResponse(res, 200, {
      application: "TechMarket Orders",
      environment: APP_ENV,
      version: APP_VERSION,
      status: "ok",
    });

    return;
  }

  if (req.url === "/") {
    sendJsonResponse(res, 200, {
      application: "TechMarket Orders",
      environment: APP_ENV,
      version: APP_VERSION,
      status: "running",
      message: "Microservicio Orders funcionando correctamente",
    });

    return;
  }

  sendJsonResponse(res, 404, {
    application: "TechMarket Orders",
    environment: APP_ENV,
    version: APP_VERSION,
    status: "not_found",
    message: "Ruta no encontrada",
  });
});

if (require.main === module) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `TechMarket Orders ${APP_VERSION} ejecutándose en ambiente ${APP_ENV} y puerto ${PORT}`
    );
  });
}

module.exports = server;