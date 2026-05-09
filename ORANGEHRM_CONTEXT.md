# **AutoTest Studio: OrangeHRM Project Context**

## **1. Project Mission**
AutoTest Studio is a no-code automation platform. The current target application for validation and demonstration is **OrangeHRM**.

## **2. Target Application**
*   **Application Name:** OrangeHRM (Demo)
*   **Base URL:** `https://opensource-demo.orangehrmlive.com/web/index.php/auth/login`
*   **Default Credentials:** `Admin` / `admin123`

## **3. Active Scenario**
*   **File:** `orangehrm_scenario.xlsx` (mirrored as `scenario_uploaded.xlsx`)
*   **Scenarios Covered:**
    1.  **Successful Admin Login:** Verifies dashboard redirection.
    2.  **Navigate to My Info:** Verifies access to personal details.
    3.  **Invalid Login Attempt:** Verifies error message visibility.

## **4. Technical Configuration**
*   **Mappings:** `core/mappings.json` contains verified selectors for OrangeHRM (Username, Password, Login Button, My Info Tab, etc.).
*   **SIT/UAT Status:** **100% Pass** (3 Scenarios).
*   **Recording Base URL:** Set to OrangeHRM login page in Studio UI.

## **5. Operational Flow**
1.  **Start Studio:** `npm run studio`
2.  **Access:** http://localhost:3000
3.  **Test:** `npm test` (Runs OrangeHRM scenarios).
4.  **Results:** Screenshots and logs captured in `results/A_1`, `results/A_2`, and `results/B_1`.

---
**Project is 100% Certified for OrangeHRM.**
