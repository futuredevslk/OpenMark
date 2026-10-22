import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Creates a realistic 2-page sample exam paper in-memory
 */
export async function createSampleExamPdf(): Promise<ArrayBuffer> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // --- Page 1 ---
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
  const { width, height } = page1.getSize();

  // Header border box
  page1.drawRectangle({
    x: 40,
    y: height - 120,
    width: width - 80,
    height: 80,
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth: 1,
    color: rgb(0.97, 0.97, 0.98),
  });

  page1.drawText('GREENWOOD HIGH SCHOOL - MIDTERM EXAMINATION', {
    x: 60,
    y: height - 65,
    size: 15,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page1.drawText('Subject: Mathematics & Applied Physics', {
    x: 60,
    y: height - 85,
    size: 11,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page1.drawText('Student: Alex Morgan   |   Grade: 11-B   |   Max Marks: 30', {
    x: 60,
    y: height - 105,
    size: 11,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Score Box for Teacher Stamp
  page1.drawRectangle({
    x: width - 150,
    y: height - 110,
    width: 90,
    height: 60,
    borderColor: rgb(0.4, 0.4, 0.4),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });
  page1.drawText('TEACHER SCORE', {
    x: width - 142,
    y: height - 62,
    size: 8,
    font: fontBold,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Question 1
  let currentY = height - 160;
  page1.drawText('Question 1: Linear Equations (5 Marks)', {
    x: 45,
    y: currentY,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.5),
  });

  currentY -= 20;
  page1.drawText('Solve for x:   4(x - 3) + 7 = 27', {
    x: 50,
    y: currentY,
    size: 12,
    font: fontRegular,
    color: rgb(0.1, 0.1, 0.1),
  });

  currentY -= 25;
  page1.drawText("Student's Answer:", {
    x: 50,
    y: currentY,
    size: 10,
    font: fontOblique,
    color: rgb(0.4, 0.4, 0.4),
  });

  currentY -= 20;
  page1.drawText('4x - 12 + 7 = 27', {
    x: 70,
    y: currentY,
    size: 12,
    font: fontRegular,
    color: rgb(0.05, 0.05, 0.4),
  });
  currentY -= 20;
  page1.drawText('4x - 5 = 27', {
    x: 70,
    y: currentY,
    size: 12,
    font: fontRegular,
    color: rgb(0.05, 0.05, 0.4),
  });
  currentY -= 20;
  page1.drawText('4x = 32', {
    x: 70,
    y: currentY,
    size: 12,
    font: fontRegular,
    color: rgb(0.05, 0.05, 0.4),
  });
  currentY -= 20;
  page1.drawText('x = 8', {
    x: 70,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.4),
  });

  // Question 2
  currentY -= 45;
  page1.drawText('Question 2: Geometry & Mensuration (10 Marks)', {
    x: 45,
    y: currentY,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.5),
  });

  currentY -= 20;
  page1.drawText('Find the total surface area of a cylinder with radius r = 7 cm and height h = 10 cm.', {
    x: 50,
    y: currentY,
    size: 12,
    font: fontRegular,
    color: rgb(0.1, 0.1, 0.1),
  });
  currentY -= 16;
  page1.drawText('(Use pi = 22/7)', {
    x: 50,
    y: currentY,
    size: 10,
    font: fontOblique,
    color: rgb(0.3, 0.3, 0.3),
  });

  currentY -= 25;
  page1.drawText("Student's Answer:", {
    x: 50,
    y: currentY,
    size: 10,
    font: fontOblique,
    color: rgb(0.4, 0.4, 0.4),
  });

  currentY -= 20;
  page1.drawText('Formula: TSA = 2 * pi * r * (r + h)', {
    x: 70,
    y: currentY,
    size: 12,
    font: fontRegular,
    color: rgb(0.05, 0.05, 0.4),
  });
  currentY -= 20;
  page1.drawText('TSA = 2 * (22/7) * 7 * (7 + 10)', {
    x: 70,
    y: currentY,
    size: 12,
    font: fontRegular,
    color: rgb(0.05, 0.05, 0.4),
  });
  currentY -= 20;
  page1.drawText('TSA = 44 * 17', {
    x: 70,
    y: currentY,
    size: 12,
    font: fontRegular,
    color: rgb(0.05, 0.05, 0.4),
  });
  currentY -= 20;
  page1.drawText('TSA = 748 cm^2', {
    x: 70,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.4),
  });

  // Footer
  page1.drawText('Page 1 of 2  -  Turn over for Physics section', {
    x: width / 2 - 80,
    y: 35,
    size: 10,
    font: fontOblique,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --- Page 2 ---
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  let p2Y = height - 60;

  page2.drawText('SECTION B: APPLIED KINEMATICS', {
    x: 45,
    y: p2Y,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  p2Y -= 35;
  page2.drawText('Question 3: Uniform Acceleration (15 Marks)', {
    x: 45,
    y: p2Y,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.5),
  });

  p2Y -= 22;
  page2.drawText('A train starts from rest (u = 0) and accelerates uniformly at 2.5 m/s^2 for 12 seconds.', {
    x: 50,
    y: p2Y,
    size: 12,
    font: fontRegular,
    color: rgb(0.1, 0.1, 0.1),
  });
  p2Y -= 18;
  page2.drawText('(a) Calculate final velocity v after 12 seconds.', {
    x: 50,
    y: p2Y,
    size: 11,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });
  p2Y -= 18;
  page2.drawText('(b) Calculate total distance travelled s during this time.', {
    x: 50,
    y: p2Y,
    size: 11,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  p2Y -= 25;
  page2.drawText("Student's Answer:", {
    x: 50,
    y: p2Y,
    size: 10,
    font: fontOblique,
    color: rgb(0.4, 0.4, 0.4),
  });

  p2Y -= 20;
  page2.drawText('Part (a):', {
    x: 70,
    y: p2Y,
    size: 11,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.4),
  });
  p2Y -= 18;
  page2.drawText('v = u + at', {
    x: 85,
    y: p2Y,
    size: 12,
    font: fontRegular,
    color: rgb(0.05, 0.05, 0.4),
  });
  p2Y -= 18;
  page2.drawText('v = 0 + (2.5)(12) = 30 m/s', {
    x: 85,
    y: p2Y,
    size: 12,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.4),
  });

  p2Y -= 25;
  page2.drawText('Part (b):', {
    x: 70,
    y: p2Y,
    size: 11,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.4),
  });
  p2Y -= 18;
  page2.drawText('s = ut + 0.5 * a * t', { // Intentional student typo: forgot square on t
    x: 85,
    y: p2Y,
    size: 12,
    font: fontRegular,
    color: rgb(0.05, 0.05, 0.4),
  });
  p2Y -= 18;
  page2.drawText('s = 0 + 0.5 * 2.5 * 12 = 15 meters', {
    x: 85,
    y: p2Y,
    size: 12,
    font: fontBold,
    color: rgb(0.05, 0.05, 0.4),
  });

  page2.drawText('Page 2 of 2  -  End of Examination', {
    x: width / 2 - 70,
    y: 35,
    size: 10,
    font: fontOblique,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes.buffer as ArrayBuffer;
}
