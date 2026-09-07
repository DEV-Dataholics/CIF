import sys
from ftplib import FTP
ftp = FTP('ftp.dataholics.com.mx')
ftp.login('DEV_CIF@cif.dataholics.com.mx', 'T_EwJd3!bPxC')
ftp.set_pasv(True)

def upload(local, remote):
    with open(local, 'rb') as f:
        ftp.storbinary(f'STOR {remote}', f)

if len(sys.argv) > 2:
    upload(sys.argv[1], sys.argv[2])
else:
    print("Usage: python upload_test.py <local> <remote>")
ftp.quit()
