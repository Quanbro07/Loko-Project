import { NavLink } from 'react-router-dom';
import './Navbar.css'
import { useLanguage } from '../Language/LanguageContext'; // Import useLanguage
import { useAuth } from '../Auth/AuthContext'; // Import useAuth

const Navbar = () => {
    const { translate, setLanguage } = useLanguage(); // Use the hook and get setLanguage
    const { isAuthenticated, user, logout, openAuthModal } = useAuth(); // Use the auth hook

    // Debug: Log user data
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
                <NavLink to="/" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>{translate('navbar_home')}</NavLink>
                <div className='list-item'>{translate('navbar_account')}</div>
                <NavLink to="/aboutus" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>{translate('navbar_about_us')}</NavLink>
                
                {/* Auth Button */}
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

                <div className='flag-container'>
                    <div className='flag' id='vietnamese' onClick={() => setLanguage('vi')}></div>
                    <div className='flag' id='english' onClick={() => setLanguage('en')}></div>
                </div>

            </div>
        </div>
    )
}

export default Navbar