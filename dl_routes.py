from ftplib import FTP
ftp = FTP('ftp.dataholics.com.mx')
ftp.login('DEV_CIF@cif.dataholics.com.mx', 'T_EwJd3!bPxC')
ftp.set_pasv(True)
with open('Routes_remote.php', 'wb') as f:
    ftp.retrbinary('RETR /api/app/Config/Routes.php', f.write)
ftp.quit()
