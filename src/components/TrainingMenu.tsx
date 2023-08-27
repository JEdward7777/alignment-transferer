// FileMenu.tsx
import React from 'react';

interface TrainingMenuProps {
  isTrainingEnabled: boolean;
  setIsTrainingEnabled: (flag: boolean) => void;
  setTestReservationFlag: (flag: boolean) => void;
}

const TrainingMenu: React.FC<TrainingMenuProps> = ({ isTrainingEnabled, setIsTrainingEnabled, setTestReservationFlag }) => {


  return (
    <li className="relative group z-10">
      <a href="#" className="text-gray-700 hover:text-black">
        Training
      </a>
      <ul className="absolute hidden group-hover:block bg-white py-2 ml-0.5 w-40">
        <li>
            <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={()=>setIsTrainingEnabled(!isTrainingEnabled)}>
                {isTrainingEnabled ? 'Disable Training' : 'Enable Training'}
            </a>
        </li>
        <li>
            <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={()=>setTestReservationFlag(true)}>
                Reserve selected for testing
            </a>
        </li>
        <li>
            <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={()=>setTestReservationFlag(false)}>
                Reserve selected for training
            </a>
        </li>
      </ul>
    </li>
  );
};


export default TrainingMenu;
