import '../../App.css'
import React from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import NavBar from '../shared/navBar';
import { useSelector } from 'react-redux';

export default function ErrorHandler() {
    const err = useRouteError();
    const mode = useSelector(state=>state.mode)

    return <div className={`App ${mode === 'light'? 'bg-light':'bg-dark text-light'}`}>
        <NavBar mode={mode}/>
        {!isRouteErrorResponse(err)? 
            <div className='container'>{console.error(err)}
                <h3 className="text-center alert alert-warning">Something Went Wrong!</h3>
                <p> Please try refreshing the page, or come back later.</p>
            </div>
        : err.status === 404?
            <div className='container'>
                <h3 className="text-center alert alert-warning">404 - Page Not Found</h3>
                <p>😕 Oops! Looks like the page you're trying to reach doesn't exist.</p>
                <p>Try double-checking the URL, or head back to the homepage to get back on track.</p>
            </div>
        : err.status === 403?
            <div className='container'>
                <h3 className="text-center alert alert-warning">403 Forbidden</h3>
                <p>Oops! You don't have permission to access this page.</p>
            </div>
        : (err.status === 500) &&
            <div className='container'>
                <h3 className="text-center alert alert-warning text-center">500 - Internal Server Error</h3>
                <div>
                    <p> Something went wrong on our end.</p>
                    <p> Please try refreshing the page, or come back later.</p>
                    <h4> What can you do?</h4>
                    <ul>
                        <li> Check your internet connection.</li>
                        <li> Clear your browser cache and cookies.</li>
                        <li> Try accessing the page again after some time.</li>
                    </ul>
                    <p> If the issue persists, please contact our support team for assistance.</p>
                    <p> Thank you for your patience and understanding.</p>
                </div>
            </div>
        }
    </div>
}