import { createBrowserRouter } from "react-router-dom";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";

export const router = createBrowserRouter([
{
    path: "/login",
    element: <Login/>
},
{
    path: "/register",
    element: <Register/>
},
 {
    path: "/",
    element: <Protected><Home/></Protected>,
 },
 {
    path: "/interviews/:interviewId",
    element: <Protected><Interview /></Protected>,
 }

]);
