require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Warehouse = require('../models/Warehouse');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Order = require('../models/Order');
const StockMovement = require('../models/StockMovement');

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Check if already seeded
    const existingUser = await User.findOne({ email: 'admin@retailflow.com' });
    if (existingUser) {
      console.log('✅ Database already seeded');
      return;
    }

    // ── Users ────────────────────────────────────────────────────────────────
    const hashedAdminPw = await bcrypt.hash('Admin@123', 12);
    const hashedManagerPw = await bcrypt.hash('Manager@123', 12);
    const hashedStaffPw = await bcrypt.hash('Staff@123', 12);

    const users = await User.insertMany([
      { name: 'Alex Johnson', email: 'admin@retailflow.com', password: hashedAdminPw, role: 'admin', phone: '+1-555-0101', department: 'Administration' },
      { name: 'Sarah Mitchell', email: 'manager@retailflow.com', password: hashedManagerPw, role: 'manager', phone: '+1-555-0102', department: 'Inventory Management' },
      { name: 'David Chen', email: 'staff@retailflow.com', password: hashedStaffPw, role: 'staff', phone: '+1-555-0103', department: 'Warehouse Operations' },
    ]);
    console.log('✅ Users seeded');

    // ── Warehouses ────────────────────────────────────────────────────────────
    const warehouses = await Warehouse.insertMany([
      { code: 'WH-001', name: 'Central Distribution Hub', address: '100 Industrial Blvd', city: 'Chicago', state: 'IL', country: 'USA', capacity: 15000, currentUtilization: 9200, type: 'main', manager: users[1]._id, phone: '+1-555-0200', email: 'central@retailflow.com' },
      { code: 'WH-002', name: 'West Coast Fulfillment', address: '500 Pacific Ave', city: 'Los Angeles', state: 'CA', country: 'USA', capacity: 10000, currentUtilization: 6100, type: 'distribution', manager: users[1]._id, phone: '+1-555-0201', email: 'westcoast@retailflow.com' },
      { code: 'WH-003', name: 'East Coast Regional', address: '250 Harbor Rd', city: 'New York', state: 'NY', country: 'USA', capacity: 8000, currentUtilization: 4300, type: 'retail', manager: users[2]._id, phone: '+1-555-0202', email: 'eastcoast@retailflow.com' },
    ]);
    console.log('✅ Warehouses seeded');

    // ── Suppliers ─────────────────────────────────────────────────────────────
    const suppliers = await Supplier.insertMany([
      { code: 'SUP-001', name: 'TechPro Electronics Ltd', contactPerson: 'Michael Wong', email: 'mwong@techpro.com', phone: '+1-555-0300', city: 'San Jose', country: 'USA', leadTimeDays: 5, rating: 4.8, paymentTerms: 'net_30', categories: ['Electronics'], totalOrders: 45, totalSpent: 284500 },
      { code: 'SUP-002', name: 'FashionForward Apparel', contactPerson: 'Emily Davis', email: 'edavis@fashionforward.com', phone: '+1-555-0301', city: 'New York', country: 'USA', leadTimeDays: 10, rating: 4.2, paymentTerms: 'net_45', categories: ['Apparel'], totalOrders: 32, totalSpent: 156800 },
      { code: 'SUP-003', name: 'HomeEssentials Co.', contactPerson: 'Robert Smith', email: 'rsmith@homeessentials.com', phone: '+1-555-0302', city: 'Atlanta', country: 'USA', leadTimeDays: 7, rating: 4.5, paymentTerms: 'net_30', categories: ['Home & Kitchen'], totalOrders: 28, totalSpent: 98400 },
      { code: 'SUP-004', name: 'HealthPlus Distributors', contactPerson: 'Jennifer Lee', email: 'jlee@healthplus.com', phone: '+1-555-0303', city: 'Houston', country: 'USA', leadTimeDays: 3, rating: 4.6, paymentTerms: 'net_15', categories: ['Health & Beauty'], totalOrders: 52, totalSpent: 212000 },
      { code: 'SUP-005', name: 'SportZone International', contactPerson: 'Carlos Martinez', email: 'cmartinez@sportzone.com', phone: '+1-555-0304', city: 'Miami', country: 'USA', leadTimeDays: 14, rating: 3.9, paymentTerms: 'net_60', categories: ['Sports'], totalOrders: 19, totalSpent: 87600 },
    ]);
    console.log('✅ Suppliers seeded');

    // ── Products ──────────────────────────────────────────────────────────────
    const products = await Product.insertMany([
      // Electronics
      { sku: 'ELEC-001', barcode: '8901234567890', name: 'UltraBook Pro 15"', category: 'Electronics', brand: 'TechPro', costPrice: 850, sellingPrice: 1299, minStockLevel: 10, reorderPoint: 25, reorderQuantity: 50, supplier: suppliers[0]._id, soldQuantity: 234, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 45, aisle: 'A1', bin: 'B01' }, { warehouse: warehouses[1]._id, quantity: 28, aisle: 'C2', bin: 'D05' }], totalStock: 73, tags: ['laptop', 'computer'] },
      { sku: 'ELEC-002', barcode: '8901234567891', name: 'SmartPhone X12 Pro', category: 'Electronics', brand: 'TechPro', costPrice: 520, sellingPrice: 899, minStockLevel: 15, reorderPoint: 30, reorderQuantity: 60, supplier: suppliers[0]._id, soldQuantity: 412, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 18, aisle: 'A2', bin: 'B02' }, { warehouse: warehouses[1]._id, quantity: 8, aisle: 'C1', bin: 'D01' }, { warehouse: warehouses[2]._id, quantity: 12, aisle: 'E1', bin: 'F01' }], totalStock: 38, tags: ['smartphone', 'mobile'] },
      { sku: 'ELEC-003', barcode: '8901234567892', name: 'Wireless ANC Headphones', category: 'Electronics', brand: 'SoundMaster', costPrice: 120, sellingPrice: 249, minStockLevel: 20, reorderPoint: 40, reorderQuantity: 100, supplier: suppliers[0]._id, soldQuantity: 567, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 35, aisle: 'A3', bin: 'B03' }, { warehouse: warehouses[2]._id, quantity: 22, aisle: 'E2', bin: 'F02' }], totalStock: 57, tags: ['audio', 'wireless'] },
      { sku: 'ELEC-004', barcode: '8901234567893', name: '4K Smart TV 55"', category: 'Electronics', brand: 'VisionTech', costPrice: 420, sellingPrice: 699, minStockLevel: 5, reorderPoint: 15, reorderQuantity: 30, supplier: suppliers[0]._id, soldQuantity: 89, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 8, aisle: 'A4', bin: 'B04' }, { warehouse: warehouses[1]._id, quantity: 5, aisle: 'C3', bin: 'D02' }], totalStock: 13, tags: ['television', 'smart-tv'] },
      { sku: 'ELEC-005', barcode: '8901234567894', name: 'Gaming Console Elite', category: 'Electronics', brand: 'GameForce', costPrice: 380, sellingPrice: 549, minStockLevel: 8, reorderPoint: 20, reorderQuantity: 40, supplier: suppliers[0]._id, soldQuantity: 156, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 6, aisle: 'A5', bin: 'B05' }], totalStock: 6, tags: ['gaming', 'console'] },
      // Apparel
      { sku: 'APP-001', barcode: '8901234567895', name: 'Premium Slim-Fit Jeans', category: 'Apparel', brand: 'DenimCo', costPrice: 28, sellingPrice: 79, minStockLevel: 30, reorderPoint: 60, reorderQuantity: 150, supplier: suppliers[1]._id, soldQuantity: 823, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 245, aisle: 'B1', bin: 'C01' }, { warehouse: warehouses[2]._id, quantity: 118, aisle: 'F1', bin: 'G01' }], totalStock: 363, tags: ['denim', 'pants'] },
      { sku: 'APP-002', barcode: '8901234567896', name: 'Merino Wool Sweater', category: 'Apparel', brand: 'WoolCraft', costPrice: 45, sellingPrice: 120, minStockLevel: 20, reorderPoint: 40, reorderQuantity: 80, supplier: suppliers[1]._id, soldQuantity: 341, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 12, aisle: 'B2', bin: 'C02' }, { warehouse: warehouses[1]._id, quantity: 8, aisle: 'D1', bin: 'E01' }], totalStock: 20, tags: ['knitwear', 'wool'] },
      { sku: 'APP-003', barcode: '8901234567897', name: 'Athletic Performance Shorts', category: 'Apparel', brand: 'ActiveWear', costPrice: 18, sellingPrice: 45, minStockLevel: 40, reorderPoint: 80, reorderQuantity: 200, supplier: suppliers[1]._id, soldQuantity: 1204, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 380, aisle: 'B3', bin: 'C03' }, { warehouse: warehouses[1]._id, quantity: 195, aisle: 'D2', bin: 'E02' }, { warehouse: warehouses[2]._id, quantity: 210, aisle: 'F2', bin: 'G02' }], totalStock: 785, tags: ['sports', 'shorts'] },
      // Home & Kitchen
      { sku: 'HOME-001', barcode: '8901234567898', name: 'Stainless Steel Cookware Set', category: 'Home & Kitchen', brand: 'ChefMaster', costPrice: 85, sellingPrice: 189, minStockLevel: 15, reorderPoint: 30, reorderQuantity: 60, supplier: suppliers[2]._id, soldQuantity: 178, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 42, aisle: 'C1', bin: 'D01' }, { warehouse: warehouses[2]._id, quantity: 19, aisle: 'G1', bin: 'H01' }], totalStock: 61, tags: ['cookware', 'kitchen'] },
      { sku: 'HOME-002', barcode: '8901234567899', name: 'Robot Vacuum Cleaner Pro', category: 'Home & Kitchen', brand: 'CleanBot', costPrice: 195, sellingPrice: 349, minStockLevel: 8, reorderPoint: 20, reorderQuantity: 40, supplier: suppliers[2]._id, soldQuantity: 95, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 3, aisle: 'C2', bin: 'D02' }], totalStock: 3, tags: ['vacuum', 'robot', 'smart-home'] },
      { sku: 'HOME-003', barcode: '8901234567900', name: 'Air Purifier HEPA 500', category: 'Home & Kitchen', brand: 'PureAir', costPrice: 140, sellingPrice: 279, minStockLevel: 10, reorderPoint: 25, reorderQuantity: 50, supplier: suppliers[2]._id, soldQuantity: 132, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 17, aisle: 'C3', bin: 'D03' }, { warehouse: warehouses[1]._id, quantity: 11, aisle: 'E1', bin: 'F01' }], totalStock: 28, tags: ['air-purifier', 'hepa'] },
      // Health & Beauty
      { sku: 'HLTH-001', barcode: '8901234567901', name: 'Vitamin D3 + K2 (180 caps)', category: 'Health & Beauty', brand: 'NutriPure', costPrice: 12, sellingPrice: 34, minStockLevel: 50, reorderPoint: 100, reorderQuantity: 300, supplier: suppliers[3]._id, soldQuantity: 2341, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 89, aisle: 'D1', bin: 'E01' }, { warehouse: warehouses[1]._id, quantity: 45, aisle: 'F1', bin: 'G01' }, { warehouse: warehouses[2]._id, quantity: 67, aisle: 'H1', bin: 'I01' }], totalStock: 201, tags: ['supplements', 'vitamins'] },
      { sku: 'HLTH-002', barcode: '8901234567902', name: 'Protein Whey Isolate 5lb', category: 'Health & Beauty', brand: 'FitFuel', costPrice: 38, sellingPrice: 79, minStockLevel: 30, reorderPoint: 60, reorderQuantity: 150, supplier: suppliers[3]._id, soldQuantity: 876, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 8, aisle: 'D2', bin: 'E02' }, { warehouse: warehouses[1]._id, quantity: 4, aisle: 'F2', bin: 'G02' }], totalStock: 12, tags: ['protein', 'supplement'] },
      { sku: 'HLTH-003', barcode: '8901234567903', name: 'Organic Face Serum 30ml', category: 'Health & Beauty', brand: 'GlowNaturals', costPrice: 22, sellingPrice: 68, minStockLevel: 25, reorderPoint: 50, reorderQuantity: 120, supplier: suppliers[3]._id, soldQuantity: 543, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 0 }, { warehouse: warehouses[2]._id, quantity: 14, aisle: 'H2', bin: 'I02' }], totalStock: 14, tags: ['skincare', 'serum'] },
      // Sports
      { sku: 'SPRT-001', barcode: '8901234567904', name: 'Adjustable Dumbbell Set 5-50lb', category: 'Sports', brand: 'IronForge', costPrice: 195, sellingPrice: 389, minStockLevel: 5, reorderPoint: 15, reorderQuantity: 30, supplier: suppliers[4]._id, soldQuantity: 67, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 22, aisle: 'E1', bin: 'F01' }, { warehouse: warehouses[1]._id, quantity: 11, aisle: 'G1', bin: 'H01' }], totalStock: 33, tags: ['dumbbells', 'weights', 'fitness'] },
      { sku: 'SPRT-002', barcode: '8901234567905', name: 'Yoga Mat Premium 6mm', category: 'Sports', brand: 'ZenFit', costPrice: 22, sellingPrice: 59, minStockLevel: 30, reorderPoint: 60, reorderQuantity: 150, supplier: suppliers[4]._id, soldQuantity: 445, warehouseStock: [{ warehouse: warehouses[0]._id, quantity: 95, aisle: 'E2', bin: 'F02' }, { warehouse: warehouses[1]._id, quantity: 68, aisle: 'G2', bin: 'H02' }, { warehouse: warehouses[2]._id, quantity: 52, aisle: 'I1', bin: 'J01' }], totalStock: 215, tags: ['yoga', 'mat', 'fitness'] },
    ]);
    console.log(`✅ ${products.length} products seeded`);

    // ── Orders ────────────────────────────────────────────────────────────────
    const getRandomDate = (daysBack) => {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
      return d;
    };

    const orders = await Order.insertMany([
      // Purchase Orders
      { orderNumber: 'PO-2024-0001', orderType: 'purchase', supplier: suppliers[0]._id, supplierName: 'TechPro Electronics Ltd', warehouse: warehouses[0]._id, warehouseName: 'Central Distribution Hub', items: [{ product: products[0]._id, productName: 'UltraBook Pro 15"', sku: 'ELEC-001', quantity: 50, unitPrice: 850, totalPrice: 42500 }, { product: products[1]._id, productName: 'SmartPhone X12 Pro', sku: 'ELEC-002', quantity: 60, unitPrice: 520, totalPrice: 31200 }], subtotal: 73700, taxRate: 0.1, taxAmount: 7370, totalAmount: 81070, status: 'delivered', paymentStatus: 'paid', createdBy: users[0]._id, createdAt: getRandomDate(60) },
      { orderNumber: 'PO-2024-0002', orderType: 'purchase', supplier: suppliers[1]._id, supplierName: 'FashionForward Apparel', warehouse: warehouses[0]._id, warehouseName: 'Central Distribution Hub', items: [{ product: products[5]._id, productName: 'Premium Slim-Fit Jeans', sku: 'APP-001', quantity: 200, unitPrice: 28, totalPrice: 5600 }, { product: products[7]._id, productName: 'Athletic Performance Shorts', sku: 'APP-003', quantity: 300, unitPrice: 18, totalPrice: 5400 }], subtotal: 11000, taxRate: 0.1, taxAmount: 1100, totalAmount: 12100, status: 'delivered', paymentStatus: 'paid', createdBy: users[1]._id, createdAt: getRandomDate(45) },
      { orderNumber: 'PO-2024-0003', orderType: 'purchase', supplier: suppliers[3]._id, supplierName: 'HealthPlus Distributors', warehouse: warehouses[0]._id, warehouseName: 'Central Distribution Hub', items: [{ product: products[11]._id, productName: 'Vitamin D3 + K2 (180 caps)', sku: 'HLTH-001', quantity: 500, unitPrice: 12, totalPrice: 6000 }, { product: products[12]._id, productName: 'Protein Whey Isolate 5lb', sku: 'HLTH-002', quantity: 150, unitPrice: 38, totalPrice: 5700 }], subtotal: 11700, taxRate: 0.1, taxAmount: 1170, totalAmount: 12870, status: 'processing', paymentStatus: 'partial', createdBy: users[1]._id, createdAt: getRandomDate(5) },
      { orderNumber: 'PO-2024-0004', orderType: 'purchase', supplier: suppliers[0]._id, supplierName: 'TechPro Electronics Ltd', warehouse: warehouses[1]._id, warehouseName: 'West Coast Fulfillment', items: [{ product: products[2]._id, productName: 'Wireless ANC Headphones', sku: 'ELEC-003', quantity: 100, unitPrice: 120, totalPrice: 12000 }], subtotal: 12000, taxRate: 0.1, taxAmount: 1200, totalAmount: 13200, status: 'shipped', paymentStatus: 'paid', createdBy: users[0]._id, createdAt: getRandomDate(10) },
      { orderNumber: 'PO-2024-0005', orderType: 'purchase', supplier: suppliers[2]._id, supplierName: 'HomeEssentials Co.', warehouse: warehouses[0]._id, warehouseName: 'Central Distribution Hub', items: [{ product: products[9]._id, productName: 'Robot Vacuum Cleaner Pro', sku: 'HOME-002', quantity: 40, unitPrice: 195, totalPrice: 7800 }], subtotal: 7800, taxRate: 0.1, taxAmount: 780, totalAmount: 8580, status: 'pending', paymentStatus: 'unpaid', createdBy: users[1]._id, createdAt: getRandomDate(2) },
      // Sales Orders
      { orderNumber: 'SO-2024-0001', orderType: 'sales', customerName: 'TechRetail Corp', customerEmail: 'orders@techretail.com', warehouse: warehouses[0]._id, warehouseName: 'Central Distribution Hub', items: [{ product: products[0]._id, productName: 'UltraBook Pro 15"', sku: 'ELEC-001', quantity: 10, unitPrice: 1299, totalPrice: 12990 }, { product: products[1]._id, productName: 'SmartPhone X12 Pro', sku: 'ELEC-002', quantity: 15, unitPrice: 899, totalPrice: 13485 }], subtotal: 26475, taxRate: 0.1, taxAmount: 2647.5, totalAmount: 29122.5, status: 'delivered', paymentStatus: 'paid', createdBy: users[1]._id, createdAt: getRandomDate(30) },
      { orderNumber: 'SO-2024-0002', orderType: 'sales', customerName: 'MegaMart Stores', customerEmail: 'purchasing@megamart.com', warehouse: warehouses[1]._id, warehouseName: 'West Coast Fulfillment', items: [{ product: products[5]._id, productName: 'Premium Slim-Fit Jeans', sku: 'APP-001', quantity: 50, unitPrice: 79, totalPrice: 3950 }, { product: products[6]._id, productName: 'Merino Wool Sweater', sku: 'APP-002', quantity: 30, unitPrice: 120, totalPrice: 3600 }, { product: products[7]._id, productName: 'Athletic Performance Shorts', sku: 'APP-003', quantity: 100, unitPrice: 45, totalPrice: 4500 }], subtotal: 12050, taxRate: 0.1, taxAmount: 1205, totalAmount: 13255, status: 'delivered', paymentStatus: 'paid', createdBy: users[1]._id, createdAt: getRandomDate(25) },
      { orderNumber: 'SO-2024-0003', orderType: 'sales', customerName: 'FitLife Wellness Center', customerEmail: 'stock@fitlife.com', warehouse: warehouses[0]._id, warehouseName: 'Central Distribution Hub', items: [{ product: products[11]._id, productName: 'Vitamin D3 + K2 (180 caps)', sku: 'HLTH-001', quantity: 200, unitPrice: 34, totalPrice: 6800 }, { product: products[12]._id, productName: 'Protein Whey Isolate 5lb', sku: 'HLTH-002', quantity: 80, unitPrice: 79, totalPrice: 6320 }], subtotal: 13120, taxRate: 0.1, taxAmount: 1312, totalAmount: 14432, status: 'delivered', paymentStatus: 'paid', createdBy: users[1]._id, createdAt: getRandomDate(20) },
      { orderNumber: 'SO-2024-0004', orderType: 'sales', customerName: 'HomeGoods Express', customerEmail: 'orders@homegoods.com', warehouse: warehouses[2]._id, warehouseName: 'East Coast Regional', items: [{ product: products[8]._id, productName: 'Stainless Steel Cookware Set', sku: 'HOME-001', quantity: 20, unitPrice: 189, totalPrice: 3780 }, { product: products[10]._id, productName: 'Air Purifier HEPA 500', sku: 'HOME-003', quantity: 15, unitPrice: 279, totalPrice: 4185 }], subtotal: 7965, taxRate: 0.1, taxAmount: 796.5, totalAmount: 8761.5, status: 'shipped', paymentStatus: 'paid', createdBy: users[1]._id, createdAt: getRandomDate(8) },
      { orderNumber: 'SO-2024-0005', orderType: 'sales', customerName: 'SportZone Retailers', customerEmail: 'bulk@sportzone-retail.com', warehouse: warehouses[0]._id, warehouseName: 'Central Distribution Hub', items: [{ product: products[13]._id, productName: 'Adjustable Dumbbell Set 5-50lb', sku: 'SPRT-001', quantity: 10, unitPrice: 389, totalPrice: 3890 }, { product: products[14]._id, productName: 'Yoga Mat Premium 6mm', sku: 'SPRT-002', quantity: 50, unitPrice: 59, totalPrice: 2950 }], subtotal: 6840, taxRate: 0.1, taxAmount: 684, totalAmount: 7524, status: 'processing', paymentStatus: 'partial', createdBy: users[1]._id, createdAt: getRandomDate(3) },
      { orderNumber: 'SO-2024-0006', orderType: 'sales', customerName: 'Digital World Chain', customerEmail: 'procurement@digitalworld.com', warehouse: warehouses[0]._id, warehouseName: 'Central Distribution Hub', items: [{ product: products[2]._id, productName: 'Wireless ANC Headphones', sku: 'ELEC-003', quantity: 25, unitPrice: 249, totalPrice: 6225 }, { product: products[3]._id, productName: '4K Smart TV 55"', sku: 'ELEC-004', quantity: 5, unitPrice: 699, totalPrice: 3495 }], subtotal: 9720, taxRate: 0.1, taxAmount: 972, totalAmount: 10692, status: 'pending', paymentStatus: 'unpaid', createdBy: users[1]._id, createdAt: getRandomDate(1) },
    ]);
    console.log(`✅ ${orders.length} orders seeded`);

    // ── Stock Movements ───────────────────────────────────────────────────────
    await StockMovement.insertMany([
      { product: products[0]._id, productName: 'UltraBook Pro 15"', sku: 'ELEC-001', movementType: 'receive', toWarehouse: warehouses[0]._id, toWarehouseName: 'Central Distribution Hub', quantity: 50, quantityBefore: 0, quantityAfter: 50, reason: 'Initial stock receive PO-2024-0001', reference: 'PO-2024-0001', performedBy: users[0]._id, performedByName: 'Alex Johnson', createdAt: getRandomDate(60) },
      { product: products[1]._id, productName: 'SmartPhone X12 Pro', sku: 'ELEC-002', movementType: 'transfer', fromWarehouse: warehouses[0]._id, fromWarehouseName: 'Central Distribution Hub', toWarehouse: warehouses[1]._id, toWarehouseName: 'West Coast Fulfillment', quantity: 15, quantityBefore: 35, quantityAfter: 20, reason: 'Replenish West Coast stock', performedBy: users[1]._id, performedByName: 'Sarah Mitchell', createdAt: getRandomDate(40) },
      { product: products[5]._id, productName: 'Premium Slim-Fit Jeans', sku: 'APP-001', movementType: 'receive', toWarehouse: warehouses[0]._id, toWarehouseName: 'Central Distribution Hub', quantity: 200, quantityBefore: 100, quantityAfter: 300, reason: 'Restocking from PO-2024-0002', reference: 'PO-2024-0002', performedBy: users[1]._id, performedByName: 'Sarah Mitchell', createdAt: getRandomDate(45) },
      { product: products[7]._id, productName: 'Athletic Performance Shorts', sku: 'APP-003', movementType: 'dispatch', fromWarehouse: warehouses[1]._id, fromWarehouseName: 'West Coast Fulfillment', quantity: 100, quantityBefore: 295, quantityAfter: 195, reason: 'Sales Order SO-2024-0002', reference: 'SO-2024-0002', performedBy: users[1]._id, performedByName: 'Sarah Mitchell', createdAt: getRandomDate(25) },
      { product: products[11]._id, productName: 'Vitamin D3 + K2 (180 caps)', sku: 'HLTH-001', movementType: 'adjustment', toWarehouse: warehouses[0]._id, toWarehouseName: 'Central Distribution Hub', quantity: -20, quantityBefore: 109, quantityAfter: 89, reason: 'Damaged stock write-off', performedBy: users[0]._id, performedByName: 'Alex Johnson', createdAt: getRandomDate(15) },
      { product: products[9]._id, productName: 'Robot Vacuum Cleaner Pro', sku: 'HOME-002', movementType: 'transfer', fromWarehouse: warehouses[0]._id, fromWarehouseName: 'Central Distribution Hub', toWarehouse: warehouses[2]._id, toWarehouseName: 'East Coast Regional', quantity: 5, quantityBefore: 8, quantityAfter: 3, reason: 'Rebalance stock', performedBy: users[1]._id, performedByName: 'Sarah Mitchell', createdAt: getRandomDate(10) },
    ]);
    console.log('✅ Stock movements seeded');

    console.log('\n🎉 Database seeding complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Demo Accounts:');
    console.log('  Admin:   admin@retailflow.com   / Admin@123');
    console.log('  Manager: manager@retailflow.com / Manager@123');
    console.log('  Staff:   staff@retailflow.com   / Staff@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    throw err;
  }
};

// Allow direct execution
if (require.main === module) {
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    await seedDatabase();
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
