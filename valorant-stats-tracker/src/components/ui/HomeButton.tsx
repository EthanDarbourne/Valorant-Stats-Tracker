import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { getButtonClass } from '@/Utilities';

export default function HomeButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className={"flex items-center gap-2 " + getButtonClass({
        bg: "bg-blue-600", text: "text-white", hoverBg: "bg-blue-700", rounded: true, padding: "px-3 py-1", transition: true
      })}
    >
      <Home size={16} />
      Home
    </button>
  );
}
