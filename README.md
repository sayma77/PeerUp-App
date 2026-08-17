# PeerUp 🤝

> The decentralized platform for human knowledge. Swap what you know for what you want to learn.

PeerUp is a React Native mobile application built with Expo that connects individuals who want to exchange skills. Instead of paying for courses, users can offer their expertise in one area (e.g., React Native) in exchange for mentorship in another (e.g., Guitar Basics).

## Key Features

- **User Profiles & Skill Exchange:** Showcase "Skills Offered" to teach and "Skills Requested" to learn.
- **Direct Communication:** Access real-time chat with file sharing and schedule 1-on-1 learning sessions.
- **Project Collaboration:** Post multi-student projects.
- **Virtual Live Classrooms:** Host group classrooms using external conferencing links and engage in in-class Q&A threads.
- **Resource Archiving & Ratings:** Access post-class resources (like slides and repositories) and evaluate mentors through a rating system.
- **AI Skill Path Recommender:** Analyzes learning history to suggest your next logical skill to learn.
- **Personalized AI Chatbot:** An intelligent learning assistant that provides tailored study guidance, answers skill-related questions, and helps navigate learning opportunities based on your profile and progress.
- **Push Notifications:** Receive real-time alerts for new messages, project updates, and live class reminders.

## Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) / [Expo](https://expo.dev/) (File-based routing with Expo Router)
- **Styling:** [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Icons:** Expo Vector Icons (Feather)
- **Backend (Planned/WIP):** Firebase (Authentication & Firestore) — screens currently use mock data; Firestore wiring is in progress

## How It Works

1.  **List Your Skill:** Create a profile detailing what you can teach and what you want to learn in return.
2.  **Find a Match:** Browse users who have the expertise you need and are looking for the skills you offer.
3.  **Swap Knowledge:** Connect via messages to start your mutual learning journey.

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine. You will also need the [Expo Go](https://expo.dev/go) app installed on your physical iOS or Android device, or a configured emulator on your computer.

### Installation

1. Clone the repository:
```bash
   git clone https://github.com/YourUsername/peerup-app.git
   cd peerup-app
```
2. Install dependencies:
```bash
   npm install
```
3. Start the development server:
```bash
   npx expo start
```
4. Open the app:

- **Physical Device:** Scan the QR code shown in your terminal using the Expo Go app.
- **iOS Simulator:** Press `i` in the terminal.
- **Android Emulator:** Press `a` in the terminal.

### Project Structure (Overview)
```
peerup-app/
├── app/                       # Expo Router file-based navigation (screens)
│   ├── index.tsx                # Public Home screen
│   ├── (auth)/                  # Login, Register
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/                  # Main app screens
│       ├── dashboard.tsx          # Dashboard
│       ├── skills.tsx             # Skills library
│       ├── projects.tsx           # Projects
│       ├── resources.tsx          # Resources
│       ├── notifications.tsx      # Notifications (stub, not yet built)
│       ├── chat/                    # Messaging (stub, not yet built)
│       ├── profile/                 # Own & public profile
│       └── skills/, projects/       # Dynamic detail routes ([id].tsx)
├── components/                # Reusable UI components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Screen.tsx
│   └── ProfileView.tsx
├── context/                   # React Context providers
│   └── ToastContext.tsx
├── types/                     # TypeScript interfaces and type definitions
│   ├── dashboard.ts
│   ├── profile.ts
│   ├── projects.ts
│   ├── resources.ts
│   └── skills.ts
├── app.json                   # Expo app configuration
├── babel.config.js
├── metro.config.js
├── tailwind.config.js         # NativeWind/Tailwind theme configuration
└── tsconfig.json
```
## Contributing

Contributions are welcome!