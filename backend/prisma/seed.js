const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ============================================================
  // CLEAN DEVELOPMENT DATA
  // ============================================================

  await prisma.stockMovement.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.deliveryItem.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.transferItem.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockAdjustment.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.location.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();

  // ============================================================
  // PASSWORDS
  // ============================================================

  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);
  const auditorPassword = await bcrypt.hash("auditor123", 10);

  // ============================================================
  // USERS
  // ============================================================

  const admin = await prisma.user.create({
    data: {
      name: "StockSense Admin",
      email: "admin@stocksense.local",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Inventory Manager",
      email: "manager@stocksense.local",
      passwordHash: managerPassword,
      role: "INVENTORY_MANAGER",
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: "Warehouse Staff",
      email: "staff@stocksense.local",
      passwordHash: staffPassword,
      role: "WAREHOUSE_STAFF",
    },
  });

  const auditor = await prisma.user.create({
    data: {
      name: "Inventory Auditor",
      email: "auditor@stocksense.local",
      passwordHash: auditorPassword,
      role: "AUDITOR",
    },
  });

  // ============================================================
  // CATEGORIES
  // ============================================================

  const electronics = await prisma.category.create({
    data: {
      name: "Electronics",
      description: "Electronic components and devices",
    },
  });

  const industrial = await prisma.category.create({
    data: {
      name: "Industrial Equipment",
      description: "Industrial tools and equipment",
    },
  });

  const office = await prisma.category.create({
    data: {
      name: "Office Supplies",
      description: "General office supplies",
    },
  });

  const safety = await prisma.category.create({
    data: {
      name: "Safety Equipment",
      description: "Industrial safety equipment",
    },
  });

  const networking = await prisma.category.create({
    data: {
      name: "Networking",
      description: "Networking components and accessories",
    },
  });

  // ============================================================
  // WAREHOUSES
  // ============================================================

  const hyderabad = await prisma.warehouse.create({
    data: {
      name: "Hyderabad Central Warehouse",
      code: "HYD-01",
      address: "Industrial Estate",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
    },
  });

  const bangalore = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse",
      code: "BLR-01",
      address: "Peenya Industrial Area",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
    },
  });

  // ============================================================
  // HYDERABAD LOCATIONS
  // ============================================================

  const hydZoneA = await prisma.location.create({
    data: {
      warehouseId: hyderabad.id,
      name: "Zone A",
      code: "HYD-A",
      type: "ZONE",
    },
  });

  const hydZoneB = await prisma.location.create({
    data: {
      warehouseId: hyderabad.id,
      name: "Zone B",
      code: "HYD-B",
      type: "ZONE",
    },
  });

  const hydRackA1 = await prisma.location.create({
    data: {
      warehouseId: hyderabad.id,
      parentId: hydZoneA.id,
      name: "Rack A1",
      code: "HYD-A-R1",
      type: "RACK",
    },
  });

  const hydRackA2 = await prisma.location.create({
    data: {
      warehouseId: hyderabad.id,
      parentId: hydZoneA.id,
      name: "Rack A2",
      code: "HYD-A-R2",
      type: "RACK",
    },
  });

  const hydShelfA1 = await prisma.location.create({
    data: {
      warehouseId: hyderabad.id,
      parentId: hydRackA1.id,
      name: "Shelf A1-1",
      code: "HYD-A-R1-S1",
      type: "SHELF",
    },
  });

  const hydBinA1 = await prisma.location.create({
    data: {
      warehouseId: hyderabad.id,
      parentId: hydShelfA1.id,
      name: "Bin A1-1-1",
      code: "HYD-A-R1-S1-B1",
      type: "BIN",
    },
  });

  const hydBinA2 = await prisma.location.create({
    data: {
      warehouseId: hyderabad.id,
      parentId: hydRackA2.id,
      name: "Bin A2-1",
      code: "HYD-A-R2-B1",
      type: "BIN",
    },
  });

  const hydBinB1 = await prisma.location.create({
    data: {
      warehouseId: hyderabad.id,
      parentId: hydZoneB.id,
      name: "Bin B1",
      code: "HYD-B-B1",
      type: "BIN",
    },
  });

  // ============================================================
  // BANGALORE LOCATIONS
  // ============================================================

  const blrZoneA = await prisma.location.create({
    data: {
      warehouseId: bangalore.id,
      name: "Zone A",
      code: "BLR-A",
      type: "ZONE",
    },
  });

  const blrRackA1 = await prisma.location.create({
    data: {
      warehouseId: bangalore.id,
      parentId: blrZoneA.id,
      name: "Rack A1",
      code: "BLR-A-R1",
      type: "RACK",
    },
  });

  const blrBinA1 = await prisma.location.create({
    data: {
      warehouseId: bangalore.id,
      parentId: blrRackA1.id,
      name: "Bin A1",
      code: "BLR-A-R1-B1",
      type: "BIN",
    },
  });

  // ============================================================
  // PRODUCTS
  // ============================================================

  const steelRod = await prisma.product.create({
    data: {
      name: "Steel Rod 12mm",
      sku: "STL-ROD-12",
      description: "Industrial grade steel rod",
      brand: "Tata Steel",
      barcode: "890100000001",
      categoryId: industrial.id,
      trackingType: "BATCH",
      unitName: "piece",
      minimumStock: 100,
      safetyStock: 30,
      leadTimeDays: 5,
      reorderPoint: 130,
    },
  });

  const steelRodVariant = await prisma.productVariant.create({
    data: {
      productId: steelRod.id,
      name: "12mm Standard",
      sku: "STL-ROD-12-STD",
      barcode: "890100000101",
      price: 450,
      cost: 350,
    },
  });

  const laptop = await prisma.product.create({
    data: {
      name: "Business Laptop",
      sku: "LAP-BUS-001",
      description: "Business productivity laptop",
      brand: "Dell",
      barcode: "890100000002",
      categoryId: electronics.id,
      trackingType: "SERIAL",
      unitName: "piece",
      minimumStock: 10,
      safetyStock: 5,
      leadTimeDays: 7,
      reorderPoint: 15,
    },
  });

  const laptopVariant = await prisma.productVariant.create({
    data: {
      productId: laptop.id,
      name: "Core i5 / 16GB / 512GB",
      sku: "LAP-BUS-I5-16-512",
      barcode: "890100000102",
      price: 65000,
      cost: 52000,
    },
  });

  const keyboard = await prisma.product.create({
    data: {
      name: "Mechanical Keyboard",
      sku: "KEY-MECH-001",
      description: "Mechanical keyboard",
      brand: "Logitech",
      barcode: "890100000003",
      categoryId: electronics.id,
      trackingType: "NONE",
      unitName: "piece",
      minimumStock: 20,
      safetyStock: 10,
      leadTimeDays: 5,
      reorderPoint: 30,
    },
  });

  const keyboardVariant = await prisma.productVariant.create({
    data: {
      productId: keyboard.id,
      name: "Mechanical Keyboard",
      sku: "KEY-MECH-001-V1",
      barcode: "890100000103",
      price: 4500,
      cost: 3000,
    },
  });

  const safetyHelmet = await prisma.product.create({
    data: {
      name: "Industrial Safety Helmet",
      sku: "SAFE-HELM-001",
      description: "Industrial safety helmet",
      brand: "3M",
      barcode: "890100000004",
      categoryId: safety.id,
      trackingType: "NONE",
      unitName: "piece",
      minimumStock: 50,
      safetyStock: 20,
      leadTimeDays: 4,
      reorderPoint: 70,
    },
  });

  const helmetVariant = await prisma.productVariant.create({
    data: {
      productId: safetyHelmet.id,
      name: "Yellow",
      sku: "SAFE-HELM-YELLOW",
      barcode: "890100000104",
      price: 1200,
      cost: 800,
    },
  });

  const ethernetCable = await prisma.product.create({
    data: {
      name: "Cat6 Ethernet Cable",
      sku: "NET-CAT6-001",
      description: "Cat6 networking cable",
      brand: "D-Link",
      barcode: "890100000005",
      categoryId: networking.id,
      trackingType: "NONE",
      unitName: "piece",
      minimumStock: 100,
      safetyStock: 50,
      leadTimeDays: 3,
      reorderPoint: 150,
    },
  });

  const ethernetVariant = await prisma.productVariant.create({
    data: {
      productId: ethernetCable.id,
      name: "10 Meter",
      sku: "NET-CAT6-10M",
      barcode: "890100000105",
      price: 800,
      cost: 500,
    },
  });

  // ============================================================
  // SUPPLIERS
  // ============================================================

  const tataSteel = await prisma.supplier.create({
    data: {
      name: "Tata Steel Supplies",
      contact: "Rajesh Kumar",
      email: "sales@tatasteel.local",
      phone: "+91-9000000001",
      address: "Hyderabad",
      leadTimeDays: 5,
    },
  });

  const dellSupplier = await prisma.supplier.create({
    data: {
      name: "Dell Enterprise Supplies",
      contact: "Arun Kumar",
      email: "enterprise@dell.local",
      phone: "+91-9000000002",
      address: "Bangalore",
      leadTimeDays: 7,
    },
  });

  // ============================================================
  // INVENTORY
  // ============================================================

  await prisma.inventory.create({
    data: {
      variantId: steelRodVariant.id,
      warehouseId: hyderabad.id,
      locationId: hydBinA1.id,
      onHand: 100,
      reserved: 10,
      damaged: 3,
    },
  });

  await prisma.inventory.create({
    data: {
      variantId: steelRodVariant.id,
      warehouseId: bangalore.id,
      locationId: blrBinA1.id,
      onHand: 60,
    },
  });

  await prisma.inventory.create({
    data: {
      variantId: laptopVariant.id,
      warehouseId: hyderabad.id,
      locationId: hydBinA2.id,
      onHand: 18,
      reserved: 4,
    },
  });

  await prisma.inventory.create({
    data: {
      variantId: keyboardVariant.id,
      warehouseId: hyderabad.id,
      locationId: hydBinB1.id,
      onHand: 8,
    },
  });

  await prisma.inventory.create({
    data: {
      variantId: helmetVariant.id,
      warehouseId: hyderabad.id,
      locationId: hydBinA1.id,
      onHand: 120,
    },
  });

  await prisma.inventory.create({
    data: {
      variantId: ethernetVariant.id,
      warehouseId: bangalore.id,
      locationId: blrBinA1.id,
      onHand: 250,
    },
  });

  // ============================================================
  // PURCHASE ORDER
  // ============================================================

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      orderNumber: "PO-1001",
      supplierId: tataSteel.id,
      warehouseId: hyderabad.id,
      createdById: manager.id,
      status: "RECEIVED",
      expectedDate: new Date(),
      items: {
        create: [
          {
            variantId: steelRodVariant.id,
            orderedQuantity: 100,
            receivedQuantity: 100,
            unitCost: 350,
          },
        ],
      },
    },
    include: {
      items: true,
    },
  });

  // ============================================================
  // RECEIPT
  // ============================================================

  await prisma.receipt.create({
    data: {
      receiptNumber: "GRN-1001",
      purchaseOrderId: purchaseOrder.id,
      warehouseId: hyderabad.id,
      status: "RECEIVED",
      expectedQuantity: 100,
      receivedQuantity: 100,
      damagedQuantity: 0,
      items: {
        create: [
          {
            variantId: steelRodVariant.id,
            quantity: 100,
            damagedQuantity: 0,
            locationId: hydBinA1.id,
          },
        ],
      },
    },
  });

  // ============================================================
  // AUDIT-FRIENDLY INITIAL STOCK MOVEMENTS
  // ============================================================

  await prisma.stockMovement.create({
    data: {
      variantId: steelRodVariant.id,
      warehouseId: hyderabad.id,
      locationId: hydBinA1.id,
      type: "RECEIPT",
      quantity: 100,
      referenceType: "RECEIPT",
      referenceId: "GRN-1001",
      reason: "Initial seeded receipt",
      createdById: manager.id,
      idempotencyKey: "SEED-RECEIPT-STEEL-001",
    },
  });

  await prisma.stockMovement.create({
    data: {
      variantId: laptopVariant.id,
      warehouseId: hyderabad.id,
      locationId: hydBinA2.id,
      type: "RECEIPT",
      quantity: 18,
      referenceType: "SEED",
      referenceId: "SEED-LAPTOP",
      reason: "Initial demo inventory",
      createdById: admin.id,
      idempotencyKey: "SEED-LAPTOP-001",
    },
  });

  await prisma.stockMovement.create({
    data: {
      variantId: keyboardVariant.id,
      warehouseId: hyderabad.id,
      locationId: hydBinB1.id,
      type: "RECEIPT",
      quantity: 8,
      referenceType: "SEED",
      referenceId: "SEED-KEYBOARD",
      reason: "Initial demo inventory",
      createdById: admin.id,
      idempotencyKey: "SEED-KEYBOARD-001",
    },
  });

  // ============================================================
  // SUMMARY
  // ============================================================

  console.log("");
  console.log("✅ Seed completed successfully");
  console.log("");
  console.log("Demo users:");
  console.log("Admin:    admin@stocksense.local / admin123");
  console.log("Manager:  manager@stocksense.local / manager123");
  console.log("Staff:    staff@stocksense.local / staff123");
  console.log("Auditor:  auditor@stocksense.local / auditor123");
  console.log("");
  console.log("Warehouses: 2");
  console.log("Products: 5");
  console.log("Variants: 5");
  console.log("Categories: 5");
  console.log("Suppliers: 2");
  console.log("");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });