const app = require("./app");
const { port } = require("./config/env");
const prisma = require("./database/prisma");

async function startServer() {
  try {
    await prisma.$connect();

    console.log("✅ Database connected");

    const server = app.listen(port, () => {
      console.log("");
      console.log("======================================");
      console.log(" StockSense Backend");
      console.log("======================================");
      console.log(`🚀 Server: http://localhost:${port}`);
      console.log(`❤️  Health: http://localhost:${port}/health`);
      console.log("");
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down...`);

      server.close(async () => {
        await prisma.$disconnect();

        console.log("Database disconnected");
        console.log("Server stopped");

        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Failed to start server");
    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  }
}

startServer();