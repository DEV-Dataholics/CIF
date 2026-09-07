
import re

with open("frontend/src/pages/reportes/ReportesPrefacturacion.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# We need to replace the entire exportarExcel function.
pattern = r"const exportarExcel = \(\) => \{.*?(?=const handleColChange = \(\(next\))"
replacement = """const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    const columnsToExport = ALL_COLUMNS.filter(c => visibleColumns.includes(c.key));
    const excelHeaders = columnsToExport.map(c => c.label);

    wsData.push(["CIF - REPORTE DE PRE-FACTURACIÓN Y MOVIMIENTOS"]);
    wsData.push([`Cliente: ${filtrosAplicados.cli || "TODOS"}`]);
    wsData.push([`Periodo: ${filtrosAplicados.fi} al ${filtrosAplicados.ff}`]);
    if (filtrosAplicados.filtroOperador) wsData.push([`Operador: ${filtrosAplicados.filtroOperador}`]);
    if (filtrosAplicados.filtroTipoMov) wsData.push([`Tipo Movimiento: ${filtrosAplicados.filtroTipoMov}`]);
    wsData.push([`MONTO TOTAL ACUMULADO: ${formatUSD(resumen.granTotalUSD)} USD (${formatMXN(resumen.granTotalMXN)} MXN)`]);
    wsData.push([]);

    tiposOrdenados.forEach(tipo => {
      wsData.push([`${tipo}`]);
      wsData.push(excelHeaders);

      grupos[tipo].forEach(m => {
        const rowData = columnsToExport.map(col => {
          if (col.key === "valeFisico") return m.valeFisico || m.id || "";
          return m[col.key] !== undefined && m[col.key] !== null ? m[col.key] : "";
        });
        wsData.push(rowData);
      });

      const subtotal = grupos[tipo].reduce((acc, m) => acc + (m.costo || 0), 0);
      const costoIdx = columnsToExport.findIndex(c => c.key === "costo");
      const subtotalRow = new Array(columnsToExport.length).fill("");
      subtotalRow[0] = `Subtotal ${tipo}`;
      if (costoIdx !== -1) {
        subtotalRow[costoIdx] = subtotal;
      }
      wsData.push(subtotalRow);
      wsData.push([]);
    });

    wsData.push([]);
    wsData.push(["RESUMEN DE TOTALES"]);
    wsData.push(["Tipo Movimiento", "Cantidad Viajes", "Precio Unitario (USD)", "Precio Total (USD)", "Precio Total (MXN)"]);
    resumen.filas.forEach(r => {
      wsData.push([r.tipoMovimiento, r.cantidad, r.precioUnitario, r.totalUSD, r.totalUSD * tipoCambio]);
    });
    wsData.push(["TOTALES GENERALES", resumen.granTotalViajes, "", resumen.granTotalUSD, resumen.granTotalMXN]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Pre-Facturación");
    XLSX.writeFile(wb, `CIF_Reporte_PreFacturacion_${cli || "TODOS"}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  """

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("frontend/src/pages/reportes/ReportesPrefacturacion.jsx", "w", encoding="utf-8") as f:
    f.write(new_content)

