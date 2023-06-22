// pages/about.tsx
import React from 'react';
import { useRouter } from 'next/router';

const AboutPage: React.FC = () => {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="max-w-md p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">About AlignmentTransferer</h1>
        <p className="text-gray-700">
          AlignmentTransferer is an application designed to facilitate working with word alignments between source and target scripture. It was developed by Missions Mutual to assist with the alignment process and improve translation workflows.
        </p>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleGoBack}>
          OK
        </button>
      </div>
    </div>
  );
};

export default AboutPage;
