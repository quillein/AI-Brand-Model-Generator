import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-full font-serif tracking-wide transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95";
  
  const variants = {
    primary: "bg-dusty-rose text-white hover:bg-[#c48b93]",
    secondary: "bg-sage-green text-white hover:bg-[#5d6854]",
    outline: "border-2 border-espresso text-espresso hover:bg-espresso hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};