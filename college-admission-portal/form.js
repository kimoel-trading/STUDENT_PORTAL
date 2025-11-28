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

// ====== Map pages to step index ======
const pageToStep = {
  "index.html": 0,
  "readfirst.html": 1,
  "confirmation.html": 2,
  "aap.html": 3,
  "personal.html": 4,
  "educattach.html": 5,
  "programs.html": 6,
  "form.html": 7,
  "form.html": 7,
  "submit.html": 8,
};

// ====== Get current page ======
const currentPage = window.location.pathname.split("/").pop();

// ====== Load progress safely ======
let savedStep = parseInt(localStorage.getItem("currentStep"));
let currentStep = pageToStep[currentPage] !== undefined ? pageToStep[currentPage] : (savedStep || 7);
let storedMax = parseInt(localStorage.getItem("maxUnlockedStep"));
let maxUnlockedStep = (storedMax !== null && !isNaN(storedMax)) ? storedMax : currentStep;

document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".step");

  // ====== Update step UI ======
  function updateStepsUI() {
    steps.forEach((step, index) => {
      const circle = step.querySelector("span"); // step number circle
      const icon = step.querySelector("i");      // optional icon
      const label = step.querySelector("p");     // step label
      const isActive = index === currentStep;

      // Active step
      step.classList.toggle("active", isActive);

      if (index <= maxUnlockedStep) {
        // Unlocked step
        step.classList.add("clickable");
        step.style.pointerEvents = "auto";
        step.style.cursor = "pointer";

        if (icon) icon.style.opacity = "1";
        if (label) label.style.opacity = "1";
        if (circle) circle.style.borderColor = isActive ? "#1a9737" : "#ccc";

        // Click handler
        step.onclick = () => {
          if (index > maxUnlockedStep) return;

          currentStep = index;

          // Unlock next step if clicking last unlocked
          if (currentStep === maxUnlockedStep && maxUnlockedStep < steps.length - 1) {
            maxUnlockedStep++;
          }

          localStorage.setItem("currentStep", currentStep);
          localStorage.setItem("maxUnlockedStep", maxUnlockedStep);

          updateStepsUI();

          if (typeof showSection === "function") showSection(currentStep);

          // Navigate to page
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
        };
      } else {
        // Locked step
        step.classList.remove("clickable");
        step.style.pointerEvents = "none";
        step.style.cursor = "default";

        if (circle) circle.style.borderColor = "#ddd";
        if (icon) icon.style.opacity = "0.4";
        if (label) label.style.opacity = "0.5";

        step.onclick = null; // remove click
      }
    });
  }

  // Initial UI render
  updateStepsUI();

  // ====== POPULATE FORM FROM LOCALSTORAGE ======
  function populateForm() {
    try {
      // Get all stored data from localStorage
      const personalData = JSON.parse(localStorage.getItem('personalData') || '{}');
      const educationData = JSON.parse(localStorage.getItem('educationData') || '{}');
      const gradesData = JSON.parse(localStorage.getItem('gradesData') || '{}');
      const programData = JSON.parse(localStorage.getItem('programData') || '{}');
      const parentalData = JSON.parse(localStorage.getItem('parentalData') || '{}');
      const siblingData = JSON.parse(localStorage.getItem('siblingData') || '{}');

      console.log('📦 Parental data loaded:', parentalData);

      // GET CONFIRMATION PAGE DATA
      const academicStatus = localStorage.getItem('field_academicStatus') || '';
      const alreadyEnrolled = localStorage.getItem('field_alreadyEnrolled') || '';
      const firstTimeApplying = localStorage.getItem('field_firstTimeApplying') || '';
      const transferred = localStorage.getItem('field_transferred') || '';
      const transferredFrom = localStorage.getItem('field_transferredFrom') || '';
      const transferredYear = localStorage.getItem('field_transferredYear') || '';
      const bsuGraduate = localStorage.getItem('field_bsuGraduate') || '';
      const bsuSchool = localStorage.getItem('field_bsuSchool') || '';
      const schoolType = localStorage.getItem('edu-schoolType') || 'public,private';

      // GET AAP DATA
      const aapSelection = localStorage.getItem('field_aap') || '';

      // POPULATE ACADEMIC STATUS CHECKBOXES
      const academicCheckboxes = document.querySelectorAll('.instructions-right .checkbox-item');
      if (academicCheckboxes.length >= 2) {
        // Currently enrolled as Grade 12
        if (academicStatus === 'graduating') {
          academicCheckboxes[0].querySelector('div').innerHTML = '☑ <i>Currently enrolled as Grade 12 student</i>';
          academicCheckboxes[1].querySelector('div').innerHTML = '☐ <i>Senior High School Graduate</i>';
        } 
        // Senior High School Graduate
        else if (academicStatus === 'graduated') {
          academicCheckboxes[0].querySelector('div').innerHTML = '☐ <i>Currently enrolled as Grade 12 student</i>';
          academicCheckboxes[1].querySelector('div').innerHTML = '☑ <i>Senior High School Graduate</i>';
        }
      }

      // POPULATE TRANSFER STATUS IN EDUCATIONAL INFORMATION
const allTables = document.querySelectorAll('table');

allTables.forEach(table => {
  const allRows = table.querySelectorAll('tr');
  
  allRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    
    cells.forEach(cell => {
      // Check if this cell contains the transfer question
      if (cell.textContent.includes('Have you ever transferred')) {
        console.log('Found transfer cell:', cell.textContent); // Debug log
        
        if (transferred === 'yes') {
          cell.innerHTML = `
            <strong>Have you ever transferred during your Senior Your High School?</strong><br>
            <span style="margin-left:20px;">☑ <i>Yes</i></span>
            <span style="margin-left:20px;">☐ <i>No</i></span>
          `;
        } else if (transferred === 'no') {
          cell.innerHTML = `
            <strong>Have you ever transferred during your Senior Your High School?</strong><br>
            <span style="margin-left:20px;">☐ <i>Yes</i></span>
            <span style="margin-left:20px;">☑ <i>No</i></span>
          `;
        }
      }
    });
  });

// POPULATE TRANSFER STATUS AND TYPE OF SCHOOL
const allTables = document.querySelectorAll('table');
const schoolType = localStorage.getItem('edu-schoolType') || 'public'; // Changed from 'field_schoolType'

console.log('🔍 Looking for Type of School...');
console.log('📚 School type from storage:', schoolType);

let transferUpdated = false;
let schoolTypeUpdated = false;

allTables.forEach(table => {
  const allRows = table.querySelectorAll('tr');
  
  allRows.forEach(row => {
    const cells = row.querySelectorAll('td');
    
    cells.forEach(cell => {
    // Handle Transfer Status (only once)
    if (!transferUpdated && cell.textContent.includes('Have you ever transferred')) {
      console.log('✅ Found transfer cell');
      
      if (transferred === 'yes') {
        cell.innerHTML = `
          <strong>Have you ever transferred during your Senior Your High School?</strong><br>
          <span style="margin-left:20px;">☑ <i>Yes</i></span>
          <span style="margin-left:20px;">☐ <i>No</i></span>
        `;
      } else if (transferred === 'no') {
        cell.innerHTML = `
          <strong>Have you ever transferred during your Senior Your High School?</strong><br>
          <span style="margin-left:20px;">☐ <i>Yes</i></span>
          <span style="margin-left:20px;">☑ <i>No</i></span>
        `;
      }
      transferUpdated = true;
    }
    
// Handle Type of School (only once)
if (!schoolTypeUpdated && cell.textContent.includes('Type of School')) {
    console.log('✅ Found Type of School cell');
    console.log('📚 Populating with:', schoolType);
    
    cell.innerHTML = `
      <strong>Type of School</strong><br>
      <span style="margin-left:20px;">${schoolType === 'private' ? '☑' : '☐'} <i>Private</i></span>
      <span style="margin-left:20px;">${schoolType === 'public' ? '☑' : '☐'} <i>Public</i></span>
      <span style="margin-left:20px;">${schoolType === 'als' ? '☑' : '☐'} <i>Alternative Learning School</i></span>
    `;
    schoolTypeUpdated = true;
}
    });
  });
});

console.log('✅ Transfer updated:', transferUpdated);
console.log('✅ School type updated:', schoolTypeUpdated);
});

      // POPULATE AAP CHECKBOXES
      const aapCheckboxes = document.querySelectorAll('.instructions-right .checkbox-item');
      if (aapCheckboxes.length >= 10 && aapSelection) {
        for (let i = 2; i < 10; i++) {
          if (aapCheckboxes[i]) {
            const div = aapCheckboxes[i].querySelector('div');
            if (div) {
              div.innerHTML = '☐ ' + div.innerHTML.substring(div.innerHTML.indexOf('<i>'));
            }
          }
        }

        const aapMap = {
          'als': 2, 'indigent': 3, 'indigenous': 4, 'pwd': 5,
          'iskolar': 6, 'solo-parent': 7, 'lab-school': 8, 'none': 9
        };

        const checkboxIndex = aapMap[aapSelection];
        if (checkboxIndex !== undefined && aapCheckboxes[checkboxIndex]) {
          const div = aapCheckboxes[checkboxIndex].querySelector('div');
          if (div) {
            div.innerHTML = '☑ ' + div.innerHTML.substring(div.innerHTML.indexOf('<i>'));
          }
        }
      }


      // PERSONAL INFORMATION - with null checks
      const setTextContent = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '';
      };

      setTextContent('userEmail', personalData.email || 'user@gmail.com');
      setTextContent('surname', personalData.surname);
      setTextContent('firstName', personalData.firstName);
      setTextContent('middleName', personalData.middleName);
      setTextContent('address', personalData.address);
      setTextContent('zipCode', personalData.zipCode);
      setTextContent('dateOfBirth', personalData.dateOfBirth);
      setTextContent('sex', personalData.sex);
      setTextContent('age', personalData.age);
      setTextContent('religion', personalData.religion);
      setTextContent('nationality', personalData.nationality);
      setTextContent('contactPerson', personalData.contactPerson);
      setTextContent('mobileNumber', personalData.mobileNumber);
      setTextContent('landlineNumber', personalData.landlineNumber || 'N/A');
      setTextContent('email', personalData.email);
      setTextContent('contactAddress', personalData.contactAddress);
      setTextContent('contactMobile', personalData.contactMobile);
      setTextContent('contactRelationship', personalData.contactRelationship);

      // Handle "Others" relationship option
      const contactRel = document.getElementById('contactRelationship');
      if (contactRel && personalData.contactRelationship === 'Others' && personalData.otherRelationship) {
          contactRel.textContent = personalData.otherRelationship.toUpperCase();
      }

      // EDUCATIONAL INFORMATION - Read from localStorage keys saved by educattach.js
      const seniorHighSchool = localStorage.getItem('edu-shsName') || '';
      const track = localStorage.getItem('edu-track') || '';
      const strand = localStorage.getItem('edu-strand') || '';
      const specialization = localStorage.getItem('edu-specialization') || 'N/A';
      const jhsCompletionYear = localStorage.getItem('edu-jhsCompletionYear') || '';
      const shsCompletionYear = localStorage.getItem('edu-shsCompletionYear') || '';

      // Format track/strand combination as shown in educattach
      let trackDisplay = track;
      if (track && strand) {
        // Capitalize first letter of track, make strand all caps
        const formattedTrack = track.charAt(0).toUpperCase() + track.slice(1).toLowerCase();
        const formattedStrand = strand.toUpperCase();
        trackDisplay = `${formattedTrack} / ${formattedStrand}`;
      } else if (track) {
        // If only track exists, capitalize first letter
        trackDisplay = track.charAt(0).toUpperCase() + track.slice(1).toLowerCase();
      }

      setTextContent('seniorHighSchool', seniorHighSchool);
      setTextContent('track', trackDisplay);
      setTextContent('specialization', specialization);
      setTextContent('jhsYear', jhsCompletionYear);
      setTextContent('shsYear', shsCompletionYear);

      // GRADES - Read from localStorage keys saved by educattach.js
      // Note: The form preview shows Grade 10 (from Junior High School), Grade 11 1st sem, and Grade 11 2nd sem
      // The educattach form collects both JHS (Grade 10) and SHS (Grade 11) data
      const englishGrade10 = localStorage.getItem('jhs-jhsEnglish') || 'N/A'; // Grade 10 from Junior High School English
      const englishGrade11_1st = localStorage.getItem('shs-g11EnglishGrade1') || '';
      const englishGrade11_2nd = localStorage.getItem('shs-g11EnglishGrade2') || '';

      // Math grades (Grade 10 from JHS, Grade 11 from SHS)
      const mathGrade10 = localStorage.getItem('jhs-jhsMath') || 'N/A'; // Grade 10 from Junior High School Math
      const mathGrade11_1st = localStorage.getItem('shs-g11MathGrade1') || '';
      const mathGrade11_2nd = localStorage.getItem('shs-g11MathGrade2') || '';

      // Science grades (Grade 10 from JHS, Grade 11 from SHS)
      const scienceGrade10 = localStorage.getItem('jhs-jhsScience') || 'N/A'; // Grade 10 from Junior High School Science
      const scienceGrade11_1st = localStorage.getItem('shs-g11ScienceGrade1') || '';
      const scienceGrade11_2nd = localStorage.getItem('shs-g11ScienceGrade2') || '';

      setTextContent('englishGrade10', englishGrade10);
      setTextContent('englishGrade11_1st', englishGrade11_1st);
      setTextContent('englishGrade11_2nd', englishGrade11_2nd);
      setTextContent('mathGrade10', mathGrade10);
      setTextContent('mathGrade11_1st', mathGrade11_1st);
      setTextContent('mathGrade11_2nd', mathGrade11_2nd);
      setTextContent('scienceGrade10', scienceGrade10);
      setTextContent('scienceGrade11_1st', scienceGrade11_1st);
      setTextContent('scienceGrade11_2nd', scienceGrade11_2nd);

      const gradesTable = document.querySelector('.info-table tbody');
      if (gradesTable) {
        const rows = gradesTable.querySelectorAll('tr');

        // English row (index 0)
        if (rows[0]) {
          const cells = rows[0].querySelectorAll('td');
          if (cells[4]) cells[4].textContent = englishGrade10;
          if (cells[5]) cells[5].textContent = englishGrade11_1st;
          if (cells[6]) cells[6].textContent = englishGrade11_2nd;
        }

        // Mathematics row (index 1)
        if (rows[1]) {
          const cells = rows[1].querySelectorAll('td');
          if (cells[4]) cells[4].textContent = mathGrade10;
          if (cells[5]) cells[5].textContent = mathGrade11_1st;
          if (cells[6]) cells[6].textContent = mathGrade11_2nd;
        }

        // Science row (index 2)
        if (rows[2]) {
          const cells = rows[2].querySelectorAll('td');
          if (cells[4]) cells[4].textContent = scienceGrade10;
          if (cells[5]) cells[5].textContent = scienceGrade11_1st;
          if (cells[6]) cells[6].textContent = scienceGrade11_2nd;
        }
      }


      // PROGRAM CHOICES - Read from localStorage keys saved by programs.js
      const programTable = document.querySelector('.right-column table tbody');
      if (programTable) {
        const rows = programTable.querySelectorAll('tr');

        // First Choice
        if (rows[0]) {
          const cells = rows[0].querySelectorAll('td');
          const programCell = cells[1]?.querySelector('.cell-inner');
          const campusCell = cells[2]?.querySelector('.cell-inner');

          if (programCell) programCell.textContent = localStorage.getItem('program_choice_1') || '';
          if (campusCell) campusCell.textContent = localStorage.getItem('campus_choice_1') || '';
        }

        // Second Choice
        if (rows[1]) {
          const cells = rows[1].querySelectorAll('td');
          const programCell = cells[1]?.querySelector('.cell-inner');
          const campusCell = cells[2]?.querySelector('.cell-inner');

          if (programCell) programCell.textContent = localStorage.getItem('program_choice_2') || '';
          if (campusCell) campusCell.textContent = localStorage.getItem('campus_choice_2') || '';
        }

        // Third Choice
        if (rows[2]) {
          const cells = rows[2].querySelectorAll('td');
          const programCell = cells[1]?.querySelector('.cell-inner');
          const campusCell = cells[2]?.querySelector('.cell-inner');

          if (programCell) programCell.textContent = localStorage.getItem('program_choice_3') || '';
          if (campusCell) campusCell.textContent = localStorage.getItem('campus_choice_3') || '';
        }
      }
      
    // PARENTAL INFORMATION 
// Find the parental section first, then get its table
const parentalSection = document.querySelector('.section-title');
let parentalTable = null;

// Loop through all section titles to find "PARENTAL INFORMATION"
document.querySelectorAll('.section-title').forEach(title => {
  if (title.textContent.includes('PARENTAL INFORMATION')) {
    // Get the next sibling which should be the form-section1
    parentalTable = title.nextElementSibling?.querySelector('table');
  }
});

console.log('🔍 Parental table found:', parentalTable);

if (parentalTable && parentalData) {
  const rows = parentalTable.querySelectorAll('tr');
  console.log('🔍 Found rows:', rows.length);
  
  // MOTHER'S INFO (Row 0)
  if (rows[0]) {
    const cells = rows[0].querySelectorAll('td');
    console.log('🔍 Mother row cells:', cells.length);
    
    // Combine mother's name
    const motherFullName = [
      parentalData.motherFirst,
      parentalData.motherMiddle,
      parentalData.motherLast
    ].filter(Boolean).join(' ').toUpperCase();
    
    console.log('👩 Mother name:', motherFullName);
    
    const motherInner0 = cells[0]?.querySelector('.cell-inner');
    const motherInner1 = cells[1]?.querySelector('.cell-inner');
    const motherInner2 = cells[2]?.querySelector('.cell-inner');
    const motherInner3 = cells[3]?.querySelector('.cell-inner');
    const motherInner4 = cells[4]?.querySelector('.cell-inner');
    
    if (motherInner0) motherInner0.textContent = motherFullName || '';
    if (motherInner1) motherInner1.textContent = parentalData.motherAge || '';
    if (motherInner2) motherInner2.textContent = parentalData.motherOccupation || '';
    if (motherInner3) motherInner3.textContent = '0';
    if (motherInner4) motherInner4.textContent = parentalData.motherContact || '';
  }
  
  // FATHER'S INFO (Row 2)
  if (rows[2]) {
    const cells = rows[2].querySelectorAll('td');
    console.log('🔍 Father row cells:', cells.length);
    
    // Combine father's name
    const fatherFullName = [
      parentalData.fatherFirst,
      parentalData.fatherMiddle,
      parentalData.fatherLast
    ].filter(Boolean).join(' ').toUpperCase();
    
    console.log('👨 Father name:', fatherFullName);
    
    const fatherInner0 = cells[0]?.querySelector('.cell-inner');
    const fatherInner1 = cells[1]?.querySelector('.cell-inner');
    const fatherInner2 = cells[2]?.querySelector('.cell-inner');
    const fatherInner3 = cells[3]?.querySelector('.cell-inner');
    const fatherInner4 = cells[4]?.querySelector('.cell-inner');
    
    if (fatherInner0) fatherInner0.textContent = fatherFullName || '';
    if (fatherInner1) fatherInner1.textContent = parentalData.fatherAge || '';
    if (fatherInner2) fatherInner2.textContent = parentalData.fatherOccupation || '';
    if (fatherInner3) fatherInner3.textContent = '0';
    if (fatherInner4) fatherInner4.textContent = parentalData.fatherContact || '';
  }
} else {
  console.error('❌ Table or data not found!');
}
      

  // ====== SIBLING INFORMATION ======
try {
  console.log('🔍 Sibling data from storage:', siblingData);
  console.log('🔍 Is array?', Array.isArray(siblingData));
  
  const siblingTable = document.querySelector('.sibling-info-table');
  console.log('🔍 Sibling table found:', siblingTable);
  
  // Check if siblingData exists and is an array with items
  if (siblingTable && Array.isArray(siblingData) && siblingData.length > 0) {
    const rows = siblingTable.querySelectorAll('tr');
    console.log('🔍 Total sibling table rows:', rows.length);
    let rowIndex = 1; // start after header (row 0)

    siblingData.forEach((sib, i) => {
      if (rowIndex < rows.length) {
        const cells = rows[rowIndex].querySelectorAll('td');
        
        if (cells.length >= 5) {
          cells[0].textContent = sib.fullName || '';
          cells[1].textContent = sib.age || '';
          cells[2].textContent = sib.education || '';
          cells[3].textContent = sib.school || '';
          cells[4].textContent = sib.yearGraduated || '';
        }
        rowIndex++;
      }
    });

    // Clear remaining rows
    for (let i = rowIndex; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td');
      cells.forEach(cell => cell.textContent = '');
    }
    
    console.log('✅ Sibling data populated successfully');
  } else {
    console.log('ℹ️ No siblings to display - clearing all data rows');
    
    // Clear all sibling data rows (leave header intact)
    if (siblingTable) {
      const rows = siblingTable.querySelectorAll('tr');
      for (let i = 1; i < rows.length; i++) {  // Start from 1 to skip header
        const cells = rows[i].querySelectorAll('td');
        cells.forEach(cell => cell.textContent = '');
      }
    }
  }
} catch (err) {
  console.error("❌ Error populating sibling data:", err);
}


// ====== SOCIO-ECONOMIC / OTHER INFORMATION ======
const socioEconomicData = JSON.parse(localStorage.getItem('socioEconomicData') || '{}');
console.log('📦 Socio-economic data loaded:', socioEconomicData);

const otherInfoSection = document.querySelector('.other-info-section');

if (otherInfoSection && socioEconomicData) {
  const checkboxLines = otherInfoSection.querySelectorAll('.checkbox-line');
  
  // First member in family (line 0)
  if (checkboxLines[0] && socioEconomicData.firstMember) {
    const isYes = socioEconomicData.firstMember === "Yes";
    checkboxLines[0].querySelector('.other-check').innerHTML = 
      isYes ? '☑ <i>Yes</i> ☐ <i>No</i>' : '☐ <i>Yes</i> ☑ <i>No</i>';
  }
  
  // 4Ps Program (line 1)
  if (checkboxLines[1] && socioEconomicData.fourPs) {
    const isYes = socioEconomicData.fourPs === "Yes";
    checkboxLines[1].querySelector('.other-check').innerHTML = 
      isYes ? '☑ <i>Yes</i> ☐ <i>No</i>' : '☐ <i>Yes</i> ☑ <i>No</i>';
  }
  
  // Indigenous group (line 2)
  if (checkboxLines[2]) {
    const isYes = socioEconomicData.indigenous === "Yes";
    let indigenousText = isYes ? '☑ <i>Yes</i> ☐ <i>No</i>' : '☐ <i>Yes</i> ☑ <i>No</i>';
    
    if (isYes) {
      const group = socioEconomicData.indigenousGroup === "Others" 
        ? socioEconomicData.indigenousOther 
        : socioEconomicData.indigenousGroup;
      indigenousText += ` &nbsp;&nbsp; If yes, please identify: <u>${group || 'N/A'}</u>`;
    } else {
      indigenousText += ` &nbsp;&nbsp; If yes, please identify: <u>N/A</u>`;
    }
    
    checkboxLines[2].querySelector('.other-check').innerHTML = indigenousText;
  }
  
  // LGBTQIA+ (line 3)
  if (checkboxLines[3] && socioEconomicData.lgbtqia) {
    const isYes = socioEconomicData.lgbtqia === "Yes";
    const isPrefer = socioEconomicData.lgbtqia === "Prefer not to say";
    
    if (isYes) {
      checkboxLines[3].querySelector('.other-check').innerHTML = 
        '☑ <i>Yes</i> ☐ <i>No</i> ☐ <i>Prefer not to say</i>';
    } else if (isPrefer) {
      checkboxLines[3].querySelector('.other-check').innerHTML = 
        '☐ <i>Yes</i> ☐ <i>No</i> ☑ <i>Prefer not to say</i>';
    } else {
      checkboxLines[3].querySelector('.other-check').innerHTML = 
        '☐ <i>Yes</i> ☑ <i>No</i> ☐ <i>Prefer not to say</i>';
    }
  }
  
  // Internally Displaced Person (line 4)
  if (checkboxLines[4]) {
    const isYes = socioEconomicData.idp === "Yes";
    let idpText = isYes ? '☑ <i>Yes</i> ☐ <i>No</i>' : '☐ <i>Yes</i> ☑ <i>No</i>';
    
    if (isYes && socioEconomicData.idpDetails) {
      idpText += ` &nbsp;&nbsp; If yes, please provide some details: <u>${socioEconomicData.idpDetails}</u>`;
    } else {
      idpText += ` &nbsp;&nbsp; If yes, please provide some details: <u>N/A</u>`;
    }
    
    checkboxLines[4].querySelector('.other-check').innerHTML = idpText;
  }
  
  // Person with Disability (line 5)
  if (checkboxLines[5] && socioEconomicData.pwd) {
    const isYes = socioEconomicData.pwd === "Yes";
    let pwdText = isYes ? '☑ <i>Yes</i> ☐ <i>No</i>' : '☐ <i>Yes</i> ☑ <i>No</i>';
    
    if (isYes && socioEconomicData.disabilities && socioEconomicData.disabilities.length > 0) {
      pwdText += ` &nbsp;&nbsp; If yes, please identify: <u>${socioEconomicData.disabilities.join(', ')}</u>`;
    } else if (isYes) {
      pwdText += ` &nbsp;&nbsp; If yes, please identify: <u>N/A</u>`;
    }
    
    checkboxLines[5].querySelector('.other-check').innerHTML = pwdText;
  }
  
  // Solo Parent (line 6)
  if (checkboxLines[6] && socioEconomicData.soloParent) {
    const isYes = socioEconomicData.soloParent === "Yes";
    checkboxLines[6].querySelector('.other-check').innerHTML = 
      isYes ? '☑ <i>Yes</i> ☐ <i>No</i>' : '☐ <i>Yes</i> ☑ <i>No</i>';
  }
  

// Monthly Family Income - FINAL FIX (Normalized comparison)
  if (socioEconomicData.monthlyIncome) {
    console.log('💰 Income value to find:', socioEconomicData.monthlyIncome);
    
    // Find the div that contains "Estimated Monthly Family Income"
    let incomeContainer = null;
    
    otherInfoSection.querySelectorAll('div').forEach(div => {
      if (div.querySelector('strong') && div.querySelector('strong').textContent.includes('Estimated Monthly Family Income')) {
        // Get the div with margin-left:20px that comes right after
        incomeContainer = div.querySelector('div[style*="margin-left:20px"]');
      }
    });
    
    console.log('🔍 Income container found:', !!incomeContainer);
    
    if (incomeContainer) {
      // Get all direct child divs (the income options)
      const incomeDivs = Array.from(incomeContainer.children).filter(el => el.tagName === 'DIV');
      
      console.log('📊 Found', incomeDivs.length, 'income options');
      
      let found = false;
      
      incomeDivs.forEach((div, index) => {
        const text = div.textContent.trim();
        // Remove checkbox symbol at the start
        const cleanText = text.replace(/^[☐☑]\s*/, '').trim();
        
        // Normalize whitespace AND normalize "to less than" / "less than" variations
        const normalizedClean = cleanText
          .replace(/\s+/g, ' ')
          .replace(/\bto\s+less\b/g, 'less')
          .toLowerCase();
        
        const normalizedIncome = socioEconomicData.monthlyIncome
          .replace(/\s+/g, ' ')
          .replace(/\bto\s+less\b/g, 'less')
          .toLowerCase();
        
        console.log(`Option ${index}: "${normalizedClean}"`);
        console.log(`  Comparing to: "${normalizedIncome}"`);
        console.log(`  Match: ${normalizedClean === normalizedIncome}`);
        
        // Use textContent for safer text assignment
        if (normalizedClean === normalizedIncome) {
          console.log('✅ MATCHED!', cleanText);
          div.textContent = '☑ ' + cleanText;
          found = true;
        } else {
          div.textContent = '☐ ' + cleanText;
        }
      });
      
      if (!found) {
        console.warn('⚠️ No matching income found');
        console.warn('Stored value (normalized):', normalizedIncome);
      }
    } else {
      console.log('❌ Income container not found');
    }
  }

  console.log('✅ Socio-economic data populated in form preview');
}

      // 🔥 LOAD SAVED PHOTO - FIXED VERSION
      setTimeout(() => {
        const savedPhoto = localStorage.getItem("savedPhoto");
        const photoBox = document.getElementById("photoPreview");
        
        console.log('🔍 Checking for saved photo...');
        console.log('Photo exists:', !!savedPhoto);
        console.log('PhotoBox element found:', !!photoBox);
        
        if (savedPhoto && photoBox) {
          photoBox.innerHTML = "";
          photoBox.style.backgroundImage = `url('${savedPhoto}')`;
          photoBox.style.backgroundSize = "cover";
          photoBox.style.backgroundPosition = "center";
          photoBox.style.backgroundRepeat = "no-repeat";
          
          console.log('✅ Photo loaded successfully in form preview');
        } else {
          console.log('❌ Photo loading failed');
        }
      }, 100);

   console.log('✅ Form populated successfully from localStorage');  // ADD THIS LINE

    } catch (error) {
      console.error('Error populating form:', error);
    }
  }

  // Run on page load
  populateForm();

  // ====== Initial render ======
  updateSteps();
});
