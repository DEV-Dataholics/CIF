from ftplib import FTP
import os

ftp = FTP('ftp.dataholics.com.mx')
ftp.login('DEV_CIF@cif.dataholics.com.mx', 'T_EwJd3!bPxC')
ftp.set_pasv(True)

def upload(local, remote):
    try:
        with open(local, 'rb') as f:
            ftp.storbinary(f'STOR {remote}', f)
    except Exception as e:
        print(f"Failed {local}: {e}")

upload(r'C:\Users\luisc\Documents\Dataholics\CIF_Project\frontend\dist\index.html', '/index.html')

assets_dir = r'C:\Users\luisc\Documents\Dataholics\CIF_Project\frontend\dist\assets'
for f in os.listdir(assets_dir):
    upload(os.path.join(assets_dir, f), f'/assets/{f}')

ftp.quit()
