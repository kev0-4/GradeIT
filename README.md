# GradeIT

![GradeIT Logo](./public/icon-192.png)

GradeIT is a modern web application designed to help students and educators track and analyze academic performance. It provides tools for managing marks, monitoring attendance, and visualizing learning trends to provide valuable insights.

## Key Features

- **User Authentication:** Secure login and registration system.
- **Marks Management:** Easily record, view, and update academic marks.
- **Attendance Tracking:** Monitor and manage student attendance records.
- **Trend Analysis:** Visualize marks and attendance trends with interactive charts.
- **PDF Report Generation:** Create and download PDF summaries of academic performance.
- **User Profiles:** Personalized user dashboards and settings.
- **Responsive Design:** Access GradeIT on any device, desktop or mobile.

## Tech Stack

- **Frontend:** Next.js (v15), React (v19), TypeScript
- **UI Components:** shadcn/ui, Radix UI
- **Styling:** Tailwind CSS
- **Charting:** ApexCharts, Recharts
- **Backend & Database:** Firebase (Firestore, Firebase Authentication)
- **Form Handling:** React Hook Form, Zod
- **Date Utilities:** date-fns
- **Deployment:** (Assuming Vercel or similar, can be added later if known)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v18 or later recommended)
- pnpm (You can install it via `npm install -g pnpm`)

### Installation

1.  **Clone the repository:**

    \`\`\`bash
    git clone https://github.com/kev0-4/gradeit
    cd my-v0-project
    \`\`\`

2.  **Install dependencies:**

    \`\`\`bash
    pnpm install
    \`\`\`

3.  **Set up Firebase:**

    - Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    - Enable Firestore and Firebase Authentication.
    - Obtain your Firebase project configuration (API Key, Auth Domain, Project ID, etc.).
    - Create a `.env.local` file in the root of the project.
    - Add your Firebase configuration to `.env.local` like this:
      \`\`\`env
      NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
      NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
      NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
      # Optional, if using measurement
      # NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_measurement_id"
      \`\`\`

4.  **Run the development server:**
    \`\`\`bash
    pnpm dev
    \`\`\`
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

In the project directory, you can run the following commands:

- `pnpm dev`: Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser. The page will reload if you make edits.
- `pnpm build`: Builds the app for production to the `.next` folder.
- `pnpm start`: Starts the production server. You need to run `pnpm build` before this.
- `pnpm lint`: Runs Next.js' built-in ESLint checks.

## Contributing

Contributions are welcome! If you have suggestions for improving GradeIT, please feel free to:

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

Please ensure your code adheres to the existing style and that any new features are well-tested.

## License

Distributed under the MIT License. See `LICENSE` file for more information.
