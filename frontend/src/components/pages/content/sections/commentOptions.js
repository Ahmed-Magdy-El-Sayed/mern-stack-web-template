import React, { useContext, useRef, useState } from 'react';
import { socket } from '../../../../socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CommentContext } from '../content';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../../../redux/alertSlice';
import { accountImagesPath, defaultUserImg, URLSearchParamsData } from '../../../../utils';

export default function CommentOptions ({comment, index, updateComments}){
    const {content, user} = useContext(CommentContext)
    const [displayReplyForm, setDisplayReplyForm] = useState(false)
    const spinnerRef = useRef({})
    const dispatch = useDispatch()
    
    const deleteComment = () =>{
        const data = {
            contentID: content._id, 
            commentID: comment._id, 
            commentUserID: comment.userID
        };
        fetch(process.env.REACT_APP_API_SERVER+'/content/comments/delete',{
            method:'delete',
            headers:{'Content-Type':'application/json'},
            credentials: "include",
            body: JSON.stringify(data)
        }).then(async res=>{
            if(res.ok) socket.emit("deleteComment", data)
            else throw await res.json();
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        })
    }

    const toggleEditMode = ()=>{
        updateComments(comments=>{
            const commentsClone = [...comments];
            comment.editMode = !comment.editMode
            commentsClone.splice(index, index+1, comment)
            return commentsClone
        })
    }

    const saveCommentEdit = e=>{
        const data= {
            contentID: content._id,
            commentID: comment._id
        };
        const newComment = e.currentTarget.parentElement.children.body.value;
        if(comment.body !== newComment){
            data.body = newComment
            spinnerRef.current.edit.classList.remove("d-none")
            fetch(process.env.REACT_APP_API_SERVER+'/content/comments/edit',{
                method:'put',
                headers:{'Content-Type':'application/json'},
                credentials: "include",
                body: JSON.stringify(data)
            }).then(async res=>{
                if(res.ok){
                    socket.emit("updateComment", data)
                }else throw await res.json();
            }).catch(err=>{
                if(err.msg)
                    dispatch(addAlert({type:"danger", msg: err.msg}))
                else{
                    console.error(err)
                    dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
                }
            }).finally(()=>{
                spinnerRef.current.edit.classList.add("d-none")
            })
        }
    };
    
    const toggleReplyForm = () =>{
        if(!user){
            dispatch(addAlert({type: "danger", msg:'login to reply'}))
            return null
        }
        setDisplayReplyForm(display => !display)
    }
    
    let addReplyIsClicked = false;
    const addReply = e=>{
        e.preventDefault();
        if(addReplyIsClicked) return null;
        addReplyIsClicked = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form);
        const dataToAppend = {
            contentID: content._id,
            commentID: comment._id,
            replyToUserID: comment.userID,
            replyToUserName: comment.username,
        }
        for (const key in dataToAppend) {
            data.append(key, dataToAppend[key])
        }
        spinnerRef.current.reply.classList.remove("d-none")
        fetch(process.env.REACT_APP_API_SERVER+'/content/replies/add',{
            method:'post',
            credentials: "include",
            body: data
        }).then(async res=>{
            if(res.ok) return await res.json() 
            else throw await res.json();

        }).then(newReply=>{
            socket.emit("addReply", {contentID: content._id, commentID: dataToAppend.commentID}, newReply)
            form.body.value = null
            toggleReplyForm(form, true)

        }).catch(err=>{
            if(err.msg){
                dispatch(addAlert({type: "danger", msg:err.msg}))
            }else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something went wrong, Try again!"}))
            }

        }).finally(()=>{
            spinnerRef.current.reply.classList.add("d-none")
            addReplyIsClicked = false
        })
    }
    
    let reactClicked = false;
    const reactTheComment = react=>{
        if(!user){
            dispatch(addAlert({type: "danger", msg:'login to react'}))
            return null
        }else if(String(user._id) === String(comment.userID)){
            dispatch(addAlert({type: "danger", msg:'You wrote this comment'}))
            return null
        }else if(String(user._id) === content.author.id){
            dispatch(addAlert({type: "danger", msg:'You (The Content Author) can only react with love'}))
            return null
        }
        const data = {
            contentID: content._id,
            commentID: comment._id,
            react
        }
        if(reactClicked) return null;
        reactClicked = true;
        fetch(process.env.REACT_APP_API_SERVER+'/content/comments/react',{
            method:'post',
            headers:{'Content-Type':'application/json'},
            credentials: "include",
            body: JSON.stringify(data)
        }).then(async res=>{
            if(res.ok){
                socket.emit('react', data, await res.json())
            }else throw await res.json();
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            reactClicked = false;
        })
    }
    
    const loveComment = addLove=>{
        const data = {
            commentID: comment._id,
            contentID: content._id,
            addLove
        }
        fetch(process.env.REACT_APP_API_SERVER+'/content/comments/love',{
            method:'post',
            headers:{'Content-Type':'application/json'},
            credentials: "include",
            body: JSON.stringify(data)
        }).then(async res=>{
            if(res.ok) data.addLove?socket.emit("addLove", data):socket.emit("deleteLove", data)
            else throw await res.json();
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        })
    }
    const viewLove = user && String(user._id) === content.author.id && String(user._id) !== String(comment.userID);
    const viewEdit = user && String(user._id) === String(comment.userID);
    const viewDelete = user && ((user.role === "admin" || user.role === "editor" || String(user._id) === content.author.id) || 
        String(user._id) === String(comment.userID));
    return <>
    {viewEdit && comment.editMode && <div className="edit-commentmb-3">
<<<<<<< HEAD
        <textarea className="form-control my-3" name="body" placeholder="Enter comment" rows="2" defaultValue={comment.body} required></textarea>
=======
        <textarea className="form-control my-3" name="body" placeholder="Enter comment" onInput={e=>{e.target.style.height = "";e.target.style.height = e.target.scrollHeight + "px"}} defaultValue={comment.body} required></textarea>
>>>>>>> c477089 (update)
        <button
            className="btn btn-sm btn-primary me-3"
            onClick={saveCommentEdit}
        >
            <span className="spinner-border spinner-border-sm me-2 d-none" ref={ref=> spinnerRef.current.edit=ref} aria-hidden="true"></span>
            Edit
        </button>
    </div>
    }
    {/*-------------------------- Like Option --------------------------*/}
        <span className="likes-counter me-2 text-primary">{comment.likes.length}</span>
        <FontAwesomeIcon 
            icon= {`${comment.likes.includes(String(user?._id)) ? 'fa-solid' : 'fa-regular'} fa-thumbs-up`}
            className='fs-5 like-comment text-primary me-3' 
            onClick={() =>reactTheComment('like')} 
        />
    {/*-------------------------- Dislike Option --------------------------*/}
        <span className="dislikes-counter me-2 text-danger">{comment.dislikes.length}</span>
        <FontAwesomeIcon 
            icon= {`${comment.dislikes.includes(String(user?._id)) ? 'fa-solid' : 'fa-regular'} fa-thumbs-down `}
            className="fs-5 dislike-comment text-danger me-3" 
            onClick={() =>reactTheComment('dislike')} 
        />
    {/*-------------------------- Author React Option --------------------------*/}
        {viewLove?
            <FontAwesomeIcon
                icon= {`${comment.loved ? 'fa-solid' : 'fa-regular'} fa-heart`}
                className= "fs-5 text-danger me-3"
                onClick= {()=> loveComment(!comment.loved)}
            />
        :
            <span className="author-react">
                {comment.loved ? 
                    <span className="budge bg-danger ps-2 pe-2 pt-1 pb-1 me-3 rounded-pill">
                        <FontAwesomeIcon icon="fa-solid fa-heart" className='text-white text-danger me-1'/>
                        <img className="mb-1 img-icon-sm rounded-circle" alt='' src={accountImagesPath(content.author.img)} onError={defaultUserImg}/>
                    </span>
                : null}
            </span>
        }
    {/*-------------------------- Edit Option --------------------------*/}
        {viewEdit &&
            <FontAwesomeIcon icon="fa-regular fa-pen-to-square" className='fs-5 text-success me-3' onClick={toggleEditMode} />
        }
    {/*-------------------------- Delete Option --------------------------*/}
        {viewDelete &&
            <FontAwesomeIcon
                icon= "fa-solid fa-trash"
                className="fs-5 text-danger me-3"
                onClick={deleteComment}
            />
        }
    {/*-------------------------- reply Option --------------------------*/}
        <FontAwesomeIcon
            icon= "fa-solid fa-reply"
            className="fs-5 text-secondary"
            onClick={toggleReplyForm}
        />
        {user && displayReplyForm &&
            <form className='reply-comment rounded m-0 mt-2 alert alert-secondary' 
            onSubmit={addReply}>
                <span className="btn btn-close me-3 position-absolute end-0" onClick={toggleReplyForm}></span>
                <div className="user-details mb-2 d-flex gap-2 align-items-center">
                    <img className="img-icon rounded-circle" alt='' src={accountImagesPath(user.img)} onError={defaultUserImg}/>
                    {
                        user.role === "admin" || user.role === "editor" || user.role === "author"?
                            <span className="username budge bg-primary text-white rounded ps-2 pe-2"> 
                                <h6 className="d-inline m-0">{user.username}</h6>
                                <FontAwesomeIcon icon="fa-solid fa-check" className='ms-1'/>
                            </span>
                        :<h6 className="m-0">{user.username}</h6>
                    }
                    <FontAwesomeIcon icon="fa-solid fa-angles-right"/> 
                    <a className="text-decoration-none" href={"#id"+comment._id}> {comment.username}</a>
                </div>
                <textarea className='form-control mb-3' rows="5" name='body' placeholder='Enter comment' required></textarea>
                <button className='btn btn-primary btn-sm' type='submit'> 
                    <span className="spinner-border spinner-border-sm me-2 d-none" ref={ref=> spinnerRef.current.reply=ref} aria-hidden="true"></span>
                    <span>Reply</span>
                </button>
            </form>
        }
    </>
}