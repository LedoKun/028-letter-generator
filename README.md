# Clinical Letter Generators

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Clinical Letter Generators is a web-based application designed to streamline the creation of common medical documents. It currently offers tools for generating Patient Referral Letters, Certificates for Carrying Medications, and general Medical Certificates.

**GitHub Repository:** [https://github.com/LedoKun/028-letter-generator](https://github.com/LedoKun/028-letter-generator)
**Docker Image:** `ghcr.io/ledokun/028-letter-generator:latest`

## Features

* **Multiple Document Types:**
    * **Patient Referral Letter Generator:** Create comprehensive patient referral letters.
    * **Certificate for Carrying Medications Generator:** Generate certificates for patients needing to carry medications, especially for travel.
    * **Medical Certificate Generator:** Produce general medical certificates for various purposes like sick leave or fitness.
* **Dynamic Form Input:** User-friendly forms for entering patient details, medical history, and other relevant information for each document type.
* **Detailed Medical History Sections (Referral Letter):**
    * Retroviral Infection (including NAP-ID, diagnosis date, CD4 counts, viral load, ART medications, and TMX/SMP prophylaxis).
    * Active Syphilis (with automatic calculation of treatment dose schedule).
    * HBV Co-infection.
    * HCV Co-infection (Active/Untreated).
    * Treated Syphilis.
    * Treated HCV (medication and completion date).
    * Treated TB (sites, medication, and completion date).
    * Completed TPT (medication and completion date).
    * Other Medical History.
    * Option for referral for admission.
* **Medical Certificate Specifics:**
    * Patient identification including salutation, gender, age, and optional Passport/ID numbers.
    * Optional sections for consultation details, diagnosis, advised rest period (with automatic duration calculation), history of Syphilis or TB treatment, and general doctor's comments.
    * Date fields for optional sections default to today's date when enabled.
    * Auto-formatting for Thai National ID input.
* **Certificate for Carrying Medications Specifics:**
    * Patient identification including salutation (with "Other" option), nationality (with "Other" option), and passport number.
    * List of current medications (generic names).
* **Medication Management (Referral & Med Carry Cert):**
    * Dynamically add multiple medications with details like dosage and timing (for referral) or generic names (for med carry cert).
* **Bilingual Support:** Interface elements and generated letter content often include both Thai and English.
* **Date Handling:**
    * Supports Buddhist Era (พ.ศ.) date inputs for referral and medical certificates, with automatic conversion to Christian Era (ค.ศ.) in the output.
    * Supports Christian Era (ค.ศ.) date inputs for the medication carrying certificate.
    * Automatic formatting of date inputs as users type.
    * Printed documents include "Printed on" date and time (ISO format for time).
* **Doctor Information:** Saves doctor's name (Thai and English) and medical license number in browser `localStorage` for convenience across all generators.
* **Print Preview:** Generates a preview of the documents formatted for A4 paper, ready for printing.
* **Theming:** Dark mode interface for comfortable use.
* **Responsive Design:** Accessible on various screen sizes.

## Technologies Used

* HTML5
* CSS3 (including Tailwind CSS for base styling and utilities)
* JavaScript (for form logic, data handling, dynamic content, and date/ID formatting)
* Paged.js (for print formatting of generated documents)

## Getting Started

### Using Docker

The easiest way to run the Clinical Letter Generators is by using the provided Docker image.

1.  **Pull the Docker image:**
    ```bash
    docker pull ghcr.io/ledokun/028-letter-generator:latest
    ```

2.  **Run the Docker container:**
    ```bash
    docker run -d -p 4000:4000 ghcr.io/ledokun/028-letter-generator:latest
    ```
    (You can replace `4000` with any port you prefer on your host machine.)

3.  **Access the application:**
    Open your web browser and navigate to `http://localhost:4000`.

### Manual Setup (from GitHub)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/LedoKun/028-letter-generator.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd 028-letter-generator
    ```
3.  **Serve the HTML files:**
    You can serve the files using any simple HTTP server. For example, using Python's built-in server:
    * Python 3: `python -m http.server`
    * Python 2: `python -m SimpleHTTPServer`
    Or use a tool like `live-server` for Visual Studio Code.

4.  **Access the application:**
    Open `public/index.html` in your web browser (e.g., `http://localhost:8000/public/` if using Python's server and you are in the root `028-letter-generator` directory).

## Usage

1.  Navigate to the application in your web browser.
2.  Select the desired document generator from the main page:
    * Patient Referral Letter (`referral/index.html`)
    * Certificate for Carrying Medications (`certificate-medication-letter/index.html`)
    * Medical Certificate (`medical-certificate/index.html`)
3.  Fill in the required and relevant optional information in the form.
4.  Doctor's information, once entered, will be saved locally in the browser for future use.
5.  Click the "ดูตัวอย่างและพิมพ์ / Preview & Print" button.
6.  A new browser tab or window will open with the formatted document. The print dialog should appear automatically.

## License

This project is licensed under the MIT License. See the [LICENSE](https://opensource.org/licenses/MIT) file for details.