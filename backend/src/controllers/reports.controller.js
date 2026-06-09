const reportsService = require('../services/reports.service');

class ReportsController {
  async downloadReport(req, res, next) {
    try {
      const { type, format } = req.query; // type: employees, assets, leaves; format: pdf, excel, csv
      
      if (format === 'excel') {
        const buffer = await reportsService.generateExcel(type);
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buffer);
      } 
      else if (format === 'csv') {
        const csvString = await reportsService.generateCsv(type);
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
        res.setHeader('Content-Type', 'text/csv');
        return res.send(csvString);
      }
      else if (format === 'pdf') {
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report.pdf`);
        res.setHeader('Content-Type', 'application/pdf');
        return await reportsService.generatePdf(type, res);
      }
      else {
        throw { statusCode: 400, message: 'Invalid format. Use pdf, excel, or csv.', isOperational: true };
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportsController();
