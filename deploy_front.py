from ftplib import FTP
import os

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
assets_dir = os.path.join(dist_dir, 'assets')
html_path = os.path.join(dist_dir, 'index.html')

# Subir todos los assets limpios generados por el build
if os.path.exists(assets_dir):
    for f in os.listdir(assets_dir):
        p = os.path.join(assets_dir, f)
        if os.path.isfile(p):
            upload(p, f'/assets/{f}')

# Subir cualquier archivo estatico en la raiz de dist (favicon, icons, etc.)
for f in os.listdir(dist_dir):
    if f != 'assets' and f != 'index.html':
        p = os.path.join(dist_dir, f)
        if os.path.isfile(p):
            upload(p, f'/{f}')

# Finalmente subir index.html al ultimo
upload(html_path, '/index.html')

ftp.quit()
print("Deploy frontend finalizado con exito.")
