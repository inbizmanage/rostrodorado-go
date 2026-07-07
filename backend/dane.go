package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"unicode"
)

type DaneMatch struct {
	CityCode  string `json:"cityCode"`
	StateCode string `json:"stateCode"`
}

type DaneCode struct {
	Dept    string
	City    string
	Code    string
	IsoDept string
}

var daneCache []DaneCode

const OriginCode = "44001000"
const OriginState = "44"

// normalize normalizes strings for robust matching (removes accents, keeps alphanumeric only, uppercase)
func normalize(s string) string {
	var sb strings.Builder
	for _, r := range strings.ToUpper(s) {
		switch r {
		case 'Á':
			sb.WriteRune('A')
		case 'É':
			sb.WriteRune('E')
		case 'Í':
			sb.WriteRune('I')
		case 'Ó':
			sb.WriteRune('O')
		case 'Ú', 'Ü':
			sb.WriteRune('U')
		case 'Ñ':
			sb.WriteRune('N')
		default:
			if unicode.IsLetter(r) || unicode.IsDigit(r) {
				sb.WriteRune(r)
			}
		}
	}
	return sb.String()
}

// LoadDaneCodes parses the tab-separated dane_codes.csv file
func LoadDaneCodes(filePath string) ([]DaneCode, error) {
	if len(daneCache) > 0 {
		return daneCache, nil
	}

	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open DANE file: %w", err)
	}
	defer file.Close()

	var codes []DaneCode
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}

		parts := strings.Split(line, "\t")
		if len(parts) < 4 {
			continue
		}

		deptName := strings.TrimSpace(parts[1])
		cityCode := strings.TrimSpace(parts[2])
		cityName := strings.TrimSpace(parts[3])
		isoDept := strings.TrimSpace(parts[0])

		codes = append(codes, DaneCode{
			Dept:    deptName,
			City:    cityName,
			Code:    cityCode + "000", // Append 000 for Envia/Envioclick compatibility
			IsoDept: isoDept,
		})
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading DANE file: %w", err)
	}

	daneCache = codes
	return codes, nil
}

// FindDaneCode matches city and department to get the DANE code
func FindDaneCode(city, department string, daneCodes []DaneCode) *DaneMatch {
	searchCity := normalize(city)
	searchDept := normalize(department)

	// Special Case: Bogota often listed under Cundinamarca in lists but is Dept 11 in DANE
	if strings.Contains(searchCity, "BOGOTA") && strings.Contains(searchDept, "CUNDINAMARCA") {
		searchDept = "BOGOTA"
	}
	if searchDept == "BOGOTA" || searchDept == "BOGOTADC" {
		searchDept = "BOGOTA"
	}

	for _, c := range daneCodes {
		cCityNorm := normalize(c.City)
		cDeptNorm := normalize(c.Dept)

		// Check Department
		deptMatch := strings.Contains(cDeptNorm, searchDept) || strings.Contains(searchDept, cDeptNorm)
		if !deptMatch {
			continue
		}

		// Check City
		cityMatch := cCityNorm == searchCity || strings.Contains(cCityNorm, searchCity) || strings.Contains(searchCity, cCityNorm)
		if cityMatch {
			return &DaneMatch{
				CityCode:  c.Code,
				StateCode: c.IsoDept,
			}
		}
	}

	return nil
}
