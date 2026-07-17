const assert = require("assert");
const http = require("http");
const server = require("./index");

const request = (port, path) =>
  new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port,
      path,
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(body),
          });
        } catch (error) {
          reject(new Error(`La respuesta no contiene JSON válido: ${error.message}`));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });

const runTests = async () => {
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  const port = address.port;

  try {
    const homeResponse = await request(port, "/");

    assert.strictEqual(homeResponse.statusCode, 200);
    assert.strictEqual(homeResponse.body.application, "TechMarket Orders");
    assert.strictEqual(homeResponse.body.environment, "blue");
    assert.strictEqual(homeResponse.body.version, "1.0.0");
    assert.strictEqual(homeResponse.body.status, "running");

    const healthResponse = await request(port, "/health");

    assert.strictEqual(healthResponse.statusCode, 200);
    assert.strictEqual(healthResponse.body.application, "TechMarket Orders");
    assert.strictEqual(healthResponse.body.environment, "blue");
    assert.strictEqual(healthResponse.body.version, "1.0.0");
    assert.strictEqual(healthResponse.body.status, "ok");

    const notFoundResponse = await request(port, "/ruta-inexistente");

    assert.strictEqual(notFoundResponse.statusCode, 404);
    assert.strictEqual(notFoundResponse.body.status, "not_found");

    console.log("Tests EFT ejecutados correctamente");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
};

runTests().catch((error) => {
  console.error("Los tests EFT fallaron:");
  console.error(error);
  process.exitCode = 1;
});