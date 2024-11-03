import React, { useState } from 'react';
import { defaultContentImg, contentRoute, contentImagesPath } from '../../utils';
import { useDispatch } from 'react-redux';
import { addAlert } from '../../redux/alertSlice';
import ContentCard from '../shared/contentCard';
import ContentSearch from '../shared/contentSearch';
import { useLoaderData, useNavigate } from 'react-router-dom';

export default function Home(){
    const loaderData = useLoaderData()
    const [stateContents, setStateContents] = useState(loaderData.contents.length? loaderData.contents : [])
    const [moreContent, setMoreContent] = useState(true)
    const navigate = useNavigate()
    const dispatch = useDispatch()


    let getContentsIsClicked = false
    const getMoreContents = e=>{
        e.preventDefault();
        if(getContentsIsClicked) return null
        getContentsIsClicked = true
        fetch(process.env.REACT_APP_API_SERVER+'/content/more',{
            method:'post',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({skip: stateContents.length})
        }).then(async res=>{
            if(res.ok) return res.json()
            else throw await res.json();
        }).then(contents=>{
            if(!contents.length)
                return setMoreContent(false)
            setStateContents([...stateContents,...contents])
        }).catch(err=>{
            if(err.msg)
                dispatch(addAlert({type:"danger", msg: err.msg}))
            else{
                console.error(err)
                dispatch(addAlert({type:"danger", msg: "Something Went Wrong, Try Again!"}))
            }
        }).finally(()=>{
            getContentsIsClicked = false
        })
    }

    return <>
        <p className="alert alert-info w-100 text-center">The content here can be product, article, or anything</p>

        <div className="container mt-3">
        <ContentSearch/>
        {/* Content Slider Section */}
            <div id="contentSlider" className="carousel slide w-100 m-auto mb-3" data-bs-theme="dark">
                <div className="carousel-indicators">
                    {loaderData.sliderContents.map((content, i)=>
                        <button type="button" data-bs-target="#contentSlider" key={i} data-bs-slide-to={i} className={(i===0?"active":"")} aria-current="true" aria-label={content.name}></button>
                    )}
                </div>
                <div className="carousel-inner">
                    {loaderData.sliderContents.map((content, i)=>
                        <div className={"carousel-item "+(i===0?"active":"")} key={i} onClick={()=>{content.link && navigate(contentRoute+content.link)}}>
                            <img className="d-block w-100 slider-image" style={{objectFit: "contain", height: "50vh"}} src={contentImagesPath(content.img)} alt="" onError={defaultContentImg}/>
                            <div className="carousel-caption d-none d-md-inline text-light">
                                <h5 className='bg-dark d-inline-block px-2 py-1'>{content.title}</h5>
                                {content.desc?<>
                                    <br/>
                                    <p className='bg-dark d-inline px-2 py-1'>{content.desc}</p>
                                </>: null}
                            </div>
                        </div>
                    )}
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#contentSlider" data-bs-slide="prev">
                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#contentSlider" data-bs-slide="next">
                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                    <span className="visually-hidden">Next</span>
                </button>
            </div>
            
            
            {stateContents.length? /* Content Section */
                <>
                <h3>Most Recent Content</h3>
                <div className='latest-contents d-flex flex-wrap justify-content-center gap-3'>
                    {stateContents.map(content=>
                        <ContentCard key={content._id} content={content}>
                            {content.hidden && <p className="text-secondary">hidden content</p>}
                        </ContentCard>
                    )}
                </div>
                {moreContent?
                    <div className="show-contents text-primary text-center m-auto fs-4 mt-3 pb-3">
                        <span className="text-decoration-none cur-pointer" href='' onClick={getMoreContents}>
                            show more
                        </span>
                    </div>
                :   <p className='text-secondary text-center mt-3 mb-0 pb-3'>No more contents</p>
                }</>
            :
                <h3 className="w-100 text-center">No Content Exist</h3>
            }
        </div>
    </>
}