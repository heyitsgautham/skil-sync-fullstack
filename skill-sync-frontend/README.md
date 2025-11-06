# SkillSync Frontend

React-based frontend application for the SkillSync intelligent internship matching platform.

## ✅ Day 5 - COMPLETE & DEMO-READY!

All features implemented and ready for production deployment.

## Features

- **User Authentication**: Login and registration with JWT token management
- **Resume Management**: Upload, parse, and manage PDF/Word resumes
- **AI Recommendations**: Get personalized internship matches using RAG
- **Internship Browsing**: View and search available internships
- **Match Scoring**: Visual match scores with color-coded indicators
- **Toast Notifications**: Real-time feedback for all user actions
- **Protected Routes**: Dashboard accessible only to authenticated users
- **Material-UI Design**: Modern, responsive UI components
- **API Integration**: Seamless connection with FastAPI backend

## Tech Stack

- **React** 18
- **React Router** v6
- **Material-UI (MUI)** v5
- **Axios** for API calls
- **LocalStorage** for token persistence

## Project Structure

```
src/
├── components/
│   └── PrivateRoute.js      # Route protection component
├── pages/
│   ├── Login.js             # Login page
│   ├── Register.js          # Registration page
│   └── Dashboard.js         # Dashboard page (protected)
├── services/
│   ├── api.js               # Axios client configuration
│   └── authService.js       # Authentication service
├── App.js                   # Main app component with routing
└── index.js                 # App entry point
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Running SkillSync backend server

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file in the root directory:
```
REACT_APP_API_BASE_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
