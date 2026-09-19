from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_BREAK
from docx.enum.style import WD_STYLE_TYPE

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'BACKEND_AND_DATABASE_GUIDE.md'
target = ROOT / 'CareBridge_Backend_Database_Guide.docx'

text = source.read_text(encoding='utf-8')
document = Document()
section = document.sections[0]
section.top_margin = Inches(0.7)
section.bottom_margin = Inches(0.7)
section.left_margin = Inches(0.8)
section.right_margin = Inches(0.8)

styles = document.styles
styles['Normal'].font.name = 'Aptos'
styles['Normal'].font.size = Pt(10.5)
for name, size in [('Title', 22), ('Heading 1', 16), ('Heading 2', 13), ('Heading 3', 11)]:
    styles[name].font.name = 'Aptos Display'
    styles[name].font.size = Pt(size)

if 'Code Block' not in styles:
    code_style = styles.add_style('Code Block', WD_STYLE_TYPE.PARAGRAPH)
else:
    code_style = styles['Code Block']
code_style.font.name = 'Consolas'
code_style.font.size = Pt(8.5)

lines = text.splitlines()
in_code = False
code_lines = []
for line in lines:
    if line.strip().startswith('```'):
        if in_code:
            paragraph = document.add_paragraph(style='Code Block')
            paragraph.paragraph_format.left_indent = Inches(0.2)
            paragraph.paragraph_format.space_after = Pt(6)
            paragraph.add_run('\n'.join(code_lines))
            code_lines = []
            in_code = False
        else:
            in_code = True
        continue
    if in_code:
        code_lines.append(line)
        continue

    stripped = line.strip()
    if not stripped:
        continue
    if stripped == '---':
        document.add_page_break()
        continue
    if stripped.startswith('# '):
        document.add_heading(stripped[2:].strip(), level=0)
    elif stripped.startswith('### '):
        document.add_heading(stripped[4:].strip(), level=3)
    elif stripped.startswith('## '):
        document.add_heading(stripped[3:].strip(), level=1)
    elif stripped.startswith('#### '):
        document.add_heading(stripped[5:].strip(), level=4)
    elif stripped.startswith('- '):
        document.add_paragraph(stripped[2:].strip(), style='List Bullet')
    elif stripped[:2].isdigit() and stripped[2:4] == '. ':
        document.add_paragraph(stripped[4:].strip(), style='List Number')
    else:
        paragraph = document.add_paragraph()
        paragraph.add_run(stripped)

# Add a compact footer with the source filename.
for section in document.sections:
    footer = section.footer.paragraphs[0]
    footer.alignment = 2
    footer.add_run('CareBridge Backend and Database Guide')

document.save(target)
print(target)
