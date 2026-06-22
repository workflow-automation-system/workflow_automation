import { useAuthStore } from '../stores/authStore';
import { isAdmin } from '../utils/rbac';
import Organisation from './Organisation';
import MemberWorkspace from './MemberWorkspace';

const OrganisationRoute = () => {
  const { user } = useAuthStore();
  return isAdmin(user) ? <Organisation /> : <MemberWorkspace />;
};

export default OrganisationRoute;
