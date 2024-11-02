import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from 'react-redux';
import { addAlert } from '../../../../redux/alertSlice';
import { socket } from '../../../../socket';
import ContentCard from '../../../shared/contentCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLoaderData, useOutletContext } from "react-router-dom";

export default function ProfileContent() {
    const {user, isOwner, mode} = useOutletContext();
    const loaderData = useLoaderData()
    const [contents, setContents] = useState(loaderData.contents);
    const spinnerRef = useRef();
    const modalCloseRef = useRef();
    const previewRef = useRef();
    const dispatch = useDispatch();

    useEffect(()=>{
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
    })

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

    if(!isOwner)
        return contents?.length?
            <>
                <h2 className="mb-4">Contents</h2>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                    {contents.map(content => 
                        <ContentCard key={content._id} content={content}/>
                    )}
                </div>
            </>
        : <div className="text-secondary text-center">
            No content exist!
        </div>
    
    return contents && (contents.reviewed || contents.underReview)?
            <>
                <div className="reviewed">
                    <h2 className="mb-4">Contents</h2>
                    <div className="reviewed-content d-flex flex-wrap justify-content-center gap-3">
                        {contents.reviewed.length? 
                            contents.reviewed.map(content =>
                                <ContentCard key={content._id} content={content}/>
                            )
                        :   <div className="text-secondary text-center w-100">No content exist</div>
                        }
                    </div>
                </div>

                {user?.role === "author" &&<>
                    <hr />
                    <div className="under-review">
                        <h2 className="mb-4">Under Review Contents</h2>
                        <div className="under-review-content d-flex flex-wrap justify-content-center gap-3">
                            {contents.underReview.length? 
                                contents.underReview.map(content =>
                                    <ContentCard key={content._id} content={content}/>
                                )
                            :   <div className="text-secondary text-center w-100">No content under review</div>
                            }
                        </div>
                    </div>
                </>}

                <hr/>
                <FontAwesomeIcon 
                    icon="fa-solid fa-square-plus" 
                    style={{ fontSize: "60px" }} 
                    className={`${mode === 'light'&&'text-primary'} text-center d-block m-auto cur-pointer`}
                    type="button" data-bs-toggle="modal" data-bs-target=".modal.add-content"
                />
                <div className="modal fade add-content">
                    <div className="modal-dialog modal-fullscreen-md-down modal-dialog-centered modal-dialog-scrollable">
                        <form className={`modal-content bg-${mode} overflow-auto`} onSubmit={addContent}>
                                <div className="modal-header">  
                                    <h1 className="modal-title fs-5">Add Content</h1>
                                    <button className={`btn-close ${mode === 'dark' && 'bg-secondary'}`} type="button" data-bs-dismiss="modal" aria-label="Close" ref={modalCloseRef}></button>
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
            </>
        : 
        <div className="text-secondary text-center m-auto w-100 h-100">
            No content exist!
        </div>
} 