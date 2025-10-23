import { NavLink } from 'react-router-dom';
import './Navbar.css'
import { useLanguage } from '../Language/LanguageContext'; // Import useLanguage

const Navbar = () => {
    const { translate, setLanguage } = useLanguage(); // Use the hook and get setLanguage
    return (
        <div className='navbar-background-wrapper'>
            <div className='navbar-list'>
                <NavLink to="/" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>{translate('navbar_home')}</NavLink>
                <div className='list-item'>{translate('navbar_account')}</div>
                <NavLink to="/aboutus" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>{translate('navbar_about_us')}</NavLink>
                <div className='flag-container'>
                    <div className='flag' id='vietnamese' onClick={() => setLanguage('vi')}></div>
                    <div className='flag' id='english' onClick={() => setLanguage('en')}></div>
                </div>

            </div>
        </div>
    )
}

export default Navbar