import { NavLink } from 'react-router-dom';
import './Navbar.css'

const Navbar = () => {
    return (
        <div className='navbar-background-wrapper'>
            <div className='navbar-list'>
                <NavLink to="/" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>Trang chủ</NavLink>
                <div className='list-item'>Tài khoản</div>
                <NavLink to="/aboutus" className={({ isActive }) => (isActive ? 'list-item active' : 'list-item')}>Về chúng tôi</NavLink>
            </div>
        </div>
    )
}

export default Navbar