from ftplib import FTP
import os
import re

ftp = FTP('ftp.dataholics.com.mx')
ftp.login('DEV_CIF@cif.dataholics.com.mx', 'T_EwJd3!bPxC')
ftp.set_pasv(True)

def upload(local, remote):
    try:
        with open(local, 'rb') as f:
            ftp.storbinary(f'STOR {remote}', f)
        print(f"Uploaded: {remote}")
    except Exception as e:
        print(f"Failed {local}: {e}")

dist_dir = r'C:\Users\luisc\Documents\Dataholics\CIF_Project\frontend\dist'
html_path = os.path.join(dist_dir, 'index.html')

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Subir primero los assets del bundle activo
assets = list(set(re.findall(r'/assets/([^"\' >]+)', html)))
for a in assets:
    p = os.path.join(dist_dir, 'assets', a)
    if os.path.exists(p):
        upload(p, f'/assets/{a}')

# Subir siempre el logo
logo_p = os.path.join(dist_dir, 'assets', 'LOGOCIF.png')
if os.path.exists(logo_p):
    upload(logo_p, '/assets/LOGOCIF.png')

# Finalmente subir index.html
upload(html_path, '/index.html')

ftp.quit()
print("Deploy frontend finalizado con exito.")
