import './App.css'
import { Routes, Route, Link } from 'react-router-dom';
import SigninForm from './components/signin-form'
import SignupForm from './components/signup-form'
import UserDashboard from './components/dashboard';

export default function App() {

  return (
    <>
      <h1 className="text-3xl font-bold underline">
        Hello world!
      </h1>
      <Routes>
      <Route path='/' element={<SignupForm />} />
      <Route path='/sign-in' element={<SigninForm />} />
      <Route path='/sign-up' element={<SignupForm />} />
      <Route path='/dashboard' element={<UserDashboard />} />
      </Routes>
      
      
    </>
  )
}
