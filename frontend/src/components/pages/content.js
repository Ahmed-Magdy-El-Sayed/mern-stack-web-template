import React, { createContext, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import Comment from "../comment"
import { useDispatch, useSelector } from 'react-redux';
import { calcPassedTime, defaultContentImg, profileRoute, defaultUserImg, URLSearchParamsData, contentImagesPath, accountImagesPath } from '../../utils';
import { socket } from '../../socket';
import { addAlert } from '../../redux/alertSlice';
import Loader from '../loader';

export const CommentContext = createContext()
export default function Content() {
    const user = useSelector(state=> Object.keys(state.user).length? state.user : null)
    const params = useParams()
    const [comments, setComments] = useState()
    const [content, setContent] = useState()
    const [editContentAlert, setEditContentAlert] = useState()
    const [spinnersControl, setSpinnersControl] = useState({
        approval: false,
        rejection: false,
        hide: false,
        show: false,
        delete: false,
        edit: false
    })
    const previewRef = useRef()
    const dispatch = useDispatch()
    const navigate = useNavigate();

    const updateComments = cb=>{
        setComments(cb)
    }

    const addCommentTime = (index)=>{
        if(index){
            updateComments(comments=>{
                if(!comments[index]){
                    setTimeout(index=>{addCommentTime(index)}, 60000, index);
                    return comments
                }
                const {passedTime, nextInc} = calcPassedTime(parseInt(comments[index].timestamp))
                if(nextInc != null) setTimeout(index=>{addCommentTime(index)}, nextInc, index);
                return [
                    ...comments.slice(0, index),
                    {...comments[index], time:passedTime},
                    ...comments.slice(index+1)
                ]
            })
        }else
            updateComments(comments=>comments.map((comment, i)=>{
                const {passedTime, nextInc} = calcPassedTime(parseInt(comment.timestamp))
                comment.time = passedTime;
                if(nextInc != null) setTimeout(i=>{addCommentTime(i)}, nextInc, i);
                return comment
            }))
    }

    let approvalIsClicked = false;
    const sendApproval = e=>{
        e.preventDefault();
        if(approvalIsClicked) return null;
        approvalIsClicked = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form)
        data.append("contentID", content._id);
        setSpinnersControl(spinners=>({...spinners, approval: true}))
        fetch(process.env.REACT_APP_API_SERVER + "/content/approve",{
            method:'put',
            credentials: "include",
            body: data
        }).then(async res=>{
            if(res.ok) {
                socket.emit("sendApproval", content.author.id, content._id)
                socket.emit("notifyUser", content.author.id)
                navigate("/content/control")
            }
            else throw await res.json();
        }).catch( err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            setSpinnersControl(spinners=>({...spinners, approval: false}))
            approvalIsClicked = false
        })
    }

    let rejectIsClicked = false;
    const sendRejection = e=>{
        e.preventDefault();
        if(rejectIsClicked) return null;
        rejectIsClicked = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form)
        data.append("contentID", content._id);
        
        setSpinnersControl(spinners=>({...spinners, rejection: true}))
        fetch(process.env.REACT_APP_API_SERVER + "/content/reject",{
            method:'delete',
            credentials: "include",
            body: data
        }).then( async res=>{
            if(res.ok) {
                socket.emit("sendRejection", content.author.id, content._id)
                socket.emit("notifyUser", content.author.id)
                navigate("/content/control")
            }
            else throw await res.json();
        }).catch( err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            setSpinnersControl(spinners=>({...spinners, rejection: true}))
            rejectIsClicked = false
        })
    }

    useEffect(()=>{
        (async()=>{
            const content = await fetch(process.env.REACT_APP_API_SERVER+"/content/id/"+params.id,{
                credentials: "include",
            }).then(async res=>{
                if(res.ok)
                    return await res.json()
                else
                    throw await res.json()
            }).then(content=>{
                updateComments(content.comments)
                delete content.comments
                setContent(content)
                addCommentTime()
                return content
            }).catch(err=>{
                if(err.msg)
                    dispatch(addAlert({type:"danger", msg: err.msg}))
                else{
                    console.error(err)
                    dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
                }
            })
            if(!content){ 
                setContent("content not exist")
                return null
            }
            socket.on("addCommentIn"+content._id, newComment=>{//when their is new 
                updateComments(comments=>{
                    const reachLastComment = content.commentsNum <= comments.length;
                    if(reachLastComment){// check that the user reached to the last comment
                        setContent(content=>({...content, commentsNum: content.commentsNum+1}))
                        addCommentTime(comments.length)
                        return [...comments, newComment]
                    }
                    return comments
                })
            })
            socket.on("updateCommentIn"+content._id, data=>{//the comment owner edit it
                updateComments(comments=>{
                    const index = comments.findIndex(comment=> String(comment._id) === data.commentID)
                    if(index !== -1)
                        return [...comments.slice(0, index),{...comments[index], body: data.body, editMode: null}, ...comments.slice(index+1)]
                    return comments
                })
            })
            socket.on("deleteCommentIn"+content._id, commentID=>{//the comment owner delete it
                updateComments(comments=>{
                    const index = comments.findIndex(comment=> String(comment._id) === commentID)
                    if(index !== -1) //check if exist
                        return [
                            ...comments.slice(0, index),
                            {
                            ...comments[index], 
                            userImg: "/user.jpg",
                            userIsAuthz: null,
                            userID: null,
                            username: "Deleted",
                            body: "Deleted Message",
                            },
                            ...comments.slice(index+1)
                        ]
                    return comments
                })
            })
            socket.on("reactIn"+content._id, (commentID, replyToID, updatedComment)=>{//their is new like or dislike on a comment/reply
                if(replyToID)
                    updateComments(comments=>{
                        const index = comments.findIndex(comment=> String(comment._id) === commentID)
                        if(index !== -1){ //check if exist
                            if(comments[index].replies && comments[index].replies[replyToID])
                            return [
                                ...comments.slice(0, index),
                                {
                                    ...comments[index], 
                                    replies:{
                                        ...comments[index].replies,
                                        [replyToID]: comments[index].replies[replyToID].map(reply=>
                                            String(reply._id) === String(updatedComment._id)?
                                            {...reply, likes:updatedComment.likes, dislikes:updatedComment.dislikes}
                                            : reply
                                        )
                                }},
                                ...comments.slice(index+1)
                            ]
                        }
                        return comments
                    })
                else
                    updateComments(comments=>{
                        const index = comments.findIndex(comment=> String(comment._id) === commentID)
                        if(index !== -1)//check if exist
                            return [
                                ...comments.slice(0, index),
                                {...comments[index], likes: updatedComment.likes, dislikes: updatedComment.dislikes},
                                ...comments.slice(index+1)
                            ]
                        return comments
                    })
            })
    
            socket.on("addReplyIn"+content._id, (commentID, newReply)=>{//when their is new reply 
                updateComments(comments=>{
                    const index = comments.findIndex(comment=> String(comment._id) === commentID)
                    if(index !== -1){//check if exist
                        const replies = comments[index].replies? comments[index].replies : {}
                        if(commentID === newReply.replyToID){
                            return [
                                ...comments.slice(0, index),
                                {
                                    ...comments[index],
                                    repliesNum: comments[index].repliesNum+1,
                                    replies: {
                                        ...replies,
                                        [commentID]: replies[commentID]? 
                                            [...replies[commentID], newReply] : [newReply]
                                    }
                                },
                                ...comments.slice(index+1)
                            ]
                        }
                        
                        let group, replyIndex;
                        for (const replyToID in replies) {
                            replyIndex = replies[replyToID].findIndex(reply=> String(reply._id) === newReply.replyToID)
                            if(replyIndex !== -1){ 
                                group = replyToID;
                                break;
                            }
                        }
                        
                        if(group)
                            return [
                                ...comments.slice(0, index),
                                {
                                    ...comments[index],
                                    repliesNum: comments[index].repliesNum+1,
                                    replies: {
                                        ...replies,
                                        [newReply.replyToID]: replies[newReply.replyToID]? 
                                            [...replies[newReply.replyToID], newReply] : [newReply],
                                        [group]: replies[group].map((reply,i)=> i === replyIndex? {...reply, repliesNum: reply.repliesNum+1} : reply)
                                    }
                                },
                                ...comments.slice(index+1)
                            ]
                        
                        return [
                            ...comments.slice(0, index),
                            {
                                ...comments[index],
                                repliesNum: comments[index].repliesNum+1
                            },
                            ...comments.slice(index+1)
                        ]
                    }
                    return comments
                })
            })
            
            socket.on("updateReplyIn"+content._id, (commentID, replyToID, replyData)=>{//the comment owner edit it
                updateComments(comments=>{
                    const index = comments.findIndex(comment=> String(comment._id) === commentID)
                    if(index !== -1){//check if exist
                        if(comments[index].replies && comments[index].replies[replyToID]?.length)
                        return [
                            ...comments.slice(0, index),
                            {
                                ...comments[index],
                                replies: {
                                    ...comments[index].replies,
                                    [replyToID]: comments[index].replies[replyToID].map(reply=> String(reply._id) === replyData.replyID? {...reply, body: replyData.body, editMode: null} : reply)
                                }
                            },
                            ...comments.slice(index+1)
                        ]
                    }
                    return comments
                })
            })
            socket.on("deleteReplyIn"+content._id, (commentID, replyToID, replyID)=>{//the comment owner delete it
                updateComments(comments=>{
                    const index = comments.findIndex(comment=> String(comment._id) === commentID)
                    if(index !== -1){//check if exist
                        if(comments[index].replies && comments[index].replies[replyToID])
                        return [
                            ...comments.slice(0, index),
                            {
                                ...comments[index],
                                replies:{
                                    ...comments[index].replies,
                                    [replyToID]: comments[index].replies[replyToID].map(reply=> String(reply._id) === replyID? {
                                        ...reply, 
                                        userImg: "/user.jpg",
                                        userIsAuthz: null,
                                        userID: null,
                                        username: "Deleted",
                                        body: "Deleted Message",
                                    } : reply)
                                }
                            },
                            ...comments.slice(index+1)
                        ]
                    }
                    return comments
                })
            })
            socket.on("addLoveIn"+content._id, (commentID, replyToID, replyID)=>{//the Auther add love to a comment
                if(replyID){
                    updateComments(comments=>{
                        const index = comments.findIndex(comment=> String(comment._id) === commentID)
                        if(index !== -1){//check if exist
                            if(comments[index].replies && comments[index].replies[replyToID])
                            return [
                                ...comments.slice(0, index),
                                {
                                    ...comments[index],
                                    replies:{
                                        ...comments[index].replies,
                                        [replyToID]: comments[index].replies[replyToID].map(reply=> String(reply._id) === replyID? {...reply, loved: true} : reply)
                                    }
                                },
                                ...comments.slice(index+1)
                            ]
                        }
                        return comments
                    })
                }else
                    updateComments(comments=>{
                        const index = comments.findIndex(comment=> String(comment._id) === commentID)
                        if(index !== -1)//check if exist
                            return comments.map((comment, i)=> i === index? {...comment, loved: true} : comment)
                        return comments
                    })
            })
            socket.on("deleteLoveIn"+content._id, (commentID, replyToID, replyID)=>{//the Auther delete the love on a comment
                if(replyID){
                    updateComments(comments=>{
                        const index = comments.findIndex(comment=> String(comment._id) === commentID)
                        if(index !== -1){//check if exist
                            if(comments[index].replies && comments[index].replies[replyToID])
                                return [
                                ...comments.slice(0, index),
                                {
                                    ...comments[index],
                                    replies: {
                                        ...comments[index].replies,
                                        [replyToID]: comments[index].replies[replyToID].map(reply=> String(reply._id) === replyID? {...reply, loved: false} : reply)
                                    }
                                },
                                ...comments.slice(index+1)
                                ]
                        }
                        return comments
                    })
                }else
                updateComments(comments=>{ 
                    const index = comments.findIndex(comment=> String(comment._id) === commentID)
                    if(index !== -1)//check if exist
                        return comments.map((comment, i)=> i === index? {...comment, loved: false} : comment)
                    return comments
                })
            })
        })()
    }, [])

    let contentChangeIsClicked = false;
    const contentView = (method, path, conf)=>{
        if(contentChangeIsClicked) return null;
        contentChangeIsClicked = true
        if(conf && !window.confirm(conf)) return null
        const type = path.split("/").pop()
        if(type === "show")
            setSpinnersControl(spinners=>({...spinners, show: true}))
        else if(type === "hide")
            setSpinnersControl(spinners=>({...spinners, hide: true}))
        else
            setSpinnersControl(spinners=>({...spinners, delete: true}))
        fetch(process.env.REACT_APP_API_SERVER+path,{
            method,
            headers:{'Content-Type':'application/json'},
            credentials: "include",
            body: JSON.stringify({contentID: content._id})
        }).then(async res=>{
            if(res.ok){
                if(type === "show")
                    setContent({...content, hidden: false})
                else if(type === "hide")
                    setContent({...content, hidden: true})
                else
                    navigate("/")
            }else
                throw await res.json()
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            if(type === "show")
                setSpinnersControl(spinners=>({...spinners, show: false}))
            else if(type === "hide")
                setSpinnersControl(spinners=>({...spinners, hide: false}))
            else
                setSpinnersControl(spinners=>({...spinners, delete: false}))
            contentChangeIsClicked = false
        })
    }
    
    let editIsClicked = false;
    const editContent = e=>{
        e.preventDefault();
        if(editIsClicked) return null;
        editIsClicked = true
        const formData = new FormData(e.currentTarget);
        formData.append("contentID", content._id)
        setSpinnersControl(spinners=>({...spinners, edit: true}))
        fetch(process.env.REACT_APP_API_SERVER+"/content/edit", {
            method:"put",
            credentials: "include",
            body: formData
        }).then(async res=>{
            if(res.ok)
                return await res.json();
            else
                throw await res.json();
        }).then(newContent=>{
            setContent(newContent)
            setEditContentAlert({state: "success", msg: "Done!"})
        })
        .catch(err=>{
            if(err.msg)
                setEditContentAlert({state: "danger", msg: err.msg})
            else{
                console.error(err)
                setEditContentAlert({state: "danger", msg: "Something Went Wrong, Try Again!"})
            }
        }).finally(()=>{
            e.currentTarget.reset();
            setSpinnersControl(spinners=>({...spinners, edit: false}))
            editIsClicked = false
        })
    }

    if (!content) return <Loader/>

    if(content === "content not exist") return ""
    
    if(content.hidden && (!user ||(user && !(user.role === "admin" || user.role === "editor" || String(user._id) === content.author.id)))) 
        return <div className="alert alert-warning w-100 text-center">Not allowed to preview this content</div>

    return (
        <>
            {content.hidden &&
                <div className="alert alert-warning w-100 text-center">
                    {String(user._id) === content.author.id ? 
                    "you changes the content setting to be unvisiable to normal users and the other authors" 
                    : 
                    "the author changes the content setting to be unvisiable to normal users and the other authors"
                    }
                </div>
            }

            <div className="container mt-3">
                {/* Content info */}
                <div className="content-info d-flex justify-content-between align-items-center">
                    {/* Content author details */}
                    <div className="author-details d-flex gap-2">
                        <p className="m-0">By:</p>
                        <div className="text-center">
                            <img className="m-auto img-icon rounded-circle .cur-pointer" src={accountImagesPath+content.author.img} alt="" onClick={() => navigate(profileRoute+content.author.id)} onError={defaultUserImg}/>
                            <p>{content.author.name}</p>
                        </div>
                    </div>
                    {user?.role === "admin" && content.reviewer &&
                    <NavLink to={profileRoute+content.reviewer}>See Reviewer</NavLink>
                    }
                    {!content.isUnderReview && user && (String(user._id) === content.author.id || user.role === "admin" || user.role === "editor") && 
                        <>
                            {/* Content Control */}
                            <div className={`collapse collapse-horizontal ${String(user._id) === content.author.id?"w-50 text-end":""} align-items-center`} id="content-setting">
                                {String(user._id) === content.author.id &&(// If the user is the content owner
                                    <>
                                        {// View/Hide content option
                                        content.hidden ?
                                            <button className="btn btn-primary rounded mb-1 me-2" type="button" onClick={()=>contentView("put", "/content/show")}>
                                                {spinnersControl.show && <span className="spinner-border spinner-border-sm me-1 cur-pointer" aria-hidden="true"></span>}
                                                show
                                            </button>
                                        :
                                            <button className="btn btn-secondary rounded mb-1 me-2" type="button" onClick={()=>contentView("put", "/content/hide")}>
                                                {spinnersControl.hide && <span className="spinner-border spinner-border-sm me-1 cur-pointer" aria-hidden="true"></span>}
                                                Hide
                                            </button>
                                        }
                                    
                                    {/* Edit Content Option */}
                                        <button className="edit-content-toggler btn btn-success mb-1 rounded me-2"
                                        data-bs-toggle="modal"
                                        data-bs-target=".modal.edit-content" 
                                        type="button">
                                            Edit
                                        </button>

                                        <div className="modal edit-content fade">
                                            <div className="modal-dialog overflow-auto">
                                                <form onSubmit={editContent}>
                                                    <div className='modal-header'>
                                                        <h1 className="modal-title fs-5">Edit Content</h1>
                                                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                    </div>
                                                    <div className='modal-body'>
                                                        <img
                                                            className="img-icon-lg"
                                                            src={contentImagesPath+content.img}
                                                            alt='content-img'
                                                            onError={defaultContentImg}
                                                        />
                                                        <h1 className="d-inline ms-3">{content.name}</h1>
                                                        <img className='preview-image w-25 ms-5' alt='' ref={previewRef}/>
                                                        {editContentAlert?
                                                            <div className={'alert alert-'+editContentAlert.state+' fade show w-100 text-center p-2 m-0'}> 
                                                            {editContentAlert.msg}
                                                            </div>
                                                        :""}
                                                        <div className="input-group my-3">
                                                            <span className='input-group-text'>Change Image</span>
                                                            <input className='form-control'
                                                                type="file"
                                                                name="img"
                                                                onChange={e=>{previewRef.current.src = URL.createObjectURL(e.currentTarget.files[0])}}
                                                            />
                                                        </div>
                                                        <p>The image should be (png, jpg, or jpeg) only</p>
                                                        <div className="input-group my-3">
                                                            <span className='input-group-text'>Name</span>
                                                            <input
                                                                className="form-control pb-2"
                                                                type="text"
                                                                name="name"
                                                                defaultValue={content.name}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className='modal-footer'>
                                                        <button className="btn btn-success" type="submit">
                                                            {spinnersControl.edit && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>}
                                                            Save
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </>
                                    )
                                }
                            
                            {/* Delete content option */}
                                <button className="btn btn-danger mb-1 rounded" type="button" onClick={()=>contentView("delete", "/content/delete", "Are you sure you want to delete the content permanently!")}>
                                    {spinnersControl.delete && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>}
                                    Delete
                                </button>
                            </div>
                            
                            <div className="d-flex flex-row-reverse gap-2 align-items-center">
                                <span>{
                                    content.views?
                                    content.views%1000000===0? (content.views/1000000).toFixed(1)+"M":
                                    content.views%1000===0? (content.views/1000)+"k" :
                                    content.views : 0
                                }</span>
                                <FontAwesomeIcon icon="fa-regular fa-eye"/>
                                <button className="btn btn-primary" type="button" data-bs-toggle='collapse' data-bs-target="#content-setting">Setting</button>
                            </div>
                        </>
                    }
                </div>

                <img className='d-block w-auto mx-auto' style={{height:"25vh"}} src={contentImagesPath+content.img} alt='page cover' onError={defaultContentImg}/>
                <h1 className="content-name alert-alert-primary text-center">{content.name}</h1>
                <p>{calcPassedTime(content.date).passedTime}</p>

                {/* --------- here you should add the details of your content --------- */}
                <div className="alert alert-info w-100">her you should add the details of your content</div>

                {content.isUnderReview?
                    content.reviewer === String(user?._id) &&
                    <> 
                    {/* If the content is under review and the user is the reviewer */}
                        <form className="d-flex justify-content-end gap-3 position-sticky bottom-0" 
                        onSubmit={sendApproval}>
                            <button className="btn btn-success" type="submit">
                                {spinnersControl.approval && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>}
                                Approve
                            </button>
                            <input type="hidden" name="authorID" value={content.author.id} />
                            <button className="btn btn-danger" type="button" data-bs-toggle="collapse" data-bs-target="#reject">
                                Reject
                            </button>
                        </form>
                        <form className="collapse mt-3 w-75 m-auto text-center" id="reject"
                        onSubmit={sendRejection}>
                            <input type="hidden" name="authorID" value={content.author.id} />
                            <input className="form-control mb-2" type="text" name="reason" placeholder="Enter the rejection reason" required />
                            <button className="btn btn-primary" type="submit">
                                {spinnersControl.rejection && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>}
                                Submit
                            </button>
                        </form>
                    </>
                :
                    <CommentContext.Provider value={{content, comments, updateComments, user}}>
                        <Comment/>
                    </CommentContext.Provider>
                }
            </div>
        </>
    )
}