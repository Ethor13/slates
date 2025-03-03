import React from 'react';
import { Link } from 'react-router-dom';

const NavLogo: React.FC = () => {
  return (
    <>
      <div className="flex items-center">
        <Link to="/" className="text-xl font-bold text-white">Slates</Link>
      </div>
      <div className="hidden md:flex"></div>
    </>
  );
};

export default NavLogo;