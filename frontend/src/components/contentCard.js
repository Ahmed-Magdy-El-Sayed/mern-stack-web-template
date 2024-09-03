import { useNavigate } from "react-router-dom";
import { defaultContentImg, contentRoute, defaultUserImg, calcPassedTime, contentImagesPath, accountImagesPath } from "../utils";

export default function ContentCard({content, children}){
    const navigate = useNavigate()

    return <div className="card text-center cur-pointer" style={{ width: "18rem" }} id={content._id} onClick={() => navigate(contentRoute+content._id)}>
        <div className="card-body d-flex flex-column justify-content-between">
            <img className="card-img-top w-100 rounded-5" src={contentImagesPath+content.img} onError={defaultContentImg}/>
            <div className="card-details">
                <h3 className="card-text text-primary">{content.name}</h3>
                <p>{calcPassedTime(content.date).passedTime}</p>
                <h6 className="m-0 author">
                    <span className="d-flex gap-2 justify-content-center align-items-center">
                        <img className="img-icon rounded-circle" src={accountImagesPath+content.author.img} alt="author img" onError={defaultUserImg}/>
                        <p className="m-0">{content.author.name}</p>
                    </span>
                </h6>
                {/* --------- add your content details here --------- */}
            </div>
            {children}
        </div>
    </div>
}