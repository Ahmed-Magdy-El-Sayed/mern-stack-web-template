import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../../socket';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../redux/alertSlice';
import { useNavigate } from 'react-router-dom';
import Loader from '../loader';
import ContentCard from '../contentCard';
import { contentImagesPath, defaultContentImg } from '../../utils';
import ContentSearch from '../contentSearch';

let newSliderData = {};
export default function ContentReview(){
    const [contents, setContents] = useState();
    const [sliderContents, setSliderContents] = useState([]);
    const [addSlideOption, setAddSlideOption] = useState("exist-content");
    const spinnersControl = useRef([]);
    const imgRef = useRef();
    const modalCloseRef = useRef();
    const previewRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    useEffect(()=>{
        fetch(process.env.REACT_APP_API_SERVER+"/content/control", {credentials: "include"}).then(async res=>{
            if(res.ok)
                return await res.json()
            else
                throw await res.json()
        }).then(({contents, sliderContents, msg})=>{
            setContents(contents)
            setSliderContents(sliderContents)
            msg && dispatch(addAlert({type: "success", msg}))
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
            if(err?.msg === "Forbidden") navigate("/")
        })
        socket.on("newContentToReview", content=>{
            setContents(contents=>{
                const selectFrom = [...contents.selectFrom, content]
                return {selected: contents.selected, selectFrom}
            })
        })
        socket.on("hiddeContent", contentID=>{
            setContents(contents=>{
                const index = contents.selectFrom.findIndex(content => String(content._id) === contentID);
                const selectFrom = contents.selectFrom.slice(0, index).concat(contents.selectFrom.slice(index+1))

                return {selected: contents.selected, selectFrom}
            })
        })
    
        socket.on("showContent", content=>{
            setContents(contents=>{
                const selectFrom = [...contents.selectFrom, content]
                
                return {selected: contents.selected, selectFrom}
            })
        })
    },[])

    let isBeingApplied = false;
    const select = (e, contentID, refI)=>{
        e.stopPropagation()
        if(isBeingApplied) return null
        isBeingApplied = true
        spinnersControl.current[refI].classList.remove('d-none')
        fetch(process.env.REACT_APP_API_SERVER+"/content/select",{
            method:'put',
            credentials: "include",
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({contentID})
        }).then(async res=>{//update the DOM
            if(res.ok){
                const index = contents.selectFrom.findIndex(content => String(content._id) === contentID);
                const selected = [...contents.selected, contents.selectFrom[index]]
                const selectFrom = contents.selectFrom.slice(0, index).concat(contents.selectFrom.slice(index+1))
                setContents({selected, selectFrom})

                socket.emit("hiddeContent", contentID)// hidde content from other online reviewers 
            }
            else throw await res.json();
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            spinnersControl.current[refI].classList.add('d-none')
            isBeingApplied = false 
        })
    }

    const unselect = (e, contentID, refI)=>{
        e.stopPropagation()
        if(isBeingApplied) return null
        isBeingApplied = true
        spinnersControl.current[refI].classList.remove('d-none')
        fetch(process.env.REACT_APP_API_SERVER+"/content/unselect",{
            method:'put',
            credentials: "include",
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({contentID})
        }).then(async res=>{//update the DOM
            if(res.ok){
                const index = contents.selected.findIndex(content => String(content._id) === contentID);
                const selectFrom = [...contents.selectFrom, contents.selected[index]]
                const selected = contents.selected.slice(0, index).concat(contents.selected.slice(index+1))
                setContents({selected, selectFrom})

                socket.emit("showContent", contents.selected[index])// to allow other online reviewers to select it
            }
            else throw await res.json();
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{ 
            spinnersControl.current[refI].classList.add('d-none')
            isBeingApplied = false 
        })
    }

    const selectContent = content=>{
        imgRef.src = process.env.REACT_APP_API_SERVER+"/content/"+content.img
        newSliderData = {
            img: content.img,
            title: content.name,
            // desc: add the content description atrr here,
            link: content._id
        }
    }

    const customSlideAddingChange = e=>{
        if(e.currentTarget.name !== 'img') 
            return newSliderData = {
                ...newSliderData,
                [e.currentTarget.name]: e.currentTarget.value,
                custom: true
            }

        previewRef.current.src = e.currentTarget.files.length? URL.createObjectURL(e.currentTarget.files[0]):""
        newSliderData = {
            ...newSliderData,
            img: e.currentTarget.files[0],
            imgSrc: URL.createObjectURL(e.currentTarget.files[0]),
            custom: true
        }
    }

    const addContent = ()=>{
        if(newSliderData.title === "") return null
        setSliderContents(sliderContents=>[...sliderContents, newSliderData])
        modalCloseRef.current.click()
    }

    const ChangeSlideNum = (currentI, newI)=>{
        if(newI > sliderContents.length-1) newI = sliderContents.length-1
        if(newI < 0 || currentI === newI) return null
        if(currentI < newI)
            setSliderContents(sliderContents=>[
                sliderContents.slice(0, currentI),
                sliderContents.slice(currentI+1, newI),
                sliderContents[newI],
                sliderContents[currentI],
                sliderContents.slice(newI+1)
            ].flat())
        else
            setSliderContents(sliderContents=>[
                sliderContents.slice(0, newI),
                sliderContents[currentI],
                sliderContents.slice(newI, currentI),
                sliderContents.slice(currentI+1)
            ].flat())
    }

    const deleteSlide = i=>{
        setSliderContents(sliderContents=>sliderContents.slice(0, i).concat(sliderContents.slice(i+1)))
    }

    const updateSlider = ()=>{
        const formData = new FormData();
        const data = structuredClone(sliderContents);
        sliderContents.forEach((slide, i)=>{
            if(slide.imgSrc){
                const newName = Date.now()+i+"."+slide.img.name.split(".").pop();
                formData.append("img", slide.img, newName); 
                data[i].img = newName
                delete data[i].imgSrc;
            }
        })
        
        formData.append("data", JSON.stringify(data));
        spinnersControl.current[0].classList.remove('d-none')
        fetch(process.env.REACT_APP_API_SERVER+"/content/slider/update",{
            method:'put',
            credentials: "include",
            body: formData
        }).then(async res=>{
            if(res.ok)
                dispatch(addAlert({type:"success", msg: "The Slider Updated Successfully"}))
            else
                throw await res.json()
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            spinnersControl.current[0].classList.add('d-none')
        })
    }

    const oldKeys = [];
    const uniqueKeysGenerator = ()=>{
        let newKey = parseInt(Math.random()*100)
        while(oldKeys.includes(newKey)){
            newKey = parseInt(Math.random()*100)
        }
        oldKeys.push(newKey)
        return newKey
    }
    
    return <>
        <div className="container mt-3">
            {/* Slider Control Section */}
            <h1>Slider Content</h1>
            <div className='slider-content'>
                <div className='options d-flex justify-content-end gap-3 mb-3'>
                    <button className='btn btn-primary' role="button" data-bs-toggle="modal" data-bs-target=".modal.add-slide">Add</button>
                    
                    <button className='btn btn-success' onClick={updateSlider}>
                        <span className="spinner-border spinner-border-sm me-1 d-none" aria-hidden="true" ref={ref=>spinnersControl.current[0] = ref}></span>
                        Save
                    </button>

                    <div className="modal add-slide fade">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h1 className="modal-title fs-5">Add Slide</h1>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" ref={modalCloseRef}></button>
                                </div>
                                <div className="modal-body">
                                    <button 
                                        className='btn btn-primary toggle-content'
                                        type='button'
                                        value="custom-content"
                                        onClick={()=> setAddSlideOption(option=>option==="custom-content"? "exist-content" : "custom-content")}
                                    >Or Custom Content
                                    </button>
                                    {addSlideOption === "custom-content"?
                                        <div className='custom-content'>
                                            <img className='preview-image w-100' ref={previewRef}/>
                                            <span className="input-group-text w-50">Image:</span>
                                            <input
                                                className="form-control mb-3"
                                                type="file"
                                                name="img"
                                                onChange={customSlideAddingChange}
                                            />

                                            <span className="input-group-text w-50">Title:</span>
                                            <input
                                                className="form-control mb-3"
                                                type="text"
                                                name="title"
                                                onChange={customSlideAddingChange}
                                            />

                                            <span className="input-group-text w-50">Description:</span>
                                            <textarea
                                                className="form-control mb-3"
                                                height="5"
                                                name="desc"
                                                onChange={customSlideAddingChange}
                                            />

                                            <span className="input-group-text w-50">Click Link:</span>
                                            <input
                                                className="form-control mb-3"
                                                type="text"
                                                name="link"
                                                onChange={customSlideAddingChange}
                                            />
                                        </div>
                                    :
                                        <div className='exist-content'>
                                            <div className="dropdown">
                                                <img className="input-group-text preview-img w-100 image-icon d-none" ref={imgRef} style={{objectFit: "cover", height: "200px"}}/>
                                                <ContentSearch onClickFun={selectContent/* <--in this fun add the description atrr */}/>
                                            </div>
                                        </div>
                                    }
                                    </div>
                                <div className="modal-footer">
                                    <button className="btn btn-primary" type="button" onClick={addContent}>
                                    Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {sliderContents.map((content, i)=>
                    <div key={uniqueKeysGenerator()}>
                        <div className='slide row'>
                            <div className='col-3'>
                                <img className='rounded-3' style={{width: "50px"}} src={content.imgSrc?content.imgSrc:contentImagesPath+content.img} onError={defaultContentImg}/>
                            </div>
                            <h5 className='col-3'>{content.title}</h5>
                            <span className='slide-count col-3'>
                                <label htmlFor='slideCount'>slide number:</label>
                                <input id='slideCount' type='number' defaultValue={i+1} min={1} max={sliderContents.length} style={{width: "35px"}} onInput={e=>{ChangeSlideNum(i, Number(e.currentTarget.value)-1)}}/>
                            </span>
                            <button className='btn btn-outline-danger col-1' onClick={()=>{deleteSlide(i)}}>
                                <div className="btn-close m-auto"></div>
                            </button>
                        </div>
                        {i < sliderContents.length-1? <hr/> : null}
                    </div>
                )}
            </div>

            {/* Content Review Section */}
            <h1 className='mt-5'>Content Review</h1>
            <h2>Selected Content</h2>
            <p>The content that you selected to review</p>
            <div className="selected-content d-flex flex-wrap justify-content-center gap-3">
                {contents?
                    contents.selected.length ?
                        contents.selected.map((content, i) =>
                            <ContentCard key={content._id} content={content}>
                                <button className="unselect btn btn-outline-danger mt-3" type="button" onClick={e => unselect(e, content._id, (i+1)*2-1)}>
                                    <span className="spinner-border spinner-border-sm me-1 d-none" aria-hidden="true" ref={ref=>spinnersControl.current[(i+1)*2-1] = ref}></span>
                                    Unselect
                                </button>
                            </ContentCard>
                        )
                    :
                        <h3 className="alert alert-secondary w-100 text-center">No content selected to review</h3>
                : 
                    <Loader/>
                }
            </div>
            <hr />
            <h2>Content To Select</h2>
            <p>The content that waiting to be selected to review</p>
            <div className="to-select-content d-flex flex-wrap justify-content-center gap-3">
                {contents?
                    contents.selectFrom.length ?
                        <div className="to-select-content d-flex flex-wrap justify-content-center gap-3">
                            {contents.selectFrom.map((content, i) => (
                                <ContentCard key={content._id} content={content}>
                                    <button className="select btn btn-outline-primary mt-3" type="button" onClick={e => select(e, content._id, (i+1)*2)}>
                                        <span className="spinner-border spinner-border-sm me-1 d-none" aria-hidden="true" ref={ref=>spinnersControl.current[(i+1)*2] = ref}></span>
                                        Select
                                    </button>
                                </ContentCard>
                            ))}
                        </div>
                    :
                        <h3 className="alert alert-secondary w-100 text-center">No content waiting to review</h3>
                : 
                    <Loader/>
                }
            </div>
        </div>
    </>
}