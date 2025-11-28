const downloads = [
  'assets/grades_form_1.pdf',
  'assets/grades_form_2.pdf'
];

document.querySelectorAll('.grade-card').forEach((card, index) => {
  card.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = downloads[index];
    link.download = downloads[index].split('/').pop();
    link.click();
  });
});

const pageToStep = {
  "index.html": 0,
  "readfirst.html": 1,
  "confirmation.html": 2,
  "aap.html": 3,
  "personal.html": 4,
  "educattach.html": 5,
  "programs.html": 6,
  "form.html": 7,
  "submit.html": 8
};

const currentPage = window.location.pathname.split("/").pop();
let savedStep = parseInt(localStorage.getItem("currentStep"));
let currentStep = pageToStep[currentPage] !== undefined ? pageToStep[currentPage] : (savedStep || 5);
let storedMax = parseInt(localStorage.getItem("maxUnlockedStep"));
let maxUnlockedStep = (storedMax !== null && !isNaN(storedMax)) ? storedMax : currentStep;

const programCatalog = [
  { program: "BS Agriculture - Animal Science", college: "College of Agriculture and Forestry", campuses: ["Lobo"], strands: ["gas"], requires80: false, requires85: false },
  { program: "BS Agriculture - Crop Science", college: "College of Agriculture and Forestry", campuses: ["Lobo"], strands: ["gas"], requires80: false, requires85: false },
  { program: "BS Forestry", college: "College of Agriculture and Forestry", campuses: ["Lobo"], strands: ["gas"], requires80: false, requires85: false },
  { program: "BS Fisheries and Aquatic Sciences", college: "College of Agriculture and Forestry", campuses: ["Lobo"], strands: ["gas"], requires80: false, requires85: false },
  { program: "BS Architecture", college: "College of Architecture, Fine Arts and Design", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Interior Design", college: "College of Architecture, Fine Arts and Design", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Fine Arts and Design - Visual Communication", college: "College of Architecture, Fine Arts and Design", campuses: ["Alangilan"], strands: [], requires80: false, requires85: false },
  { program: "BS Criminology", college: "College of Criminal Justice Education", campuses: ["Pablo Borbon","Malvar","Nasugbu"], strands: ["humss","gas"], requires80: false, requires85: false },
  { program: "BS Psychology", college: "College of Arts and Sciences", campuses: ["Pablo Borbon"], strands: ["humss"], requires80: false, requires85: false },
  { program: "BS Development Communication", college: "College of Arts and Sciences", campuses: ["Pablo Borbon"], strands: ["abm","humss","gas"], requires80: false, requires85: false },
  { program: "BA Communication", college: "College of Arts and Sciences", campuses: ["Pablo Borbon"], strands: ["humss","gas"], requires80: false, requires85: false },
  { program: "BA English Language Studies", college: "College of Arts and Sciences", campuses: ["Pablo Borbon"], strands: ["humss","gas"], requires80: false, requires85: false },
  { program: "BS Biology", college: "College of Science", campuses: ["Pablo Borbon"], strands: [], requires80: true, requires85: false },
  { program: "BS Chemistry", college: "College of Science", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Mathematics", college: "College of Science", campuses: ["Pablo Borbon"], strands: [], requires80: true, requires85: false },
  { program: "BS Aerospace Engineering", college: "College of Engineering", campuses: ["Aboitiz Lima"], strands: [], requires80: true, requires85: false },
  { program: "BS Automotive Engineering", college: "College of Engineering", campuses: ["Aboitiz Lima"], strands: [], requires80: true, requires85: false },
  { program: "BS Biomedical Engineering", college: "College of Engineering", campuses: ["Aboitiz Lima"], strands: [], requires80: true, requires85: false },
  { program: "BS Ceramics Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Chemical Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Civil Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Computer Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Electrical Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Electronics Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Food Engineering", college: "College of Engineering", campuses: ["Aboitiz Lima"], strands: [], requires80: true, requires85: false },
  { program: "BS Geodetic Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Geological Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Industrial Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Instrumentation and Control Engineering", college: "College of Engineering", campuses: ["Aboitiz Lima"], strands: [], requires80: true, requires85: false },
  { program: "BS Mechanical Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Mechatronics Engineering", college: "College of Engineering", campuses: ["Aboitiz Lima"], strands: [], requires80: true, requires85: false },
  { program: "BS Metallurgical Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Naval Architecture and Marine Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Petroleum Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Sanitary Engineering", college: "College of Engineering", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Automotive Engineering Technology", college: "College of Engineering Technology", campuses: ["Alangilan","Malvar","Balayan"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Civil Engineering Technology", college: "College of Engineering Technology", campuses: ["Alangilan","Malvar","Balayan"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Computer Engineering Technology", college: "College of Engineering Technology", campuses: ["Malvar","Lipa","Balayan","Aboitiz Lima"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Drafting Engineering Technology", college: "College of Engineering Technology", campuses: ["Alangilan","Malvar","Balayan"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Electrical Engineering Technology", college: "College of Engineering Technology", campuses: ["Malvar","Lipa","Balayan","Aboitiz Lima"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Electronics Engineering Technology", college: "College of Engineering Technology", campuses: ["Malvar","Lipa","Balayan","Aboitiz Lima"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Food Engineering Technology", college: "College of Engineering Technology", campuses: ["Alangilan","Malvar"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Instrumentation and Control Engineering Technology", college: "College of Engineering Technology", campuses: ["Alangilan","Lipa","Balayan"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Mechanical Engineering Technology", college: "College of Engineering Technology", campuses: ["Alangilan","Malvar","Balayan"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Mechatronics Engineering Technology", college: "College of Engineering Technology", campuses: ["Alangilan","Malvar"], strands: [], requires80: true, requires85: false },
  { program: "Bachelor of Welding and Fabrication Engineering Technology", college: "College of Engineering Technology", campuses: ["Alangilan"], strands: [], requires80: true, requires85: false },
  { program: "BS Computer Science", college: "College of Informatics and Computing Sciences", campuses: ["Alangilan"], strands: [], requires80: false, requires85: false },
  { program: "BS Information Technology", college: "College of Informatics and Computing Sciences", campuses: ["Alangilan","Malvar","Nasugbu","Lipa","Balayan","Mabini"], strands: ["gas"], requires80: false, requires85: false },
  { program: "Bachelor of Industrial Technology", college: "College of Informatics and Computing Sciences", campuses: ["Alangilan","Malvar"], strands: ["gas"], requires80: false, requires85: false },
  { program: "BS Nursing", college: "College of Nursing and Allied Health Sciences", campuses: ["Pablo Borbon","Nasugbu"], strands: ["gas"], requires80: true, requires85: false },
  { program: "BS Nutrition and Dietetics", college: "College of Nursing and Allied Health Sciences", campuses: ["Pablo Borbon"], strands: ["gas"], requires80: true, requires85: false },
  { program: "BS Public Health - Disaster Response", college: "College of Nursing and Allied Health Sciences", campuses: ["Pablo Borbon"], strands: ["gas"], requires80: true, requires85: false },
  { program: "BS Accountancy", college: "College of Accountancy, Business and Economics", campuses: ["Pablo Borbon"], strands: ["abm"], requires80: false, requires85: false },
  { program: "BS Management Accounting", college: "College of Accountancy, Business and Economics", campuses: ["Pablo Borbon"], strands: ["abm"], requires80: false, requires85: false },
  { program: "BS Business Administration", college: "College of Accountancy, Business and Economics", campuses: ["Pablo Borbon","Nasugbu","Lipa"], strands: ["abm"], requires80: false, requires85: false },
  { program: "BS Entrepreneurship", college: "College of Accountancy, Business and Economics", campuses: ["Pablo Borbon","Nasugbu"], strands: ["abm"], requires80: false, requires85: false },
  { program: "BS Customs Administration", college: "College of Accountancy, Business and Economics", campuses: ["Pablo Borbon"], strands: ["abm"], requires80: false, requires85: false },
  { program: "BS Applied Economics", college: "College of Accountancy, Business and Economics", campuses: ["Pablo Borbon"], strands: ["abm"], requires80: false, requires85: false },
  { program: "BS Hospitality Management", college: "College of Accountancy, Business and Economics", campuses: ["Nasugbu","Pablo Borbon"], strands: ["abm"], requires80: false, requires85: false },
  { program: "BS Tourism Management", college: "College of Accountancy, Business and Economics", campuses: ["Nasugbu","Pablo Borbon"], strands: ["abm"], requires80: false, requires85: false },
  { program: "Bachelor of Public Administration", college: "College of Accountancy, Business and Economics", campuses: ["Pablo Borbon"], strands: ["abm","humss"], requires80: false, requires85: false },
  { program: "Bachelor of Early Childhood Education", college: "College of Teacher Education", campuses: ["Pablo Borbon"], strands: ["humss"], requires80: false, requires85: false },
  { program: "Bachelor of Elementary Education", college: "College of Teacher Education", campuses: ["Pablo Borbon","Malvar","Nasugbu","Rosario"], strands: ["humss","gas"], requires80: false, requires85: false },
  { program: "Bachelor of Physical Education", college: "College of Teacher Education", campuses: ["Pablo Borbon","Malvar","Nasugbu","Lipa","San Juan","Rosario"], strands: ["humss"], requires80: false, requires85: false },
  { program: "Bachelor of Secondary Education - English", college: "College of Teacher Education", campuses: ["Pablo Borbon","Malvar","Nasugbu","Lipa","San Juan","Rosario"], strands: ["humss","gas"], requires80: false, requires85: false },
  { program: "Bachelor of Secondary Education - Filipino", college: "College of Teacher Education", campuses: ["Pablo Borbon","Malvar","Nasugbu","San Juan"], strands: ["humss","gas"], requires80: false, requires85: false },
  { program: "Bachelor of Secondary Education - Mathematics", college: "College of Teacher Education", campuses: ["Pablo Borbon","Malvar","Nasugbu","Lipa","Rosario"], strands: ["humss","gas"], requires80: false, requires85: true },
  { program: "Bachelor of Secondary Education - Sciences", college: "College of Teacher Education", campuses: ["Pablo Borbon","Malvar","Nasugbu","Lipa"], strands: ["humss","gas"], requires80: false, requires85: true },
  { program: "Bachelor of Secondary Education - Social Studies", college: "College of Teacher Education", campuses: ["Pablo Borbon","Malvar","Nasugbu","Lemery"], strands: ["humss","gas"], requires80: false, requires85: false },
  { program: "Bachelor of Technical-Vocational Teacher Education - Electronics Technology", college: "College of Teacher Education", campuses: ["Lemery"], strands: ["humss"], requires80: false, requires85: false },
  { program: "Bachelor of Technical-Vocational Teacher Education - Garments, Fashion and Design", college: "College of Teacher Education", campuses: ["Lemery"], strands: ["humss"], requires80: false, requires85: false },
  { program: "Bachelor of Technology and Livelihood Education - Home Economics", college: "College of Teacher Education", campuses: ["Pablo Borbon","San Juan","Rosario"], strands: ["humss"], requires80: false, requires85: false }
];

programCatalog.forEach(entry => {
  if (!Array.isArray(entry.strands)) {
    entry.strands = [];
  }
  const hasNonStem = entry.strands.some(code => code !== 'stem');
  if (entry.strands.length === 0 || !hasNonStem) {
    entry.strands = ['stem'];
    return;
  }
  if (hasNonStem && !entry.strands.includes('stem')) {
    entry.strands.push('stem');
  }
});

const programCampuses = Object.fromEntries(programCatalog.map(item => [item.program, item.campuses]));
const allCampuses = Array.from(new Set(programCatalog.flatMap(item => item.campuses))).sort();

function initSteps() {
  const steps = document.querySelectorAll(".step");

  function updateSteps() {
    steps.forEach((step, index) => {
      step.classList.toggle("active", index === currentStep);

      if (index <= maxUnlockedStep) {
        step.classList.add("clickable");
        step.style.pointerEvents = "auto";
        step.style.opacity = "1";
      } else {
        step.classList.remove("clickable");
        step.style.pointerEvents = "none";
        step.style.opacity = "1";
      }
    });

    localStorage.setItem("currentStep", currentStep);
    localStorage.setItem("maxUnlockedStep", maxUnlockedStep);
  }

  steps.forEach((step, index) => {
    step.addEventListener("click", () => {
      if (index > maxUnlockedStep) return;
      currentStep = index;
      if (currentStep === maxUnlockedStep && maxUnlockedStep < steps.length - 1) {
        maxUnlockedStep++;
      }
      updateSteps();

      switch (index) {
        case 0: window.location.href = "index.html"; break;
        case 1: window.location.href = "readfirst.html"; break;
        case 2: window.location.href = "confirmation.html"; break;
        case 3: window.location.href = "aap.html"; break;
        case 4: window.location.href = "personal.html"; break;
        case 5: window.location.href = "educattach.html"; break;
        case 6: window.location.href = "programs.html"; break;
        case 7: window.location.href = "form.html"; break;
        case 8: window.location.href = "submit.html"; break;
      }
    });
  });

  updateSteps();
}

function getStrandFromStorage() {
  const strand = localStorage.getItem('selected_strand') || localStorage.getItem('edu-strand');
  return strand ? strand.toLowerCase() : null;
}

function buildGradeBuckets(snapshot) {
  const result = { math: [], science: [], english: [] };
  const finalGrades = snapshot?.final_grades || {};
  const grade11 = snapshot?.grade_11_records || {};

  if (finalGrades.math) result.math.push(parseFloat(finalGrades.math));
  if (finalGrades.science) result.science.push(parseFloat(finalGrades.science));
  if (finalGrades.english) result.english.push(parseFloat(finalGrades.english));

  const grade11Map = {
    math: ['s1_math','s2_math'],
    science: ['s1_science','s2_science'],
    english: ['s1_english','s2_english']
  };

  Object.entries(grade11Map).forEach(([subject, keys]) => {
    keys.forEach(key => {
      const entry = grade11[key];
      if (entry && !entry.na && entry.grade !== '' && entry.grade !== null && entry.grade !== undefined) {
        result[subject].push(parseFloat(entry.grade));
      }
    });
  });

  return result;
}

function meetsThreshold(subjects, threshold, buckets) {
  return subjects.every(sub => {
    const values = buckets[sub];
    if (!values || !values.length) return false;
    return values.every(val => !isNaN(val) && val >= threshold);
  });
}

function getIneligibilityReason(entry, buckets) {
  if (entry.requires85 && !meetsThreshold(['math','science'], 85, buckets)) {
    return "Needs Math & Science grades ≥ 85";
  }
  if (entry.requires80 && !meetsThreshold(['math','science','english'], 80, buckets)) {
    return "Needs Math, Science & English grades ≥ 80";
  }
  return null;
}

function getAllowedProgramsForStrand(strand) {
  if (!strand || strand === 'stem') {
    return programCatalog;
  }
  return programCatalog.filter(entry => entry.strands.includes(strand));
}

function groupProgramsByCollege(programs) {
  return programs.reduce((map, entry) => {
    if (!map.has(entry.college)) map.set(entry.college, []);
    map.get(entry.college).push(entry);
    return map;
  }, new Map());
}

function populateProgramSelect(select, programs, gradeBuckets) {
  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = programs.length ? "Select Program" : "No programs available for your strand";
  select.appendChild(placeholder);

  if (!programs.length) {
    select.disabled = true;
    return;
  }

  select.disabled = false;

  const grouped = groupProgramsByCollege(programs);
  grouped.forEach((items, college) => {
    const optGroup = document.createElement("optgroup");
    optGroup.label = college;
    items
      .sort((a, b) => a.program.localeCompare(b.program))
      .forEach(entry => {
        const opt = document.createElement("option");
        opt.value = entry.program;
        const reason = getIneligibilityReason(entry, gradeBuckets);
        opt.disabled = Boolean(reason);
        opt.textContent = reason ? `${entry.program} — ${reason}` : entry.program;
        if (reason) {
          opt.title = reason;
        }
        optGroup.appendChild(opt);
      });
    select.appendChild(optGroup);
  });
}

function populateCampusSelectElement(select, campuses) {
  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = campuses.length ? "Select Campus" : "No campus available";
  select.appendChild(placeholder);

  if (!campuses.length) {
    select.disabled = true;
    return;
  }

  select.disabled = false;

  campuses.forEach(campus => {
    const opt = document.createElement("option");
    opt.value = campus;
    opt.textContent = campus;
    select.appendChild(opt);
  });

  if (campuses.length === 1) {
    select.value = campuses[0];
  }
}

function updateCampusOptions(programSelect, campusSelect) {
  if (!programSelect.value) {
    populateCampusSelectElement(campusSelect, []);
    return;
  }
  const program = programSelect.value;
  const campuses = programCampuses[program] || allCampuses;
  populateCampusSelectElement(campusSelect, campuses);
  const saved = localStorage.getItem(`campus_choice_${campusSelect.dataset.choice}`);
  if (saved && campuses.includes(saved)) {
    campusSelect.value = saved;
  } else if (campuses.length === 1) {
    campusSelect.value = campuses[0];
    localStorage.setItem(`campus_choice_${campusSelect.dataset.choice}`, campuses[0]);
  }
}

function displayStrandNotice(strand, count, gradeBuckets) {
  const section = document.querySelector('.choices-section');
  if (!section) return;
  const notice = document.createElement('div');
  notice.className = 'strand-notice';
  notice.style.background = '#eef5ff';
  notice.style.border = '1px solid #b9d4ff';
  notice.style.padding = '12px 16px';
  notice.style.borderRadius = '8px';
  notice.style.marginBottom = '16px';
  notice.style.fontSize = '0.95rem';

  if (!strand) {
    notice.textContent = "Strand not detected. Showing all programs. If this is incorrect, please go back to the Education & Attachments step.";
  } else if (count === 0) {
    notice.textContent = `Detected strand: ${strand.toUpperCase()}. No eligible programs are configured for this strand yet. Please review your strand selection or contact the admissions office.`;
  } else {
    notice.textContent = `Detected strand: ${strand.toUpperCase()}. Showing ${count} eligible program(s).`;
  }

  const missingGrades = ['math','science','english'].some(key => !gradeBuckets[key].length);
  if (missingGrades) {
    const warn = document.createElement('p');
    warn.style.margin = '8px 0 0';
    warn.style.color = '#a94442';
    warn.textContent = "Grade data is incomplete. Programs with grade requirements remain locked until you re-submit your Education & Attachments page.";
    notice.appendChild(warn);
  }

  const header = section.querySelector('.choices-header');
  if (header) {
    section.insertBefore(notice, header);
  } else {
    section.prepend(notice);
  }
}

function initProgramFiltering() {
  const rows = document.querySelectorAll('.choice');
  if (!rows.length) return;

  const strand = getStrandFromStorage();
  const eligibilitySnapshot = JSON.parse(localStorage.getItem('eligibilityData') || '{}');
  const gradeBuckets = buildGradeBuckets(eligibilitySnapshot);
  const allowedPrograms = getAllowedProgramsForStrand(strand);
  const hasPrograms = allowedPrograms.length > 0;

  displayStrandNotice(strand, allowedPrograms.length, gradeBuckets);

  rows.forEach((row, index) => {
    const programSelect = row.querySelector('.program-select');
    const campusSelect = row.querySelector('.campus-select-input');
    if (!programSelect || !campusSelect) return;

    populateProgramSelect(programSelect, allowedPrograms, gradeBuckets);
    populateCampusSelectElement(campusSelect, []);

    if (hasPrograms) {
      const savedProgram = localStorage.getItem(`program_choice_${index + 1}`);
      if (savedProgram) {
        const optionExists = Array.from(programSelect.options).some(opt => opt.value === savedProgram && !opt.disabled);
        if (optionExists) {
          programSelect.value = savedProgram;
        }
      }

      updateCampusOptions(programSelect, campusSelect);

      programSelect.addEventListener('change', () => {
        localStorage.setItem(`program_choice_${index + 1}`, programSelect.value);
        updateCampusOptions(programSelect, campusSelect);
        programSelect.classList.remove('error');
      });

      campusSelect.addEventListener('change', () => {
        localStorage.setItem(`campus_choice_${index + 1}`, campusSelect.value);
        campusSelect.classList.remove('error');
      });
    } else {
      programSelect.disabled = true;
      campusSelect.disabled = true;
    }
  });
}

function initValidation() {
const nextBtn = document.getElementById('nextBtn');
const errorNotif = document.getElementById('error-notif');
if (!nextBtn || !errorNotif) return;

nextBtn.addEventListener('click', async e => {
  e.preventDefault();
  const rows = document.querySelectorAll('.choice');
  let allFilled = true;

  const choices = Array.from(rows).map((row, index) => {
    const programSelect = row.querySelector('.program-select');
    const campusSelect = row.querySelector('.campus-select-input');
    row.classList.remove('row-error');

    if (!programSelect || !campusSelect || !programSelect.value || !campusSelect.value) {
      allFilled = false;
      if (programSelect && !programSelect.value) programSelect.classList.add('error');
      if (campusSelect && programSelect && programSelect.value && !campusSelect.value) campusSelect.classList.add('error');
      row.classList.add('row-error');
    } else {
      programSelect.classList.remove('error');
      campusSelect.classList.remove('error');
    }

    return {
      number: index + 1,
      program: programSelect ? programSelect.value : '',
      campus: campusSelect ? campusSelect.value : ''
    };
  });

  if (!allFilled) {
    showError(errorNotif, 'Please fill all required fields before proceeding.');
    return;
  }

  try {
    nextBtn.disabled = true;
    nextBtn.textContent = 'Saving...';
    await saveProgramChoices(choices);
    window.location.href = 'form.html';
  } catch (err) {
    console.error('Failed to save program choices:', err);
    showError(errorNotif, err.message || 'Unable to save your program choices. Please try again.');
  } finally {
    nextBtn.disabled = false;
    nextBtn.textContent = 'Next ->';
  }
});

  document.querySelectorAll('.program-select, .campus-select-input').forEach(field => {
    field.addEventListener('change', () => {
      const row = field.closest('.choice');
      const programSelect = row.querySelector('.program-select');
      const campusSelect = row.querySelector('.campus-select-input');
      if (field.value) field.classList.remove('error');
      if (programSelect.value && campusSelect.value) {
        row.classList.remove('row-error');
      }
    });
  });
}

async function saveProgramChoices(choices) {
  const response = await fetch('../backend/save_program_choices.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ choices })
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to save program choices.');
  }

  return result;
}

function showError(errorNotif, message = 'Please fill all required fields before proceeding.') {
  errorNotif.textContent = message;
  errorNotif.style.display = 'block';
  requestAnimationFrame(() => {
    errorNotif.style.opacity = 1;
  });

  setTimeout(() => {
    errorNotif.style.opacity = 0;
    setTimeout(() => {
      errorNotif.style.display = 'none';
    }, 500);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  initSteps();
  initProgramFiltering();
  initValidation();
});
