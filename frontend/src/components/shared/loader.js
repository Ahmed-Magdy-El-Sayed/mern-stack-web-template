import { useSelector } from "react-redux"

export default function Loader({fallback}){
    const mode = useSelector(state=>state.mode)

    const spinnerClass = "spinner-grow text-secondary"
    const style = {width: "7px", height: "7px", margin: "0 2px"}
    
    if(fallback)
        return <div 
        className={`position-fixed top-0 left-0 
            vw-100 vh-100 d-flex 
            justify-content-center align-items-center 
            z-3 ${mode === 'dark'? 'bg-dark' : 'bg-light'}
        `}> 
            <h3 className="text-secondary w-100 text-center">Loading 
                <span className={spinnerClass} style={style} role="status"></span>
                <span className={spinnerClass} style={style} role="status"></span>
                <span className={spinnerClass} style={style} role="status"></span>
            </h3>
        </div>

    return <h6 className="text-secondary w-100 text-center">Loading 
            <span className={spinnerClass} style={style} role="status"></span>
            <span className={spinnerClass} style={style} role="status"></span>
            <span className={spinnerClass} style={style} role="status"></span>
        </h6>
}