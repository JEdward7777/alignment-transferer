import React from 'react';
import Link from 'next/link';

const AboutMenu: React.FC = () => {
  return (
    <li>
      <Link href="/about" className="text-gray-700 hover:text-black">
        About
      </Link>
    </li>
  );
};

export default AboutMenu;
