import { NavLink } from 'react-router-dom';
import './Navbar.css'
import { useLanguage } from '../Language/LanguageContext';
import { useAuth } from '../Auth/AuthContext';

const Navbar = () => {
    const { translate, setLanguage } = useLanguage();
    const { isAuthenticated, user, logout, openAuthModal } = useAuth();

    console.log('User data:', user);

    const handleAuthClick = () => {
        if (isAuthenticated) {
            logout();
        } else {
            openAuthModal('login');
        }
    };

    return (
        <div className='navbar-background-wrapper'>
            <div className='navbar-list'>
                <div className='left-nav'></div>
                <div className='mid-nav'>
                    <NavLink to="/" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>{translate('navbar_home')}</NavLink>
                    <NavLink
                        to="/user"
                        className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}
                        onClick={(e) => {
                            if (!isAuthenticated) {
                                e.preventDefault();
                                openAuthModal('login');
                            }
                        }}
                    >{translate('navbar_account')}</NavLink>
                    <NavLink to="/aboutus" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>{translate('navbar_about_us')}</NavLink>
                    <div className='flag-container'>
                        <div className='flag' id='vietnamese' onClick={() => setLanguage('vi')}></div>
                        <div className='flag' id='english' onClick={() => setLanguage('en')}></div>
                    </div>
                </div>
                <div className='right-nav'>{/* Auth Button */}
                    <div className='auth-container'>
                        {isAuthenticated ? (
                            <div className='user-info'>
                                <span className='user-name'>{translate('auth_welcome')} {user?.username}</span>
                                <button className='auth-btn logout-btn' onClick={handleAuthClick}>
                                    {translate('auth_logout')}
                                </button>
                            </div>
                        ) : (
                            <div className='auth-buttons'>
                                <button className='auth-btn login-btn' onClick={() => openAuthModal('login')}>
                                    {translate('auth_login')}
                                </button>
                                <button className='auth-btn register-btn' onClick={() => openAuthModal('register')}>
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

export default Navbar