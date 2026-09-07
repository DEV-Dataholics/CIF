import sys
from ftplib import FTP
ftp = FTP('ftp.dataholics.com.mx')
ftp.login('DEV_CIF@cif.dataholics.com.mx', 'T_EwJd3!bPxC')
ftp.set_pasv(True)
with open('add_columns.php', 'rb') as f:
    ftp.storbinary('STOR /add_columns.php', f)
ftp.quit()
