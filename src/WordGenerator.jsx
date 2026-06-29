import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

const WordGenerator = ({ content, fileName = 'document.docx', title }) => {
  const generateWord = () => {
    // Clean markdown formatting from content
    let cleanContent = content
      // Remove headers (# Header)
      .replace(/#+\s+/g, '')
      // Remove bold (**text**)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Remove italic (*text*)
      .replace(/\*([^*]+)\*/g, '$1')
      // Remove code blocks (```code```)
      .replace(/```[\\s\\S]*?```/g, '')
      // Remove inline code (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // Remove blockquotes (> text)
      .replace(/^>\s+/gm, '')
      // Remove horizontal rules (---, ***, ___)
      .replace(/^(---|\*\*\*|___)$/gm, '');


    //Make the heading style bold
    // Extract title from filename

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: `${title}`,
              heading: HeadingLevel.HEADING_1,
            }),
            ...cleanContent.split('\n').map(line => {
              // Check if line is a heading (starts with #)
              if (/^#+\s+/.test(line)) {
                const headingText = line.replace(/^#+\s+/, '');
                const headingLevel = (line.match(/^#+/)[0].length <= 6) 
                  ? line.match(/^#+/)[0].length 
                  : 6;
                
                return new Paragraph({
                  text: headingText,
                  heading: headingLevel,
                });
              }
              
              // Handle bullet points
              if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return new Paragraph({
                  text: line.trim().substring(2),
                  bullet: {
                    level: 0
                  }
                });
              }
              
              // Regular paragraph
              return new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    break: 1
                  })
                ]
              });
            })
          ]
        }
      ]
    });

    // Generate and save document
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, fileName);
    });
  };

  return { generateWord };
};

export default WordGenerator;
