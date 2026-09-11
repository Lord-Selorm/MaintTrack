const fs = require('fs');
const path = 'routes/reports.js';
let text = fs.readFileSync(path, 'utf8');
if (!text.includes('const makeParagraph')) {
  text = text.replace(
    "const { Document, Packer, Paragraph, Table, TableRow, TableCell, BorderStyle, WidthType, HeadingLevel, TextRun, VerticalAlign, AlignmentType } = require('docx');\n",
    "const { Document, Packer, Paragraph, Table, TableRow, TableCell, BorderStyle, WidthType, HeadingLevel, TextRun, VerticalAlign, AlignmentType } = require('docx');\n\nconst makeParagraph = (textOrOptions, options = {}) => {\n  if (typeof textOrOptions === 'string') {\n    return new Paragraph({ text: textOrOptions, ...options });\n  }\n  return new Paragraph(textOrOptions);\n};\n"
  );
}
text = text.replace(/new Paragraph\(/g, 'makeParagraph(');
fs.writeFileSync(path, text);
