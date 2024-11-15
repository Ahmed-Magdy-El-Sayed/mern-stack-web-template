import React from 'react';
import { Outlet, useLoaderData, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { accountImagesPath, defaultUserImg } from '../../../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCookies } from 'react-cookie';

export default function Profile() {
    const mode = useSelector(state=> state.mode);
    const [cookies] = useCookies(['user']);
    const user = cookies.user? cookies.user : {};
    const {profileOwner, isAdminReq} = useLoaderData()

    const params = useParams();
    const navigate = useNavigate();

    return <div className="container row m-auto mt-3">
        <div className='slider col-0 col-md-3 border-end border-2 pe-2'>
            <FontAwesomeIcon
                className={`text-light
                    d-md-none position-absolute top-25 start-0 fs-1 border-0
                    bg-${mode === 'light'? 'primary' : 'secondary'}
                    p-2 ps-2 rounded rounded-start-0
                `}
                icon='fa-solid fa-angles-right'
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#profileSidebar"
            />
            <div className={`offcanvas-md offcanvas-start ${mode === 'dark'&& "bg-dark text-light"} text-center`} id='profileSidebar'>
                <div className="offcanvas-header">
                    <button className={`btn-close ${mode === 'dark'&& 'btn-close-white'}`} data-bs-dismiss="offcanvas" data-bs-target="#profileSidebar" aria-label="Close"></button>
                </div>
                <div className="offcanvas-body flex-column">
                    <img className="img-icon-lg m-auto rounded-circle" src={accountImagesPath((profileOwner? profileOwner : user).img)} alt="user cover" onError={defaultUserImg}/>
                    <h3 className="m-0 mt-3">{(profileOwner? profileOwner : user).username}</h3>
                    { !profileOwner && <p className='text-break'> {user.email}</p> }
                    <p>Registered at {new Date((profileOwner? profileOwner : user).registrationDate).toLocaleString()}</p>
                    <div className="list-group mt-3">
                        <p 
                            className={`
                                list-group-item list-group-item-action 
                                ${mode === 'dark' && 'list-group-item-dark'} border-0 mb-1 cur-pointer
                                ${window.location.href.split('/').pop()===params.id? 'active' : 'list-group-item-light'}
                            `}
                            onClick={()=> navigate(`/account/profile/${params.id}`)}
                        >Overview</p>
                        {(profileOwner? profileOwner : user).role !== 'user' && <p 
                            className={`
                                list-group-item list-group-item-action 
                                ${mode === 'dark' && 'list-group-item-dark'} border-0 mb-1 cur-pointer
                                ${window.location.href.split('/').pop()==='content'? 'active' : 'list-group-item-light'}
                                `}
                            onClick={()=> navigate(`/account/profile/${params.id}/content`)}
                        >My Content</p>}
                        
                        {!profileOwner && <>
                            <p 
                                className={`
                                    list-group-item list-group-item-action 
                                    ${mode === 'dark' && 'list-group-item-dark'} border-0 mb-1 cur-pointer
                                    ${window.location.href.split('/').pop()==='favorite'? 'active' : 'list-group-item-light'}
                                `}
                                onClick={()=> navigate(`/account/profile/${params.id}/favorite`)}
                            >Favorite List</p>

                            <p 
                                className={`
                                    list-group-item list-group-item-action 
                                    ${mode === 'dark' && 'list-group-item-dark'} border-0 mb-1 cur-pointer
                                    ${window.location.href.split('/').pop()==='setting'? 'active' : 'list-group-item-light'}
                                `}
                                onClick={()=> navigate(`/account/profile/${params.id}/setting`)}
                            >Setting</p>
                        </>}
                    </div>
                </div>
            </div>
        </div>
        <div className="profile-body w-sm-100 col-12 col-md-9">
            {window.location.pathname.split("/").pop() === params.id && isAdminReq &&
                <div>
                    <div className='d-flex mb-3'>
                        <span className="w-50"><span className='fw-bold'>First Name:</span> {profileOwner.firstName}</span>
                        <span className="w-50"><span className='fw-bold'>Last Name:</span> {profileOwner.lastName}</span>
                    </div>
                    <div className='mb-3'><span className='fw-bold'>email:</span> {profileOwner.email}</div>
                    <div className='mb-3'><span className='fw-bold'>Registration Date:</span> {new Date(profileOwner.registrationDate).toLocaleString()}</div>
                    <div className='d-flex mb-3'>
                        <span className="w-50"><span className='fw-bold'>Birthday:</span> {profileOwner.birthday? profileOwner.birthday : "not set"}</span>
                        <span className="w-50"><span className='fw-bold'>Address:</span> {profileOwner.address?profileOwner.address:"not set"}</span>
                    </div>
                </div>
            }
            <Outlet context={{user: profileOwner? profileOwner : user, isOwner:profileOwner?false:true, mode}}/>
        </div>
    </div>
}
