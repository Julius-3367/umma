/**
 * Simple PDF Generation Test (without Prisma)
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Sample test data
const testData = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    status: 'Active',
    dateJoined: '2024-01-15',
    courses: 3
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'Active',
    dateJoined: '2024-02-20',
    courses: 5
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    status: 'Inactive',
    dateJoined: '2024-03-10',
    courses: 2
  }
];

async function convertToPDF(data, reportType, filePath) {
  return new Promise((resolve, reject) => {
    if (!data || data.length === 0) {
      reject(new Error('No data available'));
      return;
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fontSize(18).text(`${reportType.toUpperCase()} REPORT`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Total Records: ${data.length}`, { align: 'center' });
    doc.moveDown(2);

    // Table headers
    const headers = Object.keys(data[0]);
    const columnWidth = (doc.page.width - 100) / headers.length;
    let yPosition = doc.y;

    // Draw header row
    doc.fontSize(9).fillColor('black');
    headers.forEach((header, i) => {
      doc.rect(50 + (i * columnWidth), yPosition, columnWidth, 20).stroke();
      doc.text(header, 52 + (i * columnWidth), yPosition + 5, {
        width: columnWidth - 4,
        height: 20,
        ellipsis: true
      });
    });

    yPosition += 20;

    // Draw data rows
    doc.fontSize(8);

    data.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (yPosition > doc.page.height - 100) {
        doc.addPage();
        yPosition = 50;

        // Redraw headers on new page
        doc.fontSize(9);
        headers.forEach((header, i) => {
          doc.rect(50 + (i * columnWidth), yPosition, columnWidth, 20).stroke();
          doc.text(header, 52 + (i * columnWidth), yPosition + 5, {
            width: columnWidth - 4,
            height: 20,
            ellipsis: true
          });
        });
        yPosition += 20;
        doc.fontSize(8);
      }

      headers.forEach((header, i) => {
        const value = row[header] !== null && row[header] !== undefined ? String(row[header]) : 'N/A';
        doc.rect(50 + (i * columnWidth), yPosition, columnWidth, 15).stroke();
        doc.text(value, 52 + (i * columnWidth), yPosition + 3, {
          width: columnWidth - 4,
          height: 15,
          ellipsis: true
        });
      });

      yPosition += 15;
    });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

async function testPDFGeneration() {
  console.log('Testing PDF report generation...\n');

  try {
    const uploadsDir = path.join(__dirname, 'uploads/reports');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = 'test_report.pdf';
    const filePath = path.join(uploadsDir, fileName);
    const reportType = 'candidates';
    
    console.log('Generating PDF report...');
    await convertToPDF(testData, reportType, filePath);

    console.log(`✅ PDF generated successfully at: ${filePath}`);

    // Check if file exists and get size
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✅ File size: ${stats.size} bytes`);
      console.log(`\nYou can open the file at: ${filePath}`);
    } else {
      console.log('❌ File was not created');
    }

  } catch (error) {
    console.error('❌ Error generating PDF:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPDFGeneration();
