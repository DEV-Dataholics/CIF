from ftplib import FTP
import os

ftp = FTP('ftp.dataholics.com.mx')
ftp.login('DEV_CIF@cif.dataholics.com.mx', 'T_EwJd3!bPxC')
ftp.set_pasv(True)

def upload(local, remote):
    try:
        with open(local, 'rb') as f:
            ftp.storbinary(f'STOR {remote}', f)
        print(f"Uploaded {local} to {remote}")
    except Exception as e:
        print(f"Failed {local}: {e}")

upload(r'C:\Users\luisc\Documents\Dataholics\CIF_Project\backend\api\public\read_ci_log_raw.php', '/api/read_ci_log_raw.php')
upload(r'C:\Users\luisc\Documents\Dataholics\CIF_Project\backend\api\app\Controllers\PreciosController.php', '/api/app/Controllers/PreciosController.php')
upload(r'C:\Users\luisc\Documents\Dataholics\CIF_Project\frontend\dist\index.html', '/index.html')
# JS bundle might have a different hash, let's find it
for f in os.listdir(r'C:\Users\luisc\Documents\Dataholics\CIF_Project\frontend\dist\assets'):
    if f.endswith('.js'):
        upload(os.path.join(r'C:\Users\luisc\Documents\Dataholics\CIF_Project\frontend\dist\assets', f), f'/assets/{f}')

ftp.quit()
