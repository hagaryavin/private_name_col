// -----------------------------
//  רשימת תארים – ברירת מחדל
// -----------------------------
const defaultTitles = `
ד"ר
ד״ר
דוקטור
פרופסור
פרופ'
Dr.
הרב
עו"ד
עו״ד
`.trim();

window.addEventListener("DOMContentLoaded", () => {
    const titlesBox = document.getElementById("titlesBox");
    const titlesContainer = document.getElementById("titlesContainer");
    const toggleTitlesBtn = document.getElementById("toggleTitlesBtn");
    const processBtn = document.getElementById("processBtn");
    const fileInput = document.getElementById("fileInput");
    const downloadLink = document.getElementById("downloadLink");

    // טעינת רשימת תארים מה-localStorage או ברירת מחדל
    const saved = localStorage.getItem("titlesList");
    titlesBox.value = saved || defaultTitles;

    // לוודא שבהתחלה זה סגור
    titlesContainer.classList.add("hidden");

    // שמירה אוטומטית של רשימת התארים
    titlesBox.addEventListener("input", () => {
        localStorage.setItem("titlesList", titlesBox.value);
    });

    // כפתור הצגה/הסתרה של רשימת התארים
    toggleTitlesBtn.addEventListener("click", () => {
        titlesContainer.classList.toggle("hidden");
    });

    // כפתור עיבוד קובץ
    processBtn.addEventListener("click", () => {
        const file = fileInput.files[0];
        if (!file) {
            alert("אנא העלה קובץ");
            return;
        }

        const titles = titlesBox.value
            .split("\n")
            .map(t => t.trim())
            .filter(t => t.length > 0);

        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".csv")) {
            processCSV(file, titles, downloadLink);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            processXLSX(file, titles, downloadLink);
        } else {
            alert("פורמט לא נתמך");
        }
    });
});


// -----------------------------
//  עיבוד CSV
// -----------------------------
function processCSV(file, titles, downloadLink) {
    Papa.parse(file, {
        header: true,
        complete: function(results) {
            const data = results.data;
            addFirstNameColumn(data, titles);
            downloadCSV(data, file.name, downloadLink);
        }
    });
}


// -----------------------------
//  עיבוד Excel (XLSX)
// -----------------------------
function processXLSX(file, titles, downloadLink) {
    const reader = new FileReader();

    reader.onload = function(e) {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        let data = XLSX.utils.sheet_to_json(sheet);
        addFirstNameColumn(data, titles);

        const newSheet = XLSX.utils.json_to_sheet(data);
        const newWB = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWB, newSheet, "Sheet1");

        downloadXLSX(newWB, file.name, downloadLink);
    };

    reader.readAsBinaryString(file);
}


// -----------------------------
//  הוספת עמודת "שם פרטי"
// -----------------------------
function addFirstNameColumn(data, titles) {
    data.forEach(row => {
        const fullName = row["שם"] || "";
        const parts = fullName.trim().split(/\s+/);

        if (parts.length === 0) {
            row["שם פרטי"] = "";
        } else if (titles.includes(parts[0]) && parts.length > 1) {
            row["שם פרטי"] = parts[1];
        } else {
            row["שם פרטי"] = parts[0];
        }
    });
}


// -----------------------------
//  הורדת CSV עם BOM לעברית
// -----------------------------
function downloadCSV(data, originalName, downloadLink) {
    const newCsv = Papa.unparse(data);

    const bom = "\uFEFF";
    const blob = new Blob([bom + newCsv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);

    const baseName = originalName.replace(/\.[^/.]+$/, "");
    downloadLink.download = baseName + "_with_private_names.csv";

    downloadLink.href = url;
    downloadLink.style.display = "inline";
    downloadLink.textContent = "להוריד קובץ חדש";
}


// -----------------------------
//  הורדת XLSX
// -----------------------------
function downloadXLSX(workbook, originalName, downloadLink) {
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    const url = URL.createObjectURL(blob);

    const baseName = originalName.replace(/\.[^/.]+$/, "");
    downloadLink.download = baseName + "_with_private_names.xlsx";

    downloadLink.href = url;
    downloadLink.style.display = "inline";
    downloadLink.textContent = "להוריד קובץ חדש";
}
