<style>
/* Font formatting sourced from SRS_UpsideDine_By_HiveMinds-2.pdf */

@page {
  margin-top: 1.2in;
  margin-bottom: 1in;
  margin-left: 1in;
  margin-right: 1in;
  @top-left {
    content: "Implementation Document for UpsideDine";
    font-family: "Times New Roman", Times, serif;
    font-weight: bold;
    font-style: italic;
    font-size: 10pt;
    border-bottom: 3px solid black;
    vertical-align: bottom;
    padding-bottom: 4px;
    margin-bottom: 2px;
  }
  @top-center {
    content: "";
    border-bottom: 3px solid black;
    margin-bottom: 2px;
  }
  @top-right {
    content: "Page " counter(page);
    font-family: "Times New Roman", Times, serif;
    font-weight: bold;
    font-style: italic;
    font-size: 10pt;
    border-bottom: 3px solid black;
    vertical-align: bottom;
    padding-bottom: 4px;
    white-space: nowrap;
    margin-bottom: 2px;
  }
}

/* Fallback header for tools that support running headers via standard fixed position */
header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  border-bottom: 1.5px solid black !important;
  font-family: "Times New Roman", Times, serif !important;
  font-weight: bold !important;
  font-style: italic !important;
  font-size: 10pt !important;
  display: flex !important;
  justify-content: space-between !important;
  padding-bottom: 4px !important;
}

.markdown-body, body, p, ul, ol, li {
  font-family: "Arial", sans-serif !important;
  font-size: 11pt !important;
  line-height: 1.5 !important;
  color: #000 !important;
}

.markdown-body pre, pre {
  background-color: #f6f8fa !important;
  padding: 12px !important;
  font-family: "Arial", sans-serif !important;
  font-size: 10pt !important;
  font-weight: bold !important;
  line-height: 1.5 !important;
  border-radius: 4px !important;
  overflow-x: auto !important;
}

.markdown-body pre code, pre code {
  font-family: "Arial", sans-serif !important;
  font-size: 10pt !important;
  font-weight: bold !important;
  background-color: transparent !important;
  padding: 0 !important;
}

.markdown-body code, code {
  font-family: "Arial", sans-serif !important;
  font-size: 10pt !important;
  font-weight: bold !important;
  background-color: #f6f8fa !important;
  padding: 0.2em 0.4em !important;
  border-radius: 3px !important;
}

/* Main Section Headings (H1) */
.markdown-body h1, h1 {
  page-break-before: always !important;
  background-color: #444444 !important;
  color: #ffffff !important;
  text-align: center !important;
  font-family: "Arial", sans-serif !important;
  font-size: 18pt !important;
  font-weight: bold !important;
  padding: 4px 8px !important;
  margin-top: 10pt !important;
  margin-bottom: 12pt !important;
  border: 1px solid #000000 !important;
}

.markdown-body h2, h2 {
  font-family: "Times New Roman", Times, serif !important;
  font-size: 14pt !important;
  font-weight: bold !important;
  margin-top: 20pt !important;
  margin-bottom: 10pt !important;
}

.markdown-body h3, h3 {
  font-family: "Times New Roman", Times, serif !important;
  font-size: 13pt !important;
  font-weight: bold !important;
  margin-top: 16pt !important;
  margin-bottom: 8pt !important;
}

.markdown-body h4, .markdown-body h5, .markdown-body h6, h4, h5, h6 {
  font-family: "Arial", sans-serif !important;
  font-size: 11pt !important;
  font-weight: bold !important;
  margin-top: 14pt !important;
  margin-bottom: 8pt !important;
}

.markdown-body table, table {
  font-family: "Arial", sans-serif !important;
  font-size: 11pt !important;
  border-collapse: collapse !important;
  width: 100% !important;
  margin-top: 12pt !important;
  margin-bottom: 12pt !important;
}

.markdown-body th, .markdown-body td, th, td {
  border: 1px solid #000000 !important;
  padding: 8px !important;
  text-align: left !important;
}

.markdown-body th, th {
  background-color: #f2f2f2 !important;
  font-weight: bold !important;
}

.toc-header {
  background-color: #444444 !important;
  color: #ffffff !important;
  text-align: center !important;
  font-family: "Times New Roman", Times, serif !important;
  font-size: 16pt !important;
  font-weight: bold !important;
  padding: 4px 8px !important;
  border: 1px solid #000000 !important;
  margin-top: 10pt !important;
  margin-bottom: 20px !important;
}
.toc-body { font-family: "Times New Roman", Times, serif !important; margin-bottom: 40px !important; }
.toc-item a {
  display: flex !important;
  color: #000000 !important;
  text-decoration: none !important;
  font-size: 11pt !important;
  margin-bottom: 5px !important;
}
.toc-item.level-1 a { font-weight: bold !important; font-size: 12pt !important; margin-top: 10px !important; }
.toc-item.level-2 { padding-left: 20px !important; }
.toc-item.level-3 { padding-left: 40px !important; }
.toc-item .dots {
  flex-grow: 1 !important;
  border-bottom: 2px dotted #000000 !important;
  margin: 0 5px !important;
  position: relative !important;
  top: -4px !important;
}

</style>

<div style="text-align: right; margin-top: 10px;">
  <div style="font-family: Arial, sans-serif; font-size: 34pt; font-weight: bold;">Implementation Document</div>
  <div style="font-family: Arial, sans-serif; font-size: 18pt; font-weight: bold; margin-top: 25px;">for</div>
  <div style="font-family: Arial, sans-serif; font-size: 32pt; font-weight: bold; margin-top: 25px;">UpsideDine</div>
  <div style="font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; margin-top: 25px;">Version 1.0</div>
  <div style="font-family: Arial, sans-serif; font-size: 16pt; font-weight: bold; margin-top: 40px;">Prepared by</div>
</div>

<div style="margin-top: 40px;">
  <div style="display: flex; justify-content: space-between; font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; margin-bottom: 20px;">
    <div>Group #: 18</div>
    <div>Group Name: <span style="font-weight: normal;">Hiveminds</span></div>
  </div>
  <div style="display: flex; justify-content: space-between; font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; line-height: 1.6;">
    <div style="text-align: left;">
      Dheeraj Dagar<br>
      Divyansh Yadav<br>
      Hanny<br>
      Harshit Agarwal<br>
      Ayush Kumar<br>
      Karan Keer<br>
      Kaushal Mehra<br>
      Rohan Kumar<br>
      Shivam Kumar Shaw<br>
      Vivek meena
    </div>
    <div style="text-align: center;">
      220355<br>
      230387<br>
      230433<br>
      230458<br>
      230260<br>
      230531<br>
      230546<br>
      230866<br>
      230968<br>
      231172
    </div>
    <div style="text-align: right;">
      dheerajd22@iitk.ac.in<br>
      divyanshy23@iitk.ac.in<br>
      hanny23@iitk.ac.in<br>
      harshitag23@iitk.ac.in<br>
      ayushkumar23@iitk.ac.in<br>
      karank23@iitk.ac.in<br>
      kaushalm23@iitk.ac.in<br>
      rohanp23@iitk.ac.in<br>
      shivamshaw23@iitk.ac.in<br>
      vivekm23@iitk.ac.in
    </div>
  </div>
</div>

<div style="margin-top: 40px; display: grid; grid-template-columns: max-content max-content; gap: 8px 15px; justify-content: center; font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; line-height: 1.6;">
  <div style="text-align: right;">Course:</div>
  <div style="text-align: left; font-size: 12pt; display: flex; align-items: center;">CS253</div>
  <div style="text-align: right;">Mentor TA:</div>
  <div style="text-align: left; font-style: italic; font-size: 12pt; display: flex; align-items: center;">V Arvind</div>
  <div style="text-align: right;">Date:</div>
  <div style="text-align: left; font-size: 12pt; display: flex; align-items: center;">28 March 2026</div>
</div>

<div style="page-break-after: always;"></div>

<div class="toc-header">Contents</div>
<div class="toc-body">
  <div class="toc-item level-1"><a href="#1-implementation-details"><span class="name">1. IMPLEMENTATION DETAILS</span><span class="dots"></span><span class="page" id="page-1-implementation-details">5</span></a></div>
  <div class="toc-item level-2"><a href="#11-technology-stack"><span class="name">1.1 Technology Stack</span><span class="dots"></span><span class="page" id="page-11-technology-stack">5</span></a></div>
  <div class="toc-item level-3"><a href="#111-frontend-technologies"><span class="name">1.1.1 Frontend Technologies</span><span class="dots"></span><span class="page" id="page-111-frontend-technologies">5</span></a></div>
  <div class="toc-item level-3"><a href="#112-backend-technologies"><span class="name">1.1.2 Backend Technologies</span><span class="dots"></span><span class="page" id="page-112-backend-technologies">7</span></a></div>
  <div class="toc-item level-2"><a href="#12-system-architecture"><span class="name">1.2 System Architecture</span><span class="dots"></span><span class="page" id="page-12-system-architecture">10</span></a></div>
  <div class="toc-item level-3"><a href="#121-high-level-architecture"><span class="name">1.2.1 High-Level Architecture</span><span class="dots"></span><span class="page" id="page-121-high-level-architecture">10</span></a></div>
  <div class="toc-item level-3"><a href="#122-backend-architecture"><span class="name">1.2.2 Backend Architecture</span><span class="dots"></span><span class="page" id="page-122-backend-architecture">11</span></a></div>
  <div class="toc-item level-3"><a href="#123-frontend-architecture"><span class="name">1.2.3 Frontend Architecture</span><span class="dots"></span><span class="page" id="page-123-frontend-architecture">13</span></a></div>
  <div class="toc-item level-3"><a href="#124-ml-service-architecture"><span class="name">1.2.4 ML Service Architecture</span><span class="dots"></span><span class="page" id="page-124-ml-service-architecture">13</span></a></div>
  <div class="toc-item level-3"><a href="#125-database-design"><span class="name">1.2.5 Database Design</span><span class="dots"></span><span class="page" id="page-125-database-design">14</span></a></div>
  <div class="toc-item level-1"><a href="#2-codebase"><span class="name">2. CODEBASE</span><span class="dots"></span><span class="page" id="page-2-codebase">15</span></a></div>
  <div class="toc-item level-2"><a href="#21-github-repository"><span class="name">2.1 GitHub Repository</span><span class="dots"></span><span class="page" id="page-21-github-repository">15</span></a></div>
  <div class="toc-item level-2"><a href="#22-repository-structure"><span class="name">2.2 Repository Structure</span><span class="dots"></span><span class="page" id="page-22-repository-structure">15</span></a></div>
  <div class="toc-item level-2"><a href="#23-backend"><span class="name">2.3 Backend</span><span class="dots"></span><span class="page" id="page-23-backend">16</span></a></div>
  <div class="toc-item level-3"><a href="#231-backend-root-structure"><span class="name">2.3.1 Backend Root Structure</span><span class="dots"></span><span class="page" id="page-231-backend-root-structure">16</span></a></div>
  <div class="toc-item level-3"><a href="#232-top-level-files-and-what-they-do"><span class="name">2.3.2 Top-Level Files and What They Do</span><span class="dots"></span><span class="page" id="page-232-top-level-files-and-what-they-do">17</span></a></div>
  <div class="toc-item level-3"><a href="#233-project-level-configuration-in-config"><span class="name">2.3.3 Project-Level Configuration in config/</span><span class="dots"></span><span class="page" id="page-233-project-level-configuration-in-config">19</span></a></div>
  <div class="toc-item level-3"><a href="#234-global-request-routing"><span class="name">2.3.4 Global Request Routing</span><span class="dots"></span><span class="page" id="page-234-global-request-routing">21</span></a></div>
  <div class="toc-item level-3"><a href="#235-the-api-app"><span class="name">2.3.5 The api App</span><span class="dots"></span><span class="page" id="page-235-the-api-app">21</span></a></div>
  <div class="toc-item level-3"><a href="#236-the-appsusers-app"><span class="name">2.3.6 The apps/users App</span><span class="dots"></span><span class="page" id="page-236-the-appsusers-app">22</span></a></div>
  <div class="toc-item level-3"><a href="#237-the-appsmess-app"><span class="name">2.3.7 The apps/mess App</span><span class="dots"></span><span class="page" id="page-237-the-appsmess-app">25</span></a></div>
  <div class="toc-item level-3"><a href="#238-the-appscanteen-app"><span class="name">2.3.8 The apps/canteen App</span><span class="dots"></span><span class="page" id="page-238-the-appscanteen-app">29</span></a></div>
  <div class="toc-item level-3"><a href="#239-the-appsorders-app"><span class="name">2.3.9 The apps/orders App</span><span class="dots"></span><span class="page" id="page-239-the-appsorders-app">32</span></a></div>
  <div class="toc-item level-3"><a href="#2310-the-appspayments-app"><span class="name">2.3.10 The apps/payments App</span><span class="dots"></span><span class="page" id="page-2310-the-appspayments-app">34</span></a></div>
  <div class="toc-item level-3"><a href="#2311-the-appscrowd-app"><span class="name">2.3.11 The apps/crowd App</span><span class="dots"></span><span class="page" id="page-2311-the-appscrowd-app">36</span></a></div>
  <div class="toc-item level-3"><a href="#2312-cross-app-dependencies"><span class="name">2.3.12 Cross-App Dependencies</span><span class="dots"></span><span class="page" id="page-2312-cross-app-dependencies">38</span></a></div>
  <div class="toc-item level-3"><a href="#2313-best-reading-order-for-someone-new-to-the-backend"><span class="name">2.3.13 Best Reading Order for Someone New to the Backend</span><span class="dots"></span><span class="page" id="page-2313-best-reading-order-for-someone-new-to-the-backend">39</span></a></div>
  <div class="toc-item level-3"><a href="#2314-some-important-files-in-the-entire-backend"><span class="name">2.3.14 Some Important Files in the Entire Backend</span><span class="dots"></span><span class="page" id="page-2314-some-important-files-in-the-entire-backend">40</span></a></div>
  <div class="toc-item level-2"><a href="#24-frontend"><span class="name">2.4 Frontend</span><span class="dots"></span><span class="page" id="page-24-frontend">40</span></a></div>
  <div class="toc-item level-3"><a href="#241-frontend-directory-structure"><span class="name">2.4.1 Frontend Directory Structure</span><span class="dots"></span><span class="page" id="page-241-frontend-directory-structure">40</span></a></div>
  <div class="toc-item level-3"><a href="#242-frontend-routing-structure"><span class="name">2.4.2 Frontend Routing Structure</span><span class="dots"></span><span class="page" id="page-242-frontend-routing-structure">44</span></a></div>
  <div class="toc-item level-3"><a href="#243-frontend-feature-descriptions"><span class="name">2.4.3 Frontend Feature Descriptions</span><span class="dots"></span><span class="page" id="page-243-frontend-feature-descriptions">46</span></a></div>
  <div class="toc-item level-1"><a href="#3-completeness"><span class="name">3. COMPLETENESS</span><span class="dots"></span><span class="page" id="page-3-completeness">49</span></a></div>
  <div class="toc-item level-2"><a href="#31-srs-requirements-implementation-status"><span class="name">3.1 SRS Requirements Implementation Status</span><span class="dots"></span><span class="page" id="page-31-srs-requirements-implementation-status">49</span></a></div>
  <div class="toc-item level-3"><a href="#311-backend-completeness"><span class="name">3.1.1 Backend Completeness</span><span class="dots"></span><span class="page" id="page-311-backend-completeness">49</span></a></div>
  <div class="toc-item level-3"><a href="#312-frontend-completeness"><span class="name">3.1.2 Frontend Completeness</span><span class="dots"></span><span class="page" id="page-312-frontend-completeness">51</span></a></div>
  <div class="toc-item level-2"><a href="#32-future-development-plan"><span class="name">3.2 Future Development Plan</span><span class="dots"></span><span class="page" id="page-32-future-development-plan">52</span></a></div>
  <div class="toc-item level-3"><a href="#321-planned-features-for-version-20"><span class="name">3.2.1 Planned Features for Version 2.0</span><span class="dots"></span><span class="page" id="page-321-planned-features-for-version-20">52</span></a></div>
  <div class="toc-item level-3"><a href="#322-production-deployment-architecture"><span class="name">3.2.2 Production Deployment Architecture</span><span class="dots"></span><span class="page" id="page-322-production-deployment-architecture">53</span></a></div>
  <div class="toc-item level-1"><a href="#appendix-a---complete-api-endpoint-reference"><span class="name">Appendix A - Complete API Endpoint Reference</span><span class="dots"></span><span class="page" id="page-appendix-a---complete-api-endpoint-reference">56</span></a></div>
  <div class="toc-item level-2"><a href="#a1-base-api-endpoints"><span class="name">A.1 Base API Endpoints</span><span class="dots"></span><span class="page" id="page-a1-base-api-endpoints">56</span></a></div>
  <div class="toc-item level-2"><a href="#a2-authentication-and-user-endpoints"><span class="name">A.2 Authentication and User Endpoints</span><span class="dots"></span><span class="page" id="page-a2-authentication-and-user-endpoints">57</span></a></div>
  <div class="toc-item level-2"><a href="#a3-mess-endpoints"><span class="name">A.3 Mess Endpoints</span><span class="dots"></span><span class="page" id="page-a3-mess-endpoints">62</span></a></div>
  <div class="toc-item level-2"><a href="#a4-canteen-endpoints"><span class="name">A.4 Canteen Endpoints</span><span class="dots"></span><span class="page" id="page-a4-canteen-endpoints">72</span></a></div>
  <div class="toc-item level-2"><a href="#a5-order-endpoints"><span class="name">A.5 Order Endpoints</span><span class="dots"></span><span class="page" id="page-a5-order-endpoints">79</span></a></div>
  <div class="toc-item level-2"><a href="#a6-payment-endpoints"><span class="name">A.6 Payment Endpoints</span><span class="dots"></span><span class="page" id="page-a6-payment-endpoints">84</span></a></div>
  <div class="toc-item level-2"><a href="#a7-crowd-monitoring-endpoints"><span class="name">A.7 Crowd Monitoring Endpoints</span><span class="dots"></span><span class="page" id="page-a7-crowd-monitoring-endpoints">87</span></a></div>
  <div class="toc-item level-2"><a href="#a8-api-documentation-endpoints"><span class="name">A.8 API Documentation Endpoints</span><span class="dots"></span><span class="page" id="page-a8-api-documentation-endpoints">91</span></a></div>
  <div class="toc-item level-1"><a href="#appendix-b---group-log"><span class="name">Appendix B - Group Log</span><span class="dots"></span><span class="page" id="page-appendix-b---group-log">93</span></a></div>
</div>

---

<div style="page-break-before: always;"></div>
<div class="toc-header">Revisions</div>

<table style="width: 100%; border-collapse: collapse; border: 1px solid black !important; font-family: 'Times New Roman', Times, serif !important; font-size: 11pt !important;">
  <thead>
    <tr>
      <th style="border: 1px solid black !important; padding: 8px !important; font-weight: bold !important; text-align: left !important; background-color: white !important; color: black !important;">Version</th>
      <th style="border: 1px solid black !important; padding: 8px !important; font-weight: bold !important; text-align: left !important; background-color: white !important; color: black !important;">Primary Author(s)</th>
      <th style="border: 1px solid black !important; padding: 8px !important; font-weight: bold !important; text-align: left !important; background-color: white !important; color: black !important;">Description of Version</th>
      <th style="border: 1px solid black !important; padding: 8px !important; font-weight: bold !important; text-align: center !important; background-color: white !important; color: black !important;">Date Completed</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid black !important; padding: 8px !important; vertical-align: top !important;">Version 1.0</td>
      <td style="border: 1px solid black !important; padding: 8px !important; vertical-align: top !important; line-height: 1.5 !important;">
        Dheeraj Dagar<br>
        Divyansh Yadav<br>
        Hanny<br>
        Harshit Agarwal<br>
        Ayush Kumar<br>
        Karan Keer<br>
        Kaushal Mehra<br>
        Rohan Kumar<br>
        Shivam Kumar Shaw<br>
        Vivek Meena
      </td>
      <td style="border: 1px solid black !important; padding: 8px !important; vertical-align: top !important;">First Version of the Implementation Document</td>
      <td style="border: 1px solid black !important; padding: 8px !important; vertical-align: top !important; text-align: center !important;">28/03/2026</td>
    </tr>
  </tbody>
</table>

---

# 1. IMPLEMENTATION DETAILS

This section describes the programming languages, frameworks, libraries, database systems, and build tools used in the UpsideDine platform. The system requirements are derived from the Software Requirements Specification (SRS) document, and the overall system design follows the architecture outlined in the Design Specifications document.

## 1.1 Technology Stack

### 1.1.1 Frontend Technologies

| Technology | Version | Purpose | Justification |
|-----------|---------|---------|---------------|
| **React** | 18.2.0 | UI Library | Industry-standard component-based UI library with the largest ecosystem, excellent developer tooling, and virtual DOM for efficient rendering. Chosen over Vue.js for its larger community, more extensive third-party library support, and better TypeScript integration for future migration. |
| **Vite** | 5.0.11 | Build Tool and Dev Server | Provides near-instant Hot Module Replacement (HMR) and significantly faster build times compared to Create React App (Webpack). Uses native ES modules during development, resulting in sub-second startup times even for large codebases. |
| **Tailwind CSS** | 3.4.1 | Utility-first CSS Framework | Enables rapid UI development with utility classes, eliminating context-switching between HTML and CSS files. Produces smaller production bundles through automatic purging of unused styles. Chosen over Bootstrap for greater design flexibility and over vanilla CSS for development speed. |
| **React Router DOM** | 6.21.3 | Client-side Routing | The de-facto routing library for React SPAs. Provides declarative, component-based routing with support for nested routes, route guards, and lazy loading, all essential for our multi-role application. |
| **Axios** | 1.6.5 | HTTP Client | Provides interceptors for automatic JWT token attachment and refresh on 401 responses, request/response transformation, and better error handling compared to the native Fetch API. |
| **TanStack React Query** | 5.17.19 | Server State Management | Handles server-state caching, background refetching, pagination, and optimistic updates. Significantly reduces boilerplate compared to manually managing loading/error/data states with useEffect and useState. |
| **Zustand** | 4.5.0 | Client State Management | Lightweight (1.1 kB) state management with a simple hook-based API. Chosen over Redux for minimal boilerplate and over Context API for better performance (avoids unnecessary re-renders). Used for auth state, cart state, and notification state. |
| **Framer Motion** | 11.0.3 | Animations | Declarative animation library that integrates seamlessly with React's component lifecycle. Provides page transitions, micro-interactions, and gesture-based animations for a polished user experience. |
| **Recharts** | 2.10.4 | Data Visualization | React-native charting library built on D3.js. Used for crowd density history charts, order analytics, and revenue dashboards. Chosen over Chart.js for its React-first approach with composable chart components. |
| **React Hook Form + Zod** | 7.49.3 / 3.22.4 | Form Management and Validation | Minimizes re-renders during form input (uncontrolled components pattern). Zod provides schema-based, type-safe validation across registration, login, and checkout forms. |
| **Lucide React** | 0.309.0 | Icon Library | Provides 1400+ consistent, customizable SVG icons as React components. Tree-shakable, so only imported icons are included in the bundle. |
| **clsx + tailwind-merge** | 2.1.0 / 2.2.1 | Class Utilities | `clsx` conditionally joins class names; `tailwind-merge` intelligently resolves Tailwind CSS class conflicts. Together they power the `cn()` utility function used across all UI components. |
| **date-fns** | 3.3.1 | Date Utilities | Modular date utility library that only imports the functions used, unlike Moment.js which imports the entire library. Used for formatting timestamps, calculating durations, and date arithmetic. |
| **react-hot-toast** | 2.4.1 | Toast Notifications | Lightweight toast notification library with customizable styling and positioning. Provides success, error, and loading toasts for user feedback on async operations. |

### 1.1.2 Backend Technologies

| Technology | Version | Purpose | Justification |
|-----------|---------|---------|---------------|
| **Django** | 5.0.1 | Web Framework | Mature, batteries-included Python web framework with built-in ORM, admin panel, authentication system, and middleware support. Chosen over Flask for its opinionated structure that enforces consistency across a large team. |
| **Django REST Framework (DRF)** | 3.14.0 | REST API Layer | Provides serializers, viewsets, authentication backends, and permission classes for building RESTful APIs. Integrates tightly with Django's ORM for automatic model-to-JSON serialization. |
| **djangorestframework-simplejwt** | 5.3.1 | JWT Authentication | Handles JWT access and refresh token generation, validation, and blacklisting. Configured with 30-minute access tokens and 7-day refresh tokens. |
| **PostgreSQL** | 14-alpine | Primary Database | Enterprise-grade relational database with strong ACID compliance, JSON support, and excellent performance for complex queries. Used via Django's ORM with migrations for schema management. |
| **Redis** | 7-alpine | Cache, Message Broker, Session Store | In-memory data store used for OTP storage (with TTL), rate limiting counters, crowd density caching, Celery task queue, and Django Channels layer. Chosen for its sub-millisecond latency and native TTL support. |
| **Celery** | 5.3.6 | Asynchronous Task Queue | Distributed task queue for background processing. Used for OTP email sending, booking auto-expiry, ML service polling, push notification delivery, and daily inventory resets. Celery Beat (2.6.0) provides periodic task scheduling. |
| **Django Channels + Daphne** | 4.0.0 / 4.1.0 | WebSocket Server | Extends Django to handle WebSocket connections for real-time communication. Daphne serves as the ASGI server. Used for live order status updates and crowd density streaming. |
| **FastAPI** | 0.115.0 | ML Microservice | High-performance async Python framework for the ML crowd monitoring service. Serves the YOLOv8 model inference endpoint. Chosen over Django for its async-native design and automatic OpenAPI documentation. |
| **YOLOv8** (Ultralytics) | 8.3.0 | Crowd Detection ML Model | State-of-the-art object detection model used for real-time people counting from camera feeds. The `yolov8n` (nano) variant is used for fast inference on the IITK server hardware. |
| **Razorpay SDK** | via `requests` 2.31.0 | Payment Gateway | Indian payment gateway integration for canteen order payments. Handles order creation, payment verification (signature validation), webhooks, and refund processing. |
| **Nginx** | alpine | Reverse Proxy and Load Balancer | Routes frontend, backend API, WebSocket, and static file requests to appropriate services. Configured with upstream blocks for load balancing across multiple backend instances in production. |
| **Docker + Docker Compose** | latest | Containerization and Orchestration | All services (backend, frontend, database, Redis, ML, Celery, Nginx) are containerized for consistent development and deployment environments. Docker Compose orchestrates the multi-container setup. |

---

## 1.2 System Architecture

As described in the Design Specifications document, UpsideDine follows a microservice-oriented architecture with clear separation between the frontend SPA, backend REST API, ML inference service, and supporting infrastructure.

### 1.2.1 High-Level Architecture

<div style="text-align: center; margin: 30px 0;">
  <img src="./docs/achitecture.png" alt="System Architecture Diagram" style="max-width: 100%; height: auto; border: 1px solid #ccc;" />
  <p style="font-style: italic; margin-top: 10px; font-family: 'Times New Roman', Times, serif; font-size: 10pt;">Figure 1: High-Level System Architecture</p>
</div>

### 1.2.2 Backend Architecture

The backend follows Django's app-based modular architecture, where each functional domain is encapsulated in a separate Django app under `backend/apps/`. This structure, as outlined in the Backend Work Distribution document, allows independent development of each module:

| Django App | Responsibility | Key Models |
|-----------|---------------|------------|
| `apps/users` | Authentication, user management, roles, permissions, JWT, OTP, rate limiting | `User`, `Role`, `Student`, `Staff`, `MessAccount`, `UserToken` |
| `apps/mess` | Mess menu management, extras booking, QR code generation and verification | `Mess`, `MessMenuItem`, `MessBooking` |
| `apps/canteen` | Canteen and menu management, categories | `Canteen`, `CanteenMenuCategory`, `CanteenMenuItem` |
| `apps/orders` | Order lifecycle management (placement, tracking, cancellation) | `CanteenOrder`, `CanteenOrderItem` |
| `apps/payments` | Razorpay payment integration (create, verify, webhook, refund) | `Payment` |
| `apps/crowd` | Crowd density monitoring, camera feed management, historical metrics | `CameraFeed`, `CrowdMetric` |
| `apps/delivery` | Delivery coordinator assignment and tracking | `OrderDelivery` |
| `apps/notifications` | Push notifications (FCM), in-app notifications | `Notification`, `FCMDevice` |

**Cross-cutting concerns** handled at the framework level include:
- **JWT Authentication**: Configured via `djangorestframework-simplejwt` with access/refresh token pairs and Redis-based blacklisting.
- **Permission Classes**: Role-based access control (`IsStudent`, `IsMessManager`, `IsCanteenManager`, `IsMessWorker`, `IsDeliveryPerson`) applied at the view level.
- **Rate Limiting**: Redis-based middleware throttling API and login endpoints.
- **Celery Tasks**: Background processing for OTP emails, booking expiry, ML polling, and notification delivery.
- **WebSocket Consumers**: `OrderStatusConsumer` and `CrowdMonitorConsumer` for real-time event streaming via Django Channels.

### 1.2.3 Frontend Architecture

The frontend follows a **feature-based modular architecture** where each major domain (Authentication, Mess, Canteen, ML/Crowd Monitoring) is encapsulated in its own feature directory under `src/features/`. As outlined in the Frontend Work Distribution document, this architecture enables parallel development with zero merge conflicts.

The application employs a **dual state management** approach:
- **Server State** (React Query): All data fetched from the backend (menus, orders, bookings, crowd metrics) is managed by TanStack React Query with automatic caching, background refetching, and optimistic updates.
- **Client State** (Zustand): Application-local state (authentication tokens, shopping cart, notification badges, theme preferences) is managed by Zustand stores persisted to `localStorage`.

**Real-time Communication** is provided via WebSocket connections (shared `useWebSocket` hook) for order status tracking (`ws://.../ws/order/{order_id}/`) and crowd density monitoring (`ws://.../ws/crowd/mess/{mess_id}/`), with automatic reconnection and exponential backoff.

**API Communication** is centralized through a configured Axios instance (`lib/api.js`) with JWT interceptors for automatic token attachment, transparent 401 token refresh, and Vite development proxy configuration.

### 1.2.4 ML Service Architecture

The ML microservice is a standalone FastAPI application that performs crowd density estimation using YOLOv8:
1. Celery Beat triggers a periodic task every 30 seconds.
2. The Celery worker sends camera feed frames to the ML service's `/ml/crowd/analyze` endpoint.
3. The ML service runs YOLOv8 inference, returning people count and density percentage.
4. Results are cached in Redis and pushed to connected WebSocket clients.
5. Hourly aggregates are stored in the `CrowdMetric` model for historical trend analysis.

### 1.2.5 Database Design

The database schema, as specified in the Design Specifications document, uses PostgreSQL with the following key relationships:

- **User System**: `User` (custom, email-based) with one-to-one `Student` or `Staff` profiles; `Role` defines access level; `MessAccount` tracks student mess balance.
- **Mess System**: `Mess` has many `MessMenuItem` entries; `MessBooking` links `Student` to `MessMenuItem` with QR code tokens and status tracking.
- **Canteen System**: `Canteen` has many `CanteenMenuCategory`, each with many `CanteenMenuItem`; `CanteenOrder` contains `CanteenOrderItem` entries; `Payment` is one-to-one with `CanteenOrder`.
- **Delivery System**: `OrderDelivery` is one-to-one with `CanteenOrder`, linked to a delivery `Staff` member.
- **Crowd System**: `CameraFeed` and `CrowdMetric` are linked to `Mess` for per-mess monitoring.

---

# 2. CODEBASE

## 2.1 GitHub Repository

**Repository URL:** [https://github.com/karankk-05/upside-dine](https://github.com/karankk-05/upside-dine)


> The repository is currently private. If you are reviewing or grading this submission, please provide your GitHub username to any of the group members so we can grant you immediate Collaborator access.

## 2.2 Repository Structure

The codebase is organized as a monorepo with the following top-level structure:

```
upside_dine/
├── backend/              # Django REST API server
│   ├── config/           # Django project configuration (settings, urls, celery, asgi)
│   ├── apps/             # Django application modules
│   │   ├── users/        # Authentication and user management
│   │   ├── mess/         # Mess operations and booking
│   │   ├── canteen/      # Canteen and menu management
│   │   ├── orders/       # Order lifecycle
│   │   ├── payments/     # Razorpay payment integration
│   │   ├── crowd/        # Crowd density monitoring
│   │   ├── delivery/     # Delivery coordination
│   │   └── notifications/# Push and in-app notifications
│   ├── api/              # Legacy API module
│   ├── requirements.txt  # Python dependencies
│   ├── Dockerfile        # Backend container definition
│   └── manage.py         # Django management script
│
├── frontend/             # React Single Page Application
│   ├── src/              # Application source code
│   ├── public/           # Static assets
│   ├── package.json      # Node.js dependencies and scripts
│   ├── vite.config.js    # Vite build configuration
│   └── Dockerfile        # Frontend container definition
│
├── ml_service/           # FastAPI ML microservice
│   ├── main.py           # FastAPI application entry point
│   ├── models/           # ML model loader (YOLOv8)
│   ├── services/         # Video processing and crowd analysis
│   ├── schemas.py        # Pydantic request/response models
│   ├── config.py         # Service configuration
│   ├── yolov8n.pt        # Pre-trained model weights
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # ML service container definition
│
├── nginx/                # Reverse proxy configuration
│   └── nginx.conf        # Nginx routing rules
│
├── docs/                 # Project documentation
│   ├── SRS_UpsideDine_By_HiveMinds-2.pdf
│   ├── Design_Specifications_UpsideDine_By_HiveMinds.pdf
│   ├── FRONTEND_WORK_DISTRIBUTION.md
│   ├── BACKEND_WORK_DISTRIBUTION.md
│   └── ML_SERVICE_README.md
│
└── docker-compose.yml    # Multi-container orchestration
```

---

## 2.3 Backend

This section is a code-based walkthrough of the backend. It explains how the backend is organized, which files are important, how requests move through the project, and how the apps depend on each other. The description below is based on the actual code present under `backend/`.

### 2.3.1 Backend Root Structure

The backend lives inside:

```text
backend/
|-- manage.py
|-- requirements.txt
|-- Dockerfile
|-- .env.example
|-- api/
|-- apps/
|   |-- users/
|   |-- mess/
|   |-- canteen/
|   |-- orders/
|   |-- payments/
|   `-- crowd/
`-- config/
    |-- settings.py
    |-- urls.py
    |-- asgi.py
    |-- celery.py
    `-- wsgi.py
```

At a high level, the backend is a Django monolith split into multiple domain apps:

1. `config/` contains project-level configuration.
2. `api/` contains lightweight base endpoints like health check and a sample math endpoint.
3. `apps/users/` contains identity, roles, JWT auth, OTP logic, and shared permission classes.
4. `apps/mess/` contains the mess booking and QR verification system.
5. `apps/canteen/` contains canteen listing, menu browsing, and manager menu/category management.
6. `apps/orders/` contains canteen order placement and order lifecycle logic.
7. `apps/payments/` contains Razorpay payment creation, verification, refund, and webhook logic.
8. `apps/crowd/` contains crowd-monitoring APIs, camera feed registration, and crowd snapshot persistence.

### 2.3.2 Top-Level Files and What They Do

#### `manage.py`

This is the standard Django management entry point. It is used for:

1. running the development server,
2. applying migrations,
3. creating superusers,
4. running tests,
5. executing Django management commands.

#### `requirements.txt`

This file defines the backend dependency set. The important dependency groups are:

1. Django, DRF, and django-filter for the main API stack,
2. psycopg2 and dj-database-url for PostgreSQL support,
3. SimpleJWT and allauth-related packages for auth support,
4. channels and channels-redis for ASGI and Redis-backed real-time infrastructure,
5. celery, django-celery-beat, and django-celery-results for background jobs,
6. drf-spectacular for schema/docs generation,
7. Pillow and qrcode for image and QR generation,
8. requests and httpx for external HTTP integration,
9. fastapi, uvicorn, scikit-learn, numpy, and pandas for future or adjacent ML-service work,
10. pytest and related tooling for testing,
11. gunicorn and whitenoise for deployment/runtime support.

#### `Dockerfile`

The backend Dockerfile:

1. uses `python:3.10-slim`,
2. installs PostgreSQL build dependencies,
3. installs Python dependencies from `requirements.txt`,
4. copies the backend into `/app`,
5. creates static and media directories,
6. runs Gunicorn on port `8000`.

This means the backend is designed to run as a containerized Django service rather than as a local bare-metal Python install.

#### `.env.example`

This file documents the runtime environment variables expected by the backend. It includes:

1. Django settings like `SECRET_KEY`, `DEBUG`, and `ALLOWED_HOSTS`,
2. PostgreSQL configuration,
3. Redis connection settings,
4. Celery broker and result backend,
5. email settings for OTP mail,
6. JWT lifetime values,
7. CORS values,
8. ML service URL,
9. Razorpay credentials,
10. security and environment flags.

This file is important because many backend behaviors are environment-driven.

### 2.3.3 Project-Level Configuration in `config/`

#### `config/settings.py`

This is the central configuration file for the backend. It defines:

1. `INSTALLED_APPS`, which currently includes `api`, `apps.users`, `apps.mess`, `apps.canteen`, `apps.orders`, `apps.payments`, and `apps.crowd`,
2. middleware, including `corsheaders` and the custom `apps.users.middleware.RateLimitMiddleware`,
3. PostgreSQL as the default database,
4. `AUTH_USER_MODEL = "users.User"`,
5. REST framework defaults, including JWT authentication and default permission handling,
6. drf-spectacular schema configuration,
7. Celery broker and result backend configuration,
8. Redis cache configuration,
9. Channels configuration through Redis,
10. Razorpay configuration values,
11. static and media configuration.

This is the first file to read if someone wants to understand what the backend actually loads at runtime.

#### `config/urls.py`

This file assembles the global URL tree. It currently includes:

1. Django admin at `/admin/`,
2. OpenAPI schema at `/api/schema/`,
3. Swagger UI at `/api/docs/`,
4. ReDoc at `/api/redoc/`,
5. base API routes from `api.urls`,
6. user/auth routes from `apps.users.urls`,
7. mess routes under `/api/mess/`,
8. canteen routes,
9. order routes,
10. payment routes,
11. crowd routes.

This file is the backend routing hub. If someone wants to know which apps expose public endpoints, this is the main file to inspect.

#### `config/asgi.py`

This file sets up the ASGI application using `ProtocolTypeRouter`. Right now it only maps HTTP traffic through Django. A comment explicitly says WebSocket routing will be added later. So the ASGI layer is prepared, but real-time consumers are not yet merged.

#### `config/celery.py`

This file defines the Celery app and auto-discovers tasks from installed apps. It also defines two beat schedules for the mess module:

1. expire stale mess bookings every 5 minutes,
2. reset daily mess inventory at midnight.

It also includes a debug task. This file is important because it shows which backend features already depend on scheduled background execution.

#### `config/wsgi.py`

This is the standard WSGI entry point used by Gunicorn for deployment.

### 2.3.4 Global Request Routing

A normal API request follows this path:

1. request enters Django through Gunicorn,
2. middleware runs, including CORS, auth/session middleware, and request rate limiting,
3. `config/urls.py` selects the correct app router,
4. app-level `urls.py` selects the correct view,
5. view class or function validates the request, often using a serializer,
6. service-layer functions are called for complex business logic,
7. models are read or written through the ORM,
8. a JSON response or binary response is returned.

This pattern is especially clear in the `users`, `mess`, `orders`, and `payments` apps.

### 2.3.5 The `api` App

The `api` app is the smallest app in the backend and behaves as a base diagnostics/demo app.

Important files:

1. `api/models.py` - currently empty placeholder model file.
2. `api/serializers.py` - defines `AddNumbersSerializer` with two float inputs, `a` and `b`.
3. `api/views.py` - defines two function-based views:
   - `health_check`
   - `add_numbers`
4. `api/urls.py` - exposes:
   - `/api/health/`
   - `/api/add/`
5. `api/tests.py` - currently placeholder-only.

Practical meaning:

1. `health_check` confirms API and database connectivity.
2. `add_numbers` is a simple demo endpoint useful for testing request parsing and schema generation.
3. This app is not business-critical, but it is useful for smoke testing the backend.

### 2.3.6 The `apps/users` App

The `users` app is the shared identity and authorization layer of the backend. Every other major app depends on it either directly or indirectly.

#### File-by-file breakdown

**`apps/users/models.py`**

This file defines the core identity schema:

1. `Role` - stores one of the supported role names; current choices: `student`, `mess_manager`, `mess_worker`, `canteen_manager`, `delivery_person`.
2. `User` - custom auth model extending `AbstractBaseUser` and `PermissionsMixin`; uses `email` as the username field; stores `phone`, `role`, `is_verified`, `is_active`, `is_staff`, and `date_joined`.
3. `Student` - one-to-one profile for student users; stores `roll_number`, `full_name`, `hostel_name`, and `room_number`.
4. `Staff` - one-to-one profile for staff users; stores `full_name`, `employee_code`, `canteen_id`, and `is_mess_staff`.
5. `MessAccount` - one-to-one relation to `Student`; stores student mess balance and update timestamp.
6. `UserToken` - stores refresh token metadata; tracks device info, IP address, expiry time, and revocation state.

This file is important because all other role-aware logic in the backend starts from these models.

**`apps/users/managers.py`**

Defines `UserManager`, which provides:

1. `create_user`
2. `create_superuser`

This is what makes the custom email-based user model work correctly with Django auth.

**`apps/users/forms.py`**

Contains admin-facing forms:

1. `UserCreationForm`
2. `UserChangeForm`

These are used by Django admin for custom user creation and editing.

**`apps/users/serializers.py`**

This file converts user/auth data between JSON and Django objects. The most important serializers are:

1. `RegisterSerializer` - validates registration input, creates `User`, creates `Student` or `Staff` profile based on role, auto-creates `MessAccount` for students.
2. `VerifyOTPSerializer`
3. `LoginSerializer` - authenticates email/password, rejects unverified or inactive accounts.
4. `UserSerializer` - returns user info with role and embedded profile data.
5. `MessAccountSerializer`
6. `RefreshTokenSerializer`
7. `ForgotPasswordSerializer`
8. `ResetPasswordSerializer`
9. `DeleteAccountSerializer`

This file is especially important because registration behavior is encoded here.

**`apps/users/authentication.py`**

Defines:

1. `JWTAuthentication` - extends SimpleJWT auth, checks Redis-backed blacklist keys before accepting a token.
2. `CustomTokenObtainPairSerializer` - injects `email`, `role`, and `is_superuser` into JWT claims.

This is the bridge between generic JWT auth and the app-specific role system.

**`apps/users/permissions.py`**

This file provides reusable permission classes:

1. `IsStudent`
2. `IsMessManager`
3. `IsMessWorker`
4. `IsCanteenManager`
5. `IsDeliveryPerson`
6. `IsSuperAdmin`
7. `IsMessStaff`
8. `IsAnyStaff`

These classes are imported by other apps, especially `mess` and `payments`.

**`apps/users/services.py`**

This file contains OTP and email helper logic:

1. OTP key naming,
2. OTP generation,
3. OTP attempt counting,
4. OTP verification,
5. per-account email send limiting,
6. OTP email sending through Django mail.

It uses Redis cache for all transient OTP state.

**`apps/users/middleware.py`**

Defines `RateLimitMiddleware`. It:

1. runs on every `/api/` request,
2. counts requests by client IP in Redis,
3. returns HTTP 429 if request count exceeds the configured threshold.

**`apps/users/views.py`**

This file defines the main auth endpoints:

1. `RegisterView`
2. `VerifyOTPView`
3. `LoginView`
4. `RefreshTokenView`
5. `LogoutView`
6. `ForgotPasswordView`
7. `ResetPasswordView`
8. `MeView`
9. `DeleteAccountView`
10. `MessAccountView`

This is the operational center of the authentication flow.

**`apps/users/urls.py`**

Maps all public user/auth endpoints:

1. `/api/auth/register/`
2. `/api/auth/verify-otp/`
3. `/api/auth/login/`
4. `/api/auth/refresh/`
5. `/api/auth/logout/`
6. `/api/auth/forgot-password/`
7. `/api/auth/reset-password/`
8. `/api/users/me/`
9. `/api/users/me/mess-account/`
10. `/api/users/me/delete/`

**`apps/users/admin.py`**

Registers the custom user model and related profile models in Django admin. It also:

1. uses custom admin forms,
2. inlines student and staff profiles into the user admin page,
3. customizes admin site branding to "Upside Dine Admin".

**`apps/users/tests.py`**

This file contains the merged auth smoke tests. One of the currently failing backend-wide tests lives here, so this file is important not just for coverage but also for understanding the current mismatch between test expectations and registration behavior.

### 2.3.7 The `apps/mess` App

The `mess` app is the deepest and most structured backend module in the current merged codebase. It contains models, serializers, filters, service-layer business logic, admin configuration, Celery tasks, and a dedicated multi-file test suite.

#### File-by-file breakdown

**`apps/mess/apps.py`**

Registers the app as `apps.mess` with the verbose name `Mess`.

**`apps/mess/models.py`**

This file defines the full mess-domain data model:

1. `Mess` - basic mess information; stores `name`, `location`, `hall_name`, `is_active`, `created_at`, `updated_at`.
2. `MessMenuItem` - stores menu offerings for a mess; includes `meal_type`, `day_of_week`, `price`, `available_quantity`, `default_quantity`, and `is_active`; includes constraints for uniqueness and non-negative quantity.
3. `MessBooking` - stores student extras bookings; includes `quantity`, `total_price`, `meal_type`, `booking_date`, `qr_code`, `qr_generated_at`, `qr_expires_at`, booking `status`, and redemption metadata; has constraints to keep quantity positive and total price non-negative.
4. `MessStaffAssignment` - maps a `Staff` profile to a `Mess` with an assignment role of `manager` or `worker`; is the scoping mechanism used by manager and worker APIs.

This file is the core of the mess subsystem.

**`apps/mess/filters.py`**

Defines two filter sets:

1. `MessMenuItemFilter` - supports filtering by `meal_type`, `day_of_week`, and `is_active`.
2. `MessManagerBookingFilter` - supports filtering bookings by `status`, `meal_type`, and date fields.

This file keeps query filtering declarative and out of the views.

**`apps/mess/serializers.py`**

This file is extensive and plays a major role in enforcing request correctness. Key serializers include:

1. `MessSerializer`
2. `MessMenuItemSerializer`
3. `MessMenuItemCreateUpdateSerializer`
4. `MessBookingCreateSerializer`
5. `MessBookingListSerializer`
6. `MessBookingDetailSerializer`
7. `MessBookingCancelSerializer`
8. `MessWorkerVerifySerializer`
9. `MessInventoryUpdateSerializer`

Important serializer behavior:

1. booking creation checks stock, mess ID consistency, meal type consistency, and mess account balance,
2. booking detail serializer returns structured QR payload data,
3. worker verification serializer prevents ambiguous input by requiring exactly one of `qr_code` or `booking_id`,
4. manager inventory serializer rejects empty or invalid updates.

**`apps/mess/services.py`**

This file is where the main business logic lives. It is one of the most important files in the entire backend. Main responsibilities:

1. generate QR tokens,
2. build QR payloads,
3. generate QR PNG images,
4. calculate booking total,
5. validate booking requests,
6. debit mess accounts,
7. refund mess accounts,
8. create bookings transactionally,
9. resolve bookings by QR code,
10. redeem bookings transactionally,
11. cancel bookings transactionally,
12. expire stale bookings.

Important implementation characteristics:

1. uses `transaction.atomic`,
2. uses `select_for_update` where race conditions matter,
3. centralizes booking-state validation,
4. updates stock and balances in the same transaction.

This file is the best place to understand how the mess system actually works beyond just endpoints.

**`apps/mess/views.py`**

This file contains the student, manager, and worker API views. Main view classes include:

1. `StudentMessListView`
2. `StudentMessMenuListView`
3. `StudentExtrasBookingCreateView`
4. `StudentBookingListView`
5. `StudentBookingDetailView`
6. `StudentBookingCancelView`
7. `StudentBookingQRCodeView`
8. `ManagerMenuListCreateView`
9. `ManagerMenuDetailView`
10. `ManagerBookingListView`
11. `ManagerStatsView`
12. `ManagerInventoryView`
13. `WorkerVerifyBookingView`
14. `WorkerScanHistoryView`

Important helper functions inside this file:

1. `_get_student_from_request`
2. `_get_staff_from_request`
3. `_get_manager_assignment`
4. `_get_worker_assignment`
5. scan-history cache helper functions
6. filter and summary helpers

This file controls access by role and by mess assignment.

**`apps/mess/urls.py`**

Defines the route map for the mess system. It is mounted at `/api/mess/` from the global router.

**`apps/mess/tasks.py`**

Defines two Celery tasks:

1. `expire_stale_bookings`
2. `reset_daily_menu_inventory`

This file connects the mess module to `config/celery.py`.

**`apps/mess/admin.py`**

Registers:

1. `Mess`
2. `MessMenuItem`
3. `MessBooking`
4. `MessStaffAssignment`

The admin configuration adds list displays, filters, search fields, autocomplete fields, and readonly QR-related fields. This is useful operationally because the mess module is complex enough to require inspection tools.

**`apps/mess/tests/`**

This is the most detailed test area in the backend. Current test files are:

1. `test_admin.py`
2. `test_manager_api.py`
3. `test_models.py`
4. `test_race_conditions.py`
5. `test_serializers.py`
6. `test_services.py`
7. `test_student_api.py`
8. `test_tasks.py`
9. `test_worker_api.py`

If someone wants to understand expected behavior quickly, reading these test files is highly useful.

### 2.3.8 The `apps/canteen` App

The `canteen` app provides canteen discovery, menu browsing, search, and manager-facing canteen menu/category management.

#### File-by-file breakdown

**`apps/canteen/apps.py`**

Registers the app as `apps.canteen` with the verbose name `Canteen`.

**`apps/canteen/models.py`**

Defines three major models:

1. `Canteen` - stores canteen identity and operational fields like timings, delivery availability, minimum delivery amount, fee, active state, and rating.
2. `CanteenMenuCategory` - stores named categories per canteen with display order and active flag.
3. `CanteenMenuItem` - stores individual menu items, pricing, stock, vegetarian flag, availability state, and optional category linkage.

This file is the data foundation for both the public canteen APIs and the ordering system in `apps.orders`.

**`apps/canteen/filters.py`**

Defines:

1. `CanteenFilter`
2. `CanteenMenuItemFilter`

Supported filter dimensions include:

1. delivery availability,
2. active status,
3. category,
4. canteen,
5. veg/non-veg,
6. availability,
7. min and max price.

**`apps/canteen/serializers.py`**

Main serializers include:

1. `CanteenMenuCategorySerializer`
2. `CanteenMenuItemSerializer`
3. `CanteenListSerializer`
4. `CanteenDetailSerializer`
5. `CategoryWithItemsSerializer`
6. `CanteenSearchResultSerializer`
7. `CanteenManagerStatsSerializer`

Important behavior:

1. category detail can include active items,
2. search results flatten canteen and category names into item rows,
3. stats serializer is not a model serializer; it formats computed manager analytics.

**`apps/canteen/views.py`**

Main view classes:

1. `CanteenListView`
2. `CanteenDetailView`
3. `CanteenCategoryListView`
4. `CanteenMenuView`
5. `CanteenSearchView`
6. `CanteenManagerMenuListCreateView`
7. `CanteenManagerMenuDetailView`
8. `CanteenManagerCategoryListCreateView`
9. `CanteenManagerStatsView`

Important helpers:

1. `IsCanteenManagerOrAdmin`
2. `_get_manager_canteens`

The app enforces manager scoping by using `staff_profile.canteen_id` rather than a separate assignment model.

**`apps/canteen/urls.py`**

Exposes:

1. public canteen browsing endpoints,
2. public menu/category lookup,
3. cross-canteen search,
4. manager CRUD/stat routes.

**`apps/canteen/admin.py`**

Registers:

1. `Canteen`
2. `CanteenMenuCategory`
3. `CanteenMenuItem`

The admin focuses on item/category search and stock visibility.

**`apps/canteen/tests.py`**

This file contains merged tests for canteen behavior.

### 2.3.9 The `apps/orders` App

The `orders` app contains the canteen-order transaction flow. It is tightly coupled to the `canteen` app for menu items and to the `users` app for student profiles.

#### File-by-file breakdown

**`apps/orders/apps.py`**

Registers the app as `apps.orders`.

**`apps/orders/models.py`**

Defines:

1. `CanteenOrder` - stores order header information; includes order type, status, pricing fields, delivery address, ready time, notes, pickup QR code, pickup OTP, and cancellation reason.
2. `CanteenOrderItem` - stores individual menu items inside an order; stores quantity, unit price, total price, and special instructions.

The order model contains multiple status choices and explicit order-type distinctions between pickup, delivery, and prebooking.

**`apps/orders/serializers.py`**

Main serializers include:

1. `OrderItemInputSerializer`
2. `PlaceOrderSerializer`
3. `CanteenOrderItemSerializer`
4. `CanteenOrderSerializer`
5. `CanteenOrderListSerializer`
6. `OrderStatusSerializer`
7. `CancelOrderSerializer`
8. `ManagerOrderStatusUpdateSerializer`
9. `PickupVerifySerializer`

This file defines the public shape of the order APIs.

**`apps/orders/services.py`**

This is the main business-logic file for order processing. Key functions include:

1. `_next_sequence_for_today`
2. `generate_order_number`
3. `generate_pickup_otp`
4. `generate_pickup_qr_code`
5. `calculate_delivery_fee`
6. `validate_and_prepare_items`
7. `create_order_for_student`
8. `validate_status_transition`
9. `cancel_order`
10. `verify_pickup`

Important behaviors:

1. order numbers are generated with a date-based prefix,
2. stock is locked and decremented during order creation,
3. delivery eligibility is enforced,
4. status transitions are validated explicitly,
5. pickup verification accepts either OTP or QR.

**`apps/orders/views.py`**

Main views:

1. `OrderListCreateView`
2. `OrderDetailView`
3. `OrderCancelView`
4. `OrderStatusView`
5. `CanteenManagerOrderListView`
6. `CanteenManagerOrderAcceptView`
7. `CanteenManagerOrderRejectView`
8. `CanteenManagerOrderStatusUpdateView`
9. `CanteenManagerVerifyPickupView`

The view layer separates student and manager responsibilities clearly.

**`apps/orders/urls.py`**

Maps student order routes and manager order-operation routes.

**`apps/orders/admin.py`**

Registers:

1. `CanteenOrder`
2. `CanteenOrderItem`

It also inlines order items inside the order admin screen.

**`apps/orders/tests.py`**

Contains merged order-related test coverage.

### 2.3.10 The `apps/payments` App

The `payments` app handles order-linked payment state. It depends directly on `apps.orders` and indirectly on `apps.users`.

#### File-by-file breakdown

**`apps/payments/apps.py`**

Registers the app as `apps.payments`.

**`apps/payments/models.py`**

Defines one central model:

1. `Payment` - linked one-to-one with `orders.CanteenOrder`; stores Razorpay order ID, payment ID, signature, amount, currency, status, method, failure reason, refund amount, refunded timestamp, captured timestamp, and raw response payload.

This is the canonical payment record for the backend.

**`apps/payments/serializers.py`**

Defines:

1. `PaymentSerializer`
2. `PaymentCreateOrderSerializer`
3. `PaymentVerifySerializer`
4. `PaymentRefundSerializer`

These serializers are small but important because payment endpoints exchange narrow, security-sensitive payloads.

**`apps/payments/services.py`**

This file contains Razorpay integration logic. Main functions:

1. `_get_razorpay_credentials`
2. `_razorpay_url`
3. `create_razorpay_order`
4. `verify_payment_signature`
5. `verify_webhook_signature`
6. `mark_payment_captured`
7. `mark_payment_failed`
8. `initiate_refund`

Important implementation notes:

1. HMAC verification is used for both payment signatures and webhook signatures.
2. Refund logic validates refund amount bounds before calling Razorpay.
3. External HTTP requests are made using `requests`.

**`apps/payments/views.py`**

Main views:

1. `PaymentCreateOrderView`
2. `PaymentVerifyView`
3. `PaymentWebhookView`
4. `PaymentRefundView`
5. `PaymentStatusView`

Important behavior:

1. only students can create and verify their own payments,
2. managers can refund payments for orders under their canteen,
3. the webhook endpoint is open to external callbacks and verifies Razorpay signatures itself.

**`apps/payments/urls.py`**

Maps all payment endpoints under `/api/payments/...`.

**`apps/payments/admin.py`**

Registers the `Payment` model with status filters and readonly raw response storage.

**`apps/payments/tests.py`**

Contains merged payment tests.

### 2.3.11 The `apps/crowd` App

The `crowd` app is the backend's crowd-monitoring module. It mixes database-backed history with Redis-backed live values and an external ML-service integration point.

#### File-by-file breakdown

**`apps/crowd/apps.py`**

Registers the app as `apps.crowd` with verbose name `Crowd Monitoring`.

Important implementation detail:

1. `ready()` imports `_sync_feeds_to_redis` and tries to push active feeds to Redis on startup.

This means the app performs startup-time synchronization work, which is unusual enough to matter when reading the backend.

**`apps/crowd/models.py`**

Defines:

1. `CameraFeed` - stores a `mess_id`, camera stream URL, active state, description, and creation time.
2. `CrowdMetric` - stores historical crowd readings like density percentage, estimated count, density level, wait time, and timestamp.

Important implementation detail:

1. `CameraFeed` has signal handlers that synchronize active feeds to Redis whenever a feed is created, updated, or deleted.

**`apps/crowd/serializers.py`**

Defines:

1. `CameraFeedSerializer`
2. `CrowdMetricSerializer`
3. `LiveCrowdSerializer`

`LiveCrowdSerializer` is not model-bound; it describes the shape of live data read from Redis.

**`apps/crowd/views.py`**

Main classes and helpers:

1. `FeedManagePermission`
2. `_sync_feeds_to_redis`
3. `CameraFeedListCreateView`
4. `CameraFeedDeleteView`
5. `LiveCrowdView`
6. `CrowdHistoryView`
7. `CrowdRecommendationView`
8. `CrowdAnalyzeImageView`

Important behavior:

1. feed management is allowed to superadmin, mess managers, and canteen managers,
2. live crowd data is fetched from Redis using `crowd:mess:{mess_id}`,
3. history comes from PostgreSQL through `CrowdMetric`,
4. recommendations are built from the least crowded historical hours,
5. image analysis is proxied to an external ML endpoint defined by `ML_SERVICE_URL`.

**`apps/crowd/tasks.py`**

Defines `store_crowd_snapshot`, which:

1. reads active mess IDs from `CameraFeed`,
2. fetches live crowd data from Redis,
3. writes a historical row into `CrowdMetric`.

This file is how live data becomes historical analytics data.

**`apps/crowd/urls.py`**

Maps:

1. feed management routes,
2. live crowd route,
3. history route,
4. recommendation route,
5. test image analysis route.

**`apps/crowd/admin.py`**

Registers:

1. `CameraFeed`
2. `CrowdMetric`

**`apps/crowd/tests.py`**

There is no dedicated merged `tests.py` or `tests/` package for the crowd app in the current backend. This is one of the easiest ways to see that crowd coverage is lighter than mess coverage.

### 2.3.12 Cross-App Dependencies

The backend is modular, but the apps are not isolated. The main dependencies are:

**`users` as the shared dependency layer**

Other apps depend on `users` for:

1. authentication,
2. role checks,
3. student and staff profiles,
4. mess account access,
5. manager/staff scoping.

**`mess` depends on `users`**

The mess app imports:

1. `Student`,
2. `Staff`,
3. `MessAccount`,
4. permission classes from `apps.users.permissions`.

This makes `users` mandatory for mess booking and worker/manager access control.

**`canteen` is mostly self-contained but manager-scoped through `users`**

The canteen app relies on `staff_profile.canteen_id` from the users app to decide which canteen a manager is allowed to manage.

**`orders` depends on `canteen` and `users`**

The orders app needs:

1. `Student` from users,
2. `Canteen` and `CanteenMenuItem` from canteen.

So it is structurally the bridge between identity and canteen inventory.

**`payments` depends on `orders` and `users`**

The payments app is linked one-to-one to `CanteenOrder`. It also uses role and identity context to decide whether a student or manager is allowed to perform a payment action.

**`crowd` is loosely coupled to `mess`**

The crowd app currently uses plain integer `mess_id` fields instead of ORM foreign keys to the mess models. So there is a conceptual dependency, but it is not yet strongly expressed at the model level.

### 2.3.13 Best Reading Order for Someone New to the Backend

For a new developer, the most effective reading order is:

1. `config/settings.py`
2. `config/urls.py`
3. `apps/users/models.py`
4. `apps/users/serializers.py`
5. `apps/users/views.py`
6. `apps/mess/models.py`
7. `apps/mess/services.py`
8. `apps/mess/views.py`
9. `apps/canteen/models.py`
10. `apps/orders/services.py`
11. `apps/orders/views.py`
12. `apps/payments/services.py`
13. `apps/payments/views.py`
14. `apps/crowd/views.py`
15. the test files, especially under `apps/mess/tests/`

### 2.3.14 Some Important Files in the Entire Backend

If someone only has time to read a few files, these are the highest-value ones:

1. `config/settings.py` - shows what the backend actually loads.
2. `config/urls.py` - shows all exposed app routes.
3. `apps/users/models.py` - defines the identity layer used by everything else.
4. `apps/users/views.py` - defines the authentication flow.
5. `apps/mess/services.py` - best example of serious business logic in the backend.
6. `apps/mess/views.py` - shows how roles and scoped access are enforced.
7. `apps/orders/services.py` - shows stock-aware order creation and status logic.
8. `apps/payments/services.py` - shows all external payment integration logic.
9. `apps/crowd/views.py` - shows Redis-plus-ML-service integration.
10. `config/celery.py` - shows which background tasks are already wired.

---

## 2.4 Frontend

The frontend source code follows a feature-based modular structure under `frontend/src/`. Each major domain (Authentication, Mess, Canteen, ML/Crowd Monitoring) is encapsulated in its own feature directory containing pages, components, and hooks.

### 2.4.1 Frontend Directory Structure

```
frontend/src/
├── App.jsx                               # Root component with Router setup and route definitions
├── App.css                               # Global application styles
├── main.jsx                              # React entry point, renders App into DOM
├── index.css                             # Tailwind CSS directives and custom global styles
│
├── features/                             # Feature-based modules (one per domain)
│
│   ├── auth/                             # Authentication Module
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx              # Main auth page with login/signup toggle and role selector
│   │   │   ├── AuthPage.css              # Auth page specific styles
│   │   │   └── ForgotPasswordPage.jsx    # OTP-based password reset flow
│   │   └── components/
│   │       ├── LoginForm.jsx             # Email and password login form with role-based routing
│   │       ├── SignupForm.jsx            # Multi-step signup: basic info then OTP verification
│   │       └── RoleSelector.jsx          # 2x2 grid role selection component
│
│   ├── mess/                             # Mess Interface Module
│   │   ├── routes.jsx                    # Mess feature route definitions
│   │   ├── mess.css                      # Mess-specific styles
│   │   ├── pages/
│   │   │   ├── MessListPage.jsx          # List all mess halls with status cards
│   │   │   ├── MessMenuPage.jsx          # Menu with meal-type/day filters, extras booking
│   │   │   ├── MyBookingsPage.jsx        # Student booking history with status filters
│   │   │   ├── BookingDetailPage.jsx     # Booking detail with QR code display and expiry timer
│   │   │   ├── ManagerMenuPage.jsx       # CRUD for mess menu items (Manager view)
│   │   │   ├── ManagerBookingsPage.jsx   # Today's bookings dashboard with statistics
│   │   │   ├── ManagerInventoryPage.jsx  # Update stock levels for today's items
│   │   │   ├── ManagerStatsPage.jsx      # Booking statistics with Recharts visualizations
│   │   │   ├── QRScannerPage.jsx         # Camera QR scanner and manual ID entry (Worker view)
│   │   │   └── ScanHistoryPage.jsx       # Recently verified bookings for current session
│   │   ├── components/
│   │   │   ├── MenuItemCard.jsx          # Mess menu item card with booking action
│   │   │   ├── ExtrasBookingModal.jsx    # Modal for quantity selection and booking confirmation
│   │   │   ├── QRCodeDisplay.jsx         # QR code renderer with expiry countdown timer
│   │   │   ├── CancelBookingButton.jsx   # Confirmation dialog and cancel action
│   │   │   ├── MessAccountCard.jsx       # Mess account balance and last updated display
│   │   │   ├── MessAccountHistory.jsx    # Transaction history for mess account debits
│   │   │   ├── MessCard.jsx              # Mess hall card with name, location, status
│   │   │   └── VerificationResult.jsx    # Success/failure result after QR scan
│   │   └── hooks/
│   │       ├── useMessList.js            # GET /api/mess/
│   │       ├── useMessMenu.js            # GET /api/mess/{id}/menu/
│   │       ├── useBookExtras.js          # POST /api/mess/extras/book/
│   │       ├── useMyBookings.js          # GET /api/mess/bookings/
│   │       ├── useBookingDetail.js       # GET /api/mess/bookings/{id}/
│   │       ├── useCancelBooking.js       # POST /api/mess/bookings/{id}/cancel/
│   │       ├── useMessAccount.js         # GET /api/users/me/mess-account/
│   │       ├── useManagerMenu.js         # GET/POST /api/mess/manager/menu/
│   │       ├── useManagerBookings.js     # GET /api/mess/manager/bookings/
│   │       ├── useManagerInventory.js    # GET/PATCH /api/mess/manager/inventory/
│   │       ├── useManagerStats.js        # GET /api/mess/manager/stats/
│   │       ├── useVerifyQR.js            # POST /api/mess/worker/verify/
│   │       └── useScanHistory.js         # GET /api/mess/worker/scan-history/
│
│   ├── canteen/                          # Canteen Interface Module
│   │   ├── routes.jsx                    # Canteen feature route definitions
│   │   ├── pages/
│   │   │   ├── CanteenListPage.jsx       # Browse canteens with search, ratings, status
│   │   │   ├── CanteenDetailPage.jsx     # Canteen info header and categorized menu
│   │   │   ├── CheckoutPage.jsx          # Order type, address, schedule, payment summary
│   │   │   ├── OrderHistoryPage.jsx      # Past and active orders with status badges
│   │   │   ├── OrderDetailPage.jsx       # Order detail with real-time status stepper
│   │   │   ├── ManagerOrdersPage.jsx     # Live incoming orders with accept/reject (Manager)
│   │   │   ├── ManagerOrderDetail.jsx    # Expanded order view with status update buttons
│   │   │   ├── ManagerMenuPage.jsx       # CRUD for canteen menu items and categories
│   │   │   └── ManagerStatsPage.jsx      # Revenue and order stats with Recharts
│   │   ├── components/
│   │   │   ├── CanteenCard.jsx           # Canteen list card with rating and delivery info
│   │   │   ├── MenuItemCard.jsx          # Menu item with veg/non-veg badge, add-to-cart
│   │   │   ├── MenuSearch.jsx            # Cross-canteen search with autocomplete
│   │   │   ├── CartDrawer.jsx            # Slide-out cart panel with quantity controls
│   │   │   ├── PaymentModal.jsx          # Razorpay SDK integration for payments
│   │   │   ├── OrderConfirmation.jsx     # Post-payment success screen with order number
│   │   │   ├── OrderStatusTracker.jsx    # Stepper UI (Placed, Confirmed, Ready, Picked Up)
│   │   │   └── PickupQRCode.jsx          # QR code and OTP display for self-pickup orders
│   │   └── hooks/
│   │       ├── useCanteenList.js         # GET /api/canteens/
│   │       ├── useCanteenDetail.js       # GET /api/canteens/{id}/
│   │       ├── useCanteenMenu.js         # GET /api/canteens/{id}/menu/
│   │       ├── useMenuSearch.js          # GET /api/canteens/search/?q= (debounced)
│   │       ├── usePlaceOrder.js          # POST /api/orders/
│   │       ├── useOrderHistory.js        # GET /api/orders/
│   │       ├── useOrderDetail.js         # GET /api/orders/{id}/
│   │       ├── useCancelOrder.js         # POST /api/orders/{id}/cancel/
│   │       ├── useCreatePayment.js       # POST /api/payments/create-order/
│   │       ├── useVerifyPayment.js       # POST /api/payments/verify/
│   │       ├── useManagerOrders.js       # GET /api/canteen-manager/orders/
│   │       ├── useUpdateOrderStatus.js   # PATCH /api/canteen-manager/orders/{id}/status/
│   │       ├── useManagerMenu.js         # GET/POST /api/canteen-manager/menu/
│   │       ├── useManagerStats.js        # GET /api/canteen-manager/stats/
│   │       └── useOrderSocket.js         # WebSocket for real-time order status
│
│   └── ml/                               # ML / Crowd Monitoring Module
│       ├── routes.jsx                    # ML feature route definitions
│       ├── styles/
│       │   └── crowd.css                 # Crowd monitoring specific styles
│       ├── pages/
│       │   ├── CrowdDashboard.jsx        # Student crowd overview for all messes
│       │   ├── MessCrowdDetail.jsx       # Detailed crowd view for a specific mess
│       │   ├── ManagerCrowdOverview.jsx  # Admin overview with all messes live density
│       │   └── CrowdAnalytics.jsx        # Multi-day analytics with peak-hour heatmap
│       ├── components/
│       │   ├── MessLiveDensity.jsx       # Real-time density card (level, wait, count)
│       │   ├── CrowdHistoryChart.jsx     # Hourly crowd density chart (Recharts)
│       │   ├── BestTimeRecommendation.jsx# Optimal visit time recommendation card
│       │   ├── MessSelector.jsx          # Dropdown/tabs to switch mess halls
│       │   ├── CameraFeedStatus.jsx      # Camera active/offline status cards
│       │   ├── DensityIndicator.jsx      # Reusable density badge (low/moderate/high)
│       │   └── CrowdHeatmap.jsx          # Peak-hour heatmap visualization
│       └── hooks/
│           ├── useLiveCrowdDensity.js    # GET /api/crowd/mess/{id}/live/
│           ├── useCrowdHistory.js        # GET /api/crowd/mess/{id}/history/
│           ├── useCrowdRecommendation.js # GET /api/crowd/mess/{id}/recommendation/
│           └── useCrowdSocket.js         # WebSocket for live density updates
│
├── pages/                                # Role-based dashboard landing pages
│   ├── StudentDashboard.jsx              # Student home page
│   ├── MessManagerDashboard.jsx          # Mess manager home page
│   ├── CanteenManagerDashboard.jsx       # Canteen manager home page
│   └── DeliveryDashboard.jsx             # Delivery coordinator home page
│
├── store/
│   └── cartStore.js                      # Zustand store for cart items with single-canteen
│                                         # enforcement and localStorage persistence
│
├── index.html                            # HTML entry point
├── package.json                          # Dependencies and scripts
├── vite.config.js                        # Vite config with React plugin and dev proxy
├── Dockerfile                            # Multi-stage build for production
└── .env.example                          # Environment variable template
```

**Key structural decisions:**

1. **Feature-scoped hooks**: Each feature directory contains its own `hooks/` folder with React Query hooks that encapsulate API calls, keeping API logic co-located with the consuming UI.
2. **Feature-scoped routes**: Each feature defines its routes in its own `routes.jsx` file. The main `App.jsx` imports and mounts these route trees.
3. **Separation of pages and components**: Within each feature, `pages/` contains full-page route targets while `components/` contains reusable building blocks.
4. **Shared store**: `store/cartStore.js` is placed outside feature directories because cart state is accessed by multiple features (canteen browsing, checkout, navbar).

### 2.4.2 Frontend Routing Structure

The application implements role-based routing where users are directed to appropriate dashboards based on their authenticated role:

| Route | Component | Access Level | Module |
|-------|-----------|-------------|--------|
| `/` | Redirect to `/auth` | Public | Auth |
| `/auth` | `AuthPage` | Public | Auth |
| `/forgot-password` | `ForgotPasswordPage` | Public | Auth |
| `/dashboard` | `StudentDashboard` | Student | Dashboard |
| `/manager/mess` | `MessManagerDashboard` | Mess Manager | Dashboard |
| `/manager/canteen` | `CanteenManagerDashboard` | Canteen Manager | Dashboard |
| `/delivery` | `DeliveryDashboard` | Delivery Person | Dashboard |
| `/crowd` | `CrowdDashboard` | Authenticated | ML |
| `/crowd/mess/:messId` | `MessCrowdDetail` | Authenticated | ML |
| `/manager/crowd` | `ManagerCrowdOverview` | Mess Manager | ML |
| `/manager/crowd/analytics` | `CrowdAnalytics` | Mess Manager | ML |
| `/canteens` | `CanteenListPage` | Authenticated | Canteen |
| `/canteens/:id` | `CanteenDetailPage` | Authenticated | Canteen |
| `/checkout` | `CheckoutPage` | Student | Canteen |
| `/orders` | `OrderHistoryPage` | Student | Canteen |
| `/orders/:id` | `OrderDetailPage` | Student | Canteen |
| `/manager/canteen/orders` | `ManagerOrdersPage` | Canteen Manager | Canteen |
| `/manager/canteen/menu` | `ManagerMenuPage` | Canteen Manager | Canteen |
| `/manager/canteen/stats` | `ManagerStatsPage` | Canteen Manager | Canteen |
| `/mess` | `MessListPage` | Authenticated | Mess |
| `/mess/:messId/menu` | `MessMenuPage` | Authenticated | Mess |
| `/mess/bookings` | `MyBookingsPage` | Student | Mess |
| `/mess/bookings/:id` | `BookingDetailPage` | Student | Mess |
| `/manager/mess/menu` | `ManagerMenuPage` | Mess Manager | Mess |
| `/manager/mess/bookings` | `ManagerBookingsPage` | Mess Manager | Mess |
| `/manager/mess/inventory` | `ManagerInventoryPage` | Mess Manager | Mess |
| `/manager/mess/stats` | `ManagerStatsPage` | Mess Manager | Mess |
| `/worker/scan` | `QRScannerPage` | Mess Worker | Mess |
| `/worker/history` | `ScanHistoryPage` | Mess Worker | Mess |

### 2.4.3 Frontend Feature Descriptions

#### Authentication Module

The authentication module implements a multi-role authentication system supporting five user roles: Student, Mess Manager, Canteen Manager, Mess Worker, and Delivery Person.

- **Role-Based Login**: The `AuthPage` presents a 2x2 grid role selector. Users select their role before logging in, and upon successful authentication, are routed to the appropriate dashboard (`/dashboard` for students, `/manager/mess` for mess managers, etc.).
- **Multi-Step Registration**: The `SignupForm` implements a two-step flow. Step 1 collects basic info (email, password, phone) and role-specific fields (roll number, hostel for students; employee code for staff). Step 2 handles OTP verification via the `/api/auth/verify-otp/` endpoint.
- **JWT Token Management**: Login responses are stored in `localStorage` (`access_token`, `refresh_token`, `user_role`). The Axios instance automatically attaches Bearer tokens to API requests.
- **Password Recovery**: `ForgotPasswordPage` implements OTP-based password reset via `/api/auth/forgot-password/` and `/api/auth/reset-password/`.

#### Mess Interface Module

The mess module provides three user interfaces: student mess browsing and booking, mess manager administration, and mess worker QR verification.

**Student View:**
- Browse mess halls with `MessListPage` showing status cards for each mess.
- View menus filtered by meal type (Breakfast/Lunch/Dinner/Snack) and day of week.
- Book extras via `ExtrasBookingModal` with quantity selection, confirmation, and QR code generation.
- Track bookings in `MyBookingsPage` with status filters (pending/redeemed/expired/cancelled).
- View booking QR codes with a live expiry countdown timer (`QRCodeDisplay`).

**Manager View:**
- CRUD menu items with `ManagerMenuPage` for adding, editing, and deactivating items with quantity management.
- View today's booking statistics and redemption analytics with Recharts charts.
- Manage inventory levels for daily menu items.

**Worker View:**
- Scan QR codes using device camera (`QRScannerPage`) or enter booking IDs manually.
- Verify bookings via `/api/mess/worker/verify/` with success/error result display.
- View scan history for the current session.

#### Canteen Interface Module

The canteen module covers the complete order lifecycle: browsing, cart, checkout, payment, and tracking.

**Student View:**
- Browse canteens with search, ratings, and open/closed status (`CanteenListPage`).
- View categorized menus with veg/non-veg badges, prep times, and "Add to Cart" buttons.
- `CartDrawer` slide-out panel with quantity controls, enforcing single-canteen cart policy.
- `CheckoutPage` supporting Pickup, Delivery, and Pre-booking order types.
- Razorpay payment integration via `PaymentModal` (SDK popup with verify callback).
- Real-time order tracking with `OrderStatusTracker` stepper component (Placed, Confirmed, Preparing, Ready, Picked Up).
- Pickup QR code and OTP display for self-pickup orders.

**Manager View:**
- Live incoming orders dashboard with accept/reject actions.
- Menu CRUD with category management, image upload, and availability toggles.
- Revenue and order statistics dashboard.

**State Management:**
- `cartStore.js` (Zustand): Manages cart items with `addItem`, `removeItem`, `updateQuantity`, `clearCart` actions. Persists to `localStorage` and enforces single-canteen policy with confirmation prompt.

#### ML / Crowd Monitoring Module

The ML module provides real-time crowd density visualization powered by the YOLOv8 ML microservice.

**Student View:**
- `CrowdDashboard`: Overview of all mess halls with live density cards showing density level (low/moderate/high), estimated wait time, people count, and color-coded indicators.
- `MessCrowdDetail`: Detailed view with hourly crowd density charts (Recharts) and best-time-to-visit recommendations.
- Real-time updates via WebSocket (`useCrowdSocket`) with auto-reconnect and exponential backoff.

**Manager View:**
- `ManagerCrowdOverview`: Admin dashboard with all messes live density on a single view with trend arrows.
- `CrowdAnalytics`: Multi-day charts, peak-hour heatmap visualization, and average wait time statistics.
- `CameraFeedStatus`: Active/offline status for each camera feed with last update timestamps.

---

# 3. COMPLETENESS

## 3.1 SRS Requirements Implementation Status

### 3.1.1 Backend Completeness

| SRS Req | Feature | Status | Details |
|---------|---------|--------|---------|
| **F1.1** | User Registration with @iitk.ac.in email | Completed | `POST /api/auth/register/` validates IITK email domain, sends OTP |
| **F1.2** | OTP-based Email Verification | Completed | `POST /api/auth/verify-otp/` with Redis-stored OTPs (5-min TTL), rate limiting |
| **F1.3** | Role-based Login (JWT) | Completed | `POST /api/auth/login/` returns JWT access + refresh tokens with role validation |
| **F1.4** | Token Refresh and Logout | Completed | `POST /api/auth/refresh/` and `/api/auth/logout/` with token blacklisting |
| **F1.5** | User Profile Management | Completed | `GET/PATCH /api/users/me/` for student and staff profile CRUD |
| **F1.6** | Password Reset (OTP-based) | Completed | `POST /api/auth/forgot-password/` and `/api/auth/reset-password/` |
| **F1.7** | Role-based Permissions | Completed | Custom permission classes: `IsStudent`, `IsMessManager`, `IsCanteenManager`, etc. |
| **F1.8** | Rate Limiting | Completed | Redis-based rate limiting middleware for API and login endpoints |
| **F2.1** | Mess Listing | Completed | `GET /api/mess/` lists all messes with status |
| **F2.2** | Mess Menu Browsing | Completed | `GET /api/mess/{id}/menu/` filterable by meal type and day |
| **F2.3** | Extras Booking | Completed | `POST /api/mess/extras/book/` generates QR code, debits mess account |
| **F2.4** | Booking History | Completed | `GET /api/mess/bookings/` with status filtering |
| **F2.5** | Booking Detail with QR | Completed | `GET /api/mess/bookings/{id}/` includes QR token and expiry |
| **F2.6** | Cancel Booking | Completed | `POST /api/mess/bookings/{id}/cancel/` with refund to mess account |
| **F2.7** | QR Code Generation | Completed | UUID-based tokens with 3-hour validity, auto-expiry via Celery |
| **F2.8** | Mess Account Balance | Completed | `GET /api/users/me/mess-account/` for balance and transaction history |
| **F2.9** | Auto-expiry of Bookings | Completed | Celery periodic task every 5 minutes |
| **F3.1** | Live Crowd Density | Completed | `GET /api/crowd/mess/{id}/live/` served from Redis cache |
| **F3.2** | Crowd History | Completed | `GET /api/crowd/mess/{id}/history/` with hourly aggregates |
| **F3.3** | Best Time Recommendation | Completed | `GET /api/crowd/mess/{id}/recommendation/` |
| **F3.4** | ML Model Integration | Completed | FastAPI service with YOLOv8 at `/ml/crowd/analyze` |
| **F3.5-F3.8** | Crowd Monitoring Pipeline | Completed | Celery polls ML service, updates Redis, pushes via WebSocket |
| **F4.1** | Canteen Listing | Completed | `GET /api/canteens/` with filtering and search |
| **F4.2** | Canteen Menu | Completed | `GET /api/canteens/{id}/menu/` grouped by category |
| **F4.3** | Cross-canteen Search | Completed | `GET /api/canteens/search/?q=` |
| **F4.4** | Order Placement | Completed | `POST /api/orders/` with stock validation and total calculation |
| **F4.5** | Order Types | Completed | Supports Pickup, Delivery, and Pre-booking with scheduled times |
| **F4.6-F4.8** | Order Tracking | Completed | Status timeline, WebSocket updates, QR/OTP verification for pickup |
| **F4.9-F4.13** | Payment Integration | Completed | Razorpay create-order, verify, webhook, and refund endpoints |
| **F5.1-F5.6** | Mess Manager APIs | Completed | Menu CRUD, bookings dashboard, statistics, inventory management |
| **F6.1-F6.9** | Mess Worker APIs | Completed | QR verification and scan history |
| **F7.1-F7.11** | Canteen Manager APIs | Completed | Order management, menu CRUD, statistics |
| **F8.1-F8.10** | Delivery Coordinator | Partial | Models and URL structure defined; full API implementation pending |
| **F9.1-F9.6** | Notifications | Partial | Models and Celery task stubs defined; FCM integration pending |

### 3.1.2 Frontend Completeness

| SRS Req | Feature | Status | Details |
|---------|---------|--------|---------|
| **F1.1-F1.4** | Auth UI (Login, Signup, OTP) | Completed | Full auth flow with role selection, multi-step signup, OTP verification |
| **F1.5-F1.6** | Profile and Password Reset UI | Completed | Profile view, forgot password page with OTP flow |
| **F2.1-F2.9** | Student Mess UI | Completed | Mess list, menu browsing, extras booking, booking management, QR display |
| **F3.1-F3.8** | Crowd Monitoring UI | Completed | Live density dashboard, history charts, recommendations, heatmap |
| **F4.1-F4.13** | Student Canteen UI | Completed | Canteen browsing, search, cart, checkout, payment, order tracking |
| **F5.1-F5.6** | Mess Manager UI | Completed | Menu CRUD, bookings dashboard, inventory management, statistics |
| **F6.1-F6.9** | Mess Worker UI | Completed | QR scanner page, scan history, verification result display |
| **F7.1-F7.11** | Canteen Manager UI | Completed | Orders dashboard, menu management, statistics |
| **F8.1-F8.10** | Delivery Coordinator UI | Not Started | Dashboard placeholder exists; planned for v2.0 |
| **F9.1-F9.6** | Notifications UI | Not Started | Planned for v2.0 alongside backend FCM integration |
| **NF1** | Settings/Theme UI | Not Started | Dark mode toggle and notification preferences planned for v2.0 |

---

## 3.2 Future Development Plan

### 3.2.1 Planned Features for Version 2.0

| Feature | Priority | Description |
|---------|----------|-------------|
| **Delivery Coordinator Module** | High | Complete delivery dashboard with order acceptance, real-time status tracking, earnings view, and photo proof upload for both backend APIs and frontend UI. |
| **Notification Center** | High | Push notifications via Firebase Cloud Messaging (FCM), in-app notification drawer with read/unread management, and configurable notification preferences. |
| **Settings and Theme** | Medium | Dark/light/system theme toggle with Tailwind dark mode, notification settings, and change password UI. |
| **User Profile Page** | Medium | Editable user profile with avatar upload and image cropping, mess account widget integration for students. |
| **Shared UI Component Library** | Medium | Standardized design-system primitives (Button, Card, Modal, Skeleton, Badge, Input, Select, Tabs) for consistent styling across all modules. |
| **PWA Support** | Medium | Service worker for offline-first experience and add-to-homescreen capability. |
| **Accessibility** | Low | WCAG 2.1 AA compliance, screen reader support, and full keyboard navigation. |

### 3.2.2 Production Deployment Architecture

The application is designed for a distributed microservice deployment using free-tier cloud services, optimized for the IITK infrastructure:

<div style="page-break-inside: avoid; text-align: center;">
<img src="docs/deployment_arch.png" style="max-width: 100%; height: auto;" />
</div>

| Platform | Service | Cost |
|----------|---------|------|
| **Netlify** | Frontend hosting (React/Vite static build on global CDN) | Free |
| **Render** | Backend API Node 1 (Django REST Framework) | Free tier |
| **Koyeb** | Backend API Node 2 (Django REST, load balanced) | Free tier |
| **Supabase** | Managed PostgreSQL database | Free tier |
| **Upstash** | Serverless Redis (cache, Celery broker, Channels layer) | Free tier |
| **IITK Server** | Nginx load balancer, ML service, Celery workers, WebSocket server | University provided |

**Key architectural advantages:**

1. **True Load Balancing**: API traffic is distributed across two independent cloud providers (Render and Koyeb) via Nginx round-robin. If one provider experiences downtime, the other continues serving requests.
2. **Stateless API Containers**: PostgreSQL (Supabase) and Redis (Upstash) are externalized, making the Django backend containers completely stateless, a core requirement for horizontal scaling.
3. **Compute Segregation**: Heavy AI workloads (YOLOv8 inference) are isolated to the IITK server so they do not impact web API response times.
4. **Zero Infrastructure Cost**: The entire production deployment uses free-tier services, with the university-provided IITK server handling compute-intensive tasks.

---

# Appendix A - Complete API Endpoint Reference

This appendix lists the merged backend endpoints in the exact codebase, with URL, method, request data, and status behavior.

## A.1 Base API Endpoints

### Health Check

**URL:** <span style="color: #198754;">/api/health/</span>

**Method:** <span style="color: #198754;">GET</span>

**Data:** <span style="color: #198754;">None</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns API health, database status, and version)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

### Add Numbers

**URL:** <span style="color: #198754;">/api/add/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ a, b }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns a, b, result, and operation)
    }
    else: {
        400 Bad Request Missing a or b,
        400 Bad Request Invalid numeric input,
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

## A.2 Authentication and User Endpoints

### Register

**URL:** <span style="color: #198754;">/api/auth/register/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ email, password, phone, role_name, full_name, roll_number, hostel_name, room_number, employee_code }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        201 Created OTP sent to email
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request A verified account with this email already exists,
        429 Too Many Requests OTP rate limit exceeded,
        429 Too Many Requests Email limit reached for this account
    }
}</div>

### Verify OTP

**URL:** <span style="color: #198754;">/api/auth/verify-otp/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ email, otp }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Email verified successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Invalid OTP,
        404 Not Found User not found
    }
}</div>

### Login

**URL:** <span style="color: #198754;">/api/auth/login/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ email, password }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns access, refresh, and user role details)
    }
    else: {
        400 Bad Request Invalid email or password,
        400 Bad Request Email not verified,
        400 Bad Request Account is inactive
    }
}</div>

### Refresh Token

**URL:** <span style="color: #198754;">/api/auth/refresh/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ refresh }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns new access token)
    }
    else: {
        400 Bad Request Invalid refresh token,
        400 Bad Request Invalid request data
    }
}</div>

### Logout

**URL:** <span style="color: #198754;">/api/auth/logout/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ refresh }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Logged out
    }
    else: {
        400 Bad Request Invalid refresh token,
        400 Bad Request Invalid request data,
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

### Forgot Password

**URL:** <span style="color: #198754;">/api/auth/forgot-password/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ email }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK OTP sent to email
    }
    else: {
        400 Bad Request Invalid request data,
        404 Not Found User not found,
        429 Too Many Requests OTP rate limit exceeded,
        429 Too Many Requests Email limit reached for this account
    }
}</div>

### Reset Password

**URL:** <span style="color: #198754;">/api/auth/reset-password/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ email, otp, new_password }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Password reset successful
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Invalid OTP,
        404 Not Found User not found
    }
}</div>

### Current User Profile (GET)

**URL:** <span style="color: #198754;">/api/users/me/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns current user details and profile info)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

### Current User Profile (PATCH)

**URL:** <span style="color: #198754;">/api/users/me/</span>

**Method:** <span style="color: #198754;">PATCH</span>

**Data:** <span style="color: #198754;">{ phone }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns updated current user details)
    }
    else: {
        400 Bad Request Invalid request data,
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

### Current Student Mess Account

**URL:** <span style="color: #198754;">/api/users/me/mess-account/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns mess account balance and timestamp)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        404 Not Found Student profile not found,
        404 Not Found Mess account not found
    }
}</div>

### Delete Account

**URL:** <span style="color: #198754;">/api/users/me/delete/</span>

**Method:** <span style="color: #198754;">DELETE</span>

**Data:** <span style="color: #198754;">{ password }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Account deleted successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Incorrect password,
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

## A.3 Mess Endpoints

### List Active Messes

**URL:** <span style="color: #198754;">/api/mess/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns active mess list)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a student
    }
}</div>

### List Mess Menu

**URL:** <span style="color: #198754;">/api/mess/{mess_id}/menu/</span>

**Method:** <span style="color: #198754;">GET</span>

**Data:** <span style="color: #198754;">Query params: meal_type, day_of_week, is_active</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns filtered menu items for the mess)
    }
    else: {
        400 Bad Request Invalid boolean value for is_active,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a student,
        404 Not Found Mess not found or inactive
    }
}</div>

### Create Extras Booking

**URL:** <span style="color: #198754;">/api/mess/extras/book/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ menu_item, quantity, meal_type, mess_id }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        201 Created Booking created successfully (returns booking detail and QR payload)
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Selected menu item is inactive,
        400 Bad Request Provided mess_id does not match selected menu item,
        400 Bad Request Requested meal_type does not match selected menu item,
        400 Bad Request Insufficient stock for requested quantity,
        400 Bad Request Insufficient mess account balance,
        400 Bad Request Mess account not found for student,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a student
    }
}</div>

### List Student Bookings

**URL:** <span style="color: #198754;">/api/mess/bookings/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns student's own bookings)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a student
    }
}</div>

### Booking Detail

**URL:** <span style="color: #198754;">/api/mess/bookings/{booking_id}/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns full booking detail)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a student,
        404 Not Found Booking not found or not owned by current student
    }
}</div>

### Booking QR Image

**URL:** <span style="color: #198754;">/api/mess/bookings/{booking_id}/qr-image/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns QR image as PNG)
    }
    else: {
        400 Bad Request QR generation failed,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a student,
        404 Not Found Booking not found or not owned by current student
    }
}</div>

### Cancel Booking

**URL:** <span style="color: #198754;">/api/mess/bookings/{booking_id}/cancel/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ refund, restore_inventory }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Booking cancelled successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Only pending bookings can be cancelled,
        400 Bad Request Expired booking cannot be cancelled,
        400 Bad Request Booking does not belong to current student,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a student,
        404 Not Found Booking not found or not owned by current student
    }
}</div>

### Manager Menu List

**URL:** <span style="color: #198754;">/api/mess/manager/menu/</span>

**Method:** <span style="color: #198754;">GET</span>

**Data:** <span style="color: #198754;">Query params: meal_type, day_of_week, is_active, mess_id</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns manager-scoped menu items)
    }
    else: {
        400 Bad Request Invalid mess_id,
        400 Bad Request Multiple active manager assignments found; mess_id required,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a mess manager,
        403 Forbidden No active manager assignment found
    }
}</div>

### Manager Menu Create

**URL:** <span style="color: #198754;">/api/mess/manager/menu/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ mess, item_name, description, price, meal_type, day_of_week, available_quantity, default_quantity, image_url, is_active, mess_id }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        201 Created Menu item created successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Managers can create menu items only for their assigned mess,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a mess manager,
        403 Forbidden No active manager assignment found
    }
}</div>

### Manager Menu Detail Update

**URL:** <span style="color: #198754;">/api/mess/manager/menu/{menu_item_id}/</span>

**Method:** <span style="color: #198754;">PATCH</span>

**Data:** <span style="color: #198754;">{ mess, item_name, description, price, meal_type, day_of_week, available_quantity, default_quantity, image_url, is_active, mess_id }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Menu item updated successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Changing mess is not allowed from manager menu endpoint,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a mess manager,
        404 Not Found Menu item not found in manager scope
    }
}</div>

### Manager Menu Delete

**URL:** <span style="color: #198754;">/api/mess/manager/menu/{menu_item_id}/</span>

**Method:** <span style="color: #198754;">DELETE</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        204 No Content Menu item soft-deleted successfully
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a mess manager,
        404 Not Found Menu item not found in manager scope
    }
}</div>

### Manager Booking Dashboard

**URL:** <span style="color: #198754;">/api/mess/manager/bookings/</span>

**Method:** <span style="color: #198754;">GET</span>

**Data:** <span style="color: #198754;">Query params: status, meal_type, booking_date, booking_date_from, booking_date_to, mess_id</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns { stats, results } where stats contains booking counts by status and results contains booking list items)
    }
    else: {
        400 Bad Request Invalid filter values or invalid date format,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a mess manager,
        404 Not Found Staff profile not found
    }
}</div>

### Manager Stats

**URL:** <span style="color: #198754;">/api/mess/manager/stats/</span>

**Method:** <span style="color: #198754;">GET</span>

**Data:** <span style="color: #198754;">Query params: status, meal_type, booking_date, booking_date_from, booking_date_to, mess_id</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns mess_id, mess_name, total_bookings, total_redeemed, total_cancelled, total_expired, total_pending, total_revenue, and most_popular_item)
    }
    else: {
        400 Bad Request Invalid filter values or invalid date format,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a mess manager,
        404 Not Found Staff profile not found
    }
}</div>

### Manager Inventory List

**URL:** <span style="color: #198754;">/api/mess/manager/inventory/</span>

**Method:** <span style="color: #198754;">GET</span>

**Data:** <span style="color: #198754;">Query params: mess_id</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns all menu items for the manager's assigned mess, including available_quantity, default_quantity, and image_url)
    }
    else: {
        400 Bad Request Invalid mess_id,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a mess manager,
        404 Not Found Staff profile not found
    }
}</div>

### Manager Inventory Update

**URL:** <span style="color: #198754;">/api/mess/manager/inventory/</span>

**Method:** <span style="color: #198754;">PATCH</span>

**Data:** <span style="color: #198754;">{ menu_item_id, available_quantity, default_quantity, mess_id }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Inventory updated successfully (returns updated menu item object)
    }
    else: {
        400 Bad Request menu_item_id is required,
        400 Bad Request At least one inventory field must be provided,
        400 Bad Request available_quantity or default_quantity is invalid or negative,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a mess manager,
        404 Not Found Menu item not found in manager scope
    }
}</div>

### Worker Verify Booking

**URL:** <span style="color: #198754;">/api/mess/worker/verify/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ qr_code } or { booking_id } and optional { mess_id } when the worker has multiple active assignments</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Booking verified successfully (returns full booking detail after redemption)
    }
    else: {
        400 Bad Request Provide either qr_code or booking_id,
        400 Bad Request Provide only one of qr_code or booking_id,
        400 Bad Request Booking already redeemed, expired, cancelled, or otherwise not redeemable,
        400 Bad Request Booking does not belong to worker's assigned mess,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a mess worker,
        404 Not Found Booking not found
    }
}</div>

### Worker Scan History

**URL:** <span style="color: #198754;">/api/mess/worker/scan-history/</span>

**Method:** <span style="color: #198754;">GET</span>

**Data:** <span style="color: #198754;">Query params: mess_id</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns recently redeemed bookings handled by the current worker)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a mess worker,
        404 Not Found Staff profile not found
    }
}</div>

## A.4 Canteen Endpoints

### List Active Canteens

**URL:** <span style="color: #198754;">/api/canteens/</span>

**Method:** <span style="color: #198754;">GET</span>

**Data:** <span style="color: #198754;">Query params: is_delivery_available, is_active</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns list of active canteens with summary fields)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

### Canteen Detail

**URL:** <span style="color: #198754;">/api/canteens/{id}/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns full canteen detail plus nested category list)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        404 Not Found Canteen not found or inactive
    }
}</div>

### Canteen Menu

**URL:** <span style="color: #198754;">/api/canteens/{id}/menu/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns { canteen_id, canteen_name, categories, uncategorized_items })
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        404 Not Found Canteen not found
    }
}</div>

### Canteen Categories

**URL:** <span style="color: #198754;">/api/canteens/{id}/categories/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns active categories for the selected canteen)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

### Search Canteen Menu Items

**URL:** <span style="color: #198754;">/api/canteens/search/</span>

**Method:** <span style="color: #198754;">GET</span>

**Data:** <span style="color: #198754;">Query params: q, category, canteen, is_veg, is_available, min_price, max_price</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns matching menu items with canteen and category context)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

### Canteen Manager Menu List

**URL:** <span style="color: #198754;">/api/canteen-manager/menu/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns menu items for the manager's assigned canteen)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin
    }
}</div>

### Canteen Manager Menu Create

**URL:** <span style="color: #198754;">/api/canteen-manager/menu/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ canteen, category, item_name, description, price, preparation_time_mins, is_veg, is_available, available_quantity, image_url, is_active }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        201 Created Menu item created successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request No canteen assigned to this manager profile,
        400 Bad Request Category does not belong to the provided canteen,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin
    }
}</div>

### Canteen Manager Menu Detail

**URL:** <span style="color: #198754;">/api/canteen-manager/menu/{id}/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns a single manager-scoped menu item)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin,
        404 Not Found Menu item not found in manager scope
    }
}</div>

### Canteen Manager Menu Update

**URL:** <span style="color: #198754;">/api/canteen-manager/menu/{id}/</span>

**Method:** <span style="color: #198754;">PATCH</span>

**Data:** <span style="color: #198754;">{ canteen, category, item_name, description, price, preparation_time_mins, is_veg, is_available, available_quantity, image_url, is_active }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Menu item updated successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Canteen managers cannot move menu items across canteens,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin,
        404 Not Found Menu item not found in manager scope
    }
}</div>

### Canteen Manager Menu Delete

**URL:** <span style="color: #198754;">/api/canteen-manager/menu/{id}/</span>

**Method:** <span style="color: #198754;">DELETE</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        204 No Content Menu item soft-deleted successfully
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin,
        404 Not Found Menu item not found in manager scope
    }
}</div>

### Canteen Manager Category List

**URL:** <span style="color: #198754;">/api/canteen-manager/categories/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns categories for the manager's assigned canteen)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin
    }
}</div>

### Canteen Manager Category Create

**URL:** <span style="color: #198754;">/api/canteen-manager/categories/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ canteen, category_name, display_order, is_active }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        201 Created Category created successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request No canteen assigned to this manager profile,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin
    }
}</div>

### Canteen Manager Stats

**URL:** <span style="color: #198754;">/api/canteen-manager/stats/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns daily stat objects with total_orders, total_revenue, pending_orders, preparing_orders, ready_orders, and completed_orders)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin
    }
}</div>

## A.5 Order Endpoints

### Student Order History

**URL:** <span style="color: #198754;">/api/orders/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns the authenticated student's order history)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden Only students can view personal order history
    }
}</div>

### Place Canteen Order

**URL:** <span style="color: #198754;">/api/orders/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ canteen_id, order_type, scheduled_time, delivery_address, notes, items: [{ menu_item_id, quantity, special_instructions }] }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        201 Created Order placed successfully (returns full order object including items, pickup QR/OTP, status timeline)
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Canteen not found,
        400 Bad Request Delivery address is required for delivery orders,
        400 Bad Request Delivery is not available for this canteen,
        400 Bad Request Minimum order amount for delivery not met,
        400 Bad Request Menu item does not exist, is unavailable, or has insufficient stock,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden Only students can place canteen orders
    }
}</div>

### Student Order Detail

**URL:** <span style="color: #198754;">/api/orders/{id}/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns full order detail, nested items, pricing, pickup credentials, and status timeline)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        404 Not Found Order not found or not owned by current student
    }
}</div>

### Student Cancel Order

**URL:** <span style="color: #198754;">/api/orders/{id}/cancel/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ reason }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Order cancelled successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Invalid status transition for cancellation,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden Only students can cancel their orders,
        404 Not Found Order not found
    }
}</div>

### Student Order Status

**URL:** <span style="color: #198754;">/api/orders/{id}/status/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns compact order status object)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden Only students can check personal order status,
        404 Not Found Order not found
    }
}</div>

### Canteen Manager Order List

**URL:** <span style="color: #198754;">/api/canteen-manager/orders/</span>

**Method:** <span style="color: #198754;">GET</span>

**Data:** <span style="color: #198754;">Query params: status</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns orders for the manager's assigned canteen)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin
    }
}</div>

### Canteen Manager Accept Order

**URL:** <span style="color: #198754;">/api/canteen-manager/orders/{id}/accept/</span>

**Method:** <span style="color: #198754;">POST</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Order accepted successfully (status becomes confirmed)
    }
    else: {
        400 Bad Request Invalid state transition,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin,
        404 Not Found Order not found in manager scope
    }
}</div>

### Canteen Manager Reject Order

**URL:** <span style="color: #198754;">/api/canteen-manager/orders/{id}/reject/</span>

**Method:** <span style="color: #198754;">POST</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Order rejected successfully
    }
    else: {
        400 Bad Request Invalid state transition,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin,
        404 Not Found Order not found in manager scope
    }
}</div>

### Canteen Manager Update Order Status

**URL:** <span style="color: #198754;">/api/canteen-manager/orders/{id}/status/</span>

**Method:** <span style="color: #198754;">PATCH</span>

**Data:** <span style="color: #198754;">{ status, estimated_ready_time }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Order status updated successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Invalid state transition,
        400 Bad Request Pickup/prebook orders cannot use delivery statuses,
        400 Bad Request Delivery orders cannot be marked as picked up,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin,
        404 Not Found Order not found in manager scope
    }
}</div>

### Canteen Manager Verify Pickup

**URL:** <span style="color: #198754;">/api/canteen-manager/orders/{id}/verify-pickup/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ pickup_otp } or { pickup_qr_code }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Pickup verified successfully (order status becomes picked_up)
    }
    else: {
        400 Bad Request Either pickup_otp or pickup_qr_code is required,
        400 Bad Request Delivery orders cannot be verified as pickup,
        400 Bad Request Pickup can only be verified once order is ready,
        400 Bad Request Invalid pickup OTP or QR code,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin,
        404 Not Found Order not found in manager scope
    }
}</div>

## A.6 Payment Endpoints

### Create Razorpay Order

**URL:** <span style="color: #198754;">/api/payments/create-order/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ order_id }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Payment initiation successful (returns { payment, razorpay_key_id, razorpay_order })
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Razorpay order creation failed,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden Only students can create payment orders,
        404 Not Found Order not found
    }
}</div>

### Verify Payment

**URL:** <span style="color: #198754;">/api/payments/verify/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ razorpay_order_id, razorpay_payment_id, razorpay_signature }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Payment verified successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Invalid payment signature,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden Only students can verify payments,
        404 Not Found Payment record not found
    }
}</div>

### Razorpay Webhook

**URL:** <span style="color: #198754;">/api/payments/webhook/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">Razorpay webhook payload with X-Razorpay-Signature header</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Webhook processed successfully
    }
    else: {
        400 Bad Request Missing Razorpay signature,
        400 Bad Request Invalid Razorpay webhook signature,
        400 Bad Request Webhook verification or processing failed
    }
}</div>

### Refund Payment

**URL:** <span style="color: #198754;">/api/payments/{order_id}/refund/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ amount } (optional; if omitted, refunds full eligible amount)</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK Refund processed successfully
    }
    else: {
        400 Bad Request Invalid request data,
        400 Bad Request Refund allowed only for captured or authorized payments,
        400 Bad Request Refund initiation failed,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden User is not a canteen manager or superadmin,
        404 Not Found Order or payment not found
    }
}</div>

### Payment Status

**URL:** <span style="color: #198754;">/api/payments/{order_id}/status/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns payment object if present, otherwise { order_id, order_number, status: "not_initiated" })
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        404 Not Found Order not found for the current user or manager scope
    }
}</div>

## A.7 Crowd Monitoring Endpoints

### List Camera Feeds

**URL:** <span style="color: #198754;">/api/crowd/feeds/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns all registered camera feeds)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden Only superadmin, mess managers, and canteen managers can manage feeds
    }
}</div>

### Register Camera Feed

**URL:** <span style="color: #198754;">/api/crowd/feeds/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">{ mess_id, camera_url, is_active, location_description }</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        201 Created Camera feed created successfully
    }
    else: {
        400 Bad Request Invalid request data,
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden Only superadmin, mess managers, and canteen managers can manage feeds
    }
}</div>

### Delete Camera Feed

**URL:** <span style="color: #198754;">/api/crowd/feeds/{id}/</span>

**Method:** <span style="color: #198754;">DELETE</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        204 No Content Camera feed deleted successfully
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        403 Forbidden Only superadmin, mess managers, and canteen managers can manage feeds,
        404 Not Found Camera feed not found
    }
}</div>

### Live Crowd Data

**URL:** <span style="color: #198754;">/api/crowd/mess/{mess_id}/live/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns live Redis-backed crowd object with person_count, density_percentage, density_level, estimated_wait_minutes, timestamp, and optional feed_url)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided,
        404 Not Found No live data available for this mess
    }
}</div>

### Crowd History

**URL:** <span style="color: #198754;">/api/crowd/mess/{mess_id}/history/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns today's recorded crowd metrics ordered by time)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

### Crowd Recommendation

**URL:** <span style="color: #198754;">/api/crowd/mess/{mess_id}/recommendation/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns best visiting hours based on historical low-density periods)
    }
    else: {
        401 Unauthorized Authentication credentials were not provided
    }
}</div>

### Analyze Crowd from Uploaded Image

**URL:** <span style="color: #198754;">/api/crowd/test-image/</span>

**Method:** <span style="color: #198754;">POST</span>

**Data:** <span style="color: #198754;">multipart/form-data with { file } (uploaded image)</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns ML service analysis result)
    }
    else: {
        400 Bad Request No image file provided,
        401 Unauthorized Authentication credentials were not provided,
        503 Service Unavailable Could not connect to ML service
    }
}</div>

## A.8 API Documentation Endpoints

### OpenAPI Schema

**URL:** <span style="color: #198754;">/api/schema/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns generated OpenAPI schema)
    }
}</div>

### Swagger UI

**URL:** <span style="color: #198754;">/api/docs/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns Swagger UI page for the backend APIs)
    }
}</div>

### ReDoc UI

**URL:** <span style="color: #198754;">/api/redoc/</span>

**Method:** <span style="color: #198754;">GET</span>

**Status:**
<div style="color: #198754; white-space: pre-wrap; margin-left: 20px; font-family: Arial, sans-serif; font-size: 11pt;">{
    If successful: {
        200 OK (returns ReDoc documentation page for the backend APIs)
    }
}</div>

---

# Appendix B - Group Log

| S.no. | Date | Timings | Venue | Description |
|-------|------|---------|-------|-------------|
| 1 | 10/02/26 | 19:00 - 20:30 | Hall 12 B313 | Defined the frontend project structure using React 18, Vite, and Tailwind CSS, and established the feature-based directory layout with conflict-avoidance rules for parallel development across four team members. |
| 2 | 15/02/26 | 19:30 - 21:00 | Hall 12 B311 | Finalised the shared infrastructure layer including the Axios API client with JWT interceptors, Zustand store conventions, React Query key factory, and reusable UI component library (Button, Card, Modal, Input, etc.). |
| 3 | 19/02/26 | 20:00 - 22:00 | Hall 12 B313 | Specified the React Query hooks and WebSocket integration patterns for real-time features including live crowd density updates, order status tracking, and notification delivery using exponential backoff reconnection. |
| 4 | 10/03/26 | 19:00 - 20:30 | Hall 12 B313 | Created detailed component designs for the ML Crowd Monitoring module (student and manager views) and the Canteen Interface including menu browsing, cart checkout flow, and Razorpay payment integration. |
| 5 | 14/03/26 | 20:00 - 21:30 | Hall 12 B311 | Designed the Mess Interface components covering extras booking with QR code generation, mess worker QR scanner verification flow, and role-based manager screens for menu and inventory management. |
| 6 | 20/03/26 | 20:00 - 22:00 | Hall 12 B311 | Completed the Settings, User Profile, Notification Center, and Delivery Coordinator screen designs, and finalised the central routing setup with role-based route guards (RequireAuth, RequireRole). |
| 7 | 25/03/26 | 20:00 - 22:00 | Hall 12 B313 | Integrated all four feature modules (ml, canteen, mess, settings) into the central router, resolved cross-feature dependencies (e.g., cart, notifications, mess account, profile) and finalised the frontend documentation for implementation. |
