/**
 * Alert Generation System
 * Monitors equipment and generates alerts based on various conditions
 */

const Alert = require('../models/Alert');
const Equipment = require('../models/Equipment');
const Work = require('../models/Work');

class AlertService {
  /**
   * Generate all alerts for a user
   */
  static async generateAlertsForUser(userId) {
    try {
      const equipment = await Equipment.findAll({ where: { userId } });
      const works = await Work.findAll({ where: { userId } });

      const alerts = [];

      for (const eq of equipment) {
        // Check lifespan warning (80%+)
        const lifespanAlert = this.checkLifespanWarning(eq);
        if (lifespanAlert) alerts.push({ ...lifespanAlert, userId });

        // Check repair overdue (>7 days in "Under Repair")
        const repairAlert = this.checkRepairOverdue(eq);
        if (repairAlert) alerts.push({ ...repairAlert, userId });

        // Check no maintenance in 6 months
        const maintenanceAlert = this.checkNoMaintenance(eq, works);
        if (maintenanceAlert) alerts.push({ ...maintenanceAlert, userId });

        // Check warranty expiration
        const warrantyAlert = this.checkWarrantyExpiring(eq);
        if (warrantyAlert) alerts.push({ ...warrantyAlert, userId });
      }

      // Check cost threshold (expensive equipment)
      const costAlerts = this.checkCostThreshold(equipment, works);
      alerts.push(...costAlerts.map(a => ({ ...a, userId })));

      return alerts;
    } catch (err) {
      console.error('Alert generation error:', err);
      return [];
    }
  }

  static checkLifespanWarning(equipment) {
    const start = new Date(equipment.installed);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + Number(equipment.lifespan));
    const now = new Date();
    const lifespanPct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));

    if (lifespanPct >= 80) {
      return {
        equipId: equipment.id,
        type: 'LIFESPAN_WARNING',
        title: `Equipment approaching end of life: ${equipment.name}`,
        message: `${equipment.name} (${equipment.serial}) has used ${lifespanPct}% of its lifespan. Estimated end date: ${end.toLocaleDateString()}`,
        severity: lifespanPct >= 95 ? 'CRITICAL' : 'HIGH',
        actionUrl: `/equipment/${equipment.id}`,
      };
    }
    return null;
  }

  static checkRepairOverdue(equipment) {
    if (equipment.status === 'Under Repair') {
      // This should be linked to when repair started - simplified for now
      return {
        equipId: equipment.id,
        type: 'REPAIR_OVERDUE',
        title: `Equipment under repair for extended period: ${equipment.name}`,
        message: `${equipment.name} has been under repair. Consider investigating delays or scheduling completion.`,
        severity: 'HIGH',
        actionUrl: `/equipment/${equipment.id}`,
      };
    }
    return null;
  }

  static checkNoMaintenance(equipment, works) {
    const equipWorks = works.filter(w => w.equipId === equipment.id && w.type === 'Maintenance');
    
    if (equipWorks.length === 0 && equipment.status === 'Active') {
      return {
        equipId: equipment.id,
        type: 'NO_MAINTENANCE',
        title: `No maintenance records: ${equipment.name}`,
        message: `${equipment.name} has no maintenance history. Regular maintenance is recommended to prevent equipment failure.`,
        severity: 'MEDIUM',
        actionUrl: `/equipment/${equipment.id}`,
      };
    }

    if (equipWorks.length > 0) {
      const lastMaintenance = new Date(equipWorks[0].date);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      if (lastMaintenance < sixMonthsAgo && equipment.status === 'Active') {
        return {
          equipId: equipment.id,
          type: 'NO_MAINTENANCE',
          title: `No maintenance in 6 months: ${equipment.name}`,
          message: `${equipment.name} hasn't had maintenance since ${lastMaintenance.toLocaleDateString()}. Schedule maintenance soon.`,
          severity: 'MEDIUM',
          actionUrl: `/equipment/${equipment.id}`,
        };
      }
    }

    return null;
  }

  static checkWarrantyExpiring(equipment) {
    if (!equipment.warrantyExpiration) return null;

    const warranty = new Date(equipment.warrantyExpiration);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (warranty < now) {
      return {
        equipId: equipment.id,
        type: 'WARRANTY_EXPIRING',
        title: `Warranty expired: ${equipment.name}`,
        message: `${equipment.name} warranty expired on ${warranty.toLocaleDateString()}. Equipment is no longer under warranty.`,
        severity: 'LOW',
        actionUrl: `/equipment/${equipment.id}`,
      };
    }

    if (warranty < thirtyDaysFromNow) {
      return {
        equipId: equipment.id,
        type: 'WARRANTY_EXPIRING',
        title: `Warranty expiring soon: ${equipment.name}`,
        message: `${equipment.name} warranty expires on ${warranty.toLocaleDateString()}. Consider renewal if available.`,
        severity: 'MEDIUM',
        actionUrl: `/equipment/${equipment.id}`,
      };
    }

    return null;
  }

  static checkCostThreshold(equipment, works) {
    const alerts = [];
    const avgEquipCost = this.calculateAverageCost(equipment, works);

    for (const eq of equipment) {
      const equipWorks = works.filter(w => w.equipId === eq.id);
      const equipCost = equipWorks.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);

      if (equipCost > avgEquipCost * 1.5) {
        alerts.push({
          equipId: eq.id,
          type: 'COST_THRESHOLD',
          title: `High maintenance costs: ${eq.name}`,
          message: `${eq.name} has accumulated maintenance costs of GHS ${equipCost.toFixed(2)}, significantly above average.`,
          severity: 'MEDIUM',
          actionUrl: `/equipment/${eq.id}`,
        });
      }
    }

    return alerts;
  }

  static calculateAverageCost(equipment, works) {
    if (equipment.length === 0) return 0;
    
    const totalCost = equipment.reduce((sum, eq) => {
      const equipWorks = works.filter(w => w.equipId === eq.id);
      const cost = equipWorks.reduce((s, w) => s + (Number(w.cost) || 0), 0);
      return sum + cost;
    }, 0);

    return totalCost / equipment.length;
  }

  /**
   * Get unread alerts for user
   */
  static async getAlerts(userId) {
    try {
      return await Alert.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
      });
    } catch (err) {
      console.error('Error fetching alerts:', err);
      return [];
    }
  }

  /**
   * Mark alert as read
   */
  static async markAlertAsRead(alertId) {
    try {
      await Alert.update({ isRead: true }, { where: { id: alertId } });
      return true;
    } catch (err) {
      console.error('Error marking alert as read:', err);
      return false;
    }
  }

  /**
   * Clear old alerts (older than 30 days)
   */
  static async clearOldAlerts() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await Alert.destroy({
        where: {
          createdAt: { [require('sequelize').Op.lt]: thirtyDaysAgo },
        },
      });
    } catch (err) {
      console.error('Error clearing old alerts:', err);
    }
  }
}

module.exports = AlertService;
