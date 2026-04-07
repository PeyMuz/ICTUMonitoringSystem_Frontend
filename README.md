# ICTU Inventory Monitoring System - Frontend

This repository contains the client-side user interface for the ICTU Inventory Monitoring System. It is a modernized, responsive, and role-based dashboard designed to track equipment, manage purchase requests, and monitor item deployment across the department.

## 🚀 Key Features
* **Role-Based Access Control (RBAC):** UI elements securely adapt based on the logged-in user's role (Master, Administrator, Employee, Guest).
* **Live Background Polling:** Sockets/Intervals silently keep the dashboard and Master Control Center updated in real-time.
* **Mobile-Optimized:** Fully responsive design that gracefully stacks data cards and hides sidebars on smaller screens without breaking DataTables.
* **Premium UX/UI:** Features an interactive Dark/Light mode, fluid skeleton loaders during API fetches, and a session-based Notification Center.
* **Advanced Data Handling:** Includes a custom client-side CSV bulk importer with automated date sanitization, and a "Soft Delete" system with a 5-second undo safety net.

## 🛠️ Tech Stack
* **HTML5 / CSS3 / Vanilla JavaScript**
* **Bootstrap 5:** For grid layouts and modal components.
* **DataTables:** For high-performance, client-side table filtering, sorting, and exporting.
* **Chart.js:** For dashboard analytics visualization.
* **PapaParse:** For fast, reliable CSV bulk data importing.

## ⚙️ Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/PeyMuz/ICTUMonitoringSystem_Frontend.git](https://github.com/PeyMuz/ICTUMonitoringSystem_Frontend.git)
   ```
2. **Checkout the redesign branch:**
   ```bash
   git checkout ui-redesign
   ```
3. **Configure the API URL:**
   Open `index.js` and ensure the `API_BASE_URL` at the top of the file matches your running backend port (default is usually `https://localhost:7040/api`).
4. **Run the App:**
   Because this uses standard web technologies, you can open `log.html` directly in your browser, or use a tool like VS Code's "Live Server" extension for the best development experience.