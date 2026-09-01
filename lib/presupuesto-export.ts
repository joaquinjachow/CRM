'use client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate, formatMoney, type Presupuesto } from './stock-data'

const BRAND_COLOR = [142, 27, 35] as const
const BRAND_LIGHT_COLOR = [250, 239, 239] as const
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const HORIZONTAL_MARGIN = 14

function cargarLogo(): Promise<string | null> {
  return fetch('/Logo.jpg')
    .then((response) => {
      if (!response.ok) throw new Error('No se pudo cargar el logo')
      return response.blob()
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(blob)
        }),
    )
    .catch(() => null)
}

function dibujarPie(doc: jsPDF, pagina: number) {
  doc.setDrawColor(225, 225, 225)
  doc.line(HORIZONTAL_MARGIN, 281, PAGE_WIDTH - HORIZONTAL_MARGIN, 281)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('Precios y disponibilidad sujetos a confirmación.', HORIZONTAL_MARGIN, 287)
  doc.text(`Página ${pagina}`, PAGE_WIDTH - HORIZONTAL_MARGIN, 287, { align: 'right' })
}

function dibujarEncabezadoContinuacion(doc: jsPDF, presupuesto: Presupuesto) {
  doc.setFillColor(...BRAND_COLOR)
  doc.roundedRect(HORIZONTAL_MARGIN, 14, PAGE_WIDTH - HORIZONTAL_MARGIN * 2, 11, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('PRESUPUESTO', HORIZONTAL_MARGIN + 4, 21)
  doc.text(presupuesto.id, PAGE_WIDTH - HORIZONTAL_MARGIN - 4, 21, { align: 'right' })
}

export async function exportarPresupuestoPDF(presupuesto: Presupuesto) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await cargarLogo()

  if (logo) {
    doc.addImage(logo, 'JPEG', HORIZONTAL_MARGIN, 12, PAGE_WIDTH - HORIZONTAL_MARGIN * 2, 37.7)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(...BRAND_COLOR)
    doc.text('Tajamar Molduras', HORIZONTAL_MARGIN, 30)
  }

  doc.setFillColor(...BRAND_COLOR)
  doc.roundedRect(HORIZONTAL_MARGIN, 58, PAGE_WIDTH - HORIZONTAL_MARGIN * 2, 17, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(255, 255, 255)
  doc.text('PRESUPUESTO', HORIZONTAL_MARGIN + 5, 68.5)
  doc.setFontSize(12)
  doc.text(presupuesto.id, PAGE_WIDTH - HORIZONTAL_MARGIN - 5, 68.5, { align: 'right' })

  doc.setFillColor(...BRAND_LIGHT_COLOR)
  doc.roundedRect(HORIZONTAL_MARGIN, 81, PAGE_WIDTH - HORIZONTAL_MARGIN * 2, 16, 2, 2, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('CLIENTE', HORIZONTAL_MARGIN + 5, 87)
  doc.text('FECHA DE EMISIÓN', 133, 87)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(40, 40, 40)
  doc.text(presupuesto.cliente, HORIZONTAL_MARGIN + 5, 93)
  doc.text(formatDate(presupuesto.fecha), 133, 93)

  autoTable(doc, {
    startY: 104,
    margin: { top: 34, right: HORIZONTAL_MARGIN, bottom: 24, left: HORIZONTAL_MARGIN },
    head: [['CÓD.', 'PRODUCTO', 'MEDIDAS', 'CANT.', 'PRECIO UNIT.', 'IMPORTE']],
    body: presupuesto.items.map((item) => [
      item.codigo,
      item.producto,
      item.medidas,
      formatMoney(item.cantidad),
      `$ ${formatMoney(item.precioLista)}`,
      `$ ${formatMoney(item.total)}`,
    ]),
    foot: [['', '', '', '', 'TOTAL', `$ ${formatMoney(presupuesto.total)}`]],
    theme: 'plain',
    styles: {
      cellPadding: 3,
      font: 'helvetica',
      fontSize: 9,
      lineColor: [230, 230, 230],
      lineWidth: 0.15,
      textColor: [48, 48, 48],
    },
    headStyles: {
      fillColor: [...BRAND_COLOR],
      fontStyle: 'bold',
      halign: 'left',
      textColor: [255, 255, 255],
    },
    footStyles: {
      fillColor: [...BRAND_LIGHT_COLOR],
      fontStyle: 'bold',
      halign: 'right',
      textColor: [...BRAND_COLOR],
    },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { cellWidth: 29 },
      3: { cellWidth: 17, halign: 'right' },
      4: { cellWidth: 33, halign: 'right' },
      5: { cellWidth: 38, halign: 'right' },
    },
    willDrawPage: (data) => {
      if (data.pageNumber > 1) dibujarEncabezadoContinuacion(doc, presupuesto)
    },
    didDrawPage: (data) => dibujarPie(doc, data.pageNumber),
  })

  doc.save(`presupuesto_${presupuesto.id}.pdf`)
}

export async function exportarPresupuestoExcel(presupuesto: Presupuesto) {
  const { default: ExcelJS } = await import('exceljs/dist/exceljs.min.js')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Tajamar Molduras'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet('Presupuesto', {
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
    views: [{ showGridLines: false }],
  })
  worksheet.properties.defaultRowHeight = 19
  worksheet.columns = [
    { key: 'codigo', width: 12 },
    { key: 'producto', width: 34 },
    { key: 'medidas', width: 19 },
    { key: 'cantidad', width: 13 },
    { key: 'precio', width: 19 },
    { key: 'importe', width: 20 },
  ]

  worksheet.mergeCells('C1:F1')
  worksheet.mergeCells('C2:F2')
  worksheet.getCell('C1').value = 'TAJAMAR MOLDURAS'
  worksheet.getCell('C1').font = { name: 'Arial', size: 19, bold: true, color: { argb: 'FF8E1B23' } }
  worksheet.getCell('C1').alignment = { vertical: 'middle', horizontal: 'right' }
  worksheet.getCell('C2').value = `PRESUPUESTO ${presupuesto.id}`
  worksheet.getCell('C2').font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF666666' } }
  worksheet.getCell('C2').alignment = { vertical: 'middle', horizontal: 'right' }
  worksheet.getRow(1).height = 27
  worksheet.getRow(2).height = 22
  worksheet.getRow(3).height = 19

  const logo = await cargarLogo()
  if (logo) {
    const logoId = workbook.addImage({ base64: logo, extension: 'jpeg' })
    worksheet.addImage(logoId, 'A1:B3')
  }

  worksheet.mergeCells('A5:A6')
  worksheet.mergeCells('B5:D6')
  worksheet.mergeCells('E5:E6')
  worksheet.mergeCells('F5:F6')
  worksheet.getCell('A5').value = 'CLIENTE'
  worksheet.getCell('B5').value = presupuesto.cliente
  worksheet.getCell('E5').value = 'FECHA'
  worksheet.getCell('F5').value = formatDate(presupuesto.fecha)

  for (const address of ['A5', 'E5']) {
    const cell = worksheet.getCell(address)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7E9E9' } }
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF5A171D' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  }
  for (const address of ['B5', 'F5']) {
    const cell = worksheet.getCell(address)
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF333333' } }
    cell.alignment = { vertical: 'middle', horizontal: address === 'F5' ? 'center' : 'left' }
  }
  for (const row of [5, 6]) {
    for (let column = 1; column <= 6; column += 1) {
      worksheet.getCell(row, column).border = {
        top: { style: 'thin', color: { argb: 'FFE4D6D6' } },
        left: { style: 'thin', color: { argb: 'FFE4D6D6' } },
        bottom: { style: 'thin', color: { argb: 'FFE4D6D6' } },
        right: { style: 'thin', color: { argb: 'FFE4D6D6' } },
      }
    }
  }

  const headers = ['Código', 'Producto', 'Medidas', 'Cantidad', 'Precio unitario', 'Importe']
  const headerRow = worksheet.getRow(8)
  headerRow.values = headers
  headerRow.height = 25
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8E1B23' } }
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF8E1B23' } },
      left: { style: 'thin', color: { argb: 'FF8E1B23' } },
      bottom: { style: 'thin', color: { argb: 'FF8E1B23' } },
      right: { style: 'thin', color: { argb: 'FF8E1B23' } },
    }
  })

  presupuesto.items.forEach((item, index) => {
    const row = worksheet.getRow(9 + index)
    row.values = [item.codigo, item.producto, item.medidas, item.cantidad, item.precioLista, item.total]
    row.eachCell((cell, column) => {
      cell.font = { name: 'Arial', size: 10, color: { argb: 'FF333333' } }
      cell.alignment = { vertical: 'middle', horizontal: column >= 4 ? 'right' : column === 1 ? 'center' : 'left' }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFFCF8F6' } }
      cell.border = { bottom: { style: 'hair', color: { argb: 'FFE6DEDA' } } }
    })
    row.getCell(4).numFmt = '#,##0'
    row.getCell(5).numFmt = '$ #,##0.00'
    row.getCell(6).numFmt = '$ #,##0.00'
  })

  const totalRowNumber = presupuesto.items.length + 9
  const totalRow = worksheet.getRow(totalRowNumber)
  totalRow.values = ['', '', '', '', 'TOTAL', presupuesto.total]
  totalRow.height = 25
  totalRow.eachCell((cell, column) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7E9E9' } }
    cell.font = { name: 'Arial', size: column >= 5 ? 12 : 10, bold: true, color: { argb: 'FF8E1B23' } }
    cell.alignment = { vertical: 'middle', horizontal: 'right' }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF8E1B23' } },
      bottom: { style: 'medium', color: { argb: 'FF8E1B23' } },
    }
  })
  totalRow.getCell(6).numFmt = '$ #,##0.00'

  const noteRow = totalRowNumber + 2
  worksheet.mergeCells(`A${noteRow}:F${noteRow}`)
  const noteCell = worksheet.getCell(`A${noteRow}`)
  noteCell.value = 'Precios y disponibilidad sujetos a confirmación.'
  noteCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF777777' } }
  noteCell.alignment = { horizontal: 'center', vertical: 'middle' }
  worksheet.getRow(noteRow).height = 21

  worksheet.autoFilter = { from: 'A8', to: `F${totalRowNumber - 1}` }
  worksheet.pageSetup.printArea = `A1:F${noteRow}`
  worksheet.headerFooter.oddFooter = '&CPrecios y disponibilidad sujetos a confirmación.  |  Página &P de &N'

  const data = await workbook.xlsx.writeBuffer()
  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `presupuesto_${presupuesto.id}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}