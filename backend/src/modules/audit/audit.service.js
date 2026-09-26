const { getMovements } = require("../inventory/inventory.service");

async function getAuditLog(query) {
	return getMovements(query);
}

module.exports = { getAuditLog };
