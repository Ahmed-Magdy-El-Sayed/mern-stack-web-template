import React, { useContext, useRef, useState } from "react";
import { socket } from '../../../../socket';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CommentContext } from "../content";
import { useDispatch } from 'react-redux';
import { addAlert } from "../../../../redux/alertSlice";
import { accountImagesPath, defaultUserImg, URLSearchParamsData } from "../../../../utils";

export default function ReplyOptions ({commentIndex, replyToID, reply, index, updateReplies}){
    const {content, comments, user} = useContext(CommentContext)
    const [displayReplyForm, setDisplayReplyForm] = useState(false)
    const spinnerRef = useRef({})
    const commentID = comments[commentIndex]._id
    const dispatch = useDispatch()
    
    const toggleReplyForm = () =>{
        if(!user){
            dispatch(addAlert({type: "danger", msg: 'login to reply'}));
            return null;
        }
        setDisplayReplyForm(display => !display)
    } 

    let addReplyIsClicked = false;
    const addReply = e=>{
        e.preventDefault()
        if(addReplyIsClicked) return null;
        addReplyIsClicked = true
        const form = e.currentTarget;
        const data = URLSearchParamsData(form);
        const dataToAppend = {
            contentID: content._id,
            commentID,
            replyToID: reply._id,
            replyToUserID: reply.userID,
            replyToUserName: reply.username
        }
        for (const key in dataToAppend) {
            data.append(key, dataToAppend[key])
        }
        spinnerRef.current.reply.classList.remove("d-none")
        fetch(process.env.REACT_APP_API_SERVER + '/content/replies/add',{
            method:'post',
            credentials: "include",
            body: data
        }).then(async res=>{
            if(res.ok) return await res.json() 
            else throw await res.json();
        }).then(newReply=>{
            socket.emit("addReply", {contentID: content._id, commentID}, newReply)
            form.body.value = null
            toggleReplyForm()
        }).catch(err=>{
            console.error(err.msg?err.msg:err)
            dispatch(addAlert({type:"danger", msg:"Something went wrong, Try again"}))
        }).finally(()=>{
            spinnerRef.current.reply?.classList.add("d-none");
            addReplyIsClicked = false
        })
    }

    const toggleEditMode = ()=>{
        updateReplies(replies=>{
            const repliesClone = [...replies];
            reply.editMode = !reply.editMode
            repliesClone.splice(index, index+1, reply)
            return repliesClone
        })
    }
    
    let reactClicked = false;
    const reactTheComment = react=>{
        if(!user){
            dispatch(addAlert({type: "danger", msg: 'login to react'}))
            return null
        }else if(String(user._id) === String(reply.userID)){
            dispatch(addAlert({type: "danger", msg: 'You wrote this reply'}))
            return null
        }else if(String(user._id) === content.author.id){
            dispatch(addAlert({type: "danger", msg: 'You (The Content Author) can only react with love'}))
            return null
        }
        if(reactClicked) return null;
        reactClicked = true;
        const data = {
            contentID: content._id,
            commentID,
            replyID: reply._id,
            react
        };
        fetch(process.env.REACT_APP_API_SERVER+'/content/replies/react',{
            method:'post',
            headers:{'Content-Type':'application/json'},
            credentials: "include",
            body: JSON.stringify(data)
        }).then(async res=>{
            if(res.ok){
                socket.emit('react', {contentID: content._id, commentID, replyToID}, await res.json())
            }else throw await res.json();
        }).catch(err=>{
            dispatch(addAlert({type: "danger", msg:err.msg?err.msg:err}))
        }).finally(()=>{
            reactClicked = false;
        })
    }
    
    const saveReplyEdit = e=>{
        const newBody = e.currentTarget.parentElement.children.body.value
        const data = {
            contentID: content._id,
            commentID,
            replyID: reply._id
        }
        spinnerRef.current.edit.classList.remove("d-none");
        if(reply.body !== newBody){
            data.body = newBody
            fetch(process.env.REACT_APP_API_SERVER+'/content/replies/edit',{
                method:'put',
                headers:{'Content-Type':'application/json'},
                credentials: "include",
                body: JSON.stringify(data)
            }).then(async res=>{
                if(res.ok){
                    socket.emit("updateReply", 
                        {contentID: data.contentID, commentID, replyToID}, 
                        {replyID: data.replyID, body: data.body}
                    )
                }else throw await res.json();
            }).catch(err=>{
                if(err.msg)
                    dispatch(addAlert({type:"danger", msg: err.msg}))
                else{
                    console.error(err)
                    dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
                }
            }).finally(()=>{
                spinnerRef.current.edit?.classList.add("d-none");
            })
        }
    };
    
    const deleteReply = () =>{
        const data = {
            contentID: content._id,
            commentID,
            replyID: reply._id,
            replyUserID: reply.userID
        }
        fetch(process.env.REACT_APP_API_SERVER+'/content/replies/delete',{
            method:'delete',
            headers:{'Content-Type':'application/json'},
            credentials: "include",
            body: JSON.stringify(data)
        }).then(async res=>{
            if(res.ok) socket.emit("deleteReply", {contentID: data.contentID, commentID, replyToID}, data.replyID)
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
    
    const loveComment = addLove=>{
        const data = {
            contentID: content._id,
            commentID: commentID,
            replyID: reply._id,
            addLove
        }
        fetch(process.env.REACT_APP_API_SERVER+'/content/replies/love',{
            method:'post',
            headers:{'Content-Type':'application/json'},
            credentials: "include",
            body: JSON.stringify(data)
        }).then(async res=>{
            if(res.ok) data.addLove?
                socket.emit("addLove", {contentID: data.contentID, commentID, replyToID}, data.replyID)
                :socket.emit("deleteLove", {contentID: data.contentID, commentID, replyToID}, data.replyID)
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

    const viewLove = user && String(user._id) === content.author.id && String(user._id) !== String(reply.userID);
    const viewEdit = user && String(user._id) === String(reply.userID)
    const viewDelete = user && (user.role === "admin" || user.role === "editor" || String(user._id) === content.author.id || String(user._id) === content.author.id)
    return <>
    {viewEdit && reply.editMode &&
        <div className="edit-comment mb-3">
            <textarea className='form-control mt-3 mb-3' name='body' placeholder='Enter comment' rows='2' defaultValue={reply.body} required/>
            <button className='btn btn-sm btn-primary me-3' onClick={saveReplyEdit}>
                <span className="spinner-border spinner-border-sm me-2 d-none" ref={ref=> spinnerRef.current.edit = ref} aria-hidden="true"></span>
                <span>Edit</span> 
            </button>
        </div>
    }
    {/*-------------------------- Like Option --------------------------*/}
        <span  className="likes-counter me-2 text-primary"> {reply.likes.length} </span>
        <FontAwesomeIcon icon={(reply.likes.includes(String(user?._id))? "fa-solid":"fa-regular")+ " fa-thumbs-up"} className="fs-5 like-comment text-primary me-3" onClick={()=>reactTheComment("like")}/>
    {/*-------------------------- Dislike Option --------------------------*/}
        <span className="dislikes-counter me-2 text-danger"> {reply.dislikes.length} </span>
        <FontAwesomeIcon icon={(reply.dislikes.includes(String(user?._id))? "fa-solid":"fa-regular")+ " fa-thumbs-down"} className="fs-5 dislike-comment text-danger me-3" 
            onClick={()=> reactTheComment("dislike")}
        />
    {/*-------------------------- Author React Option --------------------------*/}
        {viewLove?
            <FontAwesomeIcon icon={(reply.loved?"fa-solid":"fa-regular") + " fa-heart"} className="text-danger me-3 fs-5" onClick={()=>loveComment(!reply.loved)}/>
        :
            <span className="author-react">
                {reply.loved &&
                <span className="budge bg-danger ps-2 pe-2 pt-1 pb-1 me-3 rounded-pill">
                    <FontAwesomeIcon icon="fa-solid fa-heart" className="text-white text-danger"/>
                    <img className="img-icon-sm mb-1 rounded-circle" alt="" src={accountImagesPath(content.author.img)} onError={defaultUserImg}/>
                </span>
                }
            </span>
        }
    {/*-------------------------- Edit Option --------------------------*/}
        {viewEdit &&
            <FontAwesomeIcon icon="fa-regular fa-pen-to-square" className="fs-5 text-success me-3" onClick={toggleEditMode}/>
        }
    {/*-------------------------- Delete Option --------------------------*/}
        {viewDelete && 
            <FontAwesomeIcon icon="fa-solid fa-trash" className="fs-5 text-danger me-3" onClick={deleteReply}/>
        }
    {/*-------------------------- reply Option --------------------------*/}
        <FontAwesomeIcon icon="fa-solid fa-reply" className="fs-5 text-secondary"
            onClick={toggleReplyForm}
        />
        {user && displayReplyForm &&
            <form className='reply-comment rounded m-0 mt-2 alert alert-secondary' 
            onSubmit={addReply}>
                <span className="btn btn-close me-3 position-absolute end-0" onClick={toggleReplyForm}></span>
                <div className="user-details mb-2 d-flex gap-2 align-items-center">
                    <img className="img-icon rounded-circle" alt="" src={accountImagesPath(user.img)} onError={defaultUserImg}/>
                    {
                        user.role === "admin" || user.role === "editor" || user.role === "author"?
                            <span className="username budge bg-primary text-white rounded ps-2 pe-2"> 
                                <h6 className="d-inline m-0">{user.username}</h6>
                                <FontAwesomeIcon icon="fa-solid fa-check" className='ms-1'/>
                            </span>
                        :<h6 className="m-0">{user.username}</h6>
                    }
                    <FontAwesomeIcon icon="fa-solid fa-angles-right"/> 
                    <a className="text-decoration-none" href={"#id"+reply._id}> {reply.username}</a>
                </div>
                <textarea className='form-control mb-3' rows="5" name='body' placeholder='Enter comment' required></textarea>
                <button className='btn btn-primary btn-sm' type='submit'> 
                    <span className="spinner-border spinner-border-sm me-2 d-none" ref={ref=> spinnerRef.current.reply = ref} aria-hidden="true"></span>
                    <span>Reply</span> 
                </button>
            </form>
        }
    </>
}