from ftplib import FTP
ftp = FTP('ftp.dataholics.com.mx')
ftp.login('DEV_CIF@cif.dataholics.com.mx', 'T_EwJd3!bPxC')
ftp.set_pasv(True)
with open('remote_log2.txt', 'wb') as f:
    ftp.retrbinary('RETR /api/writable/logs/log-2026-08-25.log', f.write)
ftp.quit()
