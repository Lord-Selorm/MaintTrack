/**
 * Advanced Search & Filtering Utilities
 */

function buildEquipmentFilters(query) {
  const filters = {};

  // Text search
  if (query.search) {
    const { Op } = require('sequelize');
    filters[Op.or] = [
      { name: { [Op.like]: `%${query.search}%` } },
      { serial: { [Op.like]: `%${query.search}%` } },
      { location: { [Op.like]: `%${query.search}%` } },
    ];
  }

  // Status filter
  if (query.status) {
    filters.status = query.status;
  }

  // Type filter
  if (query.type) {
    filters.type = query.type;
  }

  // Location filter
  if (query.location) {
    filters.location = query.location;
  }

  // Date range filter (installed date)
  if (query.dateFrom || query.dateTo) {
    const { Op } = require('sequelize');
    filters.installed = {};
    if (query.dateFrom) filters.installed[Op.gte] = new Date(query.dateFrom);
    if (query.dateTo) filters.installed[Op.lte] = new Date(query.dateTo);
  }

  // Lifespan range (percentage)
  if (query.lifespanMin || query.lifespanMax) {
    // Will be handled in post-processing
  }

  // Favorite filter
  if (query.onlyFavorites === 'true') {
    filters.isFavorite = true;
  }

  return filters;
}

function postProcessEquipmentFilters(equipmentList, query) {
  let filtered = equipmentList;

  // Lifespan percentage range
  if (query.lifespanMin || query.lifespanMax) {
    filtered = filtered.filter(eq => {
      const start = new Date(eq.installed);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + Number(eq.lifespan));
      const now = new Date();
      const lifespanPct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));

      const min = query.lifespanMin ? parseInt(query.lifespanMin) : 0;
      const max = query.lifespanMax ? parseInt(query.lifespanMax) : 100;

      return lifespanPct >= min && lifespanPct <= max;
    });
  }

  // Cost range filter (requires work records)
  if (query.costMin || query.costMax) {
    // Will be handled with work records
  }

  return filtered;
}

function buildWorkFilters(query) {
  const filters = {};

  // Date range
  if (query.dateFrom || query.dateTo) {
    const { Op } = require('sequelize');
    filters.date = {};
    if (query.dateFrom) filters.date[Op.gte] = new Date(query.dateFrom);
    if (query.dateTo) filters.date[Op.lte] = new Date(query.dateTo);
  }

  // Work type
  if (query.workType) {
    filters.type = query.workType;
  }

  // Technician
  if (query.technician) {
    const { Op } = require('sequelize');
    filters.tech = { [Op.like]: `%${query.technician}%` };
  }

  // Cost range
  if (query.costMin || query.costMax) {
    const { Op } = require('sequelize');
    filters.cost = {};
    if (query.costMin) filters.cost[Op.gte] = parseFloat(query.costMin);
    if (query.costMax) filters.cost[Op.lte] = parseFloat(query.costMax);
  }

  return filters;
}

function parseFilterQuickRanges(rangeStr) {
  // Supports: "last-7-days", "last-30-days", "last-90-days", "last-year", "last-6-months"
  const now = new Date();
  let dateFrom = null;

  switch (rangeStr) {
    case 'last-7-days':
      dateFrom = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'last-30-days':
      dateFrom = new Date(now.setDate(now.getDate() - 30));
      break;
    case 'last-90-days':
      dateFrom = new Date(now.setDate(now.getDate() - 90));
      break;
    case 'last-6-months':
      dateFrom = new Date(now.setMonth(now.getMonth() - 6));
      break;
    case 'last-year':
      dateFrom = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      return null;
  }

  return { dateFrom, dateTo: new Date() };
}

function applySorting(list, sortBy, sortOrder = 'DESC') {
  const order = sortOrder === 'ASC' ? 1 : -1;

  switch (sortBy) {
    case 'name':
      return list.sort((a, b) => order * a.name.localeCompare(b.name));
    case 'installed':
      return list.sort((a, b) => order * (new Date(a.installed) - new Date(b.installed)));
    case 'cost':
      return list.sort((a, b) => order * (a.totalCost - b.totalCost));
    case 'status':
      return list.sort((a, b) => order * a.status.localeCompare(b.status));
    case 'lifespan-usage':
      return list.sort((a, b) => {
        const lifespanA = calculateLifespanPercent(a);
        const lifespanB = calculateLifespanPercent(b);
        return order * (lifespanA - lifespanB);
      });
    default:
      return list;
  }
}

function calculateLifespanPercent(equipment) {
  const start = new Date(equipment.installed);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + Number(equipment.lifespan));
  const now = new Date();
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

module.exports = {
  buildEquipmentFilters,
  postProcessEquipmentFilters,
  buildWorkFilters,
  parseFilterQuickRanges,
  applySorting,
  calculateLifespanPercent,
};
