import AssistantFullScreen from '../components/chat/AssistantFullScreen';
import { useAuth } from '../context/AuthContext';

export default function AssistantPage() {
  const { currentUser } = useAuth();
  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col p-3 sm:p-4 h-full overflow-hidden">
      <AssistantFullScreen currentUser={currentUser} />
    </div>
  );
}
