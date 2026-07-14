import React, { useState } from 'react';
import AnimatedBackground from '../components/AnimatedBackground';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Dashboard3D from '../components/Dashboard3D';
import LoginModal from '../components/LoginModal';
import Footer from '../components/Footer';

export const Landing: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleOpenLogin = () => {
    setIsLoggingIn(true);
  };

  const handleCloseLogin = () => {
    setIsLoggingIn(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050B1F] text-slate-100 overflow-hidden font-sans flex flex-col justify-between">
      {/* Optimized GPU Background component */}
      <AnimatedBackground isLoggingIn={isLoggingIn} />

      {/* Floating Header Navigation */}
      <Navbar onLoginClick={handleOpenLogin} isLoggingIn={isLoggingIn} />

      {/* Main Core Body Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-16 flex items-center relative z-20 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left Column: Typography Hero copy */}
          <Hero isLoggingIn={isLoggingIn} onLoginClick={handleOpenLogin} />

          {/* Right Column: 3D Interactive dashboard layout */}
          <Dashboard3D isLoggingIn={isLoggingIn} />
        </div>
      </main>

      {/* Sliding Glass Login Modal */}
      <LoginModal isOpen={isLoggingIn} onClose={handleCloseLogin} />

      {/* Footer */}
      <Footer isLoggingIn={isLoggingIn} />
    </div>
  );
};
export default Landing;
