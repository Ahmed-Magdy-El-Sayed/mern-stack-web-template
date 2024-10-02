import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../../socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch, useSelector } from 'react-redux';
import { addAlert } from '../../redux/alertSlice';
import ContentCard from '../contentCard';
import { accountImagesPath, defaultUserImg } from '../../utils';
import Loader from '../loader';

export default function Profile() {
    const user = useSelector(state=> Object.keys(state.user).length? state.user : null);
    const [profileOwner, setProfileOwner] = useState();
    const [contents, setContents] = useState({isLoading:true});
    const spinnerRef = useRef();
    const modalCloseRef = useRef();
    const previewRef = useRef();
    const dispatch = useDispatch();
    const param = useParams();

    useEffect(()=>{
        fetch(process.env.REACT_APP_API_SERVER+"/account/profile/"+param.id, {credentials: "include"}).then(async res=>{
            if(res.ok)
                return await res.json();
            else
                throw await res.json();
        }).then(data=>{
            setProfileOwner(data.profileOwner) // profileOwner have value when the user that visit the page not the profile owner
            setContents(data.contents)
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        })
        socket.on("approveContent", contentID=>{
            setContents(contents=>{
                const index = contents.underReview.findIndex(content=> String(content._id) === contentID)
                return {
                reviewed: [...contents.reviewed, contents.underReview[index]], 
                underReview: contents.underReview.splice(0, index).concat(contents.underReview.splice(index+1))
                }
            })
        })
        
        socket.on("rejectContent", contentID=>{
            setContents(contents=>{
                const index = contents.underReview.findIndex(content=> String(content._id) === contentID)
                return {
                reviewed: contents.reviewed, 
                underReview: contents.underReview.splice(0, index).concat(contents.underReview.splice(index+1))
                }
            })
        })
    },[])

    let addContentIsClicked = false;
    const addContent = e=>{
        e.preventDefault()
        if(addContentIsClicked) return null;
        addContentIsClicked = true
        const form = e.currentTarget
        const formData = new FormData(form)
        spinnerRef.current.classList.remove("d-none")
        fetch(process.env.REACT_APP_API_SERVER+"/content/add",{
            method:'post',
            credentials: "include",
            body: formData
        }).then(async res=>{
            if(res.ok) return await res.json() 
            else throw await res.json();
        }).then(newContent=>{
            if(newContent.isUnderReview){
                socket.emit("confirmReviewers", newContent)
                setContents({underReview: [...contents.underReview, newContent], reviewed: contents.reviewed, isLoading: false })
            }else
            setContents({underReview: contents.underReview, reviewed: [...contents.reviewed, newContent], isLoading: false})
            e.currentTarget?.reset();
            modalCloseRef.current.click();
            previewRef.current.src = null;
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            spinnerRef.current.classList.add("d-none")
            addContentIsClicked = false
        })
    }
    
    return <div className="container d-flex mt-3">
        { profileOwner ? 
            <>{/* If The Page Visitor Not The Owner Of The Profile, the profileOwner contains the profile owner data */} 
                <div className="user-details w-25 text-center border-end border-2 me-2">
                    <img className="img-icon-lg" src={accountImagesPath+profileOwner.img} alt="user cover" onError={defaultUserImg}/>
                    <h3 className="m-0 mt-3">{profileOwner.name}</h3>
                </div>
                {contents?
                    <div className="contents w-75">
                        <h2 className="mb-4">Contents</h2>
                        <div className="d-flex flex-wrap justify-content-center gap-3">
                            {contents.map(content => 
                                <ContentCard key={content._id} content={content}/>
                            )}
                        </div>
                    </div>
                : <div className="alert alert-secondary text-center w-100 h-100">No content exist</div>
                }
            </> 
        : 
            <>{/* The Page Visitor Is The Profile Owner */}
                <div className="user-details w-25 text-center border-end border-2 me-2">
                    <img className="img-icon-lg" src={accountImagesPath+user?.img} alt="user cover" onError={defaultUserImg}/>
                    <h3 className="m-0 mt-3">{user?.name}</h3>
                </div>
                <div className="contents w-75">
                    {user?.role === "user"? 
                        <div className="alert alert-secondary text-center w-100 h-100">This page is Empty For Now!</div>
                    : 
                    contents.reviewed || contents.underReview?
                        <>
                            <div className="reviewed">
                                <h2 className="mb-4">Contents</h2>
                                <div className="reviewed-content d-flex flex-wrap justify-content-center gap-3">
                                    {contents.reviewed.map(content =>
                                        <ContentCard key={content._id} content={content}/>
                                    )}
                                    {!contents.reviewed.length && <div className="alert alert-secondary text-center w-100">No content exist</div>}
                                </div>
                            </div>

                            {user?.role === "author" &&<>
                                <hr />
                                <div className="under-review">
                                    <h2 className="mb-4">Under Review Contents</h2>
                                    <div className="under-review-content d-flex flex-wrap justify-content-center gap-3">
                                        {contents.underReview.map(content =>
                                            <ContentCard key={content._id} content={content}/>
                                        )}
                                        {!contents.underReview.length && <div className="alert alert-secondary text-center w-100">No content under review</div>}
                                    </div>
                                </div>
                            </>}

                            <hr/>
                            <div className="card text-center m-auto cur-pointer" style={{ width: "18rem"}}>
                                <div className="card-body">
                                    <span className="card-text text-primary" type="button" data-bs-toggle="modal" data-bs-target=".modal.add-content">
                                        <FontAwesomeIcon icon="fa-solid fa-circle-plus" style={{ fontSize: "60px" }}></FontAwesomeIcon>
                                        <h3>Add</h3>
                                    </span>
                                </div>
                            </div>
                            <div className="modal fade add-content">
                                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                                    <div className="modal-content overflow-auto">
                                        <form onSubmit={addContent}>
                                            <div className="modal-header">
                                                <h1 className="modal-title fs-5">Add Content</h1>
                                                <button className="btn-close" type="button" data-bs-dismiss="modal" aria-label="Close" ref={modalCloseRef}></button>
                                            </div>
                                            <div className="modal-body">
                                                <img className='preview-image w-100' alt='' ref={previewRef}/>
                                                <input className="form-control mb-2" type="file" name="img" onChange={e=>{previewRef.current.src = e.currentTarget.files.length? URL.createObjectURL(e.currentTarget.files[0]):""}}/>
                                                <div className="input-group mb-2">
                                                    <span className="input-group-text">Content Name</span>
                                                    <input className="form-control" type="text" name="name" required/>
                                                </div>
                                                
                                                {/* --------- here you should add the input feilds for the content details --------- */}
                                                <div className="alert alert-info w-100">Add here the rest of the data that your content use</div>
                                            
                                            </div>
                                            <div className="modal-footer">
                                                <button className="btn btn-success" type="submit">
                                                    <span className="spinner-border spinner-border-sm d-none me-1" ref={spinnerRef} aria-hidden="true"></span>
                                                    Save
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </>
                    : 
                    contents.isLoading?
                        <Loader/>
                        : <div className="alert alert-secondary text-center w-100 h-100">No content exist!</div>
                    }
                </div>
            </>
        }
    </div>
}