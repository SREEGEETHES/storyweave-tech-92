import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}

interface NavigationDropdownProps {
  label: string;
  items: DropdownItem[];
  currentPath: string;
}

const NavigationDropdown = ({ label, items, currentPath }: NavigationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Link 
        to={items[0]?.href || '#'}
        className={`flex items-center space-x-1 transition-colors ${
          items.some(item => currentPath === item.href) ? 'text-primary' : 'text-foreground/80 hover:text-primary'
        }`}
      >
        <span>{label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Link>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-black/80 backdrop-blur-[5px] rounded-lg shadow-lg border border-border/20 z-50">
          <div className="py-2">
            {items.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="block px-4 py-3 text-sm text-white hover:text-primary hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-xs text-white/70 mt-1">{item.description}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationDropdown;