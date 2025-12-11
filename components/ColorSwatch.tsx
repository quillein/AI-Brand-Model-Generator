import React from 'react';
import { COLORS } from '../constants';

export const ColorSwatch: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-2 justify-center py-4 opacity-70 hover:opacity-100 transition-opacity">
      {COLORS.map((color) => (
        <div key={color.hex} className="group relative">
            <div 
            className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
            style={{ backgroundColor: color.hex }}
            title={color.name}
            />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-espresso text-alabaster text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 transition-opacity pointer-events-none">
                {color.name}
            </span>
        </div>
      ))}
    </div>
  );
};