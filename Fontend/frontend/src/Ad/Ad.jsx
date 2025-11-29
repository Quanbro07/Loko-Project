import './Ad.css'
import { useState, useEffect } from 'react';
import ad1 from '../img/ad1.jpg';
import ad2 from '../img/ad2.jpg';
import ad3 from '../img/ad3.png';

const ads = [
    { src: ad1, link: "https://www.vietjetair.com/vi/?utm_source=google-vj-vi&utm_medium=cpc&utm_campaign=ada_awoq32025_kw_rsa_0125awo_brand_name_awoq32025_cpa&gad_source=1&gad_campaignid=22968908158&gbraid=0AAAAADMIKnogcIxHSDq5t8CgJYQVHgEMU&gclid=CjwKCAjw04HIBhB8EiwA8jGNbVoad85hIOrnAD7EO2VM8RvdBr8v3wNJSqGWpj2cJsBNUUS0fLQXMBoCY28QAvD_BwE" },
    { src: ad2, link: "https://www.vietjetair.com/vi/?utm_source=google-vj-vi&utm_medium=cpc&utm_campaign=ada_awoq32025_kw_rsa_0125awo_brand_name_awoq32025_cpa&gad_source=1&gad_campaignid=22968908158&gbraid=0AAAAADMIKnogcIxHSDq5t8CgJYQVHgEMU&gclid=CjwKCAjw04HIBhB8EiwA8jGNbVoad85hIOrnAD7EO2VM8RvdBr8v3wNJSqGWpj2cJsBNUUS0fLQXMBoCY28QAvD_BwE" },
    { src: ad3, link: "https://www.vietjetair.com/vi/?utm_source=google-vj-vi&utm_medium=cpc&utm_campaign=ada_awoq32025_kw_rsa_0125awo_brand_name_awoq32025_cpa&gad_source=1&gad_campaignid=22968908158&gbraid=0AAAAADMIKnogcIxHSDq5t8CgJYQVHgEMU&gclid=CjwKCAjw04HIBhB8EiwA8jGNbVoad85hIOrnAD7EO2VM8RvdBr8v3wNJSqGWpj2cJsBNUUS0fLQXMBoCY28QAvD_BwE" },
];

const Ad = () => {
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    useEffect(() => {
        const adInterval = setInterval(() => {
            setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
        }, 3000); // Change ad every 3 seconds (faster)

        return () => {
            clearInterval(adInterval);
        };
    }, []);

    return (
        <div>
            <a href={ads[currentAdIndex].link} target="_blank" rel="noopener noreferrer">
                <img className="ad-banner" src={ads[currentAdIndex].src} alt="advertisement" />
            </a>
        </div>
    )
}

export default Ad;