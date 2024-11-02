import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { addAlert } from "../../redux/alertSlice";
import { defaultContentImg, contentRoute, contentImagesPath } from "../../utils"
import { useNavigate } from "react-router-dom";
import Loader from "./loader";

export default function ContentSearch({onClickFun}){
    const [searchContents, setSearchContents] = useState([]);
    const previewRef = useRef();
    const searchInput = useRef();
    const dispatch = useDispatch()
    const navigate = useNavigate()
    
    const getMatchedContents = searchVal=>{
        searchVal = searchVal.trim()
        setSearchContents([null])
        fetch(process.env.REACT_APP_API_SERVER+'/content/search?name='+searchVal, {credentials:"include"}).then(async res=>{
            if(res.status === 200) return await res.json()
            else throw await res.json();
        }).then(contents=>{
            setSearchContents(contents)
        }).catch(err=>{
            setSearchContents([])
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        })
    }
    return <>
        <img className='preview-image w-100' alt="" ref={previewRef}/>
        <input 
            className="form-control dropdown-toggle w-50 m-auto mb-3" 
            type="search" 
            name="title" 
            placeholder="search Content by name" 
            onInput={e=>getMatchedContents(e.currentTarget.value)} 
            ref={searchInput}
            role="button" data-bs-toggle="dropdown" aria-expanded="false"
        /> 
        <ul className="dropdown-menu w-50 text-center">
            {searchContents.length?
                searchContents[0]?
                    searchContents.map((content, i)=>
                        <li className="cur-pointer" key={i} onClick={()=>{
                            if(onClickFun){
                                searchInput.current.value = content.name;
                                onClickFun(content);
                                previewRef.current.src = content.img? contentImagesPath(content.img):"";
                            }else navigate(contentRoute+content._id);
                        }}>
                            <div className="dropdown-item d-flex justify-content-between align-items-center">
                                <div className='details'>
                                    <h6>{content.name}</h6>
                                    <p>By {content.author.username}</p>
                                </div>
                                <img src={contentImagesPath(content.img)}  alt='content cover' onError={defaultContentImg}/>
                            </div>
                        </li>
                    )
                : <Loader/>
            : <li>No matched result</li>}
        </ul>
    </>
}