import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Enrollment } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates an enrollment number from a numeric row id and student type.
 * Format: ENR-{5-digit zero-padded sequence}-MN-{type}
 *   type: 0 = regular, 1 = irregular
 * Example: ENR-00042-MN-0  (regular)
 *          ENR-00042-MN-1  (irregular)
 */
export function generateEnrNumber(id: number, studentType: "regular" | "irregular"): string {
  const seq  = String(id).padStart(5, "0")
  const flag = studentType === "regular" ? "0" : "1"
  return `ENR-${seq}-MN-${flag}`
}

/**
 * Generates a print-ready HTML string for an enrollment form / slip.
 * Used by both the admin panel and the student's download button.
 */
export function generateEnrollmentFormHTML(e: Enrollment): string {
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const statusColor =
    e.status === "confirmed" ? "#15803d" :
    e.status === "rejected"  ? "#991b1b" :
                               "#854d0e"
  const statusLabel =
    e.status === "confirmed" ? "APPROVED" :
    e.status === "rejected"  ? "REJECTED" :
                               "PENDING APPROVAL"

  const subjectRows = e.subjects.map((s, i) =>
    `<tr>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${i + 1}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-family:monospace">${esc(s.code)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb">${esc(s.name)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${s.units}</td>
    </tr>`
  ).join("")

  const totalUnits = e.subjects.reduce((sum, s) => sum + s.units, 0)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Enrollment Form — ${esc(e.enr_number)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,"Segoe UI",sans-serif;font-size:12px;color:#111;background:#fff;padding:32px 40px}
    .header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #7a1515;padding-bottom:14px;margin-bottom:20px}
    .header-text h1{font-size:20px;font-weight:800;color:#7a1515;letter-spacing:0.05em}
    .header-text p{font-size:11px;color:#6b7280;margin-top:2px}
    .status-stamp{margin-left:auto;border:3px solid ${statusColor};color:${statusColor};font-size:13px;font-weight:800;letter-spacing:0.12em;padding:6px 16px;border-radius:6px}
    .section{margin-bottom:18px}
    .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-bottom:8px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px}
    .field label{font-size:10px;font-weight:600;text-transform:uppercase;color:#9ca3af;display:block;margin-bottom:3px}
    .field span{font-size:13px;color:#111;font-weight:500}
    .field.wide{grid-column:1/-1}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#7a1515;color:#fff;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.07em}
    th:nth-child(1),th:nth-child(4){text-align:center}
    .totals-row td{padding:8px 10px;font-weight:700;background:#f9fafb}
    .footer{margin-top:28px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px}
    .sig-block{border-top:1px solid #374151;padding-top:6px;font-size:10px;color:#6b7280;text-align:center}
    .sig-block strong{display:block;font-size:11px;font-weight:700;color:#111;margin-bottom:2px}
    .notice{margin-top:20px;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;line-height:1.6}
    @media print{
      button{display:none!important}
      body{padding:16px 20px}
      @page{size:A4;margin:12mm}
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-text">
      <h1>PUPILA</h1>
      <p>Polytechnic University — Student Enrollment Form</p>
      <p style="margin-top:4px;font-family:monospace;font-size:11px;color:#374151">${esc(e.enr_number)}</p>
    </div>
    <div class="status-stamp">${statusLabel}</div>
  </div>

  <div class="section">
    <div class="section-title">Student Information</div>
    <div class="grid">
      <div class="field wide">
        <label>Full Name</label>
        <span>${esc(e.full_name)}</span>
      </div>
      <div class="field">
        <label>Student ID</label>
        <span>${esc(e.student_id)}</span>
      </div>
      <div class="field">
        <label>Student Type</label>
        <span style="text-transform:capitalize">${e.student_type}</span>
      </div>
      <div class="field">
        <label>Year Level</label>
        <span>${esc(e.year_level)}</span>
      </div>
      <div class="field">
        <label>Program</label>
        <span>${esc(e.program)}</span>
      </div>
      <div class="field">
        <label>Semester</label>
        <span>${esc(e.semester)}</span>
      </div>
      <div class="field">
        <label>Academic Year</label>
        <span>${esc(e.academic_year)}</span>
      </div>
      <div class="field">
        <label>Status</label>
        <span style="color:${statusColor};font-weight:700;text-transform:uppercase">${statusLabel}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Enrolled Subjects</div>
    <table>
      <thead>
        <tr>
          <th style="width:36px">#</th>
          <th style="width:90px">Code</th>
          <th>Subject Name</th>
          <th style="width:60px">Units</th>
        </tr>
      </thead>
      <tbody>
        ${subjectRows}
        <tr class="totals-row">
          <td colspan="3" style="padding:8px 10px;text-align:right;font-weight:700">Total Units</td>
          <td style="padding:8px 10px;text-align:center;font-weight:700">${totalUnits}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div class="sig-block">
      <strong>Student Signature</strong>
      Date: _______________
    </div>
    <div class="sig-block">
      <strong>Registrar / Dept. Head</strong>
      Date: _______________
    </div>
    <div class="sig-block">
      <strong>Noted by</strong>
      Date: _______________
    </div>
  </div>

  <div class="notice">
    This form is computer-generated via PUPILA. Present this form along with your valid school ID and required documents at the Registrar's Office to complete the re-admission / enrollment process. This form is only valid for AY ${esc(e.academic_year)}, ${esc(e.semester)}.
  </div>

  <script>window.onload = () => { window.print() }<\/script>
</body>
</html>`
}
