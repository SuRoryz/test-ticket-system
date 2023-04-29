import React from 'react';
import UIButton from '../ui/UIButton';
import UITitle from '../ui/UITitle';
import LoginWindow from './Login';

class Create extends React.Component {
    constructor() {
        super();
        this.state = {
            closed: true,
            title: "Центр поддержки"
        }
    }

    setClosed = () => {
        this.setState({
            closed: !this.state.closed
        })

        if (this.state.closed) {
            this.setState({
                title: "Вход"
            })
        } else {
            this.setState({
                title: "Центр поддержки"
            })
        }
    }

    setTitle = (title) => {
        this.setState({
            title: title
        })
    }

    render() {
        return (
            <div className='app-main-create'>
                <div className='create-title'>
                    <UITitle text={this.state.title}/>
                </div>
                <div className='create-wrapper'>
                    <LoginWindow setTitle={this.setTitle}/>
                </div>
            </div>
        )
    }
}

export default Create;