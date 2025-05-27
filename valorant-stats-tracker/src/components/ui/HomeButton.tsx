import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function HomeButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className="flex items-center gap-2 px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
    >
      <Home size={16} />
      Home
    </button>
  );
}
