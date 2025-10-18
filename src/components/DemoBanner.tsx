import React from 'react';
import { Info } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-700">
            <strong>Demo Mode:</strong> You're viewing TheraJournal with mock data. 
            All features are functional for testing the interface and user experience.
          </p>
        </div>
      </div>
    </div>
  );
}
