import sys
try:
    import pypdf
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
    import pypdf

reader = pypdf.PdfReader('WEBSITE CONTENT/Qimra_Creation_Website_Content_Full.pdf')
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

with open('WEBSITE CONTENT/extracted_text.txt', 'w', encoding='utf-8') as f:
    f.write(text)
print("Extracted to extracted_text.txt")
