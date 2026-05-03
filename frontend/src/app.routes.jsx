import { createBrowserRouter } from "react-router";

import Login from "./features/auth/pages/Login"
import Register from "./features/auth/pages/Register"
import Home from "./features/interview/pages/home"
import InterviewPage from "./features/interview/pages/InterviwPage"
import MockInterview from "./features/interview/pages/MockInterview"
import SessionHistory from "./features/interview/pages/SessionHistory"
import ProtectedRoute from "./features/auth/components/protected.jsx"

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        path: "/register",
        element: <Register />,
    },
    {
        path: "/home",
        element: (
            <ProtectedRoute>
                <Home />
            </ProtectedRoute>
        )
    },
    {
        path: "/interview",
        element: (
            <ProtectedRoute>
                <InterviewPage />
            </ProtectedRoute>
        )
    },
    {
        path: "/mock-interview/:sessionId?",
        element: (
            <ProtectedRoute>
                <MockInterview />
            </ProtectedRoute>
        )
    },
    {
        path: "/sessions",
        element: (
            <ProtectedRoute>
                <SessionHistory />
            </ProtectedRoute>
        )
    },
    {
        path: "/sessions/:id",
        element: (
            <ProtectedRoute>
                <SessionHistory />
            </ProtectedRoute>
        )
    }
]);