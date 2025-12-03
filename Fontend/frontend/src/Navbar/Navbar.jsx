import { NavLink } from 'react-router-dom';
import './Navbar.css'
import { useLanguage } from '../Language/LanguageContext';
import { useAuth } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { translate, setLanguage } = useLanguage();
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleAuthClick = () => {
        if (isAuthenticated) {
            logout();
        } else {
            navigate('/login');
        }
    };

    return (
        <div className='navbar-background-wrapper'>
            <div className='navbar-list'>
                <div className='left-nav'>
                    <div className='flag-container'>
                        <div className='flag' id='vietnamese' onClick={() => setLanguage('vi')}></div>
                        <div className='flag' id='english' onClick={() => setLanguage('en')}></div>
                    </div>
                </div>
                <div className='mid-nav'>
                    <NavLink to="/homepage" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>{translate('navbar_home')}</NavLink>
                    <NavLink to="/search" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>{translate('navbar_search')}</NavLink>
                    <NavLink
                        to="/currentplan"
                        className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}
                        onClick={(e) => {
                            if (!isAuthenticated) {
                                e.preventDefault();
                                navigate('/login');
                            }
                        }}
                    >{translate('navbar_currentplan')}</NavLink>
                    <NavLink
                        to="/user"
                        className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}
                        onClick={(e) => {
                            if (!isAuthenticated) {
                                e.preventDefault();
                                navigate('/login');
                            }
                        }}
                    >{translate('navbar_account')}</NavLink>
                    <NavLink to="/aboutus" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>{translate('navbar_about_us')}</NavLink>

                </div>
                <div className='right-nav'>
                    <div className='auth-container'>
                        {isAuthenticated ? (
                            <div className='user-info'>
                                {/* --- LOGIC KIỂM TRA VIP --- */}
                                {user?.role === 'VIP' ? (
                                    <div className='vip-badge'>
                                        👑 Premium
                                    </div>
                                ) : (
                                    <button className='upgrade-btn' onClick={() => navigate('/purchase')}>
                                        ⭐ Upgrade Premium
                                    </button>
                                )}
                                
                                <span className='user-name'>{translate('auth_welcome')} {user?.username}</span>
                                <button className='auth-btn logout-btn' onClick={handleAuthClick}>
                                    {translate('auth_logout')}
                                </button>
                            </div>
                        ) : (
                            <div className='auth-buttons'>
                                <button className='auth-btn login-btn' onClick={() => navigate('/login')}>
                                    {translate('auth_login')}
                                </button>
                                <button className='auth-btn register-btn' onClick={() => navigate('/signup')}>
                                    {translate('auth_register')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar;