import React, { memo, useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CommentContext } from "../content";
import { useDispatch } from 'react-redux';
import { addAlert } from "../../../../redux/alertSlice";
import ReplyOptions from "./replyOptions";
import { accountImagesPath, calcPassedTime, defaultUserImg } from "../../../../utils";

function Reply({commentIndex, replyToID}){
    const {content, comments, updateComments, user} = useContext(CommentContext)
    const commentID = comments[commentIndex]._id
    const allReplies = comments[commentIndex].replies
    const [replies, setReplies] = useState(allReplies[replyToID])
    const [viewReplies, setViewReplies] = useState(new Array(allReplies[replyToID].length))
    const dispatch = useDispatch()

    if(JSON.stringify(allReplies[replyToID]) && allReplies[replyToID]?.length && JSON.stringify(allReplies[replyToID]) !== JSON.stringify(replies))
        setReplies(allReplies[replyToID])

    const updateReplies = cb=>{
        setReplies(cb)
    }
    
    const addReplyTime = ()=>{
        updateComments(comments=>{
            const updatedReplies = {};
            const replies = comments[commentIndex].replies
            let smallestNextInc;
            for (const key in replies) {
                updatedReplies[key] = replies[key].map(reply=>{
                    const {passedTime, nextInc} = calcPassedTime(parseInt(reply.timestamp))
                    reply.time = passedTime;
                    if(!smallestNextInc || smallestNextInc > nextInc) smallestNextInc = nextInc
                    return reply    
                })
            }
            if(smallestNextInc) setTimeout(()=>{addReplyTime()}, smallestNextInc);
            return [
                ...comments.slice(0, commentIndex), 
                {...comments[commentIndex], replies: updatedReplies},
                ...comments.slice(commentIndex+1)
            ]
        })
    }

    useEffect(()=>{
        if(replies)
            addReplyTime()
    }, [])

    let getRepliesIsRunning = false; 
    const getReplies = (replyToID, i) =>{
        if(getRepliesIsRunning)
            return null
        
        getRepliesIsRunning = true
        
        if(allReplies[replyToID])
            return setViewReplies(arr=> [...arr.slice(0, i), !arr[i], ...arr.slice(i+1)])
        
        setViewReplies(arr=> [...arr.slice(0, i), !arr[i], ...arr.slice(i+1)])
        fetch(`${process.env.REACT_APP_API_SERVER}/content/${content._id}/comment/${commentID}/replies/${replyToID}`)
        .then(async res=>{ 
            if(res.ok) return await res.json()
            throw await res.json()
        }).then(newReplies=>{
            updateComments(comments=>[
                ...comments.slice(0, commentIndex), 
                {...comments[commentIndex], replies: {...allReplies, [replyToID]:newReplies}},
                ...comments.slice(commentIndex+1)
            ])
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

    const getRepliedTo =selector=>{
        document.querySelector(selector).classList.add("bg-dark", "text-white")
        setTimeout(() => {
            document.querySelector(selector).classList.remove("bg-dark", "text-white")
        }, 1000);
    }

    return <>{
        replies.map((reply, i)=>
        <div className="reply-container" key={reply._id}>
            <div className="reply pt-3" id={"id"+reply._id}>
                {/* Reply Owner Details */}
                <div className="user-details d-flex gap-2 align-items-center">
                    <img className="img-icon rounded-pill" alt="" src={accountImagesPath(reply.userImg)} onError={defaultUserImg}/>
                    <div className="details">
                        {
                            reply.userIsAuthz?
                                <>
                                <span className="username budge bg-primary text-white rounded p-1 ps-2 pe-2"> 
                                    <h6 className="d-inline m-0"> {user? String(user._id)===reply.userID?"Me":reply.username:reply.username} </h6>
                                    <FontAwesomeIcon icon="fa-solid fa-check" className="ms-1"/>
                                </span>
                                {content.author.id === reply.userID?<p className="author-mark m-0 ms-2 d-inline text-secondary fw-bold"> "The Author" </p>:null}
                                </>
                            :<h6 className="username d-inline m-0"> {user? String(user._id)===reply.userID?"Me":reply.username:reply.username} </h6>
                        }
                        <FontAwesomeIcon icon="fa-solid fa-angles-right"/>
                        <a className="text-decoration-none" href={"#id"+reply.replyToID} onClick={()=>getRepliedTo("#id"+reply.replyToID)}> {user? String(user._id)===reply.replyToUserID?"Me":reply.replyToUserName : reply.replyToUserName}</a>
                        <p className="comment-time m-0">{reply.time? reply.time : calcPassedTime(parseInt(reply.timestamp)).passedTime}</p>
                    </div>
                </div>

                {/* Reply Body */}
                <div className="reply-body mt-3">
                    {!reply.editMode && <div className="content">
                        <p className="p-3 m-0 border rounded text-break">{reply.body}</p>
                    </div>}
                    <div className="options mt-2">
                        {reply.userID && <ReplyOptions commentIndex={commentIndex} replyToID={replyToID} reply={reply} index={i} updateReplies={updateReplies}/>}
                    </div>
                </div>
            </div>
            {reply.repliesNum !== 0 &&
                <div className="comment-replies">
                    <div className={`collapse replies ${commentID === replyToID?"ps-5":"ps-2"} border-start border-2 border-secondary`} id={"replies"+reply._id}>
                        {allReplies[reply._id]?
                            <Reply commentIndex={commentIndex} replyToID={reply._id}/>
                        :
                        <div className="spinner-border text-primary ms-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        }
                    </div>
                    <a className="mb-3 text-decoration-none" data-bs-toggle="collapse"
                        href={"#replies"+reply._id}
                        onClick={()=> getReplies(reply._id, i)}
                        data-replies-num={reply.repliesNum}
                    > {viewReplies[i]? "hide" : "show"} ({reply.repliesNum}) replies </a>
                </div>
            }
        </div>)
    }</>
}

export default  memo(Reply)