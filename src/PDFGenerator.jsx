import { jsPDF } from 'jspdf';

const PDFGenerator = ({ content, fileName = 'compliance-calendar.pdf',title }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Extract title from filename
    // const title = fileName.split('-')[0];
    
    // Clean markdown formatting from content
    let cleanContent = content
      // Remove headers (# Header)
      .replace(/#+\s+/g, '')
      // Remove bold (**text**)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Remove italic (*text*)
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove code blocks (```code```)
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // Remove blockquotes (> text)
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules (---, ***, ___)
      .replace(/^(---|\*\*\*|___)$/gm, '');
    
    // Set title
    doc.setFontSize(16);
    doc.text(`${title}`, 20, 20);
    
    // Add content
    doc.setFontSize(12);
    
    // Split the content into lines to fit within page width
    const textLines = doc.splitTextToSize(cleanContent, 170);
    
    // Calculate number of pages needed
    // const linesPerPage = 50; // Approximate lines per page
    // const totalPages = Math.ceil(textLines.length / linesPerPage);
    
    // Add the text lines to the document with pagination
    let currentPage = 1;
    let yPosition = 30;
    
    for (let i = 0; i < textLines.length; i++) {
      // Check if we need a new page
      if (yPosition > 280) {
        doc.addPage();
        currentPage++;
        yPosition = 20; // Reset Y position for new page
      }
      
      // Add the line
      doc.text(textLines[i], 20, yPosition);
      yPosition += 7; // Move to next line
    }
    
    // Add page numbers
    for (let i = 1; i <= currentPage; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${currentPage}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 10);
    }
    
    // Save the PDF
    doc.save(fileName);
  };

  return { generatePDF };
};

export default PDFGenerator;
