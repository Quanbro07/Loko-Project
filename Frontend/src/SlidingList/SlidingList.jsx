import './SlidingList.css';
import { useLanguage } from '../Language/LanguageContext';
import React, { useState, useEffect } from 'react';


const SlidingList = () => {
    const { translate } = useLanguage();
    const dataSet1 = [
        {
            diadiem: translate('planning_ninhbinh_tamcoc'),
            thoigian: translate('8am'),
            mota: translate('planning_ninhbinh_tamcoc_description')
        },
        {
            diadiem: translate('planning_ninhbinh_trangan'),
            thoigian: translate('12pm'),
            mota: translate('planning_ninhbinh_trangan_description')
        },
        {
            diadiem: translate('planning_ninhbinh_hangmua'),
            thoigian: translate('4pm'),
            mota: translate('planning_ninhbinh_hangmua_description')
        }
    ];

    const dataSet2 = [
        {
            diadiem: translate('planning_phuquy_dautruong'),
            thoigian: translate('8am'),
            mota: translate('planning_phuquy_dautruong_description')
        },
        {
            diadiem: translate('planning_phuquy_lan'),
            thoigian: translate('1pm'),
            mota: translate('planning_phuquy_lan_description')
        },
        {
            diadiem: translate('planning_phuquy_docphuot'),
            thoigian: translate('6am'),
            mota: translate('planning_phuquy_docphuot_description')
        },
    ];

    const dataSet3 = [
        {
            diadiem: translate('planning_fansipan_tamquan'),
            thoigian: translate('8am'),
            mota: translate('planning_fansipan_tamquan_description')
        },
        {
            diadiem: translate('planning_fansipan_baothap'),
            thoigian: translate('10am'),
            mota: translate('planning_fansipan_baothap_description')
        },
    ];

    const dataSet4 = [
        {
            diadiem: translate('planning_danang_mykhe'),
            thoigian: translate('6am'),
            mota: translate('planning_danang_mykhe_description')
        },
        {
            diadiem: translate('planning_danang_hoian'),
            thoigian: translate('2pm'),
            mota: translate('planning_danang_hoian_description')
        },
        {
            diadiem: translate('planning_danang_chualinhung'),
            thoigian: translate('8am'),
            mota: translate('planning_danang_chualinhung_description')
        },
    ];

    const [selectedDataset, setSelectedDataset] = useState(dataSet1);
    const [showTourSample, setShowTourSample] = useState(false); /* New state for conditional rendering */

    const slidesData = [
        {
            title: translate('planning_ninhbinh_title'),
            dataSet: dataSet1,
        },
        {
            title: translate('planning_phuquy_title'),
            dataSet: dataSet2,
        },
        {
            title: translate('planning_fansipan_title'),
            dataSet: dataSet3,
        },
        {
            title: translate('planning_danang_title'),
            dataSet: dataSet4,
        },
    ];
    return (
        <div className='sliding-container'>
            <div className='list-container'>
                <div className='list-title'>{translate("list-title")}</div>
                <div className='list-item-container'>
                    <div className='list-item' id='li1' onClick={() => { setSelectedDataset(dataSet1); setShowTourSample(true); }}>
                        <div className='item-title'>{translate("culture")}</div>
                    </div>
                    <div className='list-item' id='li2' onClick={() => { setSelectedDataset(dataSet2); setShowTourSample(true); }}>
                        <div className='item-title'>{translate("external")}</div>
                    </div>
                    <div className='list-item' id='li3' onClick={() => { setSelectedDataset(dataSet3); setShowTourSample(true); }}>
                        <div className='item-title'>{translate("adventure")}</div>
                    </div>
                    <div className='list-item' id='li4' onClick={() => { setSelectedDataset(dataSet4); setShowTourSample(true); }}>
                        <div className='item-title'>{translate("healing")}</div>
                    </div>
                </div>
            </div>
            {showTourSample && (
                <div className='sample-tour'>
                    <div className="sample-tour-header">
                        <div>
                            <svg className="waves" xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
                                <defs>
                                    <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                                </defs>
                                <g className="parallax">
                                    <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.7" />
                                    <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" />
                                    <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.3)" />
                                    <use xlinkHref="#gentle-wave" x="48" y="7" fill="#fff" />
                                </g>
                            </svg>
                        </div>
                        <div className='sample-tour-content-container'>
                            <div className='planning-table'>
                                <div className='table-header'>
                                    <span>{translate('output_location')}</span>
                                    <span>{translate('output_time')}</span>
                                    <span className='description-title'>{translate('output_description')}</span>
                                </div>
                                {selectedDataset.map((item, itemIndex) => (
                                    <div key={itemIndex} className='table-row'>
                                        <span>{item.diadiem}</span>
                                        <span className='time-value'>{item.thoigian}</span>
                                        <span>{item.mota}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )


}

export default SlidingList;