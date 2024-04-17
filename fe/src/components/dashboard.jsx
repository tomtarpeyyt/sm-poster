import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/user/dashboard', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setUserData(response.data);
      } catch (error) {
        console.error(error);
        // Handle error - redirect to sign-in page or display error message
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = () => {
    // Clear user data and token from localStorage
    localStorage.removeItem('token');
    // Redirect user to sign-in page or homepage
    // Example: window.location.href = '/signin';
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-blue-200 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">User Dashboard</h2>
      {userData && (
        <div>
          <p className="mb-2"><strong>Username:</strong> {userData.username}</p>
          <p className="mb-2"><strong>Email:</strong> {userData.email}</p>
          {/* Add more user-specific information here */}
          <button onClick={handleSignOut} className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md mt-4">Sign Out</button>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
