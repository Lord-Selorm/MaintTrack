/**
 * Analytics & Reporting Utilities
 * Generates cost analytics, trends, and statistics
 */

class AnalyticsService {
  /**
   * Get cost analytics dashboard data
   */
  static generateCostAnalytics(equipment, works) {
    const analytics = {
      summary: this.calculateSummary(equipment, works),
      byType: this.groupByEquipmentType(equipment, works),
      byWorkType: this.groupByWorkType(works),
      trends: this.calculateMonthlyTrends(works),
      topExpensive: this.getTopExpensiveEquipment(equipment, works, 5),
      averageMetrics: this.calculateAverageMetrics(equipment, works),
    };

    return analytics;
  }

  static calculateSummary(equipment, works) {
    const totalCost = works.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);
    const avgCost = works.length > 0 ? totalCost / works.length : 0;
    const costByType = {};

    works.forEach(w => {
      costByType[w.type] = (costByType[w.type] || 0) + Number(w.cost || 0);
    });

    return {
      totalCost,
      totalWorks: works.length,
      totalEquipment: equipment.length,
      averageCostPerWork: avgCost.toFixed(2),
      costBreakdown: costByType,
    };
  }

  static groupByEquipmentType(equipment, works) {
    const grouped = {};

    equipment.forEach(eq => {
      const equipWorks = works.filter(w => w.equipId === eq.id);
      const cost = equipWorks.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);

      if (!grouped[eq.type]) {
        grouped[eq.type] = { count: 0, totalCost: 0, avgCost: 0, workCount: 0 };
      }

      grouped[eq.type].count += 1;
      grouped[eq.type].totalCost += cost;
      grouped[eq.type].workCount += equipWorks.length;
    });

    // Calculate averages
    Object.keys(grouped).forEach(type => {
      grouped[type].avgCost = grouped[type].count > 0
        ? (grouped[type].totalCost / grouped[type].count).toFixed(2)
        : 0;
    });

    return grouped;
  }

  static groupByWorkType(works) {
    const grouped = {};

    works.forEach(w => {
      if (!grouped[w.type]) {
        grouped[w.type] = { count: 0, totalCost: 0, avgCost: 0 };
      }
      grouped[w.type].count += 1;
      grouped[w.type].totalCost += Number(w.cost || 0);
    });

    // Calculate averages
    Object.keys(grouped).forEach(type => {
      grouped[type].avgCost = (grouped[type].totalCost / grouped[type].count).toFixed(2);
    });

    return grouped;
  }

  static calculateMonthlyTrends(works) {
    const trends = {};

    works.forEach(w => {
      const date = new Date(w.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!trends[monthKey]) {
        trends[monthKey] = { count: 0, totalCost: 0 };
      }

      trends[monthKey].count += 1;
      trends[monthKey].totalCost += Number(w.cost || 0);
    });

    // Convert to array and sort
    return Object.entries(trends)
      .map(([month, data]) => ({
        month,
        ...data,
        avgCost: (data.totalCost / data.count).toFixed(2),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  static getTopExpensiveEquipment(equipment, works, limit = 5) {
    const equipmentCosts = equipment.map(eq => {
      const equipWorks = works.filter(w => w.equipId === eq.id);
      const cost = equipWorks.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);
      return {
        id: eq.id,
        name: eq.name,
        type: eq.type,
        status: eq.status,
        totalCost: cost,
        workCount: equipWorks.length,
      };
    });

    return equipmentCosts
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
  }

  static calculateAverageMetrics(equipment, works) {
    const metrics = {
      avgCostPerEquipment: 0,
      avgWorksPerEquipment: 0,
      mostCommonWorkType: null,
      avgCostByStatus: {},
    };

    if (equipment.length === 0) return metrics;

    // Average cost per equipment
    const totalCost = works.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);
    metrics.avgCostPerEquipment = (totalCost / equipment.length).toFixed(2);

    // Average works per equipment
    metrics.avgWorksPerEquipment = (works.length / equipment.length).toFixed(2);

    // Most common work type
    const workTypes = {};
    works.forEach(w => {
      workTypes[w.type] = (workTypes[w.type] || 0) + 1;
    });
    metrics.mostCommonWorkType = Object.keys(workTypes).length > 0
      ? Object.entries(workTypes).reduce((a, b) => b[1] > a[1] ? b : a)[0]
      : null;

    // Average cost by equipment status
    const statuses = {};
    equipment.forEach(eq => {
      if (!statuses[eq.status]) statuses[eq.status] = { count: 0, cost: 0 };
      statuses[eq.status].count += 1;

      const equipWorks = works.filter(w => w.equipId === eq.id);
      const cost = equipWorks.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);
      statuses[eq.status].cost += cost;
    });

    Object.keys(statuses).forEach(status => {
      metrics.avgCostByStatus[status] = (statuses[status].cost / statuses[status].count).toFixed(2);
    });

    return metrics;
  }

  /**
   * Get predictive maintenance suggestions
   */
  static getPredictiveSuggestions(equipment, works) {
    const suggestions = [];

    equipment.forEach(eq => {
      const equipWorks = works.filter(w => w.equipId === eq.id);

      if (equipWorks.length < 2) return;

      // Calculate average days between maintenance
      const dates = equipWorks
        .filter(w => w.type === 'Maintenance')
        .map(w => new Date(w.date))
        .sort((a, b) => b - a);

      if (dates.length < 2) return;

      const daysBetween = [];
      for (let i = 0; i < dates.length - 1; i++) {
        const days = Math.floor((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
        daysBetween.push(days);
      }

      const avgDaysBetween = daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length;

      if (avgDaysBetween > 30) {
        const lastMaintenance = dates[0];
        const nextSuggested = new Date(lastMaintenance.getTime() + avgDaysBetween * 24 * 60 * 60 * 1000);

        if (nextSuggested < new Date()) {
          suggestions.push({
            equipId: eq.id,
            equipName: eq.name,
            type: 'OVERDUE_MAINTENANCE',
            message: `${eq.name} is overdue for maintenance. Last maintenance: ${lastMaintenance.toLocaleDateString()}. Suggested interval: every ${Math.round(avgDaysBetween)} days.`,
            priority: 'HIGH',
          });
        } else if (nextSuggested < new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)) {
          suggestions.push({
            equipId: eq.id,
            equipName: eq.name,
            type: 'UPCOMING_MAINTENANCE',
            message: `${eq.name} will be due for maintenance on ${nextSuggested.toLocaleDateString()}. Schedule maintenance now.`,
            priority: 'MEDIUM',
          });
        }
      }
    });

    return suggestions;
  }
}

module.exports = AnalyticsService;
