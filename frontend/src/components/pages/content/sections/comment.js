import React, { useContext, useRef, useState } from 'react';
import { socket } from '../../../../socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CommentContext } from '../content';
import { useDispatch } from 'react-redux';
import CommentOptions from './commentOptions';
import Reply from "./reply"
import { addAlert } from '../../../../redux/alertSlice';
import { accountImagesPath, calcPassedTime, defaultUserImg, URLSearchParamsData } from '../../../../utils';

function Comment() {
    const {content, comments, updateComments, user} = useContext(CommentContext);
    const spinnerRef = useRef();
    const [viewReplies, setViewReplies] = useState(new Array(comments.length))
    const dispatch = useDispatch();

    //addCommentTime in content.js file
    
    let commentIsSubmitted = false;
    const submitComment = e =>{
        e.preventDefault();
        if(commentIsSubmitted) return null;
        commentIsSubmitted = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form);
        data.append("contentID", content._id)
        spinnerRef.current.classList.remove("d-none")
        fetch(process.env.REACT_APP_API_SERVER + "/content/comments/add",{
            method:'post',
            credentials: "include",
            body: data
        }).then(async res=>{
            if(res.ok) return await res.json() 
            else throw await res.json();
        }).then(comment=>{
            form.body.value = null;
            socket.emit("addComment", content._id, comment)
        }).catch( err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            spinnerRef.current.classList.add("d-none")
            commentIsSubmitted = false
        })
    }

    let getCommentIsRunning = false;
    const getMoreComments = ()=>{
        if(getCommentIsRunning)
            return null
        getCommentIsRunning = true;
        fetch(`${process.env.REACT_APP_API_SERVER}/content/${content._id}/comments/${comments.length}`,{
            credentials: "include"
        }).then(async res=>{ 
            if(res.ok) return await res.json()
            throw await res.json()
        }).then(newComments=>{
            updateComments(comments=>[...comments, ...newComments])
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            getCommentIsRunning = false;
        })
    }

    let getRepliesIsRunning = false;
    const getReplies = (commentID, i) =>{
        if(getRepliesIsRunning)
            return null
        getRepliesIsRunning = true
        
        if(comments[i].replies)
            return setViewReplies(arr=> [...arr.slice(0, i), !arr[i], ...arr.slice(i+1)]); 
        
        setViewReplies(arr=> [...arr.slice(0, i), !arr[i], ...arr.slice(i+1)]); 
        fetch(`${process.env.REACT_APP_API_SERVER}/content/${content._id}/comment/${commentID}/replies/self`)
        .then(async res=>{ 
            if(res.ok) return await res.json()
            throw await res.json()
        }).then(replies=>{
            updateComments(comments=>comments.map((comment, index)=>index === i? {...comment, replies:{[comment._id]: replies}}:comment))
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            getRepliesIsRunning = false;
        })
    }

    return (
        <div className="comments row pb-3 position-relative">
            <h3 className="text-primary">Comments</h3>
            {comments.length ? 
                <>
                    {
                        comments.map((comment, i) =>
                            <div className="comment col-md-10 pt-3" data-index={i} key={comment._id} id={`id${comment._id}`}>
                                {/* Comment Owner Details */}
                                <div className="user-details d-flex gap-2 align-items-center">
                                    <img className="img-icon rounded-circle" alt='' src={accountImagesPath(comment.userImg)} onError={defaultUserImg}/>
                                    <div className="details">
                                        {comment.userIsAuthz ? 
                                            <span className="username budge bg-primary text-white p-1 ps-2 pe-2 rounded">
                                                <h5 className="d-inline m-0">{user ? (String(user._id) === comment.userID ? 'Me' : comment.username) : comment.username}</h5>
                                                <FontAwesomeIcon icon="fa-solid fa-check" className='ms-2'/>
                                            </span>
                                        : 
                                            <h5 className="username m-0">{user ? (String(user._id) === comment.userID ? 'Me' : comment.username) : comment.username}</h5>
                                        }
                                        {content.author.id === comment.userID &&
                                            <p className="author-mark m-0 ms-2 d-inline text-secondary fw-bold">"The Author"</p>
                                        }
                                        <p className="m-0 comment-time">{comment.time? comment.time : calcPassedTime(parseInt(comment.timestamp)).passedTime}</p>
                                    </div>
                                </div>

                                {/* Comment Body */}
                                <div className="comment-body mt-3">
                                    {!comment.editMode && <div className="content">
                                        <p className="p-3 m-0 border rounded text-break">
                                            {comment.body}
                                        </p>
                                    </div>}
                                    <div className="options mt-2">
                                        {comment.userID && <CommentOptions comment={comment} index={i} updateComments={updateComments}/>}
                                    </div>
                                </div>
                                {comment.repliesNum !== 0 &&
                                    <div className="comment-replies col-md-10">
                                        <div className="collapse replies ps-5 border-start border-2 border-primary" id={`replies${comment._id}`}>
                                            {comment.replies? <>
                                                <Reply commentIndex={i} replyToID={comment._id}/>
                                            </>
                                            :
                                                <div className="spinner-border text-primary ms-3" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            }
                                        </div>
                                        <a
                                            className="mb-3 text-decoration-none"
                                            data-bs-toggle="collapse"
                                            href={`#replies${comment._id}`}
                                            onClick={() => getReplies(comment._id, i)}
                                        >
                                            {viewReplies[i]? "hide" : "show"} ({comment.repliesNum}) replies
                                        </a>
                                    </div>
                                }
                            </div>
                        )
                    }
                    {
                        content.commentsNum > comments.length &&
                            <div className="show-comments text-center fs-5 cur-pointer">
                                <span className="text-decoration-none text-primary" onClick={getMoreComments}>
                                    show more
                                </span>
                            </div>
                    }
                </> 
            : 
                <div className="no-comment alert alert-secondary text-center m-0">no comments yet</div>
            }

            {/* Add Comment Section */}
            <form className="write-comment alert alert-secondary m-0 mt-3 text-center rounded-bottom-0 position-sticky bottom-0" onSubmit={submitComment}>
                {user? <>
                    <div className="user-details d-flex gap-2 align-items-center mb-2">
                        <img className="img-icon rounded-circle" alt='' src={accountImagesPath(user.img)} onError={defaultUserImg}/>
                        {user.role === "admin" || user.role === "editor" || user.role === "author" ? 
                            <span className="budge bg-primary text-white ps-2 pe-2 rounded">
                                <h5 className="d-inline m-0">{user.username}</h5>
                                <FontAwesomeIcon icon="fa-solid fa-check" className='ms-2'/>
                            </span>
                        : 
                            <h5>{user.username}</h5>
                        }
                        <button className="btn btn-outline-primary ms-auto" type="button" data-bs-toggle="collapse" data-bs-target="#add-comment">
                            Write Comment
                        </button>
                    </div>
                    <div className="collapse" id="add-comment">
                        <textarea className="form-control mb-3" name="body" placeholder="Enter comment" rows="5" required></textarea>
                        <button className="btn btn-primary" type="submit">
                            <span className="spinner-border spinner-border-sm me-1 d-none" ref={spinnerRef} aria-hidden="true"></span>
                            Send
                        </button>
                    </div>
                    </>: 
                    <h5 className="without-account">Login to add comment</h5>
                }
            </form>
        </div>
    )
}

export default Comment