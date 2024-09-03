import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { addAlert } from "../redux/alertSlice";
import { defaultContentImg, contentRoute, contentImagesPath } from "../utils"
import { useNavigate } from "react-router-dom";

export default function ContentSearch({onClickFun}){
    const [searchContents, setSearchContents] = useState([]);
    const previewRef = useRef();
    const dispatch = useDispatch()
    const navigate = useNavigate()
    
    const getMatchedContents = searchVal=>{
        searchVal = searchVal.trim()
        fetch(process.env.REACT_APP_API_SERVER+'/content/search?name='+searchVal, {credentials:"include"}).then(async res=>{
            if(res.status === 200) return await res.json()
            else throw await res.json();
        }).then(contents=>{
            setSearchContents(contents)
        }).catch(err=>{
            if(err.msg)
                setSearchContents([{msg: err.msg}])
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        })  
    }
    return <>
        <img className='preview-image w-100' ref={previewRef}/>
        <input 
            className="form-control w-50 m-auto mb-3 dropdown-toggle" 
            type="search" 
            name="title" 
            placeholder="search Content by name" 
            onInput={e=>getMatchedContents(e.currentTarget.value)} 
            role="button" data-bs-toggle="dropdown" aria-expanded="false"
        /> 
        <ul className="dropdown-menu w-50 text-center">
            {searchContents.length?
                searchContents.map((content, i)=>
                    <li className="cur-pointer" key={i} onClick={()=>{
                        if(onClickFun){ 
                            onClickFun(content)
                            previewRef.current.src = content.img? contentImagesPath+content.img:"";
                        }else navigate(contentRoute+content._id);
                    }}>
                        <div className="dropdown-item d-flex justify-content-between align-items-center">
                            <div className='details'>
                                <h6>{content.name}</h6>
                                <p>By {content.author.name}</p>
                            </div>
                            <img src={contentImagesPath+content.img}  alt='image cover' onError={defaultContentImg}/>
                        </div>
                    </li>
                )
            : <li>No matched result</li>}
        </ul>
    </>
}