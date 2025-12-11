/**
 * Test PDF Report Generation
 */

const reportService = require('./src/services/reportService');
const fs = require('fs');
const path = require('path');

async function testPDFGeneration() {
  console.log('Testing PDF report generation...\n');

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

  try {
    const fileName = 'test_report.pdf';
    const reportType = 'candidates';
    
    console.log('Generating PDF report...');
    const filePath = await reportService.saveReportToFile(
      testData,
      'pdf',
      fileName,
      reportType
    );

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
