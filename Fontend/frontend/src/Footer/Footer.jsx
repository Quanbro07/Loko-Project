import './Footer.css'
import { useLanguage } from '../Language/LanguageContext';
import facebookIcon from '../img/facebookicon.png';
import youtubeIcon from '../img/youtubeicon.png';
import instagramIcon from '../img/instaicon.png';
import googleIcon from '../img/googleicon.png';
import reactjsIcon from '../img/reactjsicon.png';
import dockerIcon from '../img/dockericon.png';
import serpAPIIcon from '../img/SerpAPI.png';
const Footer = () => {
    const { translate } = useLanguage(); // Use the hook
    return (
        <div className='footer-container'>
            <div className='footer-left'>
                <div className='loko'>LOKO</div>
                <div className='footer-left-info'>
                    <div className='footer-info-title' id='i11a'>Giấy phép kinh doanh: </div>
                    <div className='footer-info-description' id='i11b'>Giấy chứng nhận nhà đăng ký doanh nghiệp mã số 0401805040 ngày 09/10/2025 (đăng ký lần đầu). Đăng ký các lần thay đổi theo từng thời điểm.</div>
                </div>
                <div className='footer-left-info'>
                    <div className='footer-info-title' id='i12a'>Nơi cấp: </div>
                    <div className='footer-info-description' id='i12b'> Sở Kế hoạch và Đầu tư Thành phố Hồ Chí Minh</div>
                </div>
                <div className='footer-left-info'>
                    <div className='footer-info-title' id='i13a'>Lĩnh vực hoạt động:</div>
                    <div className='footer-info-description' id='i13b'>Lập kế hoạch và cá nhân hóa, quản lý dữ liệu du lịch</div>
                </div>
            </div>
            <div className='footer-mid'>
                <div className='loko'>Hỗ trợ</div>
                <div className='footer-mid-info'>
                    <div className='footer-info-title' id='i21a'>Hotline liên hệ:</div>
                    <div className='footer-info-description' id='i21b'>1800 3636</div>
                </div>
                <div className='footer-mid-info'>
                    <div className='footer-info-title' id='i22a'>Quảng cáo booking:</div>
                    <div className='footer-info-description' id='i22b'>booking@loko.com</div>
                </div>
                <div className='footer-mid-info'>
                    <div className='footer-info-title' id='i21a'>Báo cáo sự cố:</div>
                    <div className='footer-info-description' id='i21b'>1900 0036</div>
                </div>
                <div className='footer-bottom-mid-info'>
                    <a href="https://www.facebook.com/ctdb.hcmus" target="_blank" rel="noopener noreferrer"><img src={facebookIcon} alt="Facebook Icon" className='icon' /></a>
                    <a href="https://www.youtube.com/@FITHCMUSOfficial" target="_blank" rel="noopener noreferrer"><img src={youtubeIcon} alt="Youtube Icon" className='icon' /></a>
                    <a href="https://www.instagram.com/truongdhkhoahoctunhien_hcmus/" target="_blank" rel="noopener noreferrer"><img src={instagramIcon} alt="Instagram Icon" className='icon' /></a>
                </div>
            </div>
            <div className='footer-right'>
                <div className='loko'>Đối tác</div>
                <div className='footer-right-info'>
                    <img src={googleIcon} className='icon1' id="i1" />
                    <img src={reactjsIcon} className='icon1' id="i2" />
                    <img src={dockerIcon} className='icon1' id="i3" />
                    <img src={serpAPIIcon} className='icon1' id="i4" />
                </div>
            </div>
        </div>
    )
}

export default Footer