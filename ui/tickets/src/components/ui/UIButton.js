import React from 'react';
import '../mainCss/UIButton.css';

function UIButton({text, onClick}) {
    return (
        <div className='ui-button' onClick={onClick}>
            <div className='ui-button-text'>
                {text}
            </div>
        </div>
    )
}

export default UIButton;