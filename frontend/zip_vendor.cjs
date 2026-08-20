const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream('c:\\Users\\luisc\\Documents\\Dataholics\\Dataholics Guidelines\\moderna\\dist\\vendor.zip');
const archive = new archiver.ZipArchive();

output.on('close', function() {
  console.log('✓ Compression completed. Bytes: ' + archive.pointer());
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Agregar directorio vendor local y forzar las barras diagonales estilo Unix '/'
archive.directory('c:\\Users\\luisc\\Documents\\Dataholics\\Dataholics Guidelines\\proyectos\\CIF\\todo_CIF_Final\\api\\vendor', 'vendor');

archive.finalize();
