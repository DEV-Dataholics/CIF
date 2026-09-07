from ftplib import FTP

ftp = FTP('ftp.dataholics.com.mx')
ftp.login('DEV_CIF@cif.dataholics.com.mx', 'T_EwJd3!bPxC')
ftp.set_pasv(True)

def upload(local, remote):
    try:
        with open(local, 'rb') as f:
            ftp.storbinary(f'STOR {remote}', f)
        print(f"OK: {remote}")
    except Exception as e:
        print(f"FAIL {remote}: {e}")

upload(r'C:\Users\luisc\Documents\Dataholics\CIF_Project\backend\api\app\Controllers\OperadorController.php', '/api/app/Controllers/OperadorController.php')
upload(r'C:\Users\luisc\Documents\Dataholics\CIF_Project\backend\api\app\Config\Routes.php', '/api/app/Config/Routes.php')

ftp.quit()
print("Done.")
