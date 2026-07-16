export const useReportRenderer = () => {
  const renderWidgetHTML = (w: any, reportData: any, isPreview: boolean = false) => {
    const p = w.props || {}
    const esc = (str: any) => str ? String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''
    
    // For Preview Mode (Visual Builder)
    const SCHOOL = {
      name: "TK TELADAN BANGSA",
      npsn: "10293847",
      address: "Jl. Pendidikan No. 123, Jakarta",
      semester: "Ganjil",
      year: "2025/2026"
    }
    const s = {
      name: "Budi Santoso",
      kelas: "Kelompok B (Matahari)",
      nis: "2324001",
      nisn: "0182736455",
      wali: "Ibu Guru SPd."
    }
    const mockVal = (name: string, scale: string) => {
      const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
      if (scale === "num") return 65 + (h % 36)
      const sArr: any = {
        "BB/MB/BSH/BSB": ["MB", "BSH", "BSB"],
        "B/C/K": ["B", "C", "B"],
        "Jayyid/Maqbul": ["Jayyid", "Jayyid Jiddan", "Maqbul"]
      }
      const arr = sArr[scale] || ["BSH"]
      return arr[h % arr.length]
    }

    // For Real Data Mode
    const realSchool = reportData?.school || {}
    const realStudent = reportData?.student || {}
    const realReport = reportData?.report || {}
    const assessments = reportData?.assessments || []

    const getName = () => isPreview ? s.name : realStudent.full_name || ''
    const getKelas = () => isPreview ? s.kelas : realStudent.class_name || ''
    const getNis = () => isPreview ? s.nis : realStudent.student_number || '-'
    const getNisn = () => isPreview ? s.nisn : realStudent.national_student_number || '-'
    const getWali = () => isPreview ? s.wali : realStudent.homeroom_teacher_name || ''
    const getSchoolName = () => isPreview ? SCHOOL.name : realStudent.school_name || ''
    const getSchoolNpsn = () => isPreview ? SCHOOL.npsn : realStudent.school_npsn || ''
    const getSchoolAddress = () => isPreview ? SCHOOL.address : realStudent.school_address || ''
    const getSemester = () => isPreview ? SCHOOL.semester : (realReport.semester === 'odd' ? 'Ganjil' : 'Genap')
    const getYear = () => isPreview ? SCHOOL.year : realReport.academic_year_name || ''

    const getGrade = (elementNameOrRefId: string, scale: string) => {
      if (isPreview) return mockVal(elementNameOrRefId, scale)
      const asm = assessments.find((a: any) =>
        a.element_id === elementNameOrRefId ||
        a.element_name === elementNameOrRefId
      )
      if (!asm) return '-'
      return asm.letter_grade || asm.predicate || '-'
    }
    const getNarrative = (elementNameOrRefId: string) => {
      if (isPreview) return 'Ananda menunjukkan perkembangan yang baik pada aspek ini.'
      const asm = assessments.find((a: any) =>
        a.element_id === elementNameOrRefId ||
        a.element_name === elementNameOrRefId
      )
      if (!asm) return 'Belum ada narasi pencapaian.'
      return asm.narrative || 'Belum ada narasi pencapaian.'
    }

    const getRawHTML = () => {
      switch (w.type) {
      case "header_school": {
        const logoUrl = (!isPreview && (reportData?.school?.logo || reportData?.school?.logo_url)) ? (reportData.school.logo || reportData.school.logo_url) : null;
        const logoHtml = logoUrl 
          ? `<div style="flex:none; display:flex; justify-content:center; align-items:center; width: 75px; height: 75px;"><img src="${logoUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" /></div>` 
          : `<div class="badge">LOGO</div>`;
          
        const photoUrl = (!isPreview && reportData?.school?.logo_dinas) ? reportData.school.logo_dinas : null;
        const photoHtml = photoUrl 
          ? `<div style="flex:none; display:flex; justify-content:center; align-items:center; width: 75px; height: 75px;"><img src="${photoUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" /></div>` 
          : `<div class="badge" style="border-style:dashed;">FOTO</div>`;
        
        return `<div class="rp-header pad" style="align-items:center;">
          ${logoHtml}
          <div class="tt">
            <div class="l1">LAPORAN PERKEMBANGAN ANAK DIDIK</div>
            <div class="l2">${esc(getSchoolName())}</div>
            <div class="l3">${p.showAddress ? esc(getSchoolAddress()) : ""} ${p.showNpsn ? "· NPSN " + getSchoolNpsn() : ""}</div>
          </div>
          ${photoHtml}
        </div>`
      }
      case "student_identity": 
        return `<div class="rp-ident pad">
          <div><span class="k">Nama Peserta Didik</span>: <b>&nbsp;${esc(getName())}</b></div>
          <div><span class="k">Kelompok / Kelas</span>: &nbsp;${esc(getKelas())}</div>
          <div><span class="k">NIS</span>: &nbsp;${esc(getNis())}</div>
          ${p.showNisn ? `<div><span class="k">NISN</span>: &nbsp;${esc(getNisn())}</div>` : ``}
          <div><span class="k">Semester / TA</span>: &nbsp;${esc(getSemester())} · ${esc(getYear())}</div>
          ${p.showWali ? `<div><span class="k">Guru Kelas</span>: &nbsp;${esc(getWali())}</div>` : ``}
        </div>`
      case "student_photo": {
        const photoUrl = (!isPreview && (reportData?.student?.photo || reportData?.student?.photo_url)) ? (reportData.student.photo || reportData.student.photo_url) : null;
        if (photoUrl) {
          return `<div class="pad" style="display:flex;justify-content:flex-end"><div class="rp-photo" style="border:none;background:transparent;"><img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" /></div></div>`
        }
        return `<div class="pad" style="display:flex;justify-content:flex-end"><div class="rp-photo">PAS FOTO<br>3 × 4</div></div>`
      }
      case "section_block": 
        return `<div class="rp-sec-title pad">${esc(p.title || "SEKSI")}</div>`
      case "column_layout": {
        const slots = w.slots || Array.from({ length: p.cols || 2 }, () => [])
        const renderedCols = slots.map((slot: any[]) => {
          return `<div>${slot.map((cw: any) => renderWidgetHTML(cw, reportData, isPreview)).join("")}</div>`
        })
        return `<div class="rp-cols pad" style="grid-template-columns:repeat(${p.cols || 2},1fr)">${renderedCols.join("")}</div>`
      }
      case "page_break": 
        return `<div class="rp-pb"></div>`
      case "desc_table": {
        const cols = (p.cols || []).filter((c: any) => (c.on === true || c.visible === true));
        // Preserve ref_id for direct element_id lookup in assessments
        let items = (p.items || []).map((it: any) => typeof it === "string"
          ? { name: it, label: it, ref_id: it, subs: [] }
          : { name: it.name, label: it.label || it.name, ref_id: it.ref_id, subs: (it.subs || []).map((s: any) => typeof s === 'string' ? { label: s, ref_id: s } : s) });
        
        if (p.hasSub === false) {
          const flat: any[] = [];
          items.forEach((it: any) => {
            if (it.subs.length) it.subs.forEach((sub: any) => flat.push({ text: sub.label || sub, bind: sub.ref_id || it.ref_id || it.name || (sub.label || sub) }));
            else flat.push({ text: it.label || it.name, bind: it.ref_id || it.name });
          });
          return `<div class="pad"><table><tr>${cols.map((c: any) => `<th${(c.k || c.key) === "no" ? ' style="width:34px"' : (c.k || c.key) === "val" ? ' style="width:90px"' : ''}>${esc(c.label)}${(c.k || c.key) === "val" ? ` (${esc(p.scale)})` : ``}</th>`).join("")}</tr>
           ${flat.map((f, i) => `<tr>${cols.map((c: any) => (c.k || c.key) === "no" ? `<td>${i + 1}.</td>` : (c.k || c.key) === "name" ? `<td>${esc(f.text)}</td>` : `<td style="text-align:center;font-weight:600;vertical-align:middle">${getGrade(f.bind, p.scale)}</td>`).join("")}</tr>`).join("")}</table></div>`;
        }
        
        // Use ref_id for narasi lookup if available
        const narRow = (it: any) => { 
          const key = it.ref_id || it.name;
          return `<tr>${cols[0] && (cols[0].k || cols[0].key) === "no" ? '<td></td>' : ''}<td colspan="${cols.length - (cols[0] && (cols[0].k || cols[0].key) === "no" ? 1 : 0)}"><b style="font-family:'Plus Jakarta Sans';font-size:9.5px">Narasi&nbsp;|</b> ${esc(getNarrative(key))}</td></tr>`;
        };
        
        return `<div class="pad"><table><tr>${cols.map((c: any) => `<th${(c.k || c.key) === "no" ? ' style="width:34px"' : (c.k || c.key) === "val" ? ' style="width:90px"' : ''}>${esc(c.label)}${(c.k || c.key) === "val" && !p.showNarasi ? ` (${esc(p.scale)})` : ``}</th>`).join("")}</tr>
         ${items.map((it: any, ei: number) => {
          const disp = it.label || it.name;
          // Use ref_id (= element_id in DB) for grade lookup, fallback to name
          const itKey = it.ref_id || it.name;
          if (!it.subs.length) {
            let r = `<tr>${cols.map((c: any) => (c.k || c.key) === "no" ? `<td style="font-weight:700">${ei + 1}.</td>` : (c.k || c.key) === "name" ? `<td><b>${esc(disp)}</b></td>` : `<td style="text-align:center;font-weight:600">${getGrade(itKey, p.scale)}</td>`).join("")}</tr>`;
            if (p.showNarasi) r += narRow(it); return r;
          }
          let rows = `<tr>${cols.map((c: any) => (c.k || c.key) === "no" ? `<td style="font-weight:700">${ei + 1}.</td>` : (c.k || c.key) === "name" ? `<td style="font-weight:700">${esc(disp)}</td>` : `<td style="text-align:center;font-weight:700">${p.perSub ? "" : getGrade(itKey, p.scale)}</td>`).join("")}</tr>`;
          rows += it.subs.map((sub: any, si: number) => {
            // For each sub item, use sub.ref_id (= element_id) for grade lookup
            const subKey = sub.ref_id || (it.name ? it.name + (sub.label || sub) : (sub.label || sub));
            return `<tr>${cols.map((c: any) => (c.k || c.key) === "no" ? `<td></td>` : (c.k || c.key) === "name" ? `<td style="padding-left:16px">${si + 1}. ${esc(sub.label || sub)}</td>` : `<td style="text-align:center;font-weight:600">${p.perSub ? getGrade(subKey, p.scale) : ""}</td>`).join("")}</tr>`;
          }).join("");
          if (p.showNarasi) rows += narRow(it); return rows;
        }).join("")}</table></div>`;
      }
      case "grade_table": {
        // Real data: reportData.finalGrades = [{ subject_name, kkm, final_score, predicate, description }]
        const kkm = p.kkm || 75
        const cols = (p.cols || []).filter((c: any) => c.on !== false && c.visible !== false)
        const subjects: any[] = (p.items || []).filter((it: any) => {
          // Support both string items and object items with hidden flag
          return typeof it === 'string' || !it.hidden
        })
        const sortBelowKkm = p.sortBelowKkm === true

        // Get real grade data or generate preview data
        const getSubjectGrade = (subjectName: string) => {
          if (isPreview) {
            const h = [...subjectName].reduce((a, c) => a + c.charCodeAt(0), 0)
            const score = 65 + (h % 36)
            const pred = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'D'
            return { score, pred, desc: `Ananda menunjukkan pemahaman yang sangat matang dalam kompetensi ini, terutama terkait penerapan konsep dasar.`, kkm }
          }
          const fg = (reportData?.finalGrades || []).find((g: any) =>
            g.subject_name?.toLowerCase() === subjectName?.toLowerCase() ||
            g.subject_code?.toLowerCase() === subjectName?.toLowerCase()
          )
          return fg ? {
            score: fg.final_score ?? fg.score ?? '-',
            pred: fg.predicate || '-',
            desc: fg.achievement_description || fg.description || fg.narrative || '-',
            kkm: fg.kkm || kkm
          } : { score: '-', pred: '-', desc: '-', kkm }
        }

        let rows = subjects
        if (sortBelowKkm) {
          rows = [...subjects].sort((a: any, b: any) => {
            const ga = getSubjectGrade(a.label || a.name || a)
            const gb = getSubjectGrade(b.label || b.name || b)
            const aBelow = typeof ga.score === 'number' && ga.score < ga.kkm ? 1 : 0
            const bBelow = typeof gb.score === 'number' && gb.score < gb.kkm ? 1 : 0
            return bBelow - aBelow
          })
        }

        const defaultCols = [
          { k: 'no', label: 'No' },
          { k: 'name', label: 'Mata Pelajaran' },
          { k: 'kkm', label: 'KKM' },
          { k: 'score', label: 'Nilai Akhir' },
          { k: 'pred', label: 'Predikat' },
          { k: 'desc', label: 'Deskripsi Capaian Kompetensi' }
        ]
        const activeCols = cols.length ? cols : defaultCols

        const thStyle = (k: string) => {
          if (k === 'no') return 'width:30px;text-align:center'
          if (k === 'kkm' || k === 'score' || k === 'val' || k === 'pred') return 'width:52px;text-align:center'
          if (k === 'name') return 'width:140px'
          return ''
        }

        return `<div class="pad"><table>
          <tr>${activeCols.map((c: any) => `<th style="${thStyle(c.k || c.key)}">${esc(c.label)}</th>`).join('')}</tr>
          ${rows.map((item: any, i: number) => {
            const subName = item.label || item.name || item
            const g = getSubjectGrade(subName)
            const isBelowKkm = typeof g.score === 'number' && g.score < g.kkm
            const scoreStyle = isBelowKkm
              ? 'text-align:center;font-weight:700;color:#dc2626;background:#fef2f2;-webkit-print-color-adjust:exact;print-color-adjust:exact'
              : 'text-align:center;font-weight:700'
            return `<tr>${activeCols.map((c: any) => {
              const k = c.k || c.key
              if (k === 'no') return `<td style="text-align:center">${i + 1}</td>`
              if (k === 'name') return `<td><b>${esc(subName)}</b></td>`
              if (k === 'kkm') return `<td style="text-align:center">${esc(g.kkm)}</td>`
              if (k === 'score' || k === 'val') return `<td style="${scoreStyle}">${esc(g.score)}</td>`
              if (k === 'pred') return `<td style="text-align:center;font-weight:600">${esc(g.pred)}</td>`
              if (k === 'desc' || k === 'description') return `<td style="font-size:9.5px;line-height:1.4">${esc(g.desc)}</td>`
              return `<td style="text-align:center">${esc((g as any)[k] || '-')}</td>`
            }).join('')}</tr>`
          }).join('')}
        </table></div>`
      }
      case "subject_narrative": 
        return `<div class="pad" style="display:grid;gap:7px">${(p.items || []).map((it: any) => `<div class="rp-narr"><div class="nt">${esc(it.label || it.name || it)}</div>${esc(getNarrative(it.name || it))}</div>`).join("")}</div>`
      case "extracurricular": {
        const cols = (p.cols || []).filter((c: any) => c.on !== false && c.visible !== false)
        const rawItems = p.items || []
        let items = rawItems.filter((it: any) => typeof it === 'string' || !it.hidden)
        
        if (isPreview && rawItems.length === 0) {
          items = ['Pramuka Prasiaga', 'Seni Lukis']
        } else if (!isPreview && items.length === 0 && reportData?.extracurriculars?.length) {
          items = reportData.extracurriculars.map((e: any) => e.name || e.extracurricular_name || 'Ekskul')
        }
        
        const defaultCols = [
          { k: 'no', label: 'No' },
          { k: 'name', label: 'Ekstrakurikuler' },
          { k: 'val', label: 'Nilai' },
          { k: 'note', label: 'Keterangan' }
        ]
        const activeCols = cols.length ? cols : defaultCols
        
        const getEkskulData = (name: string) => {
          if (isPreview) {
            return { val: 'A', note: `Sangat aktif dan antusias dalam mengikuti kegiatan ${name}, serta mampu menerapkannya dengan baik.` }
          }
          const real = (reportData?.extracurriculars || []).find((e: any) => e.name?.toLowerCase() === name.toLowerCase() || e.extracurricular_name?.toLowerCase() === name.toLowerCase())
          return real ? { val: real.grade || real.score || '-', note: real.description || real.narrative || '-' } : { val: '-', note: '-' }
        }

        const thStyle = (k: string) => {
          if (k === 'no') return 'width:30px;text-align:center'
          if (k === 'val' || k === 'score') return 'width:60px;text-align:center'
          if (k === 'name') return 'width:160px'
          return ''
        }

        return `<div class="pad"><table>
          <tr>${activeCols.map((c: any) => `<th style="${thStyle(c.k || c.key)}">${esc(c.label)}</th>`).join('')}</tr>
          ${items.map((item: any, i: number) => {
            const name = item.label || item.name || item
            const d = getEkskulData(name)
            return `<tr>${activeCols.map((c: any) => {
              const k = c.k || c.key
              if (k === 'no') return `<td style="text-align:center;font-weight:700">${i + 1}</td>`
              if (k === 'name') return `<td><b>${esc(name)}</b></td>`
              if (k === 'val' || k === 'score') return `<td style="text-align:center;font-weight:700">${esc(d.val)}</td>`
              if (k === 'note' || k === 'desc') return `<td style="font-size:9.5px;line-height:1.4">${esc(d.note)}</td>`
              return `<td style="text-align:center">${esc((d as any)[k] || '-')}</td>`
            }).join('')}</tr>`
          }).join('')}
        </table></div>`
      }
      case "p5_assessment": 
        return `<div class="pad"><div style="border:1px dashed #bbb;padding:10px;text-align:center;color:#999;font-size:9.5px">Simulasi Penilaian P5</div></div>`
      case "homeroom_notes": {
        const title = p.title || 'CATATAN WALI KELAS';
        const notes = isPreview ? "Ananda menunjukkan perkembangan yang sangat baik dalam bersosialisasi dan selalu semangat dalam mengikuti setiap kegiatan." : (reportData?.report?.homeroom_notes || "Belum ada catatan wali kelas.");
        return `<div class="pad"><div style="border:1px solid #ccc;border-radius:4px;padding:12px;min-height:70px;background:#fcfcfc">
          <div style="font-weight:700;font-size:10.5px;margin-bottom:8px;color:#333">${esc(title)}</div>
          <div style="font-size:9.5px;line-height:1.5;color:#555;font-style:italic">${esc(notes)}</div>
        </div></div>`
      }
      case "attendance": {
        let s = 3, i = 2, a = 0;
        if (!isPreview && reportData?.attendance) {
          s = reportData.attendance.sick || 0;
          i = reportData.attendance.leave || 0;
          a = reportData.attendance.absent || 0;
        }
        return `<div class="pad"><table><tr><th>Sakit</th><th>Izin</th><th>Alpha</th></tr><tr><td style="text-align:center">${s} Hari</td><td style="text-align:center">${i} Hari</td><td style="text-align:center">${a} Hari</td></tr></table></div>`
      }
      case "growth": {
        let w = "18 kg", h = "109 cm", hl = "50 cm";
        if (!isPreview && reportData?.student) {
          w = (reportData.student.weight || '-') + " kg";
          h = (reportData.student.height || '-') + " cm";
          hl = (reportData.student.head_circumference || '-') + " cm";
        }
        return `<div class="pad"><table><tr><th>Berat Badan</th><th>Tinggi Badan</th><th>Lingkar Kepala</th></tr><tr><td style="text-align:center">${w}</td><td style="text-align:center">${h}</td><td style="text-align:center">${hl}</td></tr></table></div>`
      }
      case "signature_block": 
        return `<div class="rp-sign pad">
          <div class="rp-sign-row">
            <div class="slot">Mengetahui,<br>Orang Tua / Wali<div class="line">( ........................ )</div></div>
            <div class="slot">${esc(p.place)}, ${esc(p.date)}<br>Guru Kelas<div class="line">${esc(getWali())}</div></div>
          </div>
          <div class="rp-sign-center">
            <div class="slot" style="width: 220px; margin: 0 auto;">Mengetahui,<br>Kepala Sekolah<div class="line">${esc(p.kepsek)}</div></div>
          </div>
        </div>`
      }
      return ""
    }

    const rawHTML = getRawHTML()
    
    // Apply margins if they exist
    const mt = Number(p.marginTop) || 0
    const mb = Number(p.marginBottom) || 0
    const ml = Number(p.marginLeft) || 0
    const mr = Number(p.marginRight) || 0

    if (mt || mb || ml || mr) {
      return `<div style="margin: ${mt}px ${mr}px ${mb}px ${ml}px;">${rawHTML}</div>`
    }
    
    return rawHTML
  }

  return {
    renderWidgetHTML
  }
}
