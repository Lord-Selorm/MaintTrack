const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Equipment = require('../models/Equipment');
const Work = require('../models/Work');
const { Op } = require('sequelize');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, BorderStyle, WidthType, HeadingLevel, TextRun, VerticalAlign, AlignmentType } = require('docx');

// Generate report for all equipment
router.get('/all', auth, async (req, res) => {
  try {
    const equipmentList = await Equipment.findAll({
      where: {},
      order: [['createdAt', 'DESC']]
    });

    const works = await Work.findAll({
      where: {},
      order: [['date', 'DESC']]
    });

    const reportData = {
      title: 'Equipment Maintenance Report - All Equipment',
      generatedDate: new Date().toLocaleDateString(),
      equipment: equipmentList.map(eq => {
        const equipWorks = works.filter(w => w.equipId === eq.id);
        const totalCost = equipWorks.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);
        return {
          ...eq.toJSON(),
          workCount: equipWorks.length,
          totalCost,
          recentWorks: equipWorks.slice(0, 5)
        };
      }),
      summary: {
        totalEquipment: equipmentList.length,
        active: equipmentList.filter(e => e.status === 'Active').length,
        underRepair: equipmentList.filter(e => e.status === 'Under Repair').length,
        inactive: equipmentList.filter(e => e.status === 'Inactive').length,
        totalWorks: works.length,
        totalCost: works.reduce((sum, w) => sum + (Number(w.cost) || 0), 0)
      }
    };

    res.json(reportData);
  } catch (err) {
    console.error(err.stack || err);
    res.status(500).json({ error: err.message });
  }
});

// NOTE: specific export routes are registered below to avoid conflicting with the generic '/:equipId' route

// Export all equipment report to Word
router.get('/export/word/all', auth, async (req, res) => {
  try {
    const equipmentList = await Equipment.findAll({
      where: {},
      order: [['createdAt', 'DESC']]
    });

    const works = await Work.findAll({
      where: {},
      order: [['date', 'DESC']]
    });

    const totalCost = works.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);

    const sections = [];
    sections.push(
      new Paragraph({
        text: 'Equipment Maintenance Report - All Equipment',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Generated on ${new Date().toLocaleDateString()}`,
        style: 'Normal',
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Summary section
    sections.push(
      new Paragraph({
        text: 'SUMMARY',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Metric')], shading: { fill: 'D3D3D3' } }),
              new TableCell({ children: [new Paragraph('Value')], shading: { fill: 'D3D3D3' } })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Total Equipment')] }),
              new TableCell({ children: [new Paragraph(equipmentList.length.toString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Active')] }),
              new TableCell({ children: [new Paragraph(equipmentList.filter(e => e.status === 'Active').length.toString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Under Repair')] }),
              new TableCell({ children: [new Paragraph(equipmentList.filter(e => e.status === 'Under Repair').length.toString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Inactive')] }),
              new TableCell({ children: [new Paragraph(equipmentList.filter(e => e.status === 'Inactive').length.toString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Total Work Records')] }),
              new TableCell({ children: [new Paragraph(works.length.toString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Total Cost')] }),
              new TableCell({ children: [new Paragraph(`$${totalCost.toFixed(2)}`)] })
            ]
          })
        ]
      }),
      new Paragraph({ text: '', spacing: { after: 400 } })
    );

    // Equipment details section
    sections.push(
      new Paragraph({
        text: 'EQUIPMENT DETAILS',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 }
      })
    );

    for (const eq of equipmentList) {
      const equipWorks = works.filter(w => w.equipId === eq.id);
      const equipTotalCost = equipWorks.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);

      sections.push(
        new Paragraph({
          text: eq.name,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph('Property')] }),
                new TableCell({ children: [new Paragraph('Value')] })
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph('Serial Number')] }),
                new TableCell({ children: [new Paragraph(eq.serial)] })
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph('Type')] }),
                new TableCell({ children: [new Paragraph(eq.type)] })
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph('Status')] }),
                new TableCell({ children: [new Paragraph(eq.status)] })
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph('Location')] }),
                new TableCell({ children: [new Paragraph(eq.location || 'N/A')] })
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph('Installed')] }),
                new TableCell({ children: [new Paragraph(new Date(eq.installed).toLocaleDateString())] })
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph('Work Records')] }),
                new TableCell({ children: [new Paragraph(equipWorks.length.toString())] })
              ]
            }),
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph('Total Cost')] }),
                new TableCell({ children: [new Paragraph(`$${equipTotalCost.toFixed(2)}`)] })
              ]
            })
          ]
        }),
        new Paragraph({ text: '', spacing: { after: 200 } })
      );
    }

    const doc = new Document({ sections: [{ children: sections }] });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Disposition', 'attachment; filename="Maintenance_Report_All.docx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export single equipment report to Word
router.get('/export/word/:equipId', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      where: { id: req.params.equipId }
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const works = await Work.findAll({
      where: { equipId: req.params.equipId },
      order: [['date', 'DESC']]
    });

    const totalCost = works.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);
    const avgCostPerWork = works.length > 0 ? totalCost / works.length : 0;

    // Calculate lifespan
    const start = new Date(equipment.installed);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + Number(equipment.lifespan));
    const now = new Date();
    const lifespanPct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));

    const sections = [];
    sections.push(
      new Paragraph({
        text: `Equipment Report: ${equipment.name}`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Generated on ${new Date().toLocaleDateString()}`,
        style: 'Normal',
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Equipment details
    sections.push(
      new Paragraph({
        text: 'EQUIPMENT INFORMATION',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Property')] }),
              new TableCell({ children: [new Paragraph('Value')] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Name')] }),
              new TableCell({ children: [new Paragraph(equipment.name)] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Serial Number')] }),
              new TableCell({ children: [new Paragraph(equipment.serial)] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Type')] }),
              new TableCell({ children: [new Paragraph(equipment.type)] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Status')] }),
              new TableCell({ children: [new Paragraph(equipment.status)] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Location')] }),
              new TableCell({ children: [new Paragraph(equipment.location || 'N/A')] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Installation Date')] }),
              new TableCell({ children: [new Paragraph(new Date(equipment.installed).toLocaleDateString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Lifespan (years)')] }),
              new TableCell({ children: [new Paragraph(equipment.lifespan.toString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Estimated End Date')] }),
              new TableCell({ children: [new Paragraph(end.toLocaleDateString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Lifespan Used')] }),
              new TableCell({ children: [new Paragraph(`${lifespanPct}%`)] })
            ]
          })
        ]
      }),
      new Paragraph({ text: '', spacing: { after: 400 } })
    );

    // Summary statistics
    sections.push(
      new Paragraph({
        text: 'MAINTENANCE SUMMARY',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Metric')] }),
              new TableCell({ children: [new Paragraph('Value')] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Total Work Records')] }),
              new TableCell({ children: [new Paragraph(works.length.toString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Total Cost')] }),
              new TableCell({ children: [new Paragraph(`$${totalCost.toFixed(2)}`)] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Average Cost per Work')] }),
              new TableCell({ children: [new Paragraph(`$${avgCostPerWork.toFixed(2)}`)] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Maintenance Count')] }),
              new TableCell({ children: [new Paragraph(works.filter(w => w.type === 'Maintenance').length.toString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Repair Count')] }),
              new TableCell({ children: [new Paragraph(works.filter(w => w.type === 'Repair').length.toString())] })
            ]
          }),
          new TableRow({
            cells: [
              new TableCell({ children: [new Paragraph('Inspection Count')] }),
              new TableCell({ children: [new Paragraph(works.filter(w => w.type === 'Inspection').length.toString())] })
            ]
          })
        ]
      }),
      new Paragraph({ text: '', spacing: { after: 400 } })
    );

    // Work records table
    if (works.length > 0) {
      sections.push(
        new Paragraph({
          text: 'WORK RECORDS',
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph('Date')] }),
                new TableCell({ children: [new Paragraph('Type')] }),
                new TableCell({ children: [new Paragraph('Description')] }),
                new TableCell({ children: [new Paragraph('Cost')] })
              ]
            }),
            ...works.map(w => new TableRow({
              cells: [
                new TableCell({ children: [new Paragraph(new Date(w.date).toLocaleDateString())] }),
                new TableCell({ children: [new Paragraph(w.type)] }),
                new TableCell({ children: [new Paragraph(w.desc || 'N/A')] }),
                new TableCell({ children: [new Paragraph(`$${Number(w.cost || 0).toFixed(2)}`)] })
              ]
            }))
          ]
        })
      );
    }

    const doc = new Document({ sections: [{ children: sections }] });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Disposition', `attachment; filename="Equipment_Report_${equipment.name.replace(/\s+/g, '_')}.docx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate report for single equipment
router.get('/:equipId', auth, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      where: { id: req.params.equipId }
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const works = await Work.findAll({
      where: { equipId: req.params.equipId },
      order: [['date', 'DESC']]
    });

    const totalCost = works.reduce((sum, w) => sum + (Number(w.cost) || 0), 0);
    const avgCostPerWork = works.length > 0 ? totalCost / works.length : 0;

    // Calculate lifespan percentage
    const start = new Date(equipment.installed);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + Number(equipment.lifespan));
    const now = new Date();
    const lifespanPct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));

    const reportData = {
      title: `Equipment Report: ${equipment.name}`,
      generatedDate: new Date().toLocaleDateString(),
      equipment: equipment.toJSON(),
      lifespanPercentage: lifespanPct,
      estimatedEndDate: end.toISOString().slice(0, 10),
      works,
      summary: {
        totalWorks: works.length,
        totalCost,
        averageCostPerWork: avgCostPerWork.toFixed(2),
        maintenanceCount: works.filter(w => w.type === 'Maintenance').length,
        repairCount: works.filter(w => w.type === 'Repair').length,
        inspectionCount: works.filter(w => w.type === 'Inspection').length,
      }
    };

    res.json(reportData);
  } catch (err) {
    console.error(err.stack || err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
