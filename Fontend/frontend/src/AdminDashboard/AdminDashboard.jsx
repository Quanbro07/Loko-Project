import './AdminDashboard.css';  
import UserList from '../UserList/UserList';
import { useAuth } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
    const { isAuthenticated, user, logout /* openAuthModal removed */ } = useAuth();
    const navigate = useNavigate();

    console.log('User data:', user);

    const handleAuthClick = () => {
        if (isAuthenticated) {
            logout();
        } else {
            navigate('/login');
        }
    };
    return(
        <div>
        <div className='auth-buttons'>
                                <button className='auth-btn login-btn-admin' onClick={() => navigate('/login')}>
                                    Login
                                </button>
                            </div>
            <UserList />
        </div>
    )
}

export default Admin;