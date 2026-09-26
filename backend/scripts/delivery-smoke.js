const app = require("../src/app");
const prisma = require("../src/database/prisma");

async function request(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const body = await response.json();
  return { response, body };
}

async function main() {
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  let deliveryId;

  try {
    const login = await request(base, "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "admin@stocksense.local",
        password: "admin123",
      }),
    });
    const token = login.body.data.token;
    const headers = {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    };
    const inventory = await prisma.inventory.findFirst({
      where: { onHand: { gt: 0 } },
      include: { variant: true, location: true },
    });

    if (!inventory) throw new Error("Seed inventory is required");

    const created = await request(base, "/api/deliveries", {
      method: "POST",
      headers,
      body: JSON.stringify({
        deliveryNumber: `SMOKE-${Date.now()}`,
        warehouseId: inventory.warehouseId,
        items: [{
          variantId: inventory.variantId,
          locationId: inventory.locationId,
          orderedQuantity: inventory.onHand + 1,
        }],
      }),
    });
    deliveryId = created.body.data.id;
    const itemId = created.body.data.items[0].id;

    const invalidTransition = await request(`${base}`, `/api/deliveries/${deliveryId}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "DELIVERED" }),
    });
    if (invalidTransition.response.status !== 400) throw new Error("Invalid transition was accepted");

    await request(base, `/api/deliveries/${deliveryId}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "READY" }),
    });

    const overFulfillment = await request(base, `/api/deliveries/${deliveryId}/fulfill`, {
      method: "POST",
      headers,
      body: JSON.stringify({ items: [{ deliveryItemId: itemId, quantity: inventory.onHand + 2 }] }),
    });
    if (overFulfillment.response.status !== 409) throw new Error("Over-fulfillment was accepted");

    const insufficient = await request(base, `/api/deliveries/${deliveryId}/fulfill`, {
      method: "POST",
      headers,
      body: JSON.stringify({ items: [{ deliveryItemId: itemId, quantity: inventory.onHand + 1 }] }),
    });
    if (insufficient.response.status !== 409) throw new Error("Insufficient stock was accepted");

    console.log("Delivery smoke tests passed: auth, invalid transition, over-fulfillment, insufficient stock");
  } finally {
    if (deliveryId) {
      await prisma.deliveryItem.deleteMany({ where: { deliveryId } });
      await prisma.delivery.delete({ where: { id: deliveryId } });
    }
    server.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
