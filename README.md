# FINO PAY - Mobile Banking Application Prototype

This is a high-fidelity, interactive prototype of a mobile banking application named "FINO PAY", built with Next.js and designed for Android using Capacitor.

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **AI**: Genkit
- **Android Bridge**: Capacitor

## Core Features

- **Authentication**: Secure login with PIN or Face ID.
- **Dashboard**: At-a-glance view of your finances.
- **Account Management**: Detailed views for savings, investments, and loan accounts.
- **Transaction History**: A comprehensive passbook with filtering and spending analysis.
- **Fund Transfers**: Easily send money to saved payees.
- **User Profile**: Manage your personal and security details.
- **AI-Powered Insights**: Analyze bank statements using generative AI.
- **Help & Support**: Access FAQs, an AI Assistant, and a mock Agent Live Chat.
- **Developer Settings**: A powerful admin panel to manage the app's mock data in real-time.

## Project Setup

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Android Studio (for building the Android app)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

## Building the Android APK

This project uses Capacitor to wrap the Next.js web application into a native Android app.

1.  **Build the Next.js app for production:**
    This command generates a static version of the site in the `out/` directory.
    ```bash
    npm run build
    ```

2.  **Add the Android platform to Capacitor:**
    This only needs to be done once.
    ```bash
    npx cap add android
    ```

3.  **Sync the web build with the Android project:**
    This command copies the web assets from `out/` into the native Android project. Run this command every time you make changes to the web app and want to update the native build.
    ```bash
    npx cap sync
    ```

4.  **Open the Android project in Android Studio:**
    ```bash
    npx cap open android
    ```

5.  **Build the APK in Android Studio:**
    - Wait for Gradle to sync.
    - Go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
    - Once the build is complete, you can find the APK in `android/app/build/outputs/apk/debug/`.

## App Architecture

### Data Management

The application uses the browser's `localStorage` to simulate a persistent backend. All data, including user details, transactions, and settings, is stored locally.

- **`src/lib/constants.ts`**: Defines the initial mock data structure and default values.
- **`src/lib/storage.ts`**: Provides helper functions to safely read from and write to `localStorage`.
- **`src/hooks/use-app-data.ts`**: A React hook that provides application-wide state management, abstracting the `localStorage` interactions.

### AI Features

The app integrates Genkit for generative AI capabilities:

- **Statement Analysis**: In the "AI Analysis" section, users can paste text from a bank statement. The app sends this text to a Genkit flow (`statementSummaryFlow`) which returns a concise financial summary.
- **PDF Transaction Extraction**: In the Developer Settings, uploading a PDF bank statement triggers another Genkit flow (`extractTransactionsFromPdfFlow`). This multimodal flow parses the PDF, extracts transaction data, and adds it to the app's state.

### Developer Settings

The `/settings` page is a powerful control panel for this prototype. It allows for real-time manipulation of the application's mock data stored in `localStorage`, which is invaluable for testing and demonstration purposes. You can:

- Edit account details and balances.
- Perform full CRUD (Create, Read, Update, Delete) operations on transactions, payees, and live chat messages.
- Upload images (which are stored as data URIs).
- Test the PDF extraction AI feature.
- Import and Export the entire app state as a JSON file.
