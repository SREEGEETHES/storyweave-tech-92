import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1 transition-colors ${
          items.some(item => currentPath === item.href) ? 'text-primary' : 'text-foreground/80 hover:text-primary'
        }`}
      >
        <span>{label}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 transition-transform" />
        ) : (
          <ChevronDown className="h-4 w-4 transition-transform" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-black rounded-lg shadow-lg border border-gray-700 z-50">
          <div className="py-2">
            {items.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className="block px-4 py-3 text-sm text-white hover:text-primary hover:bg-gray-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-xs text-gray-300 mt-1">{item.description}</div>
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