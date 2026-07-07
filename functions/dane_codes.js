const fs = require('fs');
const path = require('path');
// const csv = require('csv-parser'); // usage if we had the lib, but standard node fs split is easier for simple CSVs without deps
// We will use native FS and Split to avoid adding new dependencies if possible, or just readSync.

let daneCache = null;

const loadDaneCodes = () => {
    if (daneCache) return daneCache;

    try {
        const filePath = path.join(__dirname, 'dane_codes.csv');
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const codes = [];
        const lines = fileContent.split('\n');

        lines.forEach(line => {
            if (!line.trim()) return;
            // Format: 05	ANTIOQUIA	05001	MEDELLÍN	Municipio	-75,581775	6,246631 (Tab separated)
            // But wait, my previous write was TAB separated? Let's check the write_to_file calls.
            // Yes, looked like tab or space. The user provided list seemed tab separated.
            // Let's assume Tab or 4 spaces.

            const parts = line.split('\t');
            if (parts.length < 4) return;

            // parts[0] = Dept Code (05)
            // parts[1] = Department Name (ANTIOQUIA)
            // parts[2] = City Code (05001) -> IMPORTANT: This is 5 digit. Envia needs 8 digit? 
            // The user provided list had 5 digit codes mostly? 
            // Wait, in the test I appended '000'.
            // "05001" -> "05001000" confirmed working.

            const deptName = parts[1].trim();
            const cityCode = parts[2].trim();
            const cityName = parts[3].trim();

            codes.push({
                dept: deptName,
                city: cityName,
                code: cityCode + '000', // Append 000 for Envia
                isoDept: parts[0].trim() // ISO often matches the DANE dept code for numbers? 
                // Using 2-digit Dept code for "state" field in Envia seems to work (e.g. 44 for La Guajira)
            });
        });

        daneCache = codes;
        return codes;
    } catch (error) {
        console.error("Error loading DANE codes:", error);
        return [];
    }
};

const findDaneCode = (city, department) => {
    const codes = loadDaneCodes();

    // Helper to aggressive normalize: BOGOTÁ, D.C. -> BOGOTADC
    const aggressiveNorm = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

    let searchCity = aggressiveNorm(city);
    let searchDept = aggressiveNorm(department);

    // Special Case: Bogota often listed under Cundinamarca in lists but is Dept 11 in DANE
    if (searchCity.includes("BOGOTA") && searchDept.includes("CUNDINAMARCA")) {
        searchDept = "BOGOTA";
    }
    // Special Case: Bogota DC vs Bogota
    if (searchDept === "BOGOTA" || searchDept === "BOGOTADC") {
        searchDept = "BOGOTA"; // Match generic
    }

    const match = codes.find(c => {
        const cName = aggressiveNorm(c.city);
        const dName = aggressiveNorm(c.dept);

        // Check Dept
        const deptMatch = dName.includes(searchDept) || searchDept.includes(dName);

        if (!deptMatch) return false;

        // Check City
        return cName === searchCity || cName.includes(searchCity) || searchCity.includes(cName);
    });

    if (match) {
        return {
            cityCode: match.code,
            stateCode: match.isoDept
        };
    }
    return null;
};

// Riohacha default
const ORIGIN_CODE = "44001000";
const ORIGIN_STATE = "44";

module.exports = {
    findDaneCode,
    loadDaneCodes,
    ORIGIN_CODE,
    ORIGIN_STATE
};
