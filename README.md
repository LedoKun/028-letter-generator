# Clinical Letter Generators

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Clinical Letter Generators is a web-based application designed to streamline the creation of medical documents. The primary tool currently available is a Patient Referral Letter Generator.

**GitHub Repository:** [https://github.com/LedoKun/028-letter-generator](https://github.com/LedoKun/028-letter-generator)
**Docker Image:** `ghcr.io/ledokun/028-letter-generator:latest`

## Features

* **Patient Referral Letter Generation:** Create comprehensive patient referral letters.
* **Dynamic Form Input:** User-friendly form for entering patient details, medical history, and referral information.
* **Detailed Medical History Sections:**
    * Retroviral Infection (including NAP-ID, diagnosis date, CD4 counts, viral load, ART medications, and TMX/SMP prophylaxis).
    * Active Syphilis (with automatic calculation of treatment dose schedule).
    * HBV Co-infection.
    * HCV Co-infection (Active).
    * Treated Syphilis.
    * Treated HCV (medication and completion date).
    * Treated TB (sites, medication, and completion date).
    * Completed TPT (medication and completion date).
    * Other Medical History.
* **Medication Management:**
    * Dynamically add multiple ART medications with dosage and timing.
* **Additional Information:**
    * Record the last medicine pickup date and duration of medication provided.
    * Specify attachments to the letter (e.g., latest laboratory results, other documents).
* **Bilingual Support:** Interface and generated letter content include both Thai and English.
* **Date Handling:** Supports Buddhist Era (พ.ศ.) date inputs with automatic conversion to Christian Era (ค.ศ.) where appropriate.
* **Doctor Information:** Saves doctor's name (Thai and English) and medical license number in browser localStorage for convenience on subsequent uses.
* **Print Preview:** Generates a preview of the letter formatted for A4 paper, ready for printing.
* **Theming:** Dark mode interface for comfortable use.
* **Responsive Design:** Accessible on various screen sizes.

## Technologies Used

* HTML5
* CSS3 (including Tailwind CSS for styling)
* JavaScript (for form logic, data handling, and dynamic content)
* Paged.js (for print formatting)

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
    Open `index.html` in your web browser (e.g., `http://localhost:8000` if using Python's server on default port).
    * The Patient Referral Letter Generator can be accessed via the link on the main page or directly at `referral/index.html`

## Usage

1.  Navigate to the application in your web browser.
2.  Click on "Open Generator" for the "หนังสือส่งตัวผู้ป่วย" (Patient Referral Letter Generator).
3.  Fill in the required information in the form:
    * General Information (Date, Patient Name, DOB, National ID, Passport Number).
    * Select and fill in details for relevant medical conditions.
    * Provide information on ART medications and prophylaxis if applicable.
    * Add details about the last medicine pickup and any attachments.
    * Enter the referring doctor's information (this will be saved locally for future use).
4.  Click the "ดูตัวอย่างและพิมพ์ / Preview & Print" button.
5.  A new browser tab or window will open with the formatted letter. The print dialog should appear automatically.

## License

This project is licensed under the MIT License. See the [LICENSE](https://opensource.org/licenses/MIT) file for details.
