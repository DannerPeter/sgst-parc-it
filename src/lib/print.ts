// ============================================================
// PRINT.TS - SGST GESTION PARC INFORMATIQUE
// Utilitaire impression PDF - aperçu avant impression
// ============================================================

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function printToPDF(elementId: string, filename: string = 'document') {
  const element = document.getElementById(elementId)
  if (!element) return

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 10

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
    pdf.save(`${filename}.pdf`)
  } catch (err) {
    console.error('Erreur PDF:', err)
  }
}

export function previewPrint(elementId: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SGST — Aperçu impression</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, sans-serif; padding: 20px; color: #000; background: #fff; }
          .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .print-header h1 { font-size: 20px; font-weight: bold; }
          .print-header p { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f1f5f9; padding: 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600; }
          td { padding: 8px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
          .badge-green { background: #dcfce7; color: #166534; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .badge-blue { background: #dbeafe; color: #1e40af; }
          .badge-yellow { background: #fef9c3; color: #854d0e; }
          .badge-slate { background: #f1f5f9; color: #475569; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .field { margin-bottom: 8px; }
          .field-label { font-size: 10px; color: #94a3b8; margin-bottom: 2px; }
          .field-value { font-size: 12px; font-weight: 500; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div>
            <h1>SGST — Gestion du Parc Informatique</h1>
            <p>Imprimé le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onclick="window.print()" style="padding:8px 16px;background:#0f172a;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;">
            🖨️ Imprimer
          </button>
        </div>
        ${element.innerHTML}
        <div class="footer">
          <span>SGST © ${new Date().getFullYear()}</span>
          <span>Document généré automatiquement</span>
        </div>
      </body>
    </html>
  `)
  printWindow.document.close()
}
