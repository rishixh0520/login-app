const reportsRepository = require('../repositories/reports.repository');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');

class ReportsService {
  async getReportData(type) {
    switch (type) {
      case 'employees':
        return await reportsRepository.getEmployeeReportData();
      case 'assets':
        return await reportsRepository.getAssetReportData();
      case 'leaves':
        return await reportsRepository.getLeaveReportData();
      case 'attendance':
        return await reportsRepository.getAttendanceReportData();
      case 'payroll':
        return await reportsRepository.getPayrollReportData();
      case 'department':
        return await reportsRepository.getDepartmentReportData();
      case 'performance':
        return await reportsRepository.getPerformanceReportData();
      default:
        throw { statusCode: 400, message: 'Invalid report type', isOperational: true };
    }
  }

  async generateExcel(type) {
    const data = await this.getReportData(type);
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Report');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async generateCsv(type) {
    const data = await this.getReportData(type);
    const worksheet = xlsx.utils.json_to_sheet(data);
    return xlsx.utils.sheet_to_csv(worksheet);
  }

  async generatePdf(type, res) {
    const data = await this.getReportData(type);
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    
    doc.pipe(res);
    
    doc.fontSize(20).text(`Report: ${type.toUpperCase()}`, { align: 'center' });
    doc.moveDown();

    if (data.length === 0) {
      doc.fontSize(12).text('No records found.');
    } else {
      // Very basic table rendering for PDF
      const keys = Object.keys(data[0]);
      doc.fontSize(10);
      let y = doc.y;
      
      // Header
      let x = 30;
      keys.forEach(key => {
        doc.text(key, x, y, { width: 90 });
        x += 90;
      });
      y += 20;

      // Rows
      data.forEach(row => {
        x = 30;
        keys.forEach(key => {
          doc.text(String(row[key] || ''), x, y, { width: 90 });
          x += 90;
        });
        y += 20;
        if (y > 750) {
          doc.addPage();
          y = 50;
        }
      });
    }

    doc.end();
  }
}

module.exports = new ReportsService();
